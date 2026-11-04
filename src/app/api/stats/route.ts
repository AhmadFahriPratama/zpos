import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/** Pecah rentang 7 hari lokal berdasarkan offset menit client */
function localDayKeys(offsetMin: number): Array<{ key: string; startUtc: Date; endUtc: Date; label: string }> {
  const days: Array<{ key: string; startUtc: Date; endUtc: Date; label: string }> = []
  const nowLocalMs = Date.now() - offsetMin * 60000
  const todayIdx = Math.floor(nowLocalMs / 86400000)
  for (let i = 6; i >= 0; i--) {
    const idx = todayIdx - i
    const startUtc = new Date(idx * 86400000 + offsetMin * 60000)
    const endUtc = new Date((idx + 1) * 86400000 + offsetMin * 60000)
    const key = new Date(idx * 86400000).toISOString().slice(0, 10)
    const dow = new Date(idx * 86400000).getUTCDay()
    days.push({ key, startUtc, endUtc, label: DAY_LABELS[dow] })
  }
  return days
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const offset = Number(searchParams.get('offset')) || 0
    const days = localDayKeys(offset)
    const since = days[0].startUtc

    const sales = await db.sale.findMany({
      where: { status: 'paid', createdAt: { gte: since } },
      include: { items: true },
    })

    // Ringkasan hari ini
    const today = days[days.length - 1]
    const todaySales = sales.filter((s) => s.createdAt >= today.startUtc && s.createdAt < today.endUtc)
    const todayRevenue = todaySales.reduce((a, b) => a + b.total, 0)
    const todayCount = todaySales.length
    const todayItems = todaySales.reduce((a, s) => a + s.items.reduce((x, i) => x + i.qty, 0), 0)

    // Seri 7 hari
    const series = days.map((d) => {
      const inDay = sales.filter((s) => s.createdAt >= d.startUtc && s.createdAt < d.endUtc)
      return {
        date: d.key, label: d.label,
        revenue: inDay.reduce((a, b) => a + b.total, 0),
        count: inDay.length,
      }
    })

    // Produk terlaris (7 hari)
    const perProduct = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const s of sales) {
      for (const it of s.items) {
        if (!it.productId) continue
        const cur = perProduct.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 }
        cur.qty += it.qty
        cur.revenue += it.subtotal
        perProduct.set(it.productId, cur)
      }
    }
    const topProducts = [...perProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    // Metode pembayaran (7 hari)
    const perMethod = new Map<string, { count: number; total: number }>()
    for (const s of sales) {
      const cur = perMethod.get(s.method) ?? { count: 0, total: 0 }
      cur.count += 1
      cur.total += s.total
      perMethod.set(s.method, cur)
    }
    const methodBreakdown = [...perMethod.entries()].map(([method, v]) => ({ method, ...v }))

    return NextResponse.json({
      todayRevenue, todayCount, todayItems,
      avgTicket: todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0,
      series, topProducts, methodBreakdown,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat statistik' },
      { status: 500 }
    )
  }
}
