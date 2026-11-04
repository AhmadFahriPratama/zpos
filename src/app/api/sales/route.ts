import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ItemInput {
  productId: string
  qty: number
  price?: number
  discount?: number
}

interface SaleBody {
  items: ItemInput[]
  method: string
  paidAmount?: number
  cashierName?: string
  shiftId?: string | null
  offset?: number
}

const VALID_METHODS = ['cash', 'qris', 'transfer', 'card']

/** Batas tengah malam waktu lokal (dari offset menit getTimezoneOffset client/server) */
function startOfLocalDay(offsetMin: number, d = new Date()): Date {
  const localMs = d.getTime() - offsetMin * 60000
  const dayIdx = Math.floor(localMs / 86400000)
  return new Date(dayIdx * 86400000 + offsetMin * 60000)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const days = Math.min(90, Math.max(1, Number(searchParams.get('days')) || 30))
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit')) || 200))
    const offset = Number(searchParams.get('offset')) || 0

    const since = new Date(Date.now() - days * 86400000)
    const sales = await db.sale.findMany({
      where: { createdAt: { gte: since } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    void offset
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
    const cashierName = (body.cashierName || 'Kasir').slice(0, 40)

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
    const discount = lines.reduce((s, l) => s + l.discount, 0)
    const total = subtotal - discount

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

    // Nomor invoice berurutan harian
    const startDay = startOfLocalDay(offset)
    const countToday = await db.sale.count({ where: { createdAt: { gte: startDay } } })
    const ymd = new Date(Date.now() - offset * 60000)
      .toISOString().slice(0, 10).replace(/-/g, '')
    const invoiceNo = `INV-${ymd}-${String(countToday + 1).padStart(4, '0')}`

    const sale = await db.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNo, status: 'paid', subtotal, discount, total,
          paidAmount, changeAmount, method, cashierName, shiftId,
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
      return created
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Transaksi gagal' },
      { status: 500 }
    )
  }
}
