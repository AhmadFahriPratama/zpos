'use client'

import { create } from 'zustand'
import { toast } from 'sonner'
import type {
  Bootstrap, CartItem, Category, Device, Product, Sale, Shift, StockMove,
} from './zpos-types'
import { rupiah } from './format'

export type View = 'kasir' | 'produk' | 'stok' | 'laporan' | 'shift' | 'monitoring'

interface ZPosState {
  booted: boolean
  loading: boolean
  view: View
  products: Product[]
  categories: Category[]
  currentShift: Shift | null
  devices: Device[]
  serverInfo: Bootstrap['serverInfo'] | null
  cart: CartItem[]
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

  checkout: (args: {
    method: string
    paidAmount: number
  }) => Promise<Sale | null>

  saveProduct: (data: Partial<Product> & { name: string; price: number }) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  adjustStock: (args: { productId: string; type: 'in' | 'out' | 'adjust'; qty: number; note: string }) => Promise<boolean>

  openShift: (cashierName: string, openingCash: number) => Promise<boolean>
  closeShift: (countedCash: number) => Promise<boolean>
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

export const useZPos = create<ZPosState>((set, get) => ({
  booted: false,
  loading: false,
  view: 'kasir',
  products: [],
  categories: [],
  currentShift: null,
  devices: [],
  serverInfo: null,
  cart: [],
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
        discount: 0, stock: p.stock, unit: p.unit,
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

  clearCart: () => set({ cart: [] }),

  checkout: async ({ method, paidAmount }) => {
    const { cart, currentShift, cashier } = get()
    if (cart.length === 0) return null
    try {
      const sale = await jfetch<Sale>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((c) => ({
            productId: c.productId, qty: c.qty, price: c.price, discount: c.discount,
          })),
          method,
          paidAmount,
          cashierName: cashier,
          shiftId: currentShift?.id ?? null,
          offset: tzOffset(),
        }),
      })
      set({ cart: [], lastSale: sale })
      await get().bootstrap()
      return sale
    } catch (e) {
      toast.error('Transaksi gagal', { description: e instanceof Error ? e.message : undefined })
      return null
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
        method: 'POST', body: JSON.stringify({ cashierName, openingCash, offset: tzOffset() }),
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
    if (!currentShift) return false
    try {
      const shift = await jfetch<Shift>('/api/shifts/close', {
        method: 'POST', body: JSON.stringify({ shiftId: currentShift.id, countedCash }),
      })
      set({ currentShift: null })
      toast.success('Shift ditutup', {
        description: shift.diff === 0
          ? 'Kas balance — tidak ada selisih'
          : `Selisih kas ${rupiah(shift.diff ?? 0)}`,
      })
      return true
    } catch (e) {
      toast.error('Gagal menutup shift', { description: e instanceof Error ? e.message : undefined })
      return false
    }
  },
}))
