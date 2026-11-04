import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const shifts = await db.shift.findMany({
      orderBy: { openedAt: 'desc' },
      take: 30,
      include: { sales: { where: { status: 'paid' } } },
    })

    const withAgg = shifts.map((s) => {
      const paid = s.sales
      return {
        id: s.id, cashierName: s.cashierName, openingCash: s.openingCash,
        closingCash: s.closingCash, expectedCash: s.expectedCash, diff: s.diff,
        status: s.status, openedAt: s.openedAt, closedAt: s.closedAt,
        salesCount: paid.length,
        salesTotal: paid.reduce((a, b) => a + b.total, 0),
        cashTotal: paid.filter((x) => x.method === 'cash').reduce((a, b) => a + b.total, 0),
      }
    })
    return NextResponse.json(withAgg)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat shift' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { cashierName?: string; openingCash?: number }
    const cashierName = (body.cashierName || 'Kasir').slice(0, 40)
    const openingCash = Math.max(0, Number(body.openingCash) || 0)

    const open = await db.shift.findFirst({ where: { status: 'open' } })
    if (open)
      return NextResponse.json(
        { error: `Masih ada shift terbuka oleh ${open.cashierName}. Tutup dulu.` },
        { status: 400 }
      )

    const shift = await db.shift.create({ data: { cashierName, openingCash } })
    return NextResponse.json(shift, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal membuka shift' },
      { status: 500 }
    )
  }
}
