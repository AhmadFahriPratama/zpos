import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      productId?: string
      type?: 'in' | 'out' | 'adjust'
      qty?: number
      note?: string
    }
    if (!body.productId) return NextResponse.json({ error: 'productId wajib' }, { status: 400 })
    const type = ['in', 'out', 'adjust'].includes(body.type ?? '') ? body.type! : 'in'
    const qty = Math.round(Number(body.qty) || 0)
    if (qty <= 0 && type !== 'adjust')
      return NextResponse.json({ error: 'Jumlah harus lebih dari 0' }, { status: 400 })

    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: body.productId! } })
      if (!product) throw new Error('Produk tidak ditemukan')

      let delta = 0
      if (type === 'in') delta = qty
      else if (type === 'out') {
        delta = -qty
        if (qty > product.stock) throw new Error(`Stok tersisa ${product.stock}, tidak bisa keluar ${qty}`)
      } else {
        delta = qty - product.stock // opname: set ke jumlah fisik
      }

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { stock: { increment: delta } },
      })

      const move = await tx.stockMove.create({
        data: {
          productId: product.id, type,
          qty: delta,
          note: (body.note || '').slice(0, 200) || null,
        },
      })
      return { updated, move }
    })

    return NextResponse.json(result.move, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menyesuaikan stok' },
      { status: 500 }
    )
  }
}
