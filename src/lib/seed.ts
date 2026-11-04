import { createHash } from 'crypto'
import { db } from './db'

export function managerPinHash(pin: string): string {
  return createHash('sha256').update(`zpos:${pin}`).digest('hex')
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CATEGORIES = [
  { name: 'Kopi', sortOrder: 1 },
  { name: 'Non-Kopi', sortOrder: 2 },
  { name: 'Pastry', sortOrder: 3 },
  { name: 'Makanan', sortOrder: 4 },
]

interface SeedProduct {
  name: string; sku: string; barcode: string; price: number; cost: number
  cat: string; unit: string; image: string; stock: number; minStock: number
}

const PRODUCTS: SeedProduct[] = [
  { name: 'Espresso', sku: 'KPI-001', barcode: '8991234500001', price: 18000, cost: 7000, cat: 'Kopi', unit: 'cup', image: '/products/espresso.png', stock: 80, minStock: 10 },
  { name: 'Americano', sku: 'KPI-002', barcode: '8991234500002', price: 22000, cost: 8000, cat: 'Kopi', unit: 'cup', image: '/products/americano.png', stock: 70, minStock: 10 },
  { name: 'Kopi Susu Gula Aren', sku: 'KPI-003', barcode: '8991234500003', price: 25000, cost: 9500, cat: 'Kopi', unit: 'cup', image: '/products/kopi-susu-gula-aren.png', stock: 60, minStock: 10 },
  { name: 'Cappuccino', sku: 'KPI-004', barcode: '8991234500004', price: 28000, cost: 10500, cat: 'Kopi', unit: 'cup', image: '/products/cappuccino.png', stock: 55, minStock: 10 },
  { name: 'Caffè Latte', sku: 'KPI-005', barcode: '8991234500005', price: 28000, cost: 10500, cat: 'Kopi', unit: 'cup', image: '/products/caffe-latte.png', stock: 55, minStock: 10 },
  { name: 'Mocha Latte', sku: 'KPI-006', barcode: '8991234500006', price: 30000, cost: 11500, cat: 'Kopi', unit: 'cup', image: '/products/mocha-latte.png', stock: 40, minStock: 8 },
  { name: 'Matcha Latte', sku: 'NKO-001', barcode: '8991234500007', price: 30000, cost: 12000, cat: 'Non-Kopi', unit: 'cup', image: '/products/matcha-latte.png', stock: 35, minStock: 8 },
  { name: 'Dark Chocolate', sku: 'NKO-002', barcode: '8991234500008', price: 27000, cost: 10500, cat: 'Non-Kopi', unit: 'cup', image: '/products/dark-chocolate.png', stock: 30, minStock: 8 },
  { name: 'Red Velvet Latte', sku: 'NKO-003', barcode: '8991234500009', price: 28000, cost: 11000, cat: 'Non-Kopi', unit: 'cup', image: '/products/red-velvet.png', stock: 45, minStock: 8 },
  { name: 'Es Teh Manis', sku: 'NKO-004', barcode: '8991234500010', price: 10000, cost: 2500, cat: 'Non-Kopi', unit: 'cup', image: '/products/es-teh-manis.png', stock: 100, minStock: 20 },
  { name: 'Butter Croissant', sku: 'PAS-001', barcode: '8991234500011', price: 22000, cost: 9500, cat: 'Pastry', unit: 'pcs', image: '/products/butter-croissant.png', stock: 8, minStock: 8 },
  { name: 'Glazed Donut', sku: 'PAS-002', barcode: '8991234500012', price: 12000, cost: 5000, cat: 'Pastry', unit: 'pcs', image: '/products/glazed-donut.png', stock: 0, minStock: 6 },
  { name: 'Banana Bread', sku: 'PAS-003', barcode: '8991234500013', price: 18000, cost: 7500, cat: 'Pastry', unit: 'pcs', image: '/products/banana-bread.png', stock: 6, minStock: 6 },
  { name: 'French Fries', sku: 'MKN-001', barcode: '8991234500014', price: 20000, cost: 8000, cat: 'Makanan', unit: 'porsi', image: '/products/french-fries.png', stock: 4, minStock: 5 },
  { name: 'Chicken Katsu Sando', sku: 'MKN-002', barcode: '8991234500015', price: 32000, cost: 14000, cat: 'Makanan', unit: 'porsi', image: '/products/chicken-katsu-sando.png', stock: 12, minStock: 5 },
  { name: 'Beef Slice Sandwich', sku: 'MKN-003', barcode: '8991234500016', price: 35000, cost: 15500, cat: 'Makanan', unit: 'porsi', image: '/products/beef-sandwich.png', stock: 10, minStock: 5 },
]

const CASHIERS = ['Sari', 'Dewi', 'Rio']
const METHODS = ['cash', 'cash', 'cash', 'qris', 'qris', 'qris', 'card', 'transfer']
const ORDER_TYPES = ['dinein', 'takeaway', 'takeaway']

const OUTLETS = [
  { name: 'Kopi Nusantara — Dago', address: 'Jl. Ir. H. Juanda No. 88, Bandung', phone: '0812-3456-7890', isMain: true },
  { name: 'Kopi Nusantara — Cihampelas', address: 'Jl. Cihampelas No. 21, Bandung', phone: '0812-3456-7891', isMain: false },
]

const SUPPLIERS = [
  { name: 'Roastery Sejati', contact: 'Pak Hartono', phone: '0813-2211-9001', email: 'sales@roasterysejati.id', address: 'Jl. Riau No. 12, Bandung' },
  { name: 'CV Mitra Pangan', contact: 'Bu Ratna', phone: '0813-2211-9002', email: 'order@mitrapangan.co.id', address: 'Jl. Soekarno Hatta No. 450, Bandung' },
  { name: 'PT Dairy Prima', contact: 'Pak Yusuf', phone: '0813-2211-9003', email: 'cs@dairyprima.com', address: 'Kawasan Industri Cikarang Blok D7' },
  { name: 'UD Sumber Pastry', contact: 'Bu Wati', phone: '0813-2211-9004', email: 'wati@sumberpastry.id', address: 'Jl. Kebon Kopi No. 3, Cimahi' },
]

const EMPLOYEES = [
  { name: 'Andi Wijaya', role: 'owner', phone: '0811-1000-0001', pin: '111111' },
  { name: 'Maya Putri', role: 'manager', phone: '0811-1000-0002', pin: '222222' },
  { name: 'Sari Rahma', role: 'kasir', phone: '0811-1000-0003', pin: '333333' },
  { name: 'Dewi Lestari', role: 'kasir', phone: '0811-1000-0004', pin: '444444' },
  { name: 'Rio Saputra', role: 'kasir', phone: '0811-1000-0005', pin: '555555' },
  { name: 'Budi Santoso', role: 'gudang', phone: '0811-1000-0006', pin: '666666' },
]

const CUSTOMERS: Array<{ code: string; name: string; phone: string; email: string; note?: string }> = [
  { code: 'MBR-0001', name: 'Rizky Pratama', phone: '0821-1111-0001', email: 'rizky@mail.com' },
  { code: 'MBR-0002', name: 'Anisa Fitriani', phone: '0821-1111-0002', email: 'anisa@mail.com', note: 'Alergi susu sapi' },
  { code: 'MBR-0003', name: 'Dimas Kurniawan', phone: '0821-1111-0003', email: 'dimas@mail.com' },
  { code: 'MBR-0004', name: 'Putri Handayani', phone: '0821-1111-0004', email: 'putri@mail.com' },
  { code: 'MBR-0005', name: 'Fajar Nugroho', phone: '0821-1111-0005', email: 'fajar@mail.com' },
  { code: 'MBR-0006', name: 'Laras Ayu', phone: '0821-1111-0006', email: 'laras@mail.com' },
  { code: 'MBR-0007', name: 'Bagus Wicaksono', phone: '0821-1111-0007', email: 'bagus@mail.com' },
  { code: 'MBR-0008', name: 'Nadia Zahra', phone: '0821-1111-0008', email: 'nadia@mail.com' },
  { code: 'MBR-0009', name: 'Ilham Ramadhan', phone: '0821-1111-0009', email: 'ilham@mail.com' },
  { code: 'MBR-0010', name: 'Citra Kirana', phone: '0821-1111-0010', email: 'citra@mail.com' },
]

const PROMOS = [
  { code: 'PROMO10', name: 'Diskon 10% Semua Menu', type: 'percent', value: 10, minPurchase: 50000, endsInDays: 30 },
  { code: 'HEMAT5K', name: 'Potongan Rp5.000', type: 'fixed', value: 5000, minPurchase: 30000, endsInDays: 14 },
  { code: 'SILVER20', name: 'Diskon 20% Member', type: 'percent', value: 20, minPurchase: 200000, endsInDays: -3, active: false },
]

/** Poin = 1 per Rp10.000 belanja */
function tierOf(spend: number): string {
  if (spend >= 1_000_000) return 'gold'
  if (spend >= 400_000) return 'silver'
  return 'regular'
}

export async function seedDemo(): Promise<{ products: number; sales: number }> {
  const now = new Date()

  // 1. Bersihkan (urutan FK)
  await db.stockMove.deleteMany()
  await db.purchaseItem.deleteMany()
  await db.purchase.deleteMany()
  await db.saleItem.deleteMany()
  await db.sale.deleteMany()
  await db.shift.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.setting.deleteMany()
  await db.customer.deleteMany()
  await db.employee.deleteMany()
  await db.promo.deleteMany()
  await db.supplier.deleteMany()
  await db.outlet.deleteMany()

  // 2. Pengaturan toko
  await db.setting.create({
    data: {
      id: 'main',
      storeName: 'Kopi Nusantara',
      storeAddress: 'Jl. Merdeka No. 88, Bandung',
      storePhone: '0812-3456-7890',
      taxEnabled: true,
      taxRate: 11,
      receiptFooter: 'Terima kasih! barang yang sudah dibeli tidak dapat ditukar.',
      paperWidth: '80',
      managerPinHash: managerPinHash('123456'),
    },
  })

  // 3. Kategori & produk
  const cats = new Map<string, string>()
  for (const c of CATEGORIES) {
    const row = await db.category.create({ data: c })
    cats.set(c.name, row.id)
  }

  const created: Array<{ id: string; sku: string; price: number; cost: number; name: string }> = []
  for (const p of PRODUCTS) {
    const row = await db.product.create({
      data: {
        name: p.name, sku: p.sku, barcode: p.barcode, unit: p.unit,
        price: p.price, cost: p.cost, image: p.image,
        stock: p.stock, minStock: p.minStock, isActive: true,
        categoryId: cats.get(p.cat) ?? null,
      },
    })
    created.push({ id: row.id, sku: p.sku, price: p.price, cost: p.cost, name: p.name })
    if (p.stock > 0) {
      await db.stockMove.create({
        data: { productId: row.id, type: 'in', qty: p.stock, note: 'Stok awal demo' },
      })
    }
  }

  // 4. Outlet, supplier, karyawan, promo — (now sudah didefinisi di atas)
  for (const o of OUTLETS) await db.outlet.create({ data: o })
  for (const s of SUPPLIERS) await db.supplier.create({ data: s })
  for (const e of EMPLOYEES) {
    await db.employee.create({
      data: { name: e.name, role: e.role, phone: e.phone, pinHash: managerPinHash(e.pin) },
    })
  }
  for (const p of PROMOS) {
    const endsAt = new Date(now.getTime() + p.endsInDays * 86400000)
    await db.promo.create({
      data: {
        code: p.code, name: p.name, type: p.type, value: p.value,
        minPurchase: p.minPurchase, endsAt, isActive: p.active ?? true,
      },
    })
  }

  // 5. Pembelian (PO diterima 15 hari terakhir) → stok masuk
  const suppliersDb = await db.supplier.findMany({ orderBy: { name: 'asc' } })
  const poPlan: Array<{ sku: string; qty: number; cost: number }>[] = [
    [
      { sku: 'KPI-001', qty: 40, cost: 7000 }, { sku: 'KPI-002', qty: 40, cost: 8000 },
      { sku: 'KPI-003', qty: 30, cost: 9500 }, { sku: 'KPI-004', qty: 20, cost: 10500 },
    ],
    [
      { sku: 'NKO-004', qty: 60, cost: 2500 }, { sku: 'MKN-001', qty: 20, cost: 8000 },
      { sku: 'MKN-002', qty: 15, cost: 14000 },
    ],
    [
      { sku: 'KPI-005', qty: 25, cost: 10500 }, { sku: 'KPI-006', qty: 20, cost: 11500 },
      { sku: 'NKO-001', qty: 15, cost: 12000 }, { sku: 'NKO-002', qty: 12, cost: 10500 },
    ],
    [
      { sku: 'PAS-001', qty: 24, cost: 9500 }, { sku: 'PAS-002', qty: 30, cost: 5000 },
      { sku: 'PAS-003', qty: 18, cost: 7500 },
    ],
  ]
  for (let i = 0; i < poPlan.length; i++) {
    const supplier = suppliersDb[i % suppliersDb.length]
    const createdAt = new Date(now.getTime() - (15 - i * 3) * 86400000)
    const items = poPlan[i].map((line) => {
      const p = created.find((c) => c.sku === line.sku)!
      return { productId: p.id, name: p.name, qty: line.qty, cost: line.cost, subtotal: line.qty * line.cost }
    })
    const total = items.reduce((a, b) => a + b.subtotal, 0)
    await db.purchase.create({
      data: {
        poNo: `PO-${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
        supplierId: supplier.id, status: 'received', total,
        note: 'Pembelian rutin mingguan', receivedAt: createdAt, createdAt,
        items: { create: items },
      },
    })
  }

  // 7. Pelanggan + karyawan (setelah loop supaya tahu urutan); pelanggan dipakai di penjualan
  const customersDb: Array<{ id: string; name: string }> = []
  for (const c of CUSTOMERS) {
    const row = await db.customer.create({
      data: {
        code: c.code, name: c.name, phone: c.phone, email: c.email,
        note: c.note ?? null, isActive: true,
      },
    })
    customersDb.push({ id: row.id, name: row.name })
  }

  // 8. Riwayat penjualan 30 hari (RNG deterministik → data demo stabil)
  const rand = mulberry32(20260214)
  const todayIdx = Math.floor(now.getTime() / 86400000)
  let totalSales = 0
  const spendMap = new Map<string, { spend: number; visits: number }>()

  for (let d = 29; d >= 0; d--) {
    const dayIdx = todayIdx - d
    const dayStart = new Date(dayIdx * 86400000)
    const dow = dayStart.getUTCDay()
    const isWeekend = dow === 0 || dow === 6
    const baseCount = isWeekend ? 14 + Math.floor(rand() * 6) : 9 + Math.floor(rand() * 6)

    const isToday = d === 0
    const currentHour = now.getUTCHours() // perkiraan; cukup untuk demo
    const maxHour = isToday ? Math.max(9, Math.min(21, currentHour + 8)) : 21
    if (isToday && currentHour + 8 < 9) continue

    for (let t = 0; t < baseCount; t++) {
      const hour = 8 + Math.floor(rand() * (maxHour - 8))
      const minute = Math.floor(rand() * 60)
      if (isToday) {
        const createdDate = new Date(dayIdx * 86400000 + hour * 3600000 + minute * 60000)
        if (createdDate > now) continue
      }
      const createdAt = new Date(dayIdx * 86400000 + hour * 3600000 + minute * 60000)

      const nItems = 1 + Math.floor(rand() * 3)
      const picked = new Set<number>()
      const lines: Array<{ productId: string; name: string; qty: number; price: number; cost: number; discount: number; subtotal: number }> = []
      for (let i = 0; i < nItems; i++) {
        let idx = Math.floor(rand() * created.length)
        let guard = 0
        while (picked.has(idx) && guard++ < 10) idx = Math.floor(rand() * created.length)
        picked.add(idx)
        const p = created[idx]
        const qty = 1 + (rand() > 0.72 ? 1 : 0)
        const discount = rand() > 0.94 ? Math.round(p.price * 0.1) : 0
        lines.push({
          productId: p.id, name: p.name, qty, price: p.price, cost: p.cost,
          discount, subtotal: p.price * qty - discount,
        })
      }

      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
      const itemDisc = lines.reduce((s, l) => s + l.discount, 0)
      const taxable = subtotal - itemDisc
      const tax = Math.round(taxable * 0.11)
      const total = taxable + tax
      const method = METHODS[Math.floor(rand() * METHODS.length)]
      let paidAmount = total
      let changeAmount = 0
      if (method === 'cash') {
        paidAmount = Math.ceil(total / 5000) * 5000
        changeAmount = paidAmount - total
      }

      const dayCount = t + 1
      const ymd = createdAt.toISOString().slice(0, 10).replace(/-/g, '')
      const invoiceNo = `INV-${ymd}-${String(dayCount).padStart(4, '0')}`

      // ±30% transaksi dari member
      const useMember = customersDb.length > 0 && rand() < 0.3
      const member = useMember ? customersDb[Math.floor(rand() * customersDb.length)] : null
      if (member) {
        const cur = spendMap.get(member.id) ?? { spend: 0, visits: 0 }
        cur.spend += total
        cur.visits += 1
        spendMap.set(member.id, cur)
      }

      await db.sale.create({
        data: {
          invoiceNo, status: 'paid', subtotal, discount: itemDisc, orderDiscount: 0,
          tax, total, paidAmount, changeAmount, method,
          orderType: ORDER_TYPES[Math.floor(rand() * ORDER_TYPES.length)],
          cashierName: CASHIERS[Math.floor(rand() * CASHIERS.length)],
          customerId: member?.id ?? null,
          customerName: member?.name ?? null,
          createdAt,
          items: { create: lines },
        },
      })
      totalSales++
    }
  }

  // 9. Agregat member: poin, kunjungan, tier
  for (const [customerId, agg] of spendMap) {
    await db.customer.update({
      where: { id: customerId },
      data: {
        totalSpend: Math.round(agg.spend),
        visitCount: agg.visits,
        points: Math.floor(agg.spend / 10000),
        tier: tierOf(agg.spend),
      },
    })
  }

  return { products: created.length, sales: totalSales }
}
