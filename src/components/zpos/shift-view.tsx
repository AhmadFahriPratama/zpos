'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, tanggalWaktu } from '@/lib/format'
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
import {
  Clock, Clock4, Coins, History, LockKeyholeOpen, Lock, LogIn, ScrollText, Wallet,
} from 'lucide-react'

const CASHIERS = ['Sari', 'Budi', 'Owner']
const QUICK_MODAL = [100000, 200000, 500000, 1000000]

interface ShiftRow extends Shift {
  salesCount: number
  salesTotal: number
  cashTotal: number
}

export function ShiftView() {
  const currentShift = useZPos((s) => s.currentShift)
  const openShift = useZPos((s) => s.openShift)
  const closeShift = useZPos((s) => s.closeShift)
  const booted = useZPos((s) => s.booted)

  const [history, setHistory] = useState<ShiftRow[] | null>(null)
  const [salesToday, setSalesToday] = useState<Sale[] | null>(null)

  // form buka shift
  const [cashier, setCashier] = useState('Sari')
  const [modal, setModal] = useState('500000')
  const [openBusy, setOpenBusy] = useState(false)

  // form tutup shift
  const [closeOpen, setCloseOpen] = useState(false)
  const [counted, setCounted] = useState('')
  const [closeBusy, setCloseBusy] = useState(false)

  const fetchHistory = async (): Promise<{ rows: ShiftRow[]; sales: Sale[] }> => {
    const [r, r2] = await Promise.all([fetch('/api/shifts'), fetch('/api/sales?days=1&limit=300')])
    return {
      rows: r.ok ? ((await r.json()) as ShiftRow[]) : [],
      sales: r2.ok ? ((await r2.json()) as Sale[]) : [],
    }
  }

  useEffect(() => {
    if (!booted) return
    let cancelled = false
    fetchHistory()
      .then(({ rows, sales }) => {
        if (cancelled) return
        setHistory(rows)
        setSalesToday(sales)
      })
      .catch(() => {
        if (cancelled) return
        setHistory([])
      })
    return () => {
      cancelled = true
    }
  }, [booted, currentShift])

  const reload = async () => {
    try {
      const { rows, sales } = await fetchHistory()
      setHistory(rows)
      setSalesToday(sales)
    } catch {
      setHistory([])
    }
  }

  const shiftSales = useMemo(() => {
    if (!currentShift || !salesToday) return []
    return salesToday.filter((s) => s.shiftId === currentShift.id)
  }, [currentShift, salesToday])

  const cashIn = shiftSales.filter((s) => s.method === 'cash').reduce((a, b) => a + b.total, 0)
  const nonCash = shiftSales.reduce((a, b) => a + b.total, 0) - cashIn
  const expected = (currentShift?.openingCash ?? 0) + cashIn

  const submitOpen = async () => {
    setOpenBusy(true)
    const ok = await openShift(cashier, Number(modal) || 0)
    setOpenBusy(false)
    if (ok) void reload()
  }

  const submitClose = async () => {
    setCloseBusy(true)
    const ok = await closeShift(Number(counted) || 0)
    setCloseBusy(false)
    if (ok) {
      setCloseOpen(false)
      void reload()
    }
  }

  return (
    <div>
      <ViewHeader
        title="Shift Kasir"
        desc="Rekap kas per shift — buka dengan modal awal, tutup dengan hitung fisik."
      />

      {!currentShift ? (
        /* ============ Belum ada shift ============ */
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <LogIn className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-900">Buka Shift Baru</p>
                <p className="text-xs text-zinc-500">Catat modal laci kas awal untuk rekap yang akurat.</p>
              </div>
            </div>
            <div className="space-y-3.5">
              <div>
                <Label>Kasir</Label>
                <Select value={cashier} onValueChange={setCashier}>
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
                <LockKeyholeOpen className="mr-2 h-4.5 w-4.5" aria-hidden="true" />
                Buka Shift — {rupiah(Number(modal) || 0)}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
              <ScrollText className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              Kenapa shift penting?
            </p>
            <ul className="space-y-2.5 text-xs leading-relaxed text-zinc-600">
              <li className="flex gap-2"><Coins className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> Setoran kas terverifikasi: tunai tercatat vs uang fisik dihitung saat tutup.</li>
              <li className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> Semua transaksi selama shift terikat ke kasir yang bertugas (audit trail).</li>
              <li className="flex gap-2"><Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> Selisih kas langsung terhitung — mencegah kebocoran tanpa konfrontasi.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* ============ Shift aktif ============ */
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Clock4 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Shift Aktif — {currentShift.cashierName}
                  </p>
                  <p className="text-xs text-zinc-500">Dibuka {tanggalWaktu(currentShift.openedAt)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-zinc-900 font-semibold text-zinc-900 hover:bg-zinc-900 hover:text-white"
                onClick={() => {
                  setCounted(String(expected))
                  setCloseOpen(true)
                }}
              >
                <Lock className="mr-2 h-4 w-4" aria-hidden="true" /> Tutup Shift
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Modal Awal" value={rupiah(currentShift.openingCash)} icon={Wallet} />
              <StatCard label="Penjualan Tunai" value={rupiah(cashIn)} sub={`${shiftSales.filter((s) => s.method === 'cash').length} transaksi`} icon={Coins} tone="emerald" />
              <StatCard label="Non-Tunai" value={rupiah(nonCash)} sub="QRIS/transfer/kartu" icon={ScrollText} />
              <StatCard label="Kas Seharusnya" value={rupiah(expected)} sub="modal + tunai" icon={Clock4} tone="emerald" />
            </div>
          </div>

          {/* Transaksi selama shift */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-bold text-zinc-900">Transaksi Shift Ini ({shiftSales.length})</p>
            </div>
            <div className="plan-scroll max-h-72 overflow-y-auto">
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
                        <p className="text-[11px] text-zinc-400">{tanggalWaktu(s.createdAt)} · {s.method === 'cash' ? 'Tunai' : s.method === 'qris' ? 'QRIS' : s.method === 'transfer' ? 'Transfer' : 'Kartu'}</p>
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
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Kasir</th>
                  <th className="px-4 py-3 font-semibold">Periode</th>
                  <th className="px-4 py-3 text-right font-semibold">Modal</th>
                  <th className="px-4 py-3 text-right font-semibold">Penjualan</th>
                  <th className="px-4 py-3 text-right font-semibold">Selisih Kas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{h.cashierName}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {tanggalWaktu(h.openedAt)}
                      {h.closedAt && <> → {tanggalWaktu(h.closedAt)}</>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{rupiah(h.openingCash)}</td>
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
              Hitung uang fisik di laci, lalu masukkan jumlahnya untuk rekonsiliasi.
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
            {counted !== '' && (
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold',
                  Number(counted) - expected === 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                )}
              >
                <span>Selisih kas</span>
                <span className="font-mono tabular-nums">
                  {Number(counted) - expected === 0
                    ? 'Balance ✓'
                    : `${Number(counted) - expected > 0 ? '+' : ''}${rupiah(Number(counted) - expected)}`}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Batal</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" disabled={closeBusy} onClick={() => void submitClose()}>
              {closeBusy ? 'Memproses…' : 'Tutup Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
