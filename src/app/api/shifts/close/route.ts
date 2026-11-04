import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { shiftId?: string; countedCash?: number }
    if (!body.shiftId) return NextResponse.json({ error: 'shiftId wajib' }, { status: 400 })
    const countedCash = Math.max(0, Number(body.countedCash) || 0)

    const shift = await db.shift.findUnique({ where: { id: body.shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift tidak ditemukan' }, { status: 404 })
    if (shift.status !== 'open') return NextResponse.json({ error: 'Shift sudah ditutup' }, { status: 400 })

    const sales = await db.sale.findMany({ where: { shiftId: shift.id, status: 'paid' } })
    const cashSum = sales.filter((s) => s.method === 'cash').reduce((a, b) => a + b.total, 0)
    const expectedCash = shift.openingCash + cashSum
    const diff = countedCash - expectedCash

    const updated = await db.shift.update({
      where: { id: shift.id },
      data: { status: 'closed', closedAt: new Date(), expectedCash, closingCash: countedCash, diff },
    })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menutup shift' },
      { status: 500 }
    )
  }
}
