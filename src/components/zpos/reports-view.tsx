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
import { StatCard, MethodChip, ViewHeader } from './ui-bits'
import { RevenueBars, DonutMethod, TopProductList } from './charts'
import {
  Banknote, BarChart3, Coins, FileDown, Loader2, ReceiptText, Calculator,
} from 'lucide-react'

type Range = '7' | '30'

export function ReportsView() {
  const booted = useZPos((s) => s.booted)
  const currentShift = useZPos((s) => s.currentShift)
  const [stats, setStats] = useState<Stats | null>(null)
  const [sales, setSales] = useState<Sale[] | null>(null)
  const [range, setRange] = useState<Range>('7')
  const [detail, setDetail] = useState<Sale | null>(null)

  useEffect(() => {
    if (!booted) return
    const offset = new Date().getTimezoneOffset()
    void (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`/api/stats?offset=${offset}&range=${range}`),
          fetch(`/api/sales?days=${range}&limit=300`),
        ])
        if (r1.ok) setStats((await r1.json()) as Stats)
        if (r2.ok) setSales((await r2.json()) as Sale[])
      } catch {
        toast.error('Gagal memuat laporan')
      }
    })()
  }, [booted, range, currentShift])

  const rangeRevenue = stats?.series.reduce((a, b) => a + b.revenue, 0) ?? 0
  const rangeCount = stats?.series.reduce((a, b) => a + b.count, 0) ?? 0
  const days = Number(range)

  const exportCsv = () => {
    if (!sales || sales.length === 0) return
    const rows = [
      ['Invoice', 'Tanggal', 'Kasir', 'Metode', 'Tipe Order', 'Item', 'Subtotal', 'Diskon', 'Pajak', 'Total', 'Status'],
      ...sales.map((s) => [
        s.invoiceNo,
        new Date(s.createdAt).toLocaleString('id-ID'),
        s.cashierName,
        methodLabel(s.method),
        s.orderType === 'dinein' ? 'Di Tempat' : 'Bawa Pulang',
        String(s.items.reduce((a, b) => a + b.qty, 0)),
        String(s.subtotal),
        String(s.discount + s.orderDiscount),
        String(s.tax),
        String(s.total),
        s.status === 'paid' ? 'Lunas' : 'Dibatalkan',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zpos-laporan-${range}hari-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Laporan CSV diunduh')
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader title="Laporan Penjualan" desc="Analitik performa toko — data langsung dari server lokal.">
        <Button variant="outline" size="sm" className="h-9 border-zinc-200 bg-white font-semibold" onClick={exportCsv} disabled={!sales?.length}>
          <FileDown className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ekspor CSV
        </Button>
      </ViewHeader>

      {/* Pilihan periode */}
      <div className="mb-4 flex rounded-lg border border-zinc-200 bg-white p-0.5 w-fit">
        {([['7', '7 Hari Terakhir'], ['30', '30 Hari Terakhir']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setRange(v)}
            className={cn(
              'rounded-md px-4 py-1.5 text-xs font-bold transition-colors',
              range === v ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" aria-hidden="true" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Kartu ringkasan periode */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={`Omzet ${days} Hari`} value={rupiah(rangeRevenue)} icon={Banknote} tone="emerald" />
            <StatCard label={`Transaksi ${days} Hari`} value={angka(rangeCount)} sub={`±${Math.round(rangeCount / days)}/hari`} icon={ReceiptText} />
            <StatCard label="Rata-rata / Hari" value={rupiah(Math.round(rangeRevenue / days))} icon={BarChart3} />
            <StatCard
              label="Rata-rata / Transaksi"
              value={rupiah(rangeCount > 0 ? Math.round(rangeRevenue / rangeCount) : 0)}
              icon={Calculator}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            {/* Grafik */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                  <BarChart3 className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                  Tren Penjualan Harian
                </p>
                <p className="text-xs font-semibold text-zinc-400">Total {rupiah(rangeRevenue)}</p>
              </div>
              <RevenueBars data={stats.series} height={210} />
            </div>

            {/* Metode pembayaran */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-900">
                <Coins className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                Metode Pembayaran
              </p>
              <DonutMethod data={stats.methodBreakdown} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            {/* Produk terlaris */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
              <p className="mb-4 text-sm font-bold text-zinc-900">Produk Terlaris</p>
              <TopProductList items={stats.topProducts} />
            </div>

            {/* Transaksi terakhir */}
            <div className="min-w-0 rounded-xl border border-zinc-200 bg-white shadow-sm xl:col-span-3">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-bold text-zinc-900">Transaksi Terakhir</p>
                {sales && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                    {sales.length} transaksi
                  </span>
                )}
              </div>
              <div className="zpos-scroll max-h-[420px] overflow-y-auto">
                {!sales ? (
                  <p className="px-4 py-10 text-center text-xs text-zinc-400">Memuat…</p>
                ) : sales.length === 0 ? (
                  <p className="px-4 py-10 text-center text-xs text-zinc-400">Belum ada transaksi.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {sales.map((s) => {
                      const voided = s.status === 'void'
                      return (
                        <li key={s.id}>
                          <button
                            onClick={() => setDetail(s)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50"
                          >
                            <div className="min-w-0">
                              <p className={cn('font-mono text-xs font-semibold text-zinc-900', voided && 'line-through opacity-60')}>
                                {s.invoiceNo}
                              </p>
                              <p className="truncate text-[11px] text-zinc-400">
                                {tanggalWaktu(s.createdAt)} · {s.cashierName} · {s.items.length} item
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <MethodChip method={s.method} />
                              <p className={cn('text-sm font-bold tabular-nums', voided ? 'text-zinc-400 line-through' : 'text-zinc-900')}>
                                {rupiah(s.total)}
                              </p>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail transaksi */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
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
                        {it.discount > 0 && <span className="text-amber-600"> −{rupiah(it.discount)}</span>}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{rupiah(it.subtotal)}</p>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 rounded-lg bg-zinc-50 px-3 py-2.5 text-sm">
                <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span className="tabular-nums">{rupiah(detail.subtotal)}</span></div>
                {(detail.discount > 0 || detail.orderDiscount > 0) && (
                  <div className="flex justify-between text-amber-700">
                    <span>Diskon</span>
                    <span className="tabular-nums">−{rupiah(detail.discount + detail.orderDiscount)}</span>
                  </div>
                )}
                {detail.tax > 0 && (
                  <div className="flex justify-between text-zinc-500"><span>Pajak</span><span className="tabular-nums">{rupiah(detail.tax)}</span></div>
                )}
                <div className="flex justify-between border-t border-dashed border-zinc-200 pt-1.5 font-bold text-zinc-900">
                  <span>Total</span><span className="tabular-nums">{rupiah(detail.total)}</span>
                </div>
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
