'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, tanggalWaktu, methodLabel } from '@/lib/format'
import type { Sale } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { MethodChip, ViewHeader, EmptyState } from './ui-bits'
import { ReceiptDialog } from './receipt-dialog'
import {
  Ban, Banknote, Eye, Loader2, Printer, ReceiptText, Search, ShieldCheck,
} from 'lucide-react'

type Range = '1' | '7' | '30'

export function TransactionsView() {
  const booted = useZPos((s) => s.booted)
  const currentShift = useZPos((s) => s.currentShift)
  const voidSale = useZPos((s) => s.voidSale)

  const [sales, setSales] = useState<Sale[] | null>(null)
  const [range, setRange] = useState<Range>('7')
  const [method, setMethod] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')

  const [detail, setDetail] = useState<Sale | null>(null)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const [voidOpen, setVoidOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const params = new URLSearchParams({ days: range, limit: '300', method, status })
      if (q.trim()) params.set('q', q.trim())
      const r = await fetch(`/api/sales?${params}`)
      if (!r.ok) throw new Error('gagal')
      setSales((await r.json()) as Sale[])
    } catch {
      setSales([])
      toast.error('Gagal memuat transaksi')
    }
  }

  useEffect(() => {
    if (!booted) return
    void load()
     
  }, [booted, range, method, status, currentShift])

  const filtered = useMemo(() => {
    if (!sales) return []
    const query = q.trim().toLowerCase()
    if (!query) return sales
    return sales.filter(
      (s) =>
        s.invoiceNo.toLowerCase().includes(query) ||
        s.cashierName.toLowerCase().includes(query)
    )
  }, [sales, q])

  const totals = useMemo(() => {
    const paid = filtered.filter((s) => s.status === 'paid')
    return {
      count: paid.length,
      omzet: paid.reduce((a, b) => a + b.total, 0),
      voided: filtered.filter((s) => s.status === 'void').length,
    }
  }, [filtered])

  const submitVoid = async () => {
    if (!detail) return
    if (pin.length < 4) {
      toast.error('PIN manajer minimal 4 digit')
      return
    }
    setBusy(true)
    const ok = await voidSale(detail.id, pin, reason)
    setBusy(false)
    if (ok) {
      setVoidOpen(false)
      setDetail(null)
      setPin('')
      setReason('')
      void load()
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader
        title="Riwayat Transaksi"
        desc="Audit semua penjualan — batalkan (void) dengan izin manajer bila diperlukan."
      />

      {/* Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
          {([['1', 'Hari Ini'], ['7', '7 Hari'], ['30', '30 Hari']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
                range === v ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="h-9 w-[140px] bg-white text-xs font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Metode</SelectItem>
            <SelectItem value="cash">Tunai</SelectItem>
            <SelectItem value="qris">QRIS</SelectItem>
            <SelectItem value="card">Kartu Debit</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[130px] bg-white text-xs font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="void">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari invoice / kasir…"
            className="h-9 bg-white pl-9 text-sm"
          />
        </div>
        <div className="ml-auto hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
          <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-semibold tabular-nums">
            {totals.count} lunas
          </span>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-bold tabular-nums text-emerald-700">
            {rupiah(totals.omzet)}
          </span>
          {totals.voided > 0 && (
            <span className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-bold tabular-nums text-rose-600">
              {totals.voided} void
            </span>
          )}
        </div>
      </div>

      {/* Tabel */}
      {!sales ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-300" aria-hidden="true" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Tidak ada transaksi" desc="Ubah filter atau lakukan transaksi baru di layar Kasir." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-semibold">Invoice</th>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Kasir</th>
                <th className="px-4 py-3 font-semibold">Metode</th>
                <th className="px-4 py-3 text-center font-semibold">Item</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((s) => {
                const voided = s.status === 'void'
                return (
                  <tr key={s.id} className={cn('transition-colors hover:bg-zinc-50', voided && 'opacity-55')}>
                    <td className="px-4 py-2.5">
                      <p className={cn('font-mono text-xs font-bold text-zinc-900', voided && 'line-through')}>
                        {s.invoiceNo}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{tanggalWaktu(s.createdAt)}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-zinc-700">{s.cashierName}</td>
                    <td className="px-4 py-2.5"><MethodChip method={s.method} /></td>
                    <td className="px-4 py-2.5 text-center text-xs tabular-nums text-zinc-500">
                      {s.items.reduce((a, b) => a + b.qty, 0)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-zinc-900">{rupiah(s.total)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                          voided ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        )}
                      >
                        {voided ? 'Dibatalkan' : 'Lunas'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setDetail(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label={`Detail ${s.invoiceNo}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog detail */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between font-mono text-base">
                  {detail.invoiceNo}
                  <MethodChip method={detail.method} />
                </DialogTitle>
                <DialogDescription>
                  {tanggalWaktu(detail.createdAt)} · kasir {detail.cashierName} · {detail.orderType === 'dinein' ? 'Makan di Tempat' : 'Bawa Pulang'}
                </DialogDescription>
              </DialogHeader>

              {detail.status === 'void' && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">
                  <p className="flex items-center gap-1.5 font-bold">
                    <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Transaksi dibatalkan
                  </p>
                  <p className="mt-1">Alasan: {detail.voidReason}</p>
                  {detail.voidedAt && <p className="text-rose-500">pada {tanggalWaktu(detail.voidedAt)}</p>}
                </div>
              )}

              {detail.note && (
                <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs italic text-zinc-600">Catatan: {detail.note}</p>
              )}

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
                {detail.discount > 0 && (
                  <div className="flex justify-between text-amber-700"><span>Diskon item</span><span className="tabular-nums">−{rupiah(detail.discount)}</span></div>
                )}
                {detail.orderDiscount > 0 && (
                  <div className="flex justify-between text-amber-700"><span>Diskon transaksi</span><span className="tabular-nums">−{rupiah(detail.orderDiscount)}</span></div>
                )}
                {detail.tax > 0 && (
                  <div className="flex justify-between text-zinc-500"><span>Pajak</span><span className="tabular-nums">{rupiah(detail.tax)}</span></div>
                )}
                <div className="flex justify-between border-t border-dashed border-zinc-200 pt-1.5 font-bold text-zinc-900">
                  <span>Total</span><span className="tabular-nums">{rupiah(detail.total)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Bayar ({methodLabel(detail.method)})</span>
                  <span className="tabular-nums">{rupiah(detail.paidAmount)}</span>
                </div>
                {detail.method === 'cash' && (
                  <div className="flex justify-between text-zinc-500">
                    <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" aria-hidden="true" /> Kembalian</span>
                    <span className="tabular-nums">{rupiah(detail.changeAmount)}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {detail.status === 'paid' && (
                  <Button
                    variant="outline"
                    className="border-rose-200 font-semibold text-rose-600 hover:bg-rose-50"
                    onClick={() => { setVoidOpen(true); setPin(''); setReason('') }}
                  >
                    <Ban className="mr-1.5 h-4 w-4" aria-hidden="true" /> Batalkan
                  </Button>
                )}
                <Button variant="outline" className="border-zinc-300 font-semibold" onClick={() => { setDetail(null); setReceipt(detail) }}>
                  <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" /> Lihat Struk
                </Button>
                <Button className="bg-zinc-900 font-bold text-white hover:bg-zinc-700" onClick={() => setDetail(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog void dengan PIN manajer */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Izin Manajer Diperlukan
            </DialogTitle>
            <DialogDescription>
              Membatalkan <span className="font-mono font-bold text-zinc-700">{detail?.invoiceNo}</span> akan mengembalikan stok ke inventori.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="void-pin">PIN Manajer</Label>
              <Input
                id="void-pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                className="mt-1 h-11 text-center font-mono text-lg font-bold tracking-[0.4em]"
                placeholder="••••••"
                inputMode="numeric"
                autoComplete="off"
              />
              <p className="mt-1 text-[11px] text-zinc-400">Demo: PIN manajer adalah <span className="font-mono font-bold text-zinc-600">123456</span></p>
            </div>
            <div>
              <Label htmlFor="void-reason">Alasan Pembatalan</Label>
              <Textarea
                id="void-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 min-h-16"
                placeholder="mis. Salah input pesanan pelanggan"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVoidOpen(false)}>Batal</Button>
            <Button variant="destructive" disabled={busy || reason.trim().length < 3} onClick={() => void submitVoid()}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Batalkan Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptDialog
        sale={receipt}
        open={receipt !== null}
        onOpenChange={(o) => !o && setReceipt(null)}
      />
    </div>
  )
}
