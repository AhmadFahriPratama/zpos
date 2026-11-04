'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { useZPos, computeTotals } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, orderTypeLabel } from '@/lib/format'
import type { Sale } from '@/lib/zpos-types'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Banknote, Check, CreditCard, Landmark, Loader2, QrCode, Wallet,
} from 'lucide-react'

type Method = 'cash' | 'qris' | 'card' | 'transfer'

const METHODS: Array<{ id: Method; label: string; icon: typeof Banknote }> = [
  { id: 'cash', label: 'Tunai', icon: Banknote },
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'card', label: 'Kartu', icon: CreditCard },
  { id: 'transfer', label: 'Transfer', icon: Landmark },
]

const BANKS = ['BCA', 'Mandiri', 'BRI', 'BNI']

function Keypad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back']
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white font-mono text-base font-bold text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-95"
          aria-label={k === 'back' ? 'Hapus angka' : `Tombol ${k}`}
        >
          {k === 'back' ? '⌫' : k}
        </button>
      ))}
    </div>
  )
}

export function PaymentDialog({
  open, onOpenChange, onPaid,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onPaid: (sale: Sale) => void
}) {
  const cart = useZPos((s) => s.cart)
  const settings = useZPos((s) => s.settings)
  const orderDiscount = useZPos((s) => s.orderDiscount)
  const checkout = useZPos((s) => s.checkout)

  const [method, setMethod] = useState<Method>('cash')
  const [paidInput, setPaidInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [qrData, setQrData] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [cardStage, setCardStage] = useState<'idle' | 'processing' | 'approved'>('idle')
  const [bank, setBank] = useState(BANKS[0])

  const totals = computeTotals(cart, orderDiscount, settings)
  const itemCount = cart.reduce((s, c) => s + c.qty, 0)
  const storeName = settings?.storeName ?? 'zPos'

  // Reset saat dibuka
  useEffect(() => {
    if (open) {
      setMethod('cash')
      setPaidInput('')
      setBusy(false)
      setCardStage('idle')
      setCountdown(60)
    }
  }, [open])

  // QRIS: generate QR asli dari payload
  useEffect(() => {
    if (open && method === 'qris') {
      const payload = `ZPOS|${storeName}|TOTAL:${totals.total}|TS:${Date.now()}`
      QRCode.toDataURL(payload, { width: 420, margin: 1, color: { dark: '#18181b', light: '#ffffff' } })
        .then(setQrData)
        .catch(() => setQrData(''))
    }
  }, [open, method, totals.total, storeName])

  // QRIS countdown
  useEffect(() => {
    if (!(open && method === 'qris')) return
    const t = setInterval(() => setCountdown((c) => (c <= 1 ? 60 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [open, method])

  const paid = method === 'cash' ? Number(paidInput) || 0 : totals.total
  const change = paid - totals.total
  const insufficient = method === 'cash' && paid < totals.total

  const quickCash = useMemo(() => {
    const t = totals.total
    const set = new Set<number>()
    for (const v of [20000, 50000, 100000]) if (v >= t) set.add(v)
    set.add(Math.ceil(t / 50000) * 50000)
    return [...set].filter((v) => v >= t).sort((a, b) => a - b).slice(0, 4)
  }, [totals.total])

  const onKey = (k: string) => {
    if (k === 'back') setPaidInput((p) => p.slice(0, -1))
    else setPaidInput((p) => (p + k).replace(/^0+(?=\d)/, ''))
  }

  const submit = async () => {
    setBusy(true)
    const sale = await checkout({ method, paidAmount: paid })
    setBusy(false)
    if (sale) onPaid(sale)
  }

  const simulateCard = () => {
    setCardStage('processing')
    setTimeout(() => {
      setCardStage('approved')
      setTimeout(() => void submit(), 600)
    }, 1600)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
          <DialogDescription>
            {itemCount} item · {orderTypeLabel(useZPos.getState().orderType)}
            {totals.orderDiscount > 0 && ` · diskon −${rupiah(totals.orderDiscount)}`}
            {totals.tax > 0 && ` · pajak ${rupiah(totals.tax)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-zinc-900 px-4 py-3.5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Total Tagihan</p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums tracking-tight">{rupiah(totals.total)}</p>
        </div>

        {/* Pilihan metode */}
        <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Metode pembayaran">
          {METHODS.map((m) => {
            const active = method === m.id
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={active}
                onClick={() => setMethod(m.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-bold transition-colors',
                  active
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                )}
              >
                <m.icon className="h-4 w-4" aria-hidden="true" />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* ============ Tunai ============ */}
        {method === 'cash' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setPaidInput(String(totals.total))}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Uang Pas
              </button>
              {quickCash.map((v) => (
                <button
                  key={v}
                  onClick={() => setPaidInput(String(v))}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-700 transition-colors hover:border-zinc-900"
                >
                  {rupiah(v)}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Uang Diterima</p>
              <p className={cn('font-mono text-2xl font-bold tabular-nums', paidInput ? 'text-zinc-900' : 'text-zinc-300')}>
                {paidInput ? rupiah(Number(paidInput)) : 'Rp 0'}
              </p>
            </div>

            <Keypad onKey={onKey} />

            <div
              className={cn(
                'flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-bold',
                insufficient
                  ? 'bg-rose-50 text-rose-700'
                  : paidInput
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-zinc-50 text-zinc-400'
              )}
            >
              <span>{insufficient ? 'Kekurangan' : 'Kembalian'}</span>
              <span className="font-mono text-base tabular-nums">{rupiah(Math.abs(change))}</span>
            </div>
          </div>
        )}

        {/* ============ QRIS ============ */}
        {method === 'qris' && (
          <div className="rounded-xl border border-zinc-200 px-4 py-4 text-center">
            {qrData ? (
               
              <img src={qrData} alt="Kode QRIS" className="mx-auto h-48 w-48 rounded-lg" />
            ) : (
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-zinc-100">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" aria-hidden="true" />
              </div>
            )}
            <p className="mt-3 text-xs font-bold text-zinc-800">
              Scan dengan aplikasi pembayaran apa pun
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <Wallet className="h-3 w-3" aria-hidden="true" />
              QRIS dinamis · berlaku {countdown} detik · demo
            </p>
          </div>
        )}

        {/* ============ Kartu ============ */}
        {method === 'card' && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
            <span
              className={cn(
                'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
                cardStage === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-500'
              )}
            >
              {cardStage === 'approved'
                ? <Check className="h-6 w-6" aria-hidden="true" />
                : cardStage === 'processing'
                  ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  : <CreditCard className="h-6 w-6" aria-hidden="true" />}
            </span>
            <p className="mt-3 text-sm font-bold text-zinc-900">
              {cardStage === 'processing'
                ? 'Memproses kartu…'
                : cardStage === 'approved'
                  ? 'Pembayaran disetujui'
                  : 'Tempel / gesek kartu di mesin EDC'}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {rupiah(totals.total)} · kontak & kontakless
            </p>
            {cardStage === 'idle' && (
              <Button
                size="sm"
                className="mt-3 h-9 bg-zinc-900 px-4 text-xs font-bold text-white hover:bg-zinc-700"
                onClick={simulateCard}
              >
                Proses di Mesin EDC
              </Button>
            )}
          </div>
        )}

        {/* ============ Transfer ============ */}
        {method === 'transfer' && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
            <p className="text-xs font-bold text-zinc-800">Virtual Account · {bank}</p>
            <p className="mt-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-zinc-900">
              8808 1092 7745 5521
            </p>
            <p className="mt-1.5 text-center text-[11px] text-zinc-400">
              Nominal harus tepat {rupiah(totals.total)} · verifikasi otomatis
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {BANKS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBank(b)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[11px] font-bold transition-colors',
                    bank === b ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tombol aksi */}
        {(method !== 'card' || cardStage !== 'processing') && (
          <Button
            size="lg"
            className="h-12 w-full bg-emerald-600 text-base font-bold hover:bg-emerald-700 disabled:opacity-40"
            disabled={busy || insufficient || (method === 'qris' && !qrData)}
            onClick={() => void submit()}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {method === 'cash' ? 'Bayar Sekarang' : method === 'qris' ? 'Tandai Sudah Dibayar' : 'Konfirmasi Pembayaran'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
