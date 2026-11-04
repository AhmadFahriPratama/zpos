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
  image: string | null
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
  image: string | null
}

export interface HeldOrder {
  id: string
  createdAt: string
  items: CartItem[]
  orderType: 'dinein' | 'takeaway'
  note: string
  orderDiscount: number
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
  orderDiscount: number
  tax: number
  total: number
  paidAmount: number
  changeAmount: number
  method: string
  orderType: string
  note: string | null
  cashierName: string
  shiftId: string | null
  voidReason: string | null
  voidedAt: string | null
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
  cashSales: number | null
  nonCashSales: number | null
  totalSales: number | null
  trxCount: number | null
  status: string
  openedAt: string
  closedAt: string | null
  salesCount?: number
  salesTotal?: number
  cashTotal?: number
}

export interface Settings {
  id: string
  storeName: string
  storeAddress: string
  storePhone: string
  taxEnabled: boolean
  taxRate: number
  receiptFooter: string
  paperWidth: string
  updatedAt: string
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
  range: number
  todayRevenue: number
  yesterdayRevenue: number
  todayCount: number
  todayItems: number
  avgTicket: number
  series: Array<{ date: string; label: string; dayNum: string; revenue: number; count: number }>
  topProducts: Array<{ productId: string; name: string; qty: number; revenue: number }>
  methodBreakdown: Array<{ method: string; count: number; total: number }>
  lowStock: Array<{ id: string; name: string; stock: number; unit: string; minStock: number }>
  recent: Sale[]
}

export interface Bootstrap {
  products: Product[]
  categories: Category[]
  currentShift: Shift | null
  devices: Device[]
  settings: Settings | null
  serverInfo: {
    name: string
    address: string
    ip: string
    version: string
    dbSizeKb: number
    startedAt: string
  }
}

export interface Totals {
  subtotal: number
  itemDiscount: number
  orderDiscount: number
  tax: number
  total: number
}
