'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, angka, jamWaktu, tanggalPendek } from '@/lib/format'
import type { Stats } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { StatCard, MethodChip, StatusDot } from './ui-bits'
import { RevenueBars, DonutMethod, TopProductList } from './charts'
import {
  ArrowRight, BarChart3, Boxes, Calculator, CircleAlert, Coins, Loader2,
  PackageSearch, ReceiptText, ShoppingCart, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react'

function Delta({ now, before }: { now: number; before: number }) {
  if (before <= 0) return null
  const pct = Math.round(((now - before) / before) * 100)
  const up = pct >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
      {up ? '+' : ''}{pct}%
    </span>
  )
}

export function DashboardView() {
  const booted = useZPos((s) => s.booted)
  const currentShift = useZPos((s) => s.currentShift)
  const cashier = useZPos((s) => s.cashier)
  const setView = useZPos((s) => s.setView)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!booted) return
    const offset = new Date().getTimezoneOffset()
    void (async () => {
      try {
        const r = await fetch(`/api/stats?offset=${offset}&range=7`)
        if (r.ok) setStats((await r.json()) as Stats)
      } catch {
        toast.error('Gagal memuat statistik')
      }
    })()
  }, [booted, currentShift])

  if (!stats) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" aria-hidden="true" />
      </div>
    )
  }

  const weekRevenue = stats.series.reduce((a, b) => a + b.revenue, 0)

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      {/* Sapaan */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Selamat datang kembali, {cashier}
          </h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500">
            {tanggalPendek(new Date())}
            {currentShift ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                <StatusDot status="online" /> Shift {currentShift.cashierName} aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                Shift belum dibuka
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 border-zinc-200 bg-white font-semibold" onClick={() => setView('produk')}>
            <Boxes className="mr-1.5 h-4 w-4" aria-hidden="true" /> Produk
          </Button>
          <Button className="h-10 bg-zinc-900 font-bold text-white hover:bg-zinc-700" onClick={() => setView('kasir')}>
            <ShoppingCart className="mr-1.5 h-4 w-4" aria-hidden="true" /> Buka Kasir
          </Button>
        </div>
      </div>

      {/* Kartu statistik hari ini */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Omzet Hari Ini"
          value={rupiah(stats.todayRevenue)}
          sub={
            <span className="inline-flex items-center gap-1.5">
              kemarin {rupiah(stats.yesterdayRevenue)}
              <Delta now={stats.todayRevenue} before={stats.yesterdayRevenue} />
            </span>
          }
          icon={Wallet}
          tone="emerald"
        />
        <StatCard label="Transaksi" value={angka(stats.todayCount)} sub="hari ini" icon={ReceiptText} />
        <StatCard label="Item Terjual" value={angka(stats.todayItems)} sub="hari ini" icon={PackageSearch} />
        <StatCard label="Rata-rata / Transaksi" value={rupiah(stats.avgTicket)} sub="hari ini" icon={Calculator} />
      </div>

      {/* Grafik + metode */}
      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                <BarChart3 className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                Penjualan 7 Hari
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">Total {rupiah(weekRevenue)}</p>
            </div>
            <button onClick={() => setView('laporan')} className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">
              Laporan lengkap <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <RevenueBars data={stats.series} />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-900">
            <Coins className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            Metode Pembayaran
          </p>
          <DonutMethod data={stats.methodBreakdown} />
        </div>
      </div>

      {/* Produk terlaris + stok + transaksi terakhir */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-zinc-900">Produk Terlaris</p>
          <TopProductList items={stats.topProducts} />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <CircleAlert className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Stok Menipis
            </p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
              {stats.lowStock.length}
            </span>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-zinc-400">Semua stok aman.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-800">{p.name}</p>
                    <p className="text-[10px] text-zinc-400">min. {p.minStock} {p.unit}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                      p.stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {p.stock <= 0 ? 'Habis' : `${p.stock} ${p.unit}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setView('stok')}
            className="block w-full border-t border-zinc-100 py-2.5 text-center text-xs font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
          >
            Kelola stok
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-bold text-zinc-900">Transaksi Terakhir</p>
            <button onClick={() => setView('transaksi')} className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              Semua
            </button>
          </div>
          {stats.recent.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-zinc-400">Belum ada transaksi.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {stats.recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-bold text-zinc-800">{s.invoiceNo}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                      {jamWaktu(s.createdAt)} · {s.cashierName}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <MethodChip method={s.method} />
                    <span className="text-xs font-bold tabular-nums text-zinc-900">{rupiah(s.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
