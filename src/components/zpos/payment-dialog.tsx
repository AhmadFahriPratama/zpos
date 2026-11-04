'use client'

import { useMemo, useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah } from '@/lib/format'
import type { Sale } from '@/lib/zpos-types'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { METHOD_META, type Method } from './kasir-view'

const QUICK_CASH = [5000, 10000, 20000, 50000, 100000]

function FakeQr() {
  // Pola QR dekoratif (simulasi tampilan QRIS)
  const cells = useMemo(() => {
    const size = 21
    const grid: boolean[][] = []
    let seed = 42
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    for (let y = 0; y < size; y++) {
      const row: boolean[] = []
      for (let x = 0; x < size; x++) {
        const inFinder =
          (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)
        if (inFinder) {
          const lx = x >= size - 7 ? x - (size - 7) : x
          const ly = y >= size - 7 ? y - (size - 7) : y
          const ring = Math.max(Math.abs(lx - 3), Math.abs(ly - 3))
          row.push(ring !== 2)
        } else {
          row.push(rand() > 0.5)
        }
      }
      grid.push(row)
    }
    return grid
  }, [])

  return (
    <div
      className="mx-auto grid w-fit gap-px rounded-lg border border-zinc-200 bg-white p-3"
      style={{ gridTemplateColumns: `repeat(${cells.length}, 8px)` }}
      aria-label="Kode QR simulasi QRIS"
    >
      {cells.flatMap((row, y) =>
        row.map((on, x) => (
          <span
            key={`${x}-${y}`}
            className={cn('h-2 w-2', on ? 'bg-zinc-900' : 'bg-white')}
          />
        ))
      )}
    </div>
  )
}

export function PaymentDialog({
  open, onOpenChange, total, onPaid,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  total: number
  onPaid: (sale: Sale) => void
}) {
  const checkout = useZPos((s) => s.checkout)
  const [method, setMethod] = useState<Method>('cash')
  const [paidInput, setPaidInput] = useState('')
  const [busy, setBusy] = useState(false)

  const paid = method === 'cash' ? Number(paidInput) || 0 : total
  const change = paid - total
  const insufficient = method === 'cash' && paid < total

  const submit = async () => {
    setBusy(true)
    const sale = await checkout({ method, paidAmount: paid })
    setBusy(false)
    if (sale) onPaid(sale)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
          <DialogDescription>Pilih metode pembayaran yang digunakan pelanggan.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-zinc-900 px-4 py-3 text-center text-white">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Total Tagihan</p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums tracking-tight">{rupiah(total)}</p>
        </div>

        {/* Pilihan metode */}
        <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Metode pembayaran">
          {(Object.keys(METHOD_META) as Method[]).map((m) => {
            const meta = METHOD_META[m]
            const active = method === m
            return (
              <button
                key={m}
                role="tab"
                aria-selected={active}
                onClick={() => setMethod(m)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition-colors',
                  active
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                )}
              >
                <meta.icon className="h-4.5 w-4.5" aria-hidden="true" />
                {meta.label}
              </button>
            )
          })}
        </div>

        {method === 'cash' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaidInput(String(total))}
                className="rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50"
              >
                Uang Pas
              </button>
              {QUICK_CASH.map((v) => (
                <button
                  key={v}
                  onClick={() => setPaidInput(String(v))}
                  className="rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50"
                >
                  {rupiah(v)}
                </button>
              ))}
              <button
                onClick={() => setPaidInput(String(Math.ceil(total / 50000) * 50000))}
                className="rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50"
              >
                Kelipatan 50rb
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500" htmlFor="input-bayar">
                Uang diterima
              </label>
              <Input
                id="input-bayar"
                value={paidInput}
                onChange={(e) => setPaidInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                inputMode="numeric"
                className="h-11 text-right font-mono text-lg font-bold tabular-nums"
              />
            </div>
            <div
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold',
                insufficient
                  ? 'bg-rose-50 text-rose-700'
                  : paidInput
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-zinc-50 text-zinc-400'
              )}
            >
              <span>{insufficient ? 'Kekurangan' : 'Kembalian'}</span>
              <span className="font-mono tabular-nums">
                {rupiah(Math.abs(change))}
              </span>
            </div>
          </div>
        )}

        {method === 'qris' && (
          <div className="rounded-xl border border-zinc-200 py-4 text-center">
            <FakeQr />
            <p className="mt-3 text-xs font-semibold text-zinc-700">Simulasi QRIS Dinamis</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Pada versi rilis: QR terbit via payment gateway (Midtrans/Xendit) &amp; status terverifikasi otomatis.
            </p>
          </div>
        )}

        {(method === 'transfer' || method === 'card') && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center text-sm text-zinc-600">
            Konfirmasi setelah {method === 'card' ? 'mesin EDC' : 'transfer'} terverifikasi,
            lalu tekan <strong>Selesaikan Pembayaran</strong>.
          </div>
        )}

        <Button
          size="lg"
          className="h-12 w-full bg-emerald-600 text-base font-bold hover:bg-emerald-700 disabled:opacity-40"
          disabled={busy || insufficient}
          onClick={() => void submit()}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {method === 'qris' ? 'Tandai Sudah Dibayar' : 'Selesaikan Pembayaran'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
