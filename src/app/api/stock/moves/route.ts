import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 40))
    const moves = await db.stockMove.findMany({
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json(
      moves.map((m) => ({
        id: m.id, productId: m.productId, productName: m.product.name,
        type: m.type, qty: m.qty, note: m.note, refId: m.refId, createdAt: m.createdAt,
      }))
    )
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat riwayat stok' },
      { status: 500 }
    )
  }
}
