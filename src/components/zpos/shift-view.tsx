'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, tanggalWaktu, durasi, methodLabel } from '@/lib/format'
import type { Sale, Shift } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatCard, ViewHeader, EmptyState } from './ui-bits'
import { ReceiptPaper } from './receipt-dialog'
import type { Settings } from '@/lib/zpos-types'
import {
  Clock4, Coins, FileText, History, Loader2, Lock, LogIn, Printer, ScrollText, Wallet,
} from 'lucide-react'

const CASHIERS = ['Sari', 'Dewi', 'Rio']
const QUICK_MODAL = [100000, 200000, 500000, 1000000]

interface ShiftRow extends Shift {
  salesCount: number
  salesTotal: number
  cashTotal: number
}

/** Panel ringkasan shift yang bisa dicetak (Laporan X / Z) */
function ShiftReportPaper({
  kind, shift, rows, settings,
}: {
  kind: 'X' | 'Z'
  shift: Shift
  rows: Sale[]
  settings: Settings | null
}) {
  const cash = rows.filter((s) => s.method === 'cash').reduce((a, b) => a + b.total, 0)
  const nonCash = rows.filter((s) => s.method !== 'cash').reduce((a, b) => a + b.total, 0)
  const items = rows.reduce((a, b) => a + b.items.reduce((x, i) => x + i.qty, 0), 0)
  const perMethod = new Map<string, { count: number; total: number }>()
  for (const s of rows) {
    const cur = perMethod.get(s.method) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += s.total
    perMethod.set(s.method, cur)
  }

  return (
    <div className="receipt-print mx-auto w-full max-w-[300px] bg-white px-4 py-5 font-mono text-[11px] leading-relaxed text-zinc-800">
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest">{settings?.storeName ?? 'zPos'}</p>
        <p className="text-[10px] text-zinc-500">LAPORAN {kind} SHIFT · {kind === 'X' ? 'Sementara' : 'Penutupan'}</p>
      </div>
      <p className="my-2 border-t border-dashed border-zinc-300" />
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between"><span>Kasir</span><span className="font-bold">{shift.cashierName}</span></div>
        <div className="flex justify-between"><span>Dibuka</span><span>{tanggalWaktu(shift.openedAt)}</span></div>
        {shift.closedAt && <div className="flex justify-between"><span>Ditutup</span><span>{tanggalWaktu(shift.closedAt)}</span></div>}
      </div>
      <p className="my-2 border-t border-dashed border-zinc-300" />
      <div className="space-y-1">
        <div className="flex justify-between font-bold"><span>PENJUALAN</span><span className="tabular-nums">{rupiah(cash + nonCash)}</span></div>
        <div className="flex justify-between text-zinc-600"><span>{rows.length} transaksi · {items} item</span></div>
        {[...perMethod.entries()].map(([m, v]) => (
          <div key={m} className="flex justify-between text-zinc-600">
            <span>{methodLabel(m)} ({v.count}×)</span>
            <span className="tabular-nums">{rupiah(v.total)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-dashed border-zinc-300 pt-1"><span>Tunai</span><span className="tabular-nums font-bold">{rupiah(cash)}</span></div>
        <div className="flex justify-between"><span>Non-tunai</span><span className="tabular-nums">{rupiah(nonCash)}</span></div>
      </div>
      <p className="my-2 border-t border-dashed border-zinc-300" />
      <div className="space-y-0.5">
        <div className="flex justify-between"><span>Modal awal</span><span className="tabular-nums">{rupiah(shift.openingCash)}</span></div>
        <div className="flex justify-between font-bold"><span>Kas seharusnya</span><span className="tabular-nums">{rupiah(shift.openingCash + cash)}</span></div>
        {kind === 'Z' && shift.closingCash !== null && (
          <>
            <div className="flex justify-between"><span>Kas dihitung</span><span className="tabular-nums">{rupiah(shift.closingCash)}</span></div>
            <div className={cn('flex justify-between font-bold', (shift.diff ?? 0) === 0 ? 'text-emerald-700' : 'text-rose-600')}>
              <span>Selisih</span>
              <span className="tabular-nums">{(shift.diff ?? 0) === 0 ? 'BALANCE' : `${(shift.diff ?? 0) > 0 ? '+' : ''}${rupiah(shift.diff ?? 0)}`}</span>
            </div>
          </>
        )}
      </div>
      <p className="my-2 border-t border-dashed border-zinc-300" />
      <p className="text-center text-[9px] tracking-widest text-zinc-300">zPOS · LAPORAN {kind}</p>
    </div>
  )
}

export function ShiftView() {
  const currentShift = useZPos((s) => s.currentShift)
  const openShift = useZPos((s) => s.openShift)
  const closeShift = useZPos((s) => s.closeShift)
  const settings = useZPos((s) => s.settings)
  const cashier = useZPos((s) => s.cashier)
  const booted = useZPos((s) => s.booted)

  const [history, setHistory] = useState<ShiftRow[] | null>(null)
  const [shiftSales, setShiftSales] = useState<Sale[]>([])

  // form buka shift
  const [shiftCashier, setShiftCashier] = useState(cashier)
  const [modal, setModal] = useState('500000')
  const [openBusy, setOpenBusy] = useState(false)

  // form tutup shift
  const [closeOpen, setCloseOpen] = useState(false)
  const [counted, setCounted] = useState('')
  const [closeBusy, setCloseBusy] = useState(false)

  // laporan X / Z
  const [xOpen, setXOpen] = useState(false)
  const [zShift, setZShift] = useState<Shift | null>(null)
  const [zOpen, setZOpen] = useState(false)

  const load = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/shifts'),
        currentShift ? fetch(`/api/sales?days=1&limit=500&shiftId=${currentShift.id}`) : Promise.resolve(null),
      ])
      if (r1.ok) setHistory((await r1.json()) as ShiftRow[])
      if (r2 && r2.ok) setShiftSales((await r2.json()) as Sale[])
    } catch {
      setHistory([])
    }
  }

  useEffect(() => {
    if (!booted) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [booted, currentShift])

  const cashIn = shiftSales.filter((s) => s.method === 'cash').reduce((a, b) => a + b.total, 0)
  const nonCash = shiftSales.reduce((a, b) => a + b.total, 0) - cashIn
  const expected = (currentShift?.openingCash ?? 0) + cashIn

  const submitOpen = async () => {
    setOpenBusy(true)
    const ok = await openShift(shiftCashier, Number(modal) || 0)
    setOpenBusy(false)
    if (ok) void load()
  }

  const submitClose = async () => {
    if (!currentShift) return
    setCloseBusy(true)
    const closed = await closeShift(Number(counted) || 0)
    setCloseBusy(false)
    if (closed) {
      setCloseOpen(false)
      setZShift(closed)
      setZOpen(true)
      toast.success('Shift ditutup', {
        description: (closed.diff ?? 0) === 0 ? 'Kas balance — tidak ada selisih' : `Selisih kas ${rupiah(closed.diff ?? 0)}`,
      })
      void load()
    }
  }

  const diff = counted === '' ? null : (Number(counted) || 0) - expected

  const historyTotals = useMemo(() => {
    const closed = (history ?? []).filter((h) => h.status === 'closed')
    return {
      count: closed.length,
      diffOk: closed.filter((h) => (h.diff ?? 0) === 0).length,
    }
  }, [history])

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader
        title="Shift Kasir"
        desc="Rekap kas per shift — buka dengan modal awal, tutup dengan hitung fisik, laporan X/Z siap cetak."
      />

      {!currentShift ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <LogIn className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-900">Buka Shift Baru</p>
                <p className="text-xs text-zinc-500">Catat modal laci kas awal untuk rekap yang akurat.</p>
              </div>
            </div>
            <div className="space-y-3.5">
              <div>
                <Label>Kasir</Label>
                <Select value={shiftCashier} onValueChange={setShiftCashier}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CASHIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modal">Modal awal laci kas (Rp)</Label>
                <Input
                  id="modal"
                  value={modal}
                  onChange={(e) => setModal(e.target.value.replace(/[^0-9]/g, ''))}
                  className="mt-1 h-11 text-right font-mono text-lg font-bold tabular-nums"
                  inputMode="numeric"
                  placeholder="500000"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_MODAL.map((v) => (
                    <button
                      key={v}
                      onClick={() => setModal(String(v))}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                        Number(modal) === v
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                      )}
                    >
                      {rupiah(v)}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                size="lg"
                className="h-12 w-full bg-emerald-600 font-bold hover:bg-emerald-700"
                disabled={openBusy}
                onClick={() => void submitOpen()}
              >
                {openBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                <LogIn className="mr-2 h-4.5 w-4.5" aria-hidden="true" />
                Buka Shift — {rupiah(Number(modal) || 0)}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
              <ScrollText className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              Ringkasan operasional
            </p>
            <ul className="space-y-2.5 text-xs leading-relaxed text-zinc-600">
              <li className="flex gap-2"><Coins className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> Setoran kas terverifikasi: tunai tercatat vs uang fisik dihitung saat tutup shift.</li>
              <li className="flex gap-2"><Clock4 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> Semua transaksi selama shift terikat ke kasir yang bertugas (audit trail).</li>
              <li className="flex gap-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> Laporan X membaca posisi sementara; laporan Z dicetak otomatis saat shift ditutup.</li>
            </ul>
            <div className="mt-4 rounded-lg bg-zinc-50 px-3.5 py-3 text-xs text-zinc-500">
              <span className="font-bold text-zinc-700">{historyTotals.count} shift ditutup</span> sebelumnya ·{' '}
              <span className="font-semibold text-emerald-700">{historyTotals.diffOk} balance</span> tanpa selisih kas.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Clock4 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Shift Aktif — {currentShift.cashierName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Dibuka {tanggalWaktu(currentShift.openedAt)} · berjalan {durasi(currentShift.openedAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-zinc-200 bg-white font-semibold"
                  onClick={() => setXOpen(true)}
                >
                  <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" /> Laporan X
                </Button>
                <Button
                  className="bg-zinc-900 font-bold text-white hover:bg-zinc-700"
                  onClick={() => {
                    setCounted(String(expected))
                    setCloseOpen(true)
                  }}
                >
                  <Lock className="mr-1.5 h-4 w-4" aria-hidden="true" /> Tutup Shift
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Modal Awal" value={rupiah(currentShift.openingCash)} icon={Wallet} />
              <StatCard label="Penjualan Tunai" value={rupiah(cashIn)} sub={`${shiftSales.filter((s) => s.method === 'cash').length} transaksi`} icon={Coins} tone="emerald" />
              <StatCard label="Non-Tunai" value={rupiah(nonCash)} sub="QRIS / kartu / transfer" icon={ScrollText} />
              <StatCard label="Kas Seharusnya" value={rupiah(expected)} sub="modal + tunai" icon={Clock4} tone="emerald" />
            </div>
          </div>

          {/* Transaksi selama shift */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-bold text-zinc-900">Transaksi Shift Ini ({shiftSales.length})</p>
            </div>
            <div className="zpos-scroll max-h-72 overflow-y-auto">
              {shiftSales.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-zinc-400">
                  Belum ada transaksi pada shift ini.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {[...shiftSales].reverse().map((s) => (
                    <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-mono text-xs font-semibold text-zinc-900">{s.invoiceNo}</p>
                        <p className="text-[11px] text-zinc-400">
                          {tanggalWaktu(s.createdAt)} · {methodLabel(s.method)}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums">{rupiah(s.total)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Riwayat shift */}
      <div className="mt-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
          <History className="h-4 w-4 text-zinc-500" aria-hidden="true" /> Riwayat Shift
        </p>
        {history === null ? (
          <p className="text-xs text-zinc-400">Memuat…</p>
        ) : history.length === 0 ? (
          <EmptyState icon={History} title="Belum ada riwayat shift" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Kasir</th>
                  <th className="px-4 py-3 font-semibold">Periode</th>
                  <th className="px-4 py-3 text-right font-semibold">Modal</th>
                  <th className="px-4 py-3 text-right font-semibold">Tunai</th>
                  <th className="px-4 py-3 text-right font-semibold">Non-Tunai</th>
                  <th className="px-4 py-3 text-right font-semibold">Penjualan</th>
                  <th className="px-4 py-3 text-right font-semibold">Selisih Kas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-semibold text-zinc-900">{h.cashierName}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {tanggalWaktu(h.openedAt)}
                      {h.closedAt && <> → {tanggalWaktu(h.closedAt)}</>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{rupiah(h.openingCash)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-zinc-500">
                      {rupiah(h.cashSales ?? h.cashTotal ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-zinc-500">
                      {rupiah(h.nonCashSales ?? (h.salesTotal ?? 0) - (h.cashTotal ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold tabular-nums">{rupiah(h.salesTotal)}</p>
                      <p className="text-[10px] text-zinc-400">{h.salesCount} transaksi</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {h.diff === null || h.diff === undefined ? (
                        <span className="text-xs text-zinc-300">—</span>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'font-mono tabular-nums',
                            h.diff === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          )}
                        >
                          {h.diff === 0 ? 'balance' : `${h.diff > 0 ? '+' : ''}${rupiah(h.diff)}`}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={h.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}
                      >
                        {h.status === 'open' ? 'Aktif' : 'Ditutup'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog tutup shift */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tutup Shift — {currentShift?.cashierName}</DialogTitle>
            <DialogDescription>
              Hitung uang fisik di laci, lalu masukkan jumlahnya untuk rekonsiliasi. Laporan Z tercetak otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">Kas seharusnya</p>
                <p className="mt-0.5 font-mono font-bold tabular-nums">{rupiah(expected)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">Non-tunai (otomatis)</p>
                <p className="mt-0.5 font-mono font-bold tabular-nums text-zinc-500">{rupiah(nonCash)}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="counted">Uang fisik dihitung (Rp)</Label>
              <Input
                id="counted"
                value={counted}
                onChange={(e) => setCounted(e.target.value.replace(/[^0-9]/g, ''))}
                className="mt-1 h-11 text-right font-mono text-lg font-bold tabular-nums"
                inputMode="numeric"
              />
            </div>
            {diff !== null && (
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-bold',
                  diff === 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : diff < 0
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                )}
              >
                <span>{diff === 0 ? 'Kas balance' : diff < 0 ? 'Kas kurang' : 'Kas lebih'}</span>
                <span className="font-mono tabular-nums">{diff > 0 ? '+' : ''}{rupiah(diff)}</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Batal</Button>
            <Button className="bg-zinc-900 font-bold text-white hover:bg-zinc-700" disabled={closeBusy} onClick={() => void submitClose()}>
              {closeBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Tutup Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Laporan X */}
      <Dialog open={xOpen} onOpenChange={setXOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Laporan X — Sementara
            </DialogTitle>
            <DialogDescription>Posisi kas & penjualan shift berjalan. Shift tetap terbuka.</DialogDescription>
          </DialogHeader>
          {currentShift && (
            <>
              <div className="rounded-xl border border-zinc-200 shadow-inner">
                <ShiftReportPaper kind="X" shift={currentShift} rows={shiftSales} settings={settings} />
              </div>
              <Button variant="outline" className="border-zinc-300 font-semibold" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Cetak Laporan X
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Laporan Z */}
      <Dialog open={zOpen} onOpenChange={setZOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Laporan Z — Penutupan
            </DialogTitle>
            <DialogDescription>Rekap final shift. Shift telah ditutup & tercatat di riwayat.</DialogDescription>
          </DialogHeader>
          {zShift && (
            <>
              <div className="rounded-xl border border-zinc-200 shadow-inner">
                <ShiftReportPaper kind="Z" shift={zShift} rows={shiftSales} settings={settings} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-zinc-300 font-semibold" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Cetak Z
                </Button>
                <Button className="bg-zinc-900 font-bold text-white hover:bg-zinc-700" onClick={() => setZOpen(false)}>
                  Selesai
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
