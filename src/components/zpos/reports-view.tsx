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
import { StatCard, MethodChip, ViewHeader, EmptyState } from './ui-bits'
import { RevenueBars, ProfitBars, DonutMethod, TopProductList } from './charts'
import {
  Banknote, BarChart3, Coins, Crown, FileDown, Loader2, ReceiptText, Calculator,
  Star, Tag, TrendingUp, UserCog, UsersRound,
} from 'lucide-react'

type Range = '7' | '30'
type Tab = 'ringkasan' | 'laba' | 'kategori' | 'kasir' | 'pelanggan'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'laba', label: 'Laba' },
  { id: 'kategori', label: 'Kategori' },
  { id: 'kasir', label: 'Kasir' },
  { id: 'pelanggan', label: 'Pelanggan' },
]

export function ReportsView() {
  const booted = useZPos((s) => s.booted)
  const currentShift = useZPos((s) => s.currentShift)
  const memberCount = useZPos((s) => s.customers.length)
  const goldCount = useZPos((s) => s.customers.filter((c) => c.tier === 'gold').length)
  const totalPoints = useZPos((s) => s.customers.reduce((a, c) => a + c.points, 0))
  const [stats, setStats] = useState<Stats | null>(null)
  const [sales, setSales] = useState<Sale[] | null>(null)
  const [range, setRange] = useState<Range>('7')
  const [tab, setTab] = useState<Tab>('ringkasan')
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
  const rangeProfit = stats?.rangeProfit ?? 0
  const margin = rangeRevenue > 0 ? Math.round((rangeProfit / rangeRevenue) * 100) : 0

  const exportCsv = () => {
    if (!sales || sales.length === 0) return
    const rows = [
      ['Invoice', 'Tanggal', 'Kasir', 'Pelanggan', 'Metode', 'Tipe Order', 'Item', 'Subtotal', 'Diskon', 'Pajak', 'Total', 'Status'],
      ...sales.map((s) => [
        s.invoiceNo,
        new Date(s.createdAt).toLocaleString('id-ID'),
        s.cashierName,
        s.customerName ?? 'Umum',
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
      <ViewHeader title="Laporan" desc="Analitik lengkap performa bisnis — data langsung dari server lokal.">
        <Button variant="outline" size="sm" className="h-9 border-zinc-200 bg-white font-semibold" onClick={exportCsv} disabled={!sales?.length}>
          <FileDown className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ekspor CSV
        </Button>
      </ViewHeader>

      {/* Pilihan periode */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
          {([['7', '7 Hari'], ['30', '30 Hari']] as const).map(([v, label]) => (
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
        <div className="zpos-scroll flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'shrink-0 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors',
                tab === t.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!stats ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" aria-hidden="true" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ============ TAB RINGKASAN ============ */}
          {tab === 'ringkasan' && (
            <>
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

                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <p className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <Coins className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                    Metode Pembayaran
                  </p>
                  <DonutMethod data={stats.methodBreakdown} />
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-5">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <p className="mb-4 text-sm font-bold text-zinc-900">Produk Terlaris</p>
                  <TopProductList items={stats.topProducts} />
                </div>

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
                                    {tanggalWaktu(s.createdAt)} · {s.cashierName} · {s.customerName ? s.customerName : 'Umum'} · {s.items.length} item
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
            </>
          )}

          {/* ============ TAB LABA ============ */}
          {tab === 'laba' && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label={`Laba Kotor ${days} Hari`} value={rupiah(rangeProfit)} icon={TrendingUp} tone="emerald" />
                <StatCard label="Margin Kotor" value={`${margin}%`} sub="laba ÷ omzet" icon={Calculator} />
                <StatCard label="Laba Hari Ini" value={rupiah(stats.todayProfit)} icon={Banknote} />
                <StatCard label={`Omzet ${days} Hari`} value={rupiah(rangeRevenue)} icon={ReceiptText} />
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    Omzet vs Laba Harian
                  </p>
                  <p className="text-xs font-semibold text-zinc-400">
                    Laba {rupiah(rangeProfit)} dari omzet {rupiah(rangeRevenue)}
                  </p>
                </div>
                <ProfitBars data={stats.profitSeries} height={230} />
              </div>

              <div className="grid gap-4 xl:grid-cols-5">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <p className="mb-4 text-sm font-bold text-zinc-900">Metode Pembayaran</p>
                  <DonutMethod data={stats.methodBreakdown} />
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-3">
                  <p className="mb-4 text-sm font-bold text-zinc-900">Catatan Analisis Laba</p>
                  <ul className="space-y-2.5 text-xs leading-relaxed text-zinc-500">
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />Laba kotor dihitung dari harga jual dikurangi HPP (harga pokok) per item — belum termasuk biaya operasional seperti sewa & gaji.</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />Margin sehat untuk F&B umumnya 55–70%. Margin Anda saat ini <b className="text-zinc-800">{margin}%</b>.</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />Perbarui harga beli produk lewat modul <b className="text-zinc-800">Pembelian</b> agar HPP selalu akurat.</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* ============ TAB KATEGORI ============ */}
          {tab === 'kategori' && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-900">
                <Tag className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                Penjualan per Kategori — {days} hari
              </p>
              {stats.categoryBreakdown.length === 0 ? (
                <EmptyState icon={Tag} title="Belum ada penjualan" desc="Data kategori muncul setelah ada transaksi." />
              ) : (
                <ul className="space-y-4">
                  {stats.categoryBreakdown.map((c, i) => {
                    const maxRev = Math.max(1, ...stats.categoryBreakdown.map((x) => x.revenue))
                    return (
                      <li key={c.name}>
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                              i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                            )}>
                              {i + 1}
                            </span>
                            <span className="font-bold text-zinc-800">{c.name}</span>
                            <span className="text-zinc-400">({angka(c.qty)} item)</span>
                          </span>
                          <span className="shrink-0 tabular-nums">
                            <span className="font-bold text-zinc-900">{rupiah(c.revenue)}</span>
                            <span className="ml-2 text-emerald-600">laba {rupiah(c.profit)}</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={cn('h-full rounded-full', i === 0 ? 'bg-emerald-500' : 'bg-zinc-300')}
                            style={{ width: `${Math.round((c.revenue / maxRev) * 100)}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ============ TAB KASIR ============ */}
          {tab === 'kasir' && (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                  <UserCog className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                  Performa Kasir — {days} hari
                </p>
                <span className="text-[11px] font-semibold text-zinc-400">{stats.cashierBreakdown.length} kasir aktif</span>
              </div>
              {stats.cashierBreakdown.length === 0 ? (
                <EmptyState icon={UserCog} title="Belum ada transaksi" desc="Rekap kasir muncul setelah ada penjualan." />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Kasir</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Transaksi</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Total Omzet</th>
                      <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Rata-rata / Trx</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {stats.cashierBreakdown.map((c, i) => {
                      const pct = rangeRevenue > 0 ? Math.round((c.total / rangeRevenue) * 100) : 0
                      return (
                        <tr key={c.name} className="transition-colors hover:bg-zinc-50">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2.5">
                              <span className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold',
                                i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                              )}>
                                {c.name.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="font-semibold text-zinc-900">{c.name}</span>
                              {i === 0 && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                                  Terbaik
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums text-zinc-600">{angka(c.count)}</td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums text-zinc-900">{rupiah(c.total)}</td>
                          <td className="hidden px-4 py-3 text-right tabular-nums text-zinc-500 sm:table-cell">
                            {rupiah(Math.round(c.total / Math.max(1, c.count)))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                              </span>
                              <span className="w-8 text-right text-xs font-bold tabular-nums text-zinc-600">{pct}%</span>
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ============ TAB PELANGGAN ============ */}
          {tab === 'pelanggan' && (
            <div className="grid gap-4 xl:grid-cols-5">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-3">
                <p className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-900">
                  <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  Member Teratas — {days} hari
                </p>
                {stats.topCustomers.length === 0 ? (
                  <EmptyState icon={UsersRound} title="Belum ada transaksi member" desc="Tandai pelanggan di layar kasir untuk melacak loyalitas." />
                ) : (
                  <ol className="space-y-3">
                    {stats.topCustomers.map((c, i) => (
                      <li key={c.id} className="flex items-center gap-3">
                        <span className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                          i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'
                        )}>
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-900">{c.name}</p>
                          <p className="text-[11px] text-zinc-400">{c.count} kunjungan</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-900">{rupiah(c.total)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
                <p className="mb-3 text-sm font-bold text-zinc-900">Ringkasan Loyalitas</p>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                    <span className="flex items-center gap-2 font-semibold text-zinc-600"><UsersRound className="h-4 w-4 text-zinc-400" aria-hidden="true" /> Total Member</span>
                    <span className="font-bold tabular-nums text-zinc-900">{angka(memberCount)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2.5">
                    <span className="flex items-center gap-2 font-semibold text-amber-700"><Crown className="h-4 w-4 text-amber-500" aria-hidden="true" /> Member Gold</span>
                    <span className="font-bold tabular-nums text-amber-800">{angka(goldCount)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                    <span className="flex items-center gap-2 font-semibold text-zinc-600"><Star className="h-4 w-4 text-amber-400" aria-hidden="true" /> Poin Beredar</span>
                    <span className="font-bold tabular-nums text-zinc-900">{angka(totalPoints)}</span>
                  </div>
                  <p className="px-1 pt-1 leading-relaxed text-zinc-400">
                    Kelola tier & poin di modul <b className="text-zinc-600">Pelanggan</b>. Poin bertambah otomatis
                    1 poin setiap Rp10.000 belanja saat kasir memilih member.
                  </p>
                  <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-400">
                    Tip: tawarkan promo bertingkat ke member yang mendekati syarat minimal untuk mendorong transaksi lebih besar.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail transaksi */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{detail?.invoiceNo}</DialogTitle>
            <DialogDescription>
              {detail && `${tanggalWaktu(detail.createdAt)} · kasir ${detail.cashierName} · ${methodLabel(detail.method)}`}
              {detail?.customerName && ` · member ${detail.customerName}`}
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
                    <span>Diskon{detail.promoName ? ` (${detail.promoName})` : ''}</span>
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
