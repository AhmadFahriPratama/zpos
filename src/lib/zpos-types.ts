export interface Category {
  id: string
  name: string
}

export interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  unit: string
  price: number
  cost: number
  stock: number
  minStock: number
  isActive: boolean
  categoryId: string | null
  category: Category | null
}

export interface CartItem {
  productId: string
  name: string
  price: number
  qty: number
  discount: number
  stock: number
  unit: string
}

export interface SaleItem {
  id: string
  productId: string | null
  name: string
  qty: number
  price: number
  discount: number
  subtotal: number
}

export interface Sale {
  id: string
  invoiceNo: string
  status: string
  subtotal: number
  discount: number
  total: number
  paidAmount: number
  changeAmount: number
  method: string
  cashierName: string
  shiftId: string | null
  createdAt: string
  items: SaleItem[]
}

export interface Shift {
  id: string
  cashierName: string
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  diff: number | null
  status: string
  openedAt: string
  closedAt: string | null
  salesCount?: number
  salesTotal?: number
  cashTotal?: number
}

export interface Device {
  id: string
  name: string
  kind: string
  platform: string
  version: string
  status: string
  isBlocked: boolean
  lastSeen: string
}

export interface StockMove {
  id: string
  productId: string
  productName: string
  type: string
  qty: number
  note: string | null
  refId: string | null
  createdAt: string
}

export interface Stats {
  todayRevenue: number
  todayCount: number
  todayItems: number
  avgTicket: number
  series: Array<{ date: string; label: string; revenue: number; count: number }>
  topProducts: Array<{ productId: string; name: string; qty: number; revenue: number }>
  methodBreakdown: Array<{ method: string; count: number; total: number }>
}

export interface Bootstrap {
  products: Product[]
  categories: Category[]
  currentShift: Shift | null
  devices: Device[]
  serverInfo: {
    name: string
    address: string
    ip: string
    version: string
    dbSizeKb: number
    startedAt: string
  }
}
