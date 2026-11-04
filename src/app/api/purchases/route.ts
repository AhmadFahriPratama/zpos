import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ItemInput {
  productId: string
  qty: number
  cost: number
}

interface Body {
  id?: string
  supplierId?: string
  items?: ItemInput[]
  note?: string
  receive?: boolean
}

export async function GET() {
  try {
    const purchases = await db.purchase.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(purchases)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat pembelian' },
      { status: 500 }
    )
  }
}

/** Buat PO — langsung "received" (stok masuk otomatis via StockMove) */
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body
    if (!b.supplierId) return NextResponse.json({ error: 'Pilih supplier dulu' }, { status: 400 })
    if (!Array.isArray(b.items) || b.items.length === 0)
      return NextResponse.json({ error: 'Minimal 1 item pembelian' }, { status: 400 })

    const supplier = await db.supplier.findUnique({ where: { id: b.supplierId } })
    if (!supplier) return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 400 })

    const ids = b.items.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: ids } } })
    const map = new Map(products.map((p) => [p.id, p]))

    const lines: Array<{ productId: string; name: string; qty: number; cost: number; subtotal: number }> = []
    for (const it of b.items) {
      const p = map.get(it.productId)
      if (!p) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 400 })
      const qty = Math.max(1, Math.round(Number(it.qty) || 1))
      const cost = Math.max(0, Number(it.cost) || p.cost)
      lines.push({ productId: p.id, name: p.name, qty, cost, subtotal: qty * cost })
    }

    const total = lines.reduce((a, l) => a + l.subtotal, 0)
    const note = (b.note || '').trim().slice(0, 200) || null

    // Nomor PO harian berurutan
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const prefix = `PO-${ymd}-`
    const todays = await db.purchase.findMany({
      where: { poNo: { startsWith: prefix } },
      select: { poNo: true },
    })
    let maxSeq = 0
    for (const t of todays) {
      const n = Number(t.poNo.slice(prefix.length))
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n
    }
    const poNo = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`

    const purchase = await db.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          poNo, supplierId: supplier.id, status: 'received', total, note,
          receivedAt: new Date(),
          items: { create: lines },
        },
        include: { supplier: { select: { id: true, name: true } }, items: true },
      })
      for (const l of lines) {
        // Harga belanja terakhir ikut ter-update untuk HPP
        await tx.product.update({ where: { id: l.productId }, data: { stock: { increment: l.qty }, cost: l.cost } })
        await tx.stockMove.create({
          data: { productId: l.productId, type: 'in', qty: l.qty, refId: created.id, note: `Terima ${poNo}` },
        })
      }
      return created
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal membuat pembelian' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const purchase = await db.purchase.findUnique({ where: { id } })
    if (!purchase) return NextResponse.json({ error: 'Pembelian tidak ditemukan' }, { status: 404 })
    if (purchase.status === 'received')
      return NextResponse.json({ error: 'PO sudah diterima — tidak dapat dihapus' }, { status: 409 })
    await db.purchase.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus pembelian' },
      { status: 500 }
    )
  }
}
