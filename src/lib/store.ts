'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import type {
  Bootstrap, CartItem, Category, Device, HeldOrder, Product, Sale, Settings, Shift, StockMove, Totals,
} from './zpos-types'
import { rupiah } from './format'

export type View =
  | 'dashboard' | 'kasir' | 'produk' | 'stok'
  | 'transaksi' | 'shift' | 'laporan' | 'monitoring' | 'pengaturan'

export type OrderType = 'dinein' | 'takeaway'

/** Hitung total keranjang — sumber kebenaran yang sama dengan server */
export function computeTotals(
  cart: CartItem[],
  orderDiscountRaw: number,
  settings: Settings | null
): Totals {
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const itemDiscount = cart.reduce((s, c) => s + c.discount, 0)
  const afterItems = subtotal - itemDiscount
  const orderDiscount = Math.max(0, Math.min(orderDiscountRaw, afterItems))
  const taxable = subtotal - itemDiscount - orderDiscount
  const tax = settings?.taxEnabled && settings.taxRate > 0
    ? Math.round(taxable * (settings.taxRate / 100))
    : 0
  return { subtotal, itemDiscount, orderDiscount, tax, total: taxable + tax }
}

interface ZPosState {
  booted: boolean
  loading: boolean
  view: View
  products: Product[]
  categories: Category[]
  currentShift: Shift | null
  devices: Device[]
  settings: Settings | null
  serverInfo: Bootstrap['serverInfo'] | null

  cart: CartItem[]
  orderType: OrderType
  orderNote: string
  orderDiscount: number
  heldOrders: HeldOrder[]
  lastSale: Sale | null
  cashier: string

  setView: (v: View) => void
  setCashier: (c: string) => void
  bootstrap: () => Promise<void>

