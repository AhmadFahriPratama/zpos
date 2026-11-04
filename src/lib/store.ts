'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import type {
  Bootstrap, CartItem, Category, Customer, Device, Employee, HeldOrder, Outlet,
  Product, Promo, Purchase, Sale, Settings, Shift, StockMove, Supplier, Totals,
} from './zpos-types'
import { rupiah } from './format'

export type View =
  | 'dashboard' | 'kasir' | 'produk' | 'stok' | 'pembelian'
  | 'pelanggan' | 'karyawan' | 'promo' | 'outlet'
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
  customers: Customer[]
  promos: Promo[]
  employees: Employee[]

  cart: CartItem[]
  orderType: OrderType
  orderNote: string
  orderDiscount: number
  heldOrders: HeldOrder[]
  lastSale: Sale | null
  cashier: string
  selectedCustomerId: string | null
  selectedPromoId: string | null

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
  setSelectedCustomer: (id: string | null) => void
  setSelectedPromo: (id: string | null) => void

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

  saveSupplier: (data: Partial<Supplier> & { name: string }) => Promise<boolean>
  deleteSupplier: (id: string) => Promise<boolean>
  createPurchase: (args: { supplierId: string; items: Array<{ productId: string; qty: number; cost: number }>; note: string }) => Promise<boolean>
  saveCustomer: (data: Partial<Customer> & { name: string }) => Promise<boolean>
  deleteCustomer: (id: string) => Promise<boolean>
  saveEmployee: (data: Partial<Employee> & { name: string; role: string }) => Promise<boolean>
  deleteEmployee: (id: string) => Promise<boolean>
  savePromo: (data: Partial<Promo> & { code: string; name: string }) => Promise<boolean>
  deletePromo: (id: string) => Promise<boolean>
  saveOutlet: (data: Partial<Outlet> & { name: string }) => Promise<boolean>
  deleteOutlet: (id: string) => Promise<boolean>
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
      customers: [],
      promos: [],
      employees: [],

      cart: [],
      orderType: 'takeaway',
      orderNote: '',
      orderDiscount: 0,
      heldOrders: [],
      lastSale: null,
      cashier: 'Sari',
      selectedCustomerId: null,
      selectedPromoId: null,

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
            customers: data.customers ?? [],
            promos: data.promos ?? [],
            employees: data.employees ?? [],
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

      clearCart: () => set({ cart: [], orderDiscount: 0, orderNote: '', selectedCustomerId: null, selectedPromoId: null }),

      setOrderType: (t) => set({ orderType: t }),
      setOrderNote: (n) => set({ orderNote: n }),
      setOrderDiscount: (d) => set({ orderDiscount: Math.max(0, d) }),
      setSelectedCustomer: (id) => set({ selectedCustomerId: id }),
      setSelectedPromo: (id) => set({ selectedPromoId: id }),

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
        const { cart, currentShift, cashier, orderType, orderNote, orderDiscount, settings, selectedCustomerId, selectedPromoId } = get()
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
              customerId: selectedCustomerId ?? null,
              promoId: selectedPromoId ?? null,
              offset: tzOffset(),
            }),
          })
          set({ cart: [], lastSale: sale, orderDiscount: 0, orderNote: '', selectedCustomerId: null, selectedPromoId: null })
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
          set({ cart: [], heldOrders: [], currentShift: null, selectedCustomerId: null, selectedPromoId: null })
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal reset data demo', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      /* ===== Suite: supplier & pembelian ===== */
      saveSupplier: async (data) => {
        try {
          if (data.id) {
            await jfetch<Supplier>(`/api/suppliers`, { method: 'PATCH', body: JSON.stringify(data) })
            toast.success('Supplier diperbarui')
          } else {
            await jfetch<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) })
            toast.success('Supplier ditambahkan')
          }
          return true
        } catch (e) {
          toast.error('Gagal menyimpan supplier', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      deleteSupplier: async (id) => {
        try {
          await jfetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
          toast.success('Supplier dihapus')
          return true
        } catch (e) {
          toast.error('Gagal menghapus supplier', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      createPurchase: async ({ supplierId, items, note }) => {
        try {
          await jfetch<Purchase>('/api/purchases', {
            method: 'POST', body: JSON.stringify({ supplierId, items, note }),
          })
          toast.success('Pembelian diterima', { description: 'Stok produk otomatis bertambah.' })
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal mencatat pembelian', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      /* ===== Suite: pelanggan, karyawan, promo, outlet ===== */
      saveCustomer: async (data) => {
        try {
          if (data.id) {
            await jfetch<Customer>('/api/customers', { method: 'PATCH', body: JSON.stringify(data) })
            toast.success('Pelanggan diperbarui')
          } else {
            await jfetch<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) })
            toast.success('Member baru terdaftar')
          }
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menyimpan pelanggan', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      deleteCustomer: async (id) => {
        try {
          await jfetch(`/api/customers?id=${id}`, { method: 'DELETE' })
          toast.success('Pelanggan dihapus')
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menghapus pelanggan', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      saveEmployee: async (data) => {
        try {
          if (data.id) {
            await jfetch<Employee>('/api/employees', { method: 'PATCH', body: JSON.stringify(data) })
            toast.success('Karyawan diperbarui')
          } else {
            await jfetch<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(data) })
            toast.success('Karyawan ditambahkan')
          }
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menyimpan karyawan', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      deleteEmployee: async (id) => {
        try {
          await jfetch(`/api/employees?id=${id}`, { method: 'DELETE' })
          toast.success('Karyawan dihapus')
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menghapus karyawan', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      savePromo: async (data) => {
        try {
          if (data.id) {
            await jfetch<Promo>('/api/promos', { method: 'PATCH', body: JSON.stringify(data) })
            toast.success('Promo diperbarui')
          } else {
            await jfetch<Promo>('/api/promos', { method: 'POST', body: JSON.stringify(data) })
            toast.success('Promo dibuat')
          }
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menyimpan promo', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      deletePromo: async (id) => {
        try {
          await jfetch(`/api/promos?id=${id}`, { method: 'DELETE' })
          toast.success('Promo dihapus')
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menghapus promo', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      saveOutlet: async (data) => {
        try {
          if (data.id) {
            await jfetch<Outlet>('/api/outlets', { method: 'PATCH', body: JSON.stringify(data) })
            toast.success('Outlet diperbarui')
          } else {
            await jfetch<Outlet>('/api/outlets', { method: 'POST', body: JSON.stringify(data) })
            toast.success('Outlet ditambahkan')
          }
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menyimpan outlet', { description: e instanceof Error ? e.message : undefined })
          return false
        }
      },

      deleteOutlet: async (id) => {
        try {
          await jfetch(`/api/outlets?id=${id}`, { method: 'DELETE' })
          toast.success('Outlet dihapus')
          await get().bootstrap()
          return true
        } catch (e) {
          toast.error('Gagal menghapus outlet', { description: e instanceof Error ? e.message : undefined })
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
