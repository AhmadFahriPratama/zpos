'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useZPos, computeTotals } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, orderTypeLabel } from '@/lib/format'
import type { Sale } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ProductThumb, Kbd } from './ui-bits'
import { PaymentDialog } from './payment-dialog'
import { ReceiptDialog } from './receipt-dialog'
import {
  BadgePercent, ChevronDown, Pause, ScanBarcode, Search, ShoppingBag, StickyNote,
  Ticket, Trash2, TriangleAlert, UsersRound, Utensils, X,
} from 'lucide-react'
import { TierBadge } from './customers-view'

/* ================= Bar Pelanggan & Promo ================= */
function CustomerPromoBar({ base }: { base: number }) {
  const customers = useZPos((s) => s.customers)
  const promos = useZPos((s) => s.promos)
  const selectedCustomerId = useZPos((s) => s.selectedCustomerId)
  const selectedPromoId = useZPos((s) => s.selectedPromoId)
  const setSelectedCustomer = useZPos((s) => s.setSelectedCustomer)
  const setSelectedPromo = useZPos((s) => s.setSelectedPromo)

  const [custOpen, setCustOpen] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [q, setQ] = useState('')

  const selected = customers.find((c) => c.id === selectedCustomerId) ?? null
  const filteredCust = (() => {
    const t = q.trim().toLowerCase()
    if (!t) return customers.slice(0, 30)
    return customers
      .filter((c) => c.name.toLowerCase().includes(t) || c.code.toLowerCase().includes(t) || c.phone.includes(t))
      .slice(0, 30)
  })()

  const selectedPromo = promos.find((p) => p.id === selectedPromoId) ?? null

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {/* Pelanggan */}
      <Popover open={custOpen} onOpenChange={(o) => { setCustOpen(o); if (o) setQ('') }}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors',
              selected
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
            )}
            aria-label="Pilih pelanggan"
          >
            <UsersRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-left">
              {selected ? selected.name : 'Pelanggan Umum'}
            </span>
            {selected && <TierBadge tier={selected.tier} className="shrink-0" />}
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-2">
          <p className="px-1.5 pb-1.5 pt-0.5 text-xs font-bold text-zinc-900">Pilih Pelanggan</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / kode / HP…"
              className="h-8 border-zinc-200 bg-white pl-8 text-xs"
              autoFocus
            />
          </div>
          <ul className="zpos-scroll mt-1.5 max-h-52 overflow-y-auto">
            {filteredCust.length === 0 ? (
              <li className="px-2 py-4 text-center text-xs text-zinc-400">
                {q ? 'Tidak ada hasil' : 'Belum ada member terdaftar'}
              </li>
            ) : (
              filteredCust.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { setSelectedCustomer(c.id); setCustOpen(false) }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-100',
                      selectedCustomerId === c.id && 'bg-emerald-50'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-zinc-800">{c.name}</span>
                      <span className="block truncate text-[10px] text-zinc-400">{c.code} · {angkaPoin(c.points)} poin</span>
                    </span>
                    <TierBadge tier={c.tier} className="shrink-0" />
                  </button>
                </li>
              ))
            )}
          </ul>
          <button
            onClick={() => { setSelectedCustomer(null); setCustOpen(false) }}
            className="mt-1 w-full rounded-md border border-zinc-200 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            Tanpa Member (Umum)
          </button>
        </PopoverContent>
      </Popover>

      {/* Promo */}
      <Popover open={promoOpen} onOpenChange={setPromoOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors',
              selectedPromo
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
            )}
            aria-label="Pilih promo"
          >
            <Ticket className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-left">
              {selectedPromo ? selectedPromo.code : 'Pilih Promo'}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-2">
          <p className="px-1.5 pb-1.5 pt-0.5 text-xs font-bold text-zinc-900">Promo Tersedia</p>
          <ul className="zpos-scroll max-h-56 overflow-y-auto">
            {promos.length === 0 ? (
              <li className="px-2 py-4 text-center text-xs text-zinc-400">Belum ada promo aktif</li>
            ) : (
              promos.map((p) => {
                const eligible = base >= p.minPurchase
                const active = selectedPromoId === p.id
                return (
                  <li key={p.id}>
                    <button
                      disabled={!eligible}
                      onClick={() => { setSelectedPromo(active ? null : p.id); setPromoOpen(false) }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                        eligible ? 'hover:bg-zinc-100' : 'cursor-not-allowed opacity-40',
                        active && 'bg-amber-50'
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-xs font-bold text-zinc-800">{p.code}</span>
                        <span className="block truncate text-[10px] text-zinc-400">
                          min. {rupiah(p.minPurchase)}
                          {!eligible && ' · belum memenuhi'}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-emerald-600">
                        {p.type === 'percent' ? `${p.value}%` : rupiah(p.value)}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
          {selectedPromoId && (
            <button
              onClick={() => { setSelectedPromo(null); setPromoOpen(false) }}
              className="mt-1 w-full rounded-md border border-zinc-200 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-50"
            >
              Hapus Promo
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

function angkaPoin(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

/* ================= Panel Keranjang ================= */
function CartPanel({ onPay }: { onPay: () => void }) {
  const cart = useZPos((s) => s.cart)
  const settings = useZPos((s) => s.settings)
  const orderType = useZPos((s) => s.orderType)
  const orderNote = useZPos((s) => s.orderNote)
  const orderDiscount = useZPos((s) => s.orderDiscount)
  const heldOrders = useZPos((s) => s.heldOrders)
  const currentShift = useZPos((s) => s.currentShift)
  const setView = useZPos((s) => s.setView)
  const setQty = useZPos((s) => s.setQty)
  const setItemDiscount = useZPos((s) => s.setItemDiscount)
  const removeFromCart = useZPos((s) => s.removeFromCart)
  const clearCart = useZPos((s) => s.clearCart)
  const setOrderType = useZPos((s) => s.setOrderType)
  const setOrderNote = useZPos((s) => s.setOrderNote)
  const setOrderDiscount = useZPos((s) => s.setOrderDiscount)
  const holdOrder = useZPos((s) => s.holdOrder)
  const resumeHeld = useZPos((s) => s.resumeHeld)
  const removeHeld = useZPos((s) => s.removeHeld)

  const [discOpen, setDiscOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [discInput, setDiscInput] = useState('')
  const [discMode, setDiscMode] = useState<'rp' | 'pct'>('rp')

  const selectedPromoId = useZPos((s) => s.selectedPromoId)
  const promos = useZPos((s) => s.promos)
  const setSelectedPromo = useZPos((s) => s.setSelectedPromo)
  const selectedPromo = promos.find((p) => p.id === selectedPromoId) ?? null

  const itemCount = cart.reduce((s, c) => s + c.qty, 0)
  const base = cart.reduce((s, c) => s + c.price * c.qty - c.discount, 0)

  // Preview diskon promo di klien — server tetap validasi ulang saat checkout
  const promoDiscount = selectedPromo && base >= selectedPromo.minPurchase
    ? (selectedPromo.type === 'percent'
        ? Math.round((base * selectedPromo.value) / 100)
        : Math.min(selectedPromo.value, base))
    : 0
  const effectiveDiscount = selectedPromo ? promoDiscount : orderDiscount
  const totals = computeTotals(cart, effectiveDiscount, settings)

  const applyDiscount = () => {
    const n = Number(discInput) || 0
    const value = discMode === 'rp' ? n : Math.round((base * n) / 100)
    setOrderDiscount(value)
    if (selectedPromoId) setSelectedPromo(null) // diskon manual menimpa promo
    setDiscOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-100 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <p className="text-sm font-bold text-zinc-900">Pesanan Baru</p>
            {itemCount > 0 && (
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white">
                {itemCount} item
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Popover open={heldOpen} onOpenChange={setHeldOpen}>
              <PopoverTrigger asChild>
                <button
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Pesanan diparkir"
                >
                  <Pause className="h-4 w-4" />
                  {heldOrders.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                      {heldOrders.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-2">
                <p className="px-2 pb-1.5 pt-1 text-xs font-bold text-zinc-900">Pesanan Diparkir</p>
                {heldOrders.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-zinc-400">
                    Tekan tombol <Pause className="inline h-3 w-3" aria-hidden="true" /> untuk menunda pesanan.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {heldOrders.map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800">
                            {h.items.reduce((a, b) => a + b.qty, 0)} item · {rupiah(h.items.reduce((a, b) => a + b.price * b.qty, 0))}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {orderTypeLabel(h.orderType)} · {new Date(h.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => { resumeHeld(h.id); setHeldOpen(false) }}
                            className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white hover:bg-zinc-700"
                          >
                            Lanjut
                          </button>
                          <button
                            onClick={() => removeHeld(h.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-300 hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Hapus pesanan diparkir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
            <button
              onClick={() => {
                if (cart.length > 0 && window.confirm('Kosongkan keranjang?')) clearCart()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              aria-label="Kosongkan keranjang"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tipe order + diskon + catatan */}
        <div className="mt-3 flex items-center gap-1.5">
          <div className="flex rounded-lg border border-zinc-200 p-0.5">
            {([
              { id: 'dinein' as const, label: 'Di Tempat', icon: Utensils },
              { id: 'takeaway' as const, label: 'Bawa Pulang', icon: ShoppingBag },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setOrderType(t.id)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
                  orderType === t.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <t.icon className="h-3 w-3" aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
          <Popover open={discOpen} onOpenChange={(o) => { setDiscOpen(o); if (o) setDiscInput(orderDiscount ? String(orderDiscount) : '') }}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors',
                  orderDiscount > 0
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                )}
              >
                <BadgePercent className="h-3.5 w-3.5" aria-hidden="true" />
                {orderDiscount > 0 ? `−${rupiah(orderDiscount)}` : 'Diskon'}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <p className="text-xs font-bold text-zinc-900">Diskon Transaksi</p>
              <div className="mt-2 flex rounded-lg border border-zinc-200 p-0.5">
                {(['rp', 'pct'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDiscMode(m)}
                    className={cn(
                      'flex-1 rounded-md py-1 text-[11px] font-bold',
                      discMode === m ? 'bg-zinc-900 text-white' : 'text-zinc-500'
                    )}
                  >
                    {m === 'rp' ? 'Rupiah' : 'Persen %'}
                  </button>
                ))}
              </div>
              <Input
                value={discInput}
                onChange={(e) => setDiscInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={discMode === 'rp' ? '0' : '0'}
                inputMode="numeric"
                className="mt-2 h-9 text-right font-mono font-bold"
                onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
              />
              {discMode === 'pct' && discInput && (
                <p className="mt-1 text-right text-[11px] font-semibold text-amber-700">
                  = {rupiah(Math.round((base * Number(discInput)) / 100))}
                </p>
              )}
              <div className="mt-2 flex gap-1">
                {[5, 10, 15].map((p) => (
                  <button
                    key={p}
                    onClick={() => { setDiscMode('pct'); setDiscInput(String(p)) }}
                    className="flex-1 rounded-md border border-zinc-200 py-1 text-[11px] font-semibold text-zinc-600 hover:border-zinc-900"
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <Button size="sm" className="mt-2 h-8 w-full bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-700" onClick={applyDiscount}>
                Terapkan
              </Button>
            </PopoverContent>
          </Popover>
          <Popover open={noteOpen} onOpenChange={setNoteOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors',
                  orderNote
                    ? 'bg-zinc-100 text-zinc-700'
                    : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                )}
              >
                <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                {orderNote ? 'Catatan' : 'Catatan'}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <p className="text-xs font-bold text-zinc-900">Catatan Pesanan</p>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value.slice(0, 200))}
                placeholder="mis. Less sugar, tanpa es…"
                className="mt-2 min-h-16 w-full rounded-lg border border-zinc-200 p-2 text-xs outline-none focus:border-zinc-900"
              />
              <Button size="sm" className="mt-2 h-8 w-full bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-700" onClick={() => setNoteOpen(false)}>
                Simpan
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Pelanggan & Promo */}
        <CustomerPromoBar base={base} />
      </div>

      {!currentShift && (
        <button
          onClick={() => setView('shift')}
          className="flex shrink-0 items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-left text-xs text-amber-800 transition-colors hover:bg-amber-100"
        >
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">Shift belum dibuka — rekap kas tidak terekam. <u>Buka shift</u></span>
        </button>
      )}

      {/* Daftar item */}
      {cart.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
            <ShoppingBag className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-zinc-500">Keranjang kosong</p>
          <p className="max-w-[220px] text-xs text-zinc-400">
            Pilih produk dari katalog atau scan barcode untuk memulai transaksi.
          </p>
        </div>
      ) : (
        <ul className="zpos-scroll min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">
          {cart.map((item) => (
            <li key={item.productId} className="flex gap-2.5 px-4 py-3">
              <ProductThumb src={item.image} name={item.name} className="h-10 w-10 shrink-0 rounded-lg border border-zinc-100" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-[13px] font-semibold text-zinc-900">{item.name}</p>
                  <p className="shrink-0 text-[13px] font-bold tabular-nums text-zinc-900">
                    {rupiah(item.price * item.qty - item.discount)}
                  </p>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {rupiah(item.price)} / {item.unit}
                  {item.discount > 0 && <span className="ml-1.5 font-semibold text-amber-600">−{rupiah(item.discount)}</span>}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-zinc-200">
                    <button
                      onClick={() => setQty(item.productId, item.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      aria-label={`Kurangi ${item.name}`}
                    >
                      <span className="text-sm font-bold leading-none">−</span>
                    </button>
                    <span className="w-8 border-x border-zinc-200 text-center font-mono text-xs font-bold tabular-nums leading-7">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => setQty(item.productId, item.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      aria-label={`Tambah ${item.name}`}
                    >
                      <span className="text-sm font-bold leading-none">+</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      value={item.discount || ''}
                      onChange={(e) => setItemDiscount(item.productId, Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                      placeholder="disc."
                      className="h-7 w-14 rounded-md border border-zinc-200 px-1.5 text-right font-mono text-[11px] tabular-nums outline-none focus:border-zinc-900"
                      inputMode="numeric"
                      aria-label={`Diskon ${item.name}`}
                    />
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Hapus ${item.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Ringkasan & bayar */}
      <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/70 px-4 py-3">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span className="font-semibold tabular-nums text-zinc-700">{rupiah(totals.subtotal)}</span>
          </div>
          {totals.itemDiscount > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Diskon item</span>
              <span className="font-semibold tabular-nums">−{rupiah(totals.itemDiscount)}</span>
            </div>
          )}
          {totals.orderDiscount > 0 && (
            <div className="flex justify-between text-amber-700">
              <span className="min-w-0 truncate">{selectedPromo ? `Promo ${selectedPromo.code}` : 'Diskon transaksi'}</span>
              <span className="shrink-0 font-semibold tabular-nums">−{rupiah(totals.orderDiscount)}</span>
            </div>
          )}
          {settings?.taxEnabled && settings.taxRate > 0 && (
            <div className="flex justify-between text-zinc-500">
              <span>Pajak PPN {settings.taxRate}%</span>
              <span className="font-semibold tabular-nums text-zinc-700">{rupiah(totals.tax)}</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-zinc-200 pt-2">
          <span className="text-sm font-bold text-zinc-900">Total</span>
          <span className="text-2xl font-extrabold tracking-tight tabular-nums text-zinc-900">
            {rupiah(totals.total)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2">
          <Button
            variant="outline"
            className="h-11 border-zinc-200 font-semibold text-zinc-700 hover:bg-zinc-100"
            disabled={cart.length === 0}
            onClick={() => holdOrder()}
          >
            <Pause className="mr-1.5 h-4 w-4" aria-hidden="true" /> Tunda
          </Button>
          <Button
            className="h-11 bg-emerald-600 text-[15px] font-bold tracking-wide hover:bg-emerald-700 disabled:opacity-40"
            disabled={cart.length === 0}
            onClick={onPay}
          >
            Bayar — {rupiah(totals.total)}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ================= Layar Kasir ================= */
export function KasirView() {
  const products = useZPos((s) => s.products)
  const categories = useZPos((s) => s.categories)
  const cart = useZPos((s) => s.cart)
  const settings = useZPos((s) => s.settings)
  const addToCart = useZPos((s) => s.addToCart)
  const orderDiscount = useZPos((s) => s.orderDiscount)

  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const totals = computeTotals(cart, orderDiscount, settings)
  const itemCount = cart.reduce((s, c) => s + c.qty, 0)

  // Shortcut: "/" fokus cari · F9 bayar · Esc tutup sheet
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'F9') {
        e.preventDefault()
        if (useZPos.getState().cart.length > 0) setPaymentOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const catCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of products) {
      if (!p.isActive) continue
      const key = p.categoryId ?? 'none'
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [products])

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

  const onSearchEnter = () => {
    const q = search.trim().toLowerCase()
    if (!q) return
    const exact = products.find(
      (p) => p.isActive && ((p.barcode ?? '').toLowerCase() === q || p.sku.toLowerCase() === q)
    )
    if (exact) {
      addToCart(exact)
      setSearch('')
    }
  }

  const openPayment = () => {
    setSheetOpen(false)
    setPaymentOpen(true)
  }

  const catChips = [
    { id: 'all', name: 'Semua', count: products.filter((p) => p.isActive).length },
    ...categories.map((c) => ({ id: c.id, name: c.name, count: catCounts.get(c.id) ?? 0 })),
  ]

  return (
    <div className="flex h-full min-h-0">
      {/* ============ Katalog ============ */}
      <section className="flex min-w-0 flex-1 flex-col" aria-label="Katalog produk">
        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchEnter()}
                placeholder="Cari nama / SKU / scan barcode…"
                className="h-10 border-zinc-200 bg-zinc-50 pl-9 pr-14 text-sm focus-visible:bg-white"
                aria-label="Cari produk"
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:block"><Kbd>/</Kbd></span>
              )}
            </div>
            <span className="hidden shrink-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-500 sm:block">
              {filtered.length} produk
            </span>
          </div>

          <div className="zpos-scroll -mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
            {catChips.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  activeCat === c.id
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                )}
              >
                {c.name}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-[10px] font-bold',
                    activeCat === c.id ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-400'
                  )}
                >
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid produk */}
        <div className="zpos-scroll min-h-0 flex-1 overflow-y-auto p-4 pb-24 xl:pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((p) => {
              const habis = p.stock <= 0
              const kritis = !habis && p.stock <= p.minStock
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={habis}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all',
                    habis
                      ? 'cursor-not-allowed border-zinc-200 opacity-55'
                      : 'border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-900 hover:shadow-lg active:scale-[0.98]'
                  )}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                    <ProductThumb
                      src={p.image}
                      name={p.name}
                      className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                    />
                    {habis && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                        <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white">HABIS</span>
                      </div>
                    )}
                    {kritis && (
                      <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        Sisa {p.stock}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-2.5">
                    <p className="min-h-8 line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-900">{p.name}</p>
                    <div className="mt-auto flex items-baseline justify-between pt-1.5">
                      <p className="text-sm font-bold tabular-nums text-zinc-900">{rupiah(p.price)}</p>
                      <span className="text-[10px] font-medium text-zinc-400">{p.category?.name ?? '—'}</span>
                    </div>
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white py-14 text-center">
                <Search className="h-6 w-6 text-zinc-300" aria-hidden="true" />
                <p className="text-sm font-semibold text-zinc-600">Tidak ada produk cocok</p>
                <p className="text-xs text-zinc-400">Coba kata kunci lain atau ganti kategori.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bar keranjang mobile */}
        <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 xl:hidden">
          <button
            onClick={() => setSheetOpen(true)}
            disabled={cart.length === 0}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-left">
                <span className="block text-[11px] font-medium text-zinc-300">{itemCount} item dipesan</span>
                <span className="block text-sm font-bold tabular-nums">{rupiah(totals.total)}</span>
              </span>
            </span>
            <span className="rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-bold">Lihat Keranjang</span>
          </button>
        </div>
      </section>

      {/* ============ Keranjang desktop ============ */}
      <aside
        className="hidden w-[380px] shrink-0 border-l border-zinc-200 bg-white 2xl:w-[400px] xl:flex xl:flex-col"
        aria-label="Keranjang belanja"
      >
        <CartPanel onPay={openPayment} />
      </aside>

      {/* Keranjang mobile (sheet) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[400px] p-0 sm:max-w-[400px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Keranjang</SheetTitle>
          </SheetHeader>
          <CartPanel onPay={openPayment} />
        </SheetContent>
      </Sheet>

      <PaymentDialog
        key={paymentOpen ? 'open' : 'closed'}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
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
