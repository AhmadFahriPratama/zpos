'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, angka, tanggalWaktu, methodLabel } from '@/lib/format'
import type { Sale, Stats } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { StatCard, ViewHeader } from './ui-bits'
import {
  BarChart3, Banknote, Coins, FileDown, Loader2, ReceiptText, ShoppingBag, TrendingUp,
} from 'lucide-react'

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-emerald-500',
  qris: 'bg-zinc-900',
  transfer: 'bg-amber-500',
  card: 'bg-rose-500',
}

export function ReportsView() {
  const booted = useZPos((s) => s.booted)
  const [stats, setStats] = useState<Stats | null>(null)
  const [sales, setSales] = useState<Sale[] | null>(null)
  const [detail, setDetail] = useState<Sale | null>(null)

  useEffect(() => {
    if (!booted) return
    const offset = new Date().getTimezoneOffset()
    void (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`/api/stats?offset=${offset}`),
          fetch('/api/sales?days=30&limit=200'),
        ])
        if (r1.ok) setStats((await r1.json()) as Stats)
        if (r2.ok) setSales((await r2.json()) as Sale[])
      } catch {
        toast.error('Gagal memuat laporan')
      }
    })()
  }, [booted])

  const exportCsv = () => {
    if (!sales || sales.length === 0) return
    const rows = [
      ['Invoice', 'Tanggal', 'Kasir', 'Metode', 'Item', 'Subtotal', 'Diskon', 'Total'],
      ...sales.map((s) => [
        s.invoiceNo,
        new Date(s.createdAt).toLocaleString('id-ID'),
        s.cashierName,
        methodLabel(s.method),
        String(s.items.reduce((a, b) => a + b.qty, 0)),
        String(s.subtotal),
        String(s.discount),
        String(s.total),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zpos-laporan-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Laporan CSV diunduh')
  }

  const maxRevenue = Math.max(1, ...(stats?.series.map((s) => s.revenue) ?? [1]))
  const topMax = Math.max(1, ...(stats?.topProducts.map((p) => p.qty) ?? [1]))
  const methodTotal = stats?.methodBreakdown.reduce((a, b) => a + b.total, 0) ?? 0

  return (
    <div>
      <ViewHeader title="Laporan Penjualan" desc="Ringkasan performa toko — data langsung dari server lokal.">
        <Button variant="outline" size="sm" className="h-9 border-zinc-200 bg-white" onClick={exportCsv} disabled={!sales?.length}>
          <FileDown className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ekspor CSV
        </Button>
      </ViewHeader>

      {!stats ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" aria-hidden="true" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Kartu ringkasan */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Penjualan Hari Ini" value={rupiah(stats.todayRevenue)} icon={TrendingUp} tone="emerald" />
            <StatCard label="Transaksi" value={angka(stats.todayCount)} sub="hari ini" icon={ShoppingBag} />
            <StatCard label="Item Terjual" value={angka(stats.todayItems)} sub="hari ini" icon={ReceiptText} />
            <StatCard label="Rata-rata / Transaksi" value={rupiah(stats.avgTicket)} icon={Coins} />
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            {/* Grafik 7 hari */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                  <BarChart3 className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  Penjualan 7 Hari Terakhir
                </p>
                <p className="text-xs text-zinc-400">
                  Total {rupiah(stats.series.reduce((a, b) => a + b.revenue, 0))}
                </p>
              </div>
              <div className="flex h-44 items-end gap-2 sm:gap-3">
                {stats.series.map((d) => {
                  const h = Math.max(4, Math.round((d.revenue / maxRevenue) * 100))
                  const isToday = d === stats.series[stats.series.length - 1]
                  return (
                    <div key={d.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                      <p className={cn('text-[10px] font-semibold tabular-nums', isToday ? 'text-emerald-700' : 'text-zinc-400')}>
                        {d.revenue > 0 ? `${Math.round(d.revenue / 1000)}rb` : '—'}
                      </p>
                      <div
                        title={`${d.label}: ${rupiah(d.revenue)} (${d.count} transaksi)`}
                        style={{ height: `${h}%` }}
                        className={cn(
                          'w-full max-w-10 shrink-0 rounded-t-md transition-all hover:opacity-80',
                          isToday ? 'bg-emerald-500' : 'bg-zinc-800'
                        )}
                      />
                      <p className={cn('text-[10px] font-medium', isToday ? 'text-emerald-700' : 'text-zinc-400')}>
                        {d.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Metode pembayaran */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
              <p className="mb-4 text-sm font-bold text-zinc-900">Metode Pembayaran (7 hari)</p>
              <div className="space-y-3">
                {stats.methodBreakdown.length === 0 && (
                  <p className="text-xs text-zinc-400">Belum ada data.</p>
                )}
                {stats.methodBreakdown
                  .sort((a, b) => b.total - a.total)
                  .map((m) => {
                    const pct = methodTotal > 0 ? Math.round((m.total / methodTotal) * 100) : 0
                    return (
                      <div key={m.method}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-zinc-700">
                            <span className={cn('h-2.5 w-2.5 rounded-full', METHOD_COLORS[m.method] ?? 'bg-zinc-300')} aria-hidden="true" />
                            {methodLabel(m.method)}
                          </span>
                          <span className="tabular-nums text-zinc-400">
                            {m.count}× · {pct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div className={cn('h-full rounded-full', METHOD_COLORS[m.method] ?? 'bg-zinc-300')} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            {/* Produk terlaris */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
              <p className="mb-4 text-sm font-bold text-zinc-900">Produk Terlaris (7 hari)</p>
              <ol className="space-y-3">
                {stats.topProducts.map((p, i) => (
                  <li key={p.productId}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                          i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'
                        )}>
                          {i + 1}
                        </span>
                        <span className="truncate font-semibold text-zinc-800">{p.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-zinc-400">{angka(p.qty)} terjual</span>
                    </div>
                    <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-zinc-800" style={{ width: `${Math.round((p.qty / topMax) * 100)}%` }} />
                    </div>
                  </li>
                ))}
                {stats.topProducts.length === 0 && <p className="text-xs text-zinc-400">Belum ada penjualan.</p>}
              </ol>
            </div>

            {/* Transaksi terakhir */}
            <div className="min-w-0 rounded-xl border border-zinc-200 bg-white shadow-sm xl:col-span-3">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-bold text-zinc-900">Transaksi Terakhir (30 hari)</p>
                {sales && <BadgeCount n={sales.length} />}
              </div>
              <div className="plan-scroll max-h-[420px] overflow-y-auto">
                {!sales ? (
                  <p className="px-4 py-10 text-center text-xs text-zinc-400">Memuat…</p>
                ) : sales.length === 0 ? (
                  <p className="px-4 py-10 text-center text-xs text-zinc-400">Belum ada transaksi.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {sales.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => setDetail(s)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50"
                        >
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-zinc-900">{s.invoiceNo}</p>
                            <p className="truncate text-[11px] text-zinc-400">
                              {tanggalWaktu(s.createdAt)} · {s.cashierName} · {methodLabel(s.method)} · {s.items.length} item
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-900">{rupiah(s.total)}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail transaksi */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{detail?.invoiceNo}</DialogTitle>
            <DialogDescription>
              {detail && `${tanggalWaktu(detail.createdAt)} · kasir ${detail.cashierName} · ${methodLabel(detail.method)}`}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                {detail.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-800">{it.name}</p>
                      <p className="text-[11px] text-zinc-400">
                        {it.qty} × {rupiah(it.price)}
                        {it.discount > 0 && <span className="text-rose-500"> −{rupiah(it.discount)}</span>}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{rupiah(it.subtotal)}</p>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 rounded-lg bg-zinc-50 px-3 py-2.5 text-sm">
                <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span className="tabular-nums">{rupiah(detail.subtotal)}</span></div>
                {detail.discount > 0 && (
                  <div className="flex justify-between text-rose-600"><span>Diskon</span><span className="tabular-nums">−{rupiah(detail.discount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-zinc-900"><span>Total</span><span className="tabular-nums">{rupiah(detail.total)}</span></div>
                {detail.method === 'cash' && (
                  <div className="flex justify-between text-zinc-500">
                    <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" aria-hidden="true" /> Bayar / Kembali</span>
                    <span className="tabular-nums">{rupiah(detail.paidAmount)} / {rupiah(detail.changeAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BadgeCount({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
      {n} transaksi
    </span>
  )
}
