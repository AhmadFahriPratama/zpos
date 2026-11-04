import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface DayBucket {
  key: string; startUtc: Date; endUtc: Date; label: string; dayNum: string
}

/** Bucket hari lokal berdasarkan offset menit client */
function localDayKeys(offsetMin: number, nDays: number): DayBucket[] {
  const days: DayBucket[] = []
  const nowLocalMs = Date.now() - offsetMin * 60000
  const todayIdx = Math.floor(nowLocalMs / 86400000)
  for (let i = nDays - 1; i >= 0; i--) {
    const idx = todayIdx - i
    const dayDate = new Date(idx * 86400000)
    days.push({
      key: dayDate.toISOString().slice(0, 10),
      startUtc: new Date(idx * 86400000 + offsetMin * 60000),
      endUtc: new Date((idx + 1) * 86400000 + offsetMin * 60000),
      label: DAY_LABELS[dayDate.getUTCDay()],
      dayNum: String(dayDate.getUTCDate()).padStart(2, '0'),
    })
  }
  return days
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const offset = Number(searchParams.get('offset')) || 0
    const nDays = Math.min(30, Math.max(1, Number(searchParams.get('range')) || 7))
    const days = localDayKeys(offset, nDays)
    const since = days[0].startUtc

    const [sales, products] = await Promise.all([
      db.sale.findMany({
        where: { status: 'paid', createdAt: { gte: since } },
        include: { items: true },
      }),
      db.product.findMany({ where: { isActive: true } }),
    ])

    // Ringkasan hari ini
    const today = days[days.length - 1]
    const yesterday = days.length >= 2 ? days[days.length - 2] : null
    const inDay = (s: { createdAt: Date }, d: DayBucket | null) =>
      d !== null && s.createdAt >= d.startUtc && s.createdAt < d.endUtc

    const todaySales = sales.filter((s) => inDay(s, today))
    const yesterdaySales = yesterday ? sales.filter((s) => inDay(s, yesterday)) : []
    const todayRevenue = todaySales.reduce((a, b) => a + b.total, 0)
    const yesterdayRevenue = yesterdaySales.reduce((a, b) => a + b.total, 0)
    const todayCount = todaySales.length
    const todayItems = todaySales.reduce((a, s) => a + s.items.reduce((x, i) => x + i.qty, 0), 0)

    // Seri harian
    const series = days.map((d) => {
      const ds = sales.filter((s) => s.createdAt >= d.startUtc && s.createdAt < d.endUtc)
      return {
        date: d.key, label: d.label, dayNum: d.dayNum,
        revenue: ds.reduce((a, b) => a + b.total, 0),
        count: ds.length,
      }
    })

    // Produk terlaris
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

    // Metode pembayaran
    const perMethod = new Map<string, { count: number; total: number }>()
    for (const s of sales) {
      const cur = perMethod.get(s.method) ?? { count: 0, total: 0 }
      cur.count += 1
      cur.total += s.total
      perMethod.set(s.method, cur)
    }
    const methodBreakdown = [...perMethod.entries()].map(([method, v]) => ({ method, ...v }))

    // Stok menipis & transaksi terakhir
    const lowStock = products
      .filter((p) => p.stock <= p.minStock)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock, unit: p.unit, minStock: p.minStock }))
    const recent = await db.sale.findMany({
      where: { status: 'paid' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })

    return NextResponse.json({
      range: nDays,
      todayRevenue, yesterdayRevenue, todayCount, todayItems,
      avgTicket: todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0,
      series, topProducts, methodBreakdown, lowStock, recent,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat statistik' },
      { status: 500 }
    )
  }
}
