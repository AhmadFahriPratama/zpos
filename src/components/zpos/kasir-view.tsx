'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah } from '@/lib/format'
import type { Sale } from '@/lib/zpos-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Banknote, CreditCard, Loader2, Minus, Plus, QrCode, Receipt,
  ScanBarcode, Search, ShoppingBag, Trash2, TriangleAlert, Wallet, X,
} from 'lucide-react'
import { PaymentDialog } from './payment-dialog'
import { ReceiptDialog } from './receipt-dialog'

type Method = 'cash' | 'qris' | 'transfer' | 'card'

const METHOD_META: Record<Method, { label: string; icon: typeof Banknote }> = {
  cash: { label: 'Tunai', icon: Banknote },
  qris: { label: 'QRIS', icon: QrCode },
  transfer: { label: 'Transfer', icon: Wallet },
  card: { label: 'Kartu', icon: CreditCard },
}

export function KasirView() {
  const products = useZPos((s) => s.products)
  const categories = useZPos((s) => s.categories)
  const cart = useZPos((s) => s.cart)
  const currentShift = useZPos((s) => s.currentShift)
  const setView = useZPos((s) => s.setView)
  const addToCart = useZPos((s) => s.addToCart)
  const setQty = useZPos((s) => s.setQty)
  const setItemDiscount = useZPos((s) => s.setItemDiscount)
  const removeFromCart = useZPos((s) => s.removeFromCart)
  const clearCart = useZPos((s) => s.clearCart)

  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Shortcut "/" untuk fokus pencarian
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (!p.isActive) return false
      if (activeCat !== 'all' && p.categoryId !== activeCat) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? '').includes(q)
      )
    })
  }, [products, search, activeCat])

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const discount = cart.reduce((s, c) => s + c.discount, 0)
  const total = subtotal - discount
  const itemCount = cart.reduce((s, c) => s + c.qty, 0)

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* ================= Area Produk ================= */}
      <section className="min-w-0 flex-1" aria-label="Katalog produk">
        <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / SKU / scan barcode…   (tekan / )"
              className="h-10 border-zinc-200 bg-white pl-9 text-sm"
              aria-label="Cari produk"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label="Hapus pencarian"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Badge variant="secondary" className="w-fit shrink-0 bg-white font-medium text-zinc-600 border border-zinc-200">
            {filtered.length} produk
          </Badge>
        </div>

        {/* Filter kategori */}
        <div className="plan-scroll mb-3 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCat('all')}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeCat === 'all'
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
            )}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                activeCat === c.id
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Grid produk */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((p) => {
            const habis = p.stock <= 0
            const kritis = !habis && p.stock <= p.minStock
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={habis}
                className={cn(
                  'group flex min-h-[118px] flex-col rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition-all',
                  habis ? 'cursor-not-allowed opacity-55' : 'hover:-translate-y-0.5 hover:border-zinc-900 hover:shadow-md'
                )}
              >
                <div className="mb-1.5 flex items-start justify-between gap-1.5">
                  <span className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    {p.category?.name ?? 'Tanpa Kategori'}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      habis
                        ? 'bg-rose-100 text-rose-700'
                        : kritis
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-zinc-100 text-zinc-500'
                    )}
                  >
                    {habis ? 'Habis' : `${p.stock} ${p.unit}`}
                  </span>
                </div>
                <p className="line-clamp-2 min-h-8 text-sm font-semibold leading-snug text-zinc-900">{p.name}</p>
                <div className="mt-auto flex items-end justify-between pt-2">
                  <p className="text-sm font-bold text-zinc-900">{rupiah(p.price)}</p>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-500">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          )}
        </div>
      </section>

      {/* ================= Panel Keranjang ================= */}
      <aside
        className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:sticky lg:top-[72px] lg:w-[380px] lg:self-start"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
        aria-label="Keranjang belanja"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <p className="text-sm font-bold text-zinc-900">Transaksi Baru</p>
            {itemCount > 0 && (
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white">
                {itemCount} item
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Kosongkan
            </button>
          )}
        </div>

        {!currentShift && (
          <button
            onClick={() => setView('shift')}
            className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-left text-xs text-amber-800 transition-colors hover:bg-amber-100"
          >
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">Shift belum dibuka — rekap kas tidak terekam. <u>Buka shift</u></span>
          </button>
        )}

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-300">
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-zinc-400">Keranjang kosong</p>
            <p className="max-w-[220px] text-xs text-zinc-400">
              Klik produk di katalog atau scan barcode untuk menambah item.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <ul className="divide-y divide-zinc-100">
              {cart.map((item) => (
                <li key={item.productId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-400">{rupiah(item.price)} / {item.unit}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-900">
                      {rupiah(item.price * item.qty - item.discount)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-zinc-200">
                      <button
                        onClick={() => setQty(item.productId, item.qty - 1)}
                        className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label={`Kurangi ${item.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        value={item.qty}
                        onChange={(e) => setQty(item.productId, Number(e.target.value) || 0)}
                        className="h-7 w-10 border-x border-zinc-200 text-center font-mono text-sm font-semibold tabular-nums outline-none"
                        inputMode="numeric"
                        aria-label={`Jumlah ${item.name}`}
                      />
                      <button
                        onClick={() => setQty(item.productId, item.qty + 1)}
                        className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label={`Tambah ${item.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] text-zinc-400">
                        Diskon
                        <input
                          value={item.discount || ''}
                          onChange={(e) => setItemDiscount(item.productId, Number(e.target.value) || 0)}
                          placeholder="0"
                          className="h-7 w-16 rounded-md border border-zinc-200 px-1.5 text-right font-mono text-xs tabular-nums outline-none focus:border-zinc-900"
                          inputMode="numeric"
                          aria-label={`Diskon ${item.name}`}
                        />
                      </label>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Hapus ${item.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        {/* Ringkasan & bayar */}
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span className="font-medium tabular-nums">{rupiah(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon</span>
                <span className="font-medium tabular-nums">−{rupiah(discount)}</span>
              </div>
            )}
          </div>
          <Separator className="my-2.5" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-zinc-900">Total</span>
            <span className="text-2xl font-extrabold tabular-nums tracking-tight text-zinc-900">
              {rupiah(total)}
            </span>
          </div>
          <Button
            size="lg"
            className="mt-3 h-12 w-full bg-emerald-600 text-base font-bold hover:bg-emerald-700 disabled:opacity-40"
            disabled={cart.length === 0}
            onClick={() => setPaymentOpen(true)}
          >
            <Receipt className="mr-2 h-5 w-5" aria-hidden="true" />
            Bayar — {rupiah(total)}
          </Button>
        </div>
      </aside>

      <PaymentDialog
        key={paymentOpen ? 'pay-open' : 'pay-closed'}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        onPaid={(sale) => {
          setPaymentOpen(false)
          setReceipt(sale)
        }}
      />
      <ReceiptDialog
        sale={receipt}
        open={receipt !== null}
        onOpenChange={(o) => !o && setReceipt(null)}
      />
    </div>
  )
}

export { METHOD_META }
export type { Method }