  addToCart: (p: Product) => void
  setQty: (productId: string, qty: number) => void
  setItemDiscount: (productId: string, discount: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  setOrderType: (t: OrderType) => void
  setOrderNote: (n: string) => void
  setOrderDiscount: (d: number) => void

  holdOrder: () => boolean
  resumeHeld: (id: string) => void
  removeHeld: (id: string) => void

  checkout: (args: { method: string; paidAmount: number }) => Promise<Sale | null>
  voidSale: (saleId: string, pin: string, reason: string) => Promise<boolean>

  saveProduct: (data: Partial<Product> & { name: string; price: number }) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  adjustStock: (args: { productId: string; type: 'in' | 'out' | 'adjust'; qty: number; note: string }) => Promise<boolean>

  openShift: (cashierName: string, openingCash: number) => Promise<boolean>
  closeShift: (countedCash: number) => Promise<Shift | null>
  resetDemo: () => Promise<boolean>
}

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Request gagal (${res.status})`)
  }
  return res.json() as Promise<T>
}

function tzOffset(): number {
  if (typeof window === 'undefined') return 0
  return new Date().getTimezoneOffset()
}

export const useZPos = create<ZPosState>()(
  persist(
    (set, get) => ({
      booted: false,
      loading: false,
      view: 'kasir',
      products: [],
      categories: [],
      currentShift: null,
      devices: [],
      settings: null,
      serverInfo: null,

      cart: [],
      orderType: 'takeaway',
      orderNote: '',
      orderDiscount: 0,
      heldOrders: [],
      lastSale: null,
      cashier: 'Sari',

      setView: (v) => set({ view: v }),
      setCashier: (c) => set({ cashier: c }),

      bootstrap: async () => {
        set({ loading: true })
        try {
          const data = await jfetch<Bootstrap>('/api/bootstrap')
          set({
            products: data.products,
            categories: data.categories,
            currentShift: data.currentShift,
            devices: data.devices,
            settings: data.settings,
            serverInfo: data.serverInfo,
            booted: true,
          })
        } catch (e) {
          toast.error('Gagal memuat data server', { description: e instanceof Error ? e.message : undefined })
        } finally {
          set({ loading: false })
        }
      },

      addToCart: (p) => {
        if (p.stock <= 0) {
          toast.warning(`Stok ${p.name} habis`)
          return
        }
        const cart = [...get().cart]
        const idx = cart.findIndex((c) => c.productId === p.id)
        if (idx >= 0) {
          const item = cart[idx]
          if (item.qty + 1 > p.stock) {
            toast.warning(`Stok ${p.name} hanya ${p.stock} ${p.unit}`)
            return
          }
          cart[idx] = { ...item, qty: item.qty + 1 }
        } else {
          cart.push({
            productId: p.id, name: p.name, price: p.price, qty: 1,
            discount: 0, stock: p.stock, unit: p.unit, image: p.image,
          })
        }
        set({ cart })
      },

      setQty: (productId, qty) => {
        const cart = [...get().cart]
        const idx = cart.findIndex((c) => c.productId === productId)
        if (idx < 0) return
        const item = cart[idx]
        if (qty <= 0) {
          cart.splice(idx, 1)
        } else {
          if (qty > item.stock) {
            toast.warning(`Stok ${item.name} hanya ${item.stock} ${item.unit}`)
            qty = item.stock
          }
          cart[idx] = { ...item, qty }
        }
        set({ cart })
      },

      setItemDiscount: (productId, discount) => {
        const cart = get().cart.map((c) =>
          c.productId === productId ? { ...c, discount: Math.max(0, Math.min(discount, c.price * c.qty)) } : c
        )
        set({ cart })
      },

      removeFromCart: (productId) =>
        set({ cart: get().cart.filter((c) => c.productId !== productId) }),

      clearCart: () => set({ cart: [], orderDiscount: 0, orderNote: '' }),

      setOrderType: (t) => set({ orderType: t }),
      setOrderNote: (n) => set({ orderNote: n }),
      setOrderDiscount: (d) => set({ orderDiscount: Math.max(0, d) }),

      holdOrder: () => {
        const { cart, heldOrders, orderType, orderNote, orderDiscount } = get()
        if (cart.length === 0) {
          toast.warning('Keranjang masih kosong')
          return false
        }
        const held: HeldOrder = {
          id: `H-${Date.now()}`,
          createdAt: new Date().toISOString(),
          items: cart, orderType, note: orderNote, orderDiscount,
        }
        set({
          heldOrders: [held, ...heldOrders],
          cart: [], orderDiscount: 0, orderNote: '',
        })
        toast.success('Pesanan diparkir', { description: `${held.items.length} item ditunda — lanjutkan kapan saja.` })
        return true
      },

      resumeHeld: (id) => {
        const { heldOrders, cart, heldOrders: current } = get()
        const held = heldOrders.find((h) => h.id === id)
        if (!held) return
        if (cart.length > 0) {
          toast.warning('Keranjang saat ini tidak kosong — kosongkan dulu.')
          return
        }
        set({
          cart: held.items,
          orderType: held.orderType,
          orderNote: held.note,
          orderDiscount: held.orderDiscount,
          heldOrders: current.filter((h) => h.id !== id),
        })
        toast.success('Pesanan dilanjutkan')
      },

      removeHeld: (id) =>
        set({ heldOrders: get().heldOrders.filter((h) => h.id !== id) }),

      checkout: async ({ method, paidAmount }) => {
        const { cart, currentShift, cashier, orderType, orderNote, orderDiscount, settings } = get()
        if (cart.length === 0) return null
        try {
          const totals = computeTotals(cart, orderDiscount, settings)
          const sale = await jfetch<Sale>('/api/sales', {
            method: 'POST',
            body: JSON.stringify({
              items: cart.map((c) => ({
                productId: c.productId, qty: c.qty, discount: c.discount,
              })),
              method,
              paidAmount,
              cashierName: cashier,
              shiftId: currentShift?.id ?? null,
              orderType,
              note: orderNote || undefined,
              orderDiscount: totals.orderDiscount || undefined,
              offset: tzOffset(),
            }),
          })
          set({ cart: [], lastSale: sale, orderDiscount: 0, orderNote: '' })
          await get().bootstrap()
          return sale
        } catch (e) {
          toast.error('Transaksi gagal', { description: e instanceof Error ? e.message : undefined })
          return null
        }
      },

      voidSale: async (saleId, pin, reason) => {
        try {
          await jfetch<Sale>('/api/sales/void', {
            method: 'POST',
            body: JSON.stringify({ saleId, pin, reason }),
          })
          toast.success('Transaksi dibatalkan', { description: 'Stok telah dikembalikan ke inventori.' })
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal membatalkan', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      saveProduct: async (data) => {
        try {
          if (data.id) {
            await jfetch<Product>(`/api/products?id=${data.id}`, {
              method: 'PATCH', body: JSON.stringify(data),
            })
            toast.success('Produk diperbarui')
          } else {
            await jfetch<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) })
            toast.success('Produk ditambahkan')
          }
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menyimpan produk', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      deleteProduct: async (id) => {
        try {
          await jfetch(`/api/products?id=${id}`, { method: 'DELETE' })
          toast.success('Produk dihapus')
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menghapus produk', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      adjustStock: async ({ productId, type, qty, note }) => {
        try {
          await jfetch<StockMove>('/api/stock/adjust', {
            method: 'POST', body: JSON.stringify({ productId, type, qty, note }),
          })
          toast.success('Stok diperbarui')
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menyesuaikan stok', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      openShift: async (cashierName, openingCash) => {
        try {
          const shift = await jfetch<Shift>('/api/shifts', {
            method: 'POST', body: JSON.stringify({ cashierName, openingCash }),
          })
          set({ currentShift: shift, cashier: cashierName })
          toast.success(`Shift dibuka oleh ${cashierName}`, { description: `Modal awal ${rupiah(openingCash)}` })
          return true
        } catch (e) {
          toast.error('Gagal membuka shift', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      closeShift: async (countedCash) => {
        const { currentShift } = get()
        if (!currentShift) return null
        try {
          const shift = await jfetch<Shift>('/api/shifts/close', {
            method: 'POST', body: JSON.stringify({ shiftId: currentShift.id, countedCash }),
          })
          set({ currentShift: null })
          return shift
        } catch (e) {
          toast.error('Gagal menutup shift', { description: e instanceof Error ? e.message : undefined })
          return null
        }
      },

      resetDemo: async () => {
        try {
          await jfetch<{ ok: boolean }>('/api/seed', { method: 'POST' })
          toast.success('Data demo di-reset')
          set({ cart: [], heldOrders: [], currentShift: null })
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal reset data demo', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },
    }),
    {
      name: 'zpos-held-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ heldOrders: s.heldOrders, cashier: s.cashier }),
    }
  )
)
