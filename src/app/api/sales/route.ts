import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ItemInput {
  productId: string
  qty: number
  discount?: number
}

interface SaleBody {
  items: ItemInput[]
  method: string
  paidAmount?: number
  cashierName?: string
  shiftId?: string | null
  orderType?: string
  note?: string
  orderDiscount?: number
  offset?: number
  customerId?: string | null
  promoId?: string | null
}

const VALID_METHODS = ['cash', 'qris', 'transfer', 'card']
const VALID_ORDER_TYPES = ['dinein', 'takeaway']

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const days = Math.min(90, Math.max(1, Number(searchParams.get('days')) || 30))
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit')) || 200))
    const shiftId = searchParams.get('shiftId') || undefined
    const method = searchParams.get('method') || undefined
    const status = searchParams.get('status') || undefined
    const q = (searchParams.get('q') || '').trim()

    const since = new Date(Date.now() - days * 86400000)
    const sales = await db.sale.findMany({
      where: {
        createdAt: { gte: since },
        ...(shiftId ? { shiftId } : {}),
        ...(method && method !== 'all' ? { method } : {}),
        ...(status && status !== 'all' ? { status } : {}),
        ...(q ? { OR: [{ invoiceNo: { contains: q } }, { cashierName: { contains: q } }] } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json(sales)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat penjualan' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaleBody
    const offset = Number(body.offset) || 0
    const method = VALID_METHODS.includes(body.method) ? body.method : 'cash'
    const orderType = VALID_ORDER_TYPES.includes(body.orderType ?? '') ? body.orderType! : 'takeaway'
    const cashierName = (body.cashierName || 'Kasir').slice(0, 40)
    const note = (body.note || '').trim().slice(0, 200) || null

    if (!Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 })

    // Ambil & validasi produk dari DB (server = sumber kebenaran harga)
    const ids = body.items.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: ids } } })
    const map = new Map(products.map((p) => [p.id, p]))

    const lines: Array<{
      productId: string; name: string; qty: number; price: number; cost: number; discount: number; subtotal: number
    }> = []

    for (const item of body.items) {
      const p = map.get(item.productId)
      if (!p) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 400 })
      if (!p.isActive) return NextResponse.json({ error: `${p.name} tidak aktif` }, { status: 400 })
      const qty = Math.max(1, Math.round(Number(item.qty) || 1))
      if (qty > p.stock)
        return NextResponse.json({ error: `Stok ${p.name} tersisa ${p.stock}` }, { status: 400 })
      const price = p.price
      const discount = Math.max(0, Math.min(Number(item.discount) || 0, price * qty))
      lines.push({
        productId: p.id, name: p.name, qty, price, cost: p.cost, discount,
        subtotal: price * qty - discount,
      })
    }

    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
    const itemDiscount = lines.reduce((s, l) => s + l.discount, 0)
    const afterItems = subtotal - itemDiscount

    // Pelanggan member (opsional)
    let customerId: string | null = null
    let customerName: string | null = null
    if (body.customerId) {
      const cust = await db.customer.findUnique({ where: { id: body.customerId } })
      if (!cust || !cust.isActive)
        return NextResponse.json({ error: 'Pelanggan tidak valid / tidak aktif' }, { status: 400 })
      customerId = cust.id
      customerName = cust.name
    }

    // Promo (opsional) — server = sumber kebenaran perhitungan diskon promo
    let orderDiscount = Math.max(0, Math.min(Number(body.orderDiscount) || 0, afterItems))
    let promoId: string | null = null
    let promoName: string | null = null
    if (body.promoId) {
      const promo = await db.promo.findUnique({ where: { id: body.promoId } })
      const now = new Date()
      const valid =
        promo && promo.isActive &&
        now >= promo.startsAt &&
        (!promo.endsAt || now <= promo.endsAt) &&
        afterItems >= promo.minPurchase
      if (!valid)
        return NextResponse.json({ error: 'Promo tidak berlaku untuk transaksi ini' }, { status: 400 })
      promoId = promo.id
      promoName = promo.name
      const raw = promo.type === 'percent'
        ? Math.round(afterItems * (promo.value / 100))
        : promo.value
      orderDiscount = Math.max(0, Math.min(raw, afterItems))
    }

    // Pajak dari pengaturan toko (PPN/PB1)
    const setting = await db.setting.findUnique({ where: { id: 'main' } })
    const taxEnabled = setting?.taxEnabled ?? false
    const taxRate = setting?.taxRate ?? 0
    const taxable = subtotal - itemDiscount - orderDiscount
    const tax = taxEnabled && taxRate > 0 ? Math.round(taxable * (taxRate / 100)) : 0
    const total = taxable + tax

    let paidAmount = total
    let changeAmount = 0
    if (method === 'cash') {
      paidAmount = Math.max(0, Number(body.paidAmount) || 0)
      if (paidAmount < total)
        return NextResponse.json({ error: 'Uang bayar kurang dari total' }, { status: 400 })
      changeAmount = paidAmount - total
    }

    // Validasi shift bila ada
    let shiftId: string | null = null
    if (body.shiftId) {
      const shift = await db.shift.findUnique({ where: { id: body.shiftId } })
      if (shift && shift.status === 'open') shiftId = shift.id
    }

    // Nomor invoice berurutan harian — ambil max sequence yang ada (tahan gap & collision)
    const ymd = new Date(Date.now() - offset * 60000)
      .toISOString().slice(0, 10).replace(/-/g, '')
    const prefix = `INV-${ymd}-`
    const todays = await db.sale.findMany({
      where: { invoiceNo: { startsWith: prefix } },
      select: { invoiceNo: true },
    })
    let maxSeq = 0
    for (const t of todays) {
      const n = Number(t.invoiceNo.slice(prefix.length))
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n
    }
    const invoiceNo = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`

    const sale = await db.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNo, status: 'paid', subtotal, discount: itemDiscount, orderDiscount, tax, total,
          paidAmount, changeAmount, method, orderType, note, cashierName, shiftId,
          customerId, customerName, promoId, promoName,
          items: {
            create: lines.map((l) => ({
              productId: l.productId, name: l.name, qty: l.qty,
              price: l.price, cost: l.cost, discount: l.discount, subtotal: l.subtotal,
            })),
          },
        },
        include: { items: true },
      })

      for (const l of lines) {
        await tx.product.update({
          where: { id: l.productId },
          data: { stock: { decrement: l.qty } },
        })
        await tx.stockMove.create({
          data: {
            productId: l.productId, type: 'sale', qty: -l.qty,
            refId: created.id, note: invoiceNo,
          },
        })
      }

      // Promo terpakai
      if (promoId) {
        await tx.promo.update({ where: { id: promoId }, data: { usageCount: { increment: 1 } } })
      }

      // Update agregat member: total belanja, kunjungan, poin (1 poin / Rp10.000)
      if (customerId) {
        const cust = await tx.customer.findUnique({ where: { id: customerId } })
        if (cust) {
          const spend = cust.totalSpend + total
          await tx.customer.update({
            where: { id: customerId },
            data: {
              totalSpend: spend,
              visitCount: { increment: 1 },
              points: { increment: Math.floor(total / 10000) },
              tier: spend >= 1_000_000 ? 'gold' : spend >= 400_000 ? 'silver' : 'regular',
            },
          })
        }
      }

      return created
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[sales POST]', e)
    }
    return NextResponse.json(
      { error: 'Transaksi gagal diproses — periksa kembali keranjang lalu coba lagi.' },
      { status: 500 }
    )
  }
}
