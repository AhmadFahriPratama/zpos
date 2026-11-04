'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, angka, tanggalWaktu } from '@/lib/format'
import type { StockMove } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { StatCard, ViewHeader } from './ui-bits'
import {
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, ClipboardCheck,
  History, PackageSearch, Wallet,
} from 'lucide-react'

type AdjustType = 'in' | 'out' | 'adjust'

const TYPE_META: Record<AdjustType, { label: string; labelShort: string; cls: string }> = {
  in: { label: 'Stok Masuk', labelShort: 'Masuk', cls: 'bg-emerald-100 text-emerald-700' },
  out: { label: 'Stok Keluar', labelShort: 'Keluar', cls: 'bg-rose-100 text-rose-700' },
  adjust: { label: 'Opname (set fisik)', labelShort: 'Opname', cls: 'bg-amber-100 text-amber-700' },
}

export function StockView() {
  const products = useZPos((s) => s.products)
  const adjustStock = useZPos((s) => s.adjustStock)

  const [moves, setMoves] = useState<StockMove[] | null>(null)
  const [target, setTarget] = useState<{ productId: string; name: string; stock: number; type: AdjustType } | null>(null)
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const loadMoves = async () => {
    try {
      const res = await fetch('/api/stock/moves?limit=40')
      if (!res.ok) throw new Error('gagal')
      setMoves((await res.json()) as StockMove[])
    } catch {
      setMoves([])
    }
  }

  useEffect(() => {
    void loadMoves()
  }, [])

  const lowStock = useMemo(
    () => products.filter((p) => p.isActive && p.stock <= p.minStock).sort((a, b) => a.stock - b.stock),
    [products]
  )
  const stockValue = useMemo(
    () => products.reduce((s, p) => s + p.stock * p.cost, 0),
    [products]
  )

  const openDialog = (productId: string, name: string, stock: number, type: AdjustType) => {
    setTarget({ productId, name, stock, type })
    setQty('')
    setNote('')
  }

  const submit = async () => {
    if (!target) return
    const n = Number(qty)
    if (!Number.isFinite(n) || n < 0 || (n === 0 && target.type !== 'adjust')) {
      toast.error(target.type === 'adjust' ? 'Jumlah fisik tidak boleh minus' : 'Jumlah harus lebih dari 0')
      return
    }
    if (target.type === 'out' && n > target.stock) {
      toast.error(`Stok hanya ${target.stock}`)
      return
    }
    setBusy(true)
    const ok = await adjustStock({ productId: target.productId, type: target.type, qty: n, note })
    setBusy(false)
    if (ok) {
      setTarget(null)
      void loadMoves()
    }
  }

  return (
    <div>
      <ViewHeader title="Inventori & Stok" desc="Pantau stok minimum, penyesuaian, dan riwayat pergerakan." />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="SKU Aktif" value={angka(products.filter((p) => p.isActive).length)} icon={Boxes} />
        <StatCard label="Nilai Stok (Modal)" value={rupiah(stockValue)} icon={Wallet} tone="emerald" />
        <StatCard
          label="Alert Stok Minimum"
          value={angka(lowStock.length)}
          sub={lowStock.length > 0 ? 'perlu restock' : 'aman'}
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? 'amber' : 'default'}
        />
        <StatCard label="Riwayat Terekam" value={moves ? `${moves.length} gerakan` : '—'} icon={History} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Tabel stok */}
        <div className="min-w-0 xl:col-span-3">
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Produk</th>
                  <th className="px-4 py-3 text-center font-semibold">Stok</th>
                  <th className="px-4 py-3 text-center font-semibold">Min</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.filter((p) => p.isActive).map((p) => {
                  const low = p.stock <= p.minStock
                  return (
                    <tr key={p.id} className={cn(low && 'bg-amber-50/50')}>
                      <td className="max-w-[240px] px-4 py-2.5">
                        <p className="truncate font-medium text-zinc-900">{p.name}</p>
                        <p className="font-mono text-[11px] text-zinc-400">{p.sku}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'font-mono tabular-nums',
                            p.stock <= 0 ? 'bg-rose-100 text-rose-700' : low ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
                          )}
                        >
                          {angka(p.stock)} {p.unit}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-xs tabular-nums text-zinc-400">
                        {p.minStock}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openDialog(p.id, p.name, p.stock, 'in')}
                            className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 px-2 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-600 hover:bg-emerald-50"
                            aria-label={`Stok masuk ${p.name}`}
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" /> Masuk
                          </button>
                          <button
                            onClick={() => openDialog(p.id, p.name, p.stock, 'out')}
                            className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 px-2 text-xs font-semibold text-rose-700 transition-colors hover:border-rose-600 hover:bg-rose-50"
                            aria-label={`Stok keluar ${p.name}`}
                          >
                            <ArrowUpFromLine className="h-3.5 w-3.5" /> Keluar
                          </button>
                          <button
                            onClick={() => openDialog(p.id, p.name, p.stock, 'adjust')}
                            className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 px-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-zinc-900 hover:bg-zinc-50"
                            aria-label={`Opname ${p.name}`}
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" /> Opname
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riwayat pergerakan */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
            <History className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <p className="text-sm font-bold text-zinc-900">Riwayat Pergerakan</p>
            <Badge variant="secondary" className="ml-auto bg-zinc-100 text-[10px] text-zinc-500">40 terakhir</Badge>
          </div>
          <div className="plan-scroll max-h-[480px] overflow-y-auto">
            {moves === null ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-400">Memuat…</p>
            ) : moves.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <PackageSearch className="h-7 w-7 text-zinc-300" aria-hidden="true" />
                <p className="text-xs text-zinc-400">Belum ada pergerakan stok.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {moves.map((m) => {
                  const meta = TYPE_META[(m.type === 'sale' ? 'out' : m.type) as AdjustType]
                  return (
                    <li key={m.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-zinc-800">{m.productName}</p>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums',
                            m.qty >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          )}
                        >
                          {m.qty >= 0 ? '+' : ''}{m.qty}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <span className={cn('rounded px-1 py-px font-semibold', meta.cls)}>{meta.labelShort}</span>
                        {tanggalWaktu(m.createdAt)}
                        {m.note && <span className="truncate">· {m.note}</span>}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Dialog penyesuaian */}
      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{target ? TYPE_META[target.type].label : ''}</DialogTitle>
            <DialogDescription>
              {target && (
                <>
                  <strong className="text-zinc-800">{target.name}</strong>
                  {' · stok saat ini '}
                  <span className="font-mono font-semibold">{target.stock}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {target && (
            <div className="space-y-3.5">
              <div>
                <Label htmlFor="adj-qty">
                  {target.type === 'adjust' ? 'Jumlah stok fisik (hasil hitung)' : 'Jumlah'}
                </Label>
                <Input
                  id="adj-qty"
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ''))}
                  className="mt-1 h-11 text-right font-mono text-lg font-bold tabular-nums"
                  inputMode="numeric"
                  placeholder={target.type === 'adjust' ? String(target.stock) : '0'}
                />
                {target.type === 'adjust' && qty !== '' && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Selisih tercatat:{' '}
                    <span className={cn('font-mono font-bold', Number(qty) - target.stock >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {Number(qty) - target.stock >= 0 ? '+' : ''}{Number(qty) - target.stock}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="adj-note">Catatan</Label>
                <Textarea
                  id="adj-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 min-h-16"
                  placeholder={target.type === 'in' ? 'mis. Terima PO dari supplier' : target.type === 'out' ? 'mis. Barang rusak / hilang' : 'mis. Hasil opname mingguan'}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTarget(null)}>Batal</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" disabled={busy} onClick={() => void submit()}>
              {busy ? 'Memproses…' : 'Simpan Penyesuaian'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
