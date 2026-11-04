/* Seed data zPos — jalankan: bun prisma/seed.ts */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const CATEGORIES = [
  { name: 'Makanan Instan', sortOrder: 1 },
  { name: 'Minuman', sortOrder: 2 },
  { name: 'Snack', sortOrder: 3 },
  { name: 'Sembako', sortOrder: 4 },
  { name: 'Kebutuhan Rumah', sortOrder: 5 },
  { name: 'Perawatan Diri', sortOrder: 6 },
]

const PRODUCTS: Array<{
  sku: string; barcode: string; name: string; cat: string; unit: string
  price: number; cost: number; stock: number; minStock: number
}> = [
  { sku: 'MKN-001', barcode: '8998866200011', name: 'Indomie Goreng', cat: 'Makanan Instan', unit: 'pcs', price: 3500, cost: 2900, stock: 144, minStock: 24 },
  { sku: 'MKN-002', barcode: '8998866200028', name: 'Indomie Kari Ayam', cat: 'Makanan Instan', unit: 'pcs', price: 3500, cost: 2900, stock: 96, minStock: 24 },
  { sku: 'MKN-003', barcode: '8992388101017', name: 'Sarden Botan 155g', cat: 'Makanan Instan', unit: 'kaleng', price: 8500, cost: 7200, stock: 36, minStock: 12 },
  { sku: 'MIN-001', barcode: '8886008101053', name: 'Aqua 600ml', cat: 'Minuman', unit: 'btl', price: 4000, cost: 3100, stock: 120, minStock: 24 },
  { sku: 'MIN-002', barcode: '8996001600136', name: 'Teh Botol Sosro 450ml', cat: 'Minuman', unit: 'btl', price: 5000, cost: 4000, stock: 72, minStock: 24 },
  { sku: 'MIN-003', barcode: '8998009010010', name: 'Kopi Kapal Api 65g', cat: 'Minuman', unit: 'pcs', price: 2000, cost: 1650, stock: 4, minStock: 12 },
  { sku: 'MIN-004', barcode: '8994696510016', name: 'Le Minerale 1500ml', cat: 'Minuman', unit: 'btl', price: 6500, cost: 5400, stock: 48, minStock: 12 },
  { sku: 'MIN-005', barcode: '8886008101091', name: 'Pocari Sweat 500ml', cat: 'Minuman', unit: 'btl', price: 8500, cost: 7000, stock: 30, minStock: 12 },
  { sku: 'MIN-006', barcode: '8992753100114', name: 'Susu Ultra Milk 250ml', cat: 'Minuman', unit: 'pcs', price: 7000, cost: 5900, stock: 40, minStock: 12 },
  { sku: 'SNK-001', barcode: '8993175537018', name: 'Chitato 68g', cat: 'Snack', unit: 'pcs', price: 12500, cost: 10500, stock: 24, minStock: 10 },
  { sku: 'SNK-002', barcode: '8992696404019', name: 'Oreo Original 133g', cat: 'Snack', unit: 'pcs', price: 9500, cost: 8000, stock: 28, minStock: 10 },
  { sku: 'SNK-003', barcode: '8991002101015', name: 'SilverQueen 65g', cat: 'Snack', unit: 'pcs', price: 18000, cost: 15200, stock: 3, minStock: 6 },
  { sku: 'SNK-004', barcode: '8998866600017', name: 'Roti Tawar Sari Roti', cat: 'Snack', unit: 'pcs', price: 14000, cost: 11800, stock: 12, minStock: 6 },
  { sku: 'SMB-001', barcode: '2000000000015', name: 'Beras Ramos 5kg', cat: 'Sembako', unit: 'sak', price: 68000, cost: 61000, stock: 20, minStock: 5 },
  { sku: 'SMB-002', barcode: '8998866600024', name: 'Minyak Goreng Bimoli 1L', cat: 'Sembako', unit: 'btl', price: 18500, cost: 16500, stock: 32, minStock: 10 },
  { sku: 'SMB-003', barcode: '2000000000039', name: 'Gula Pasir 1kg', cat: 'Sembako', unit: 'pack', price: 16000, cost: 14200, stock: 40, minStock: 10 },
  { sku: 'SMB-004', barcode: '2000000000046', name: 'Telur Ayam 1kg', cat: 'Sembako', unit: 'kg', price: 28000, cost: 25500, stock: 15, minStock: 10 },
  { sku: 'SMB-005', barcode: '8992775810013', name: 'Kecap Manis Bango 135ml', cat: 'Sembako', unit: 'btl', price: 15000, cost: 12800, stock: 22, minStock: 8 },
  { sku: 'RUM-001', barcode: '8999999040018', name: 'Rinso Anti Noda 770g', cat: 'Kebutuhan Rumah', unit: 'pcs', price: 24500, cost: 21000, stock: 18, minStock: 6 },
  { sku: 'RUM-002', barcode: '8999999050017', name: 'Sunlight Jeruk 755ml', cat: 'Kebutuhan Rumah', unit: 'btl', price: 19500, cost: 16800, stock: 16, minStock: 6 },
  { sku: 'RUM-003', barcode: '8999999060016', name: 'Tissue Paseo 250s', cat: 'Kebutuhan Rumah', unit: 'pack', price: 16500, cost: 14000, stock: 25, minStock: 8 },
  { sku: 'PDT-001', barcode: '8999999520019', name: 'Sabun Lifebuoy 110g', cat: 'Perawatan Diri', unit: 'pcs', price: 5500, cost: 4400, stock: 36, minStock: 12 },
  { sku: 'PDT-002', barcode: '8999999530018', name: 'Pepsodent 190g', cat: 'Perawatan Diri', unit: 'pcs', price: 17500, cost: 14800, stock: 20, minStock: 8 },
  { sku: 'PDT-003', barcode: '8999999540017', name: 'Shampoo Sachet Clear', cat: 'Perawatan Diri', unit: 'pcs', price: 1500, cost: 1150, stock: 88, minStock: 24 },
]

const DEVICES = [
  { name: 'Kasir-01', kind: 'client', platform: 'Windows 11 · zPos Desktop', version: '1.0.0', status: 'online', minutesAgo: 0 },
  { name: 'Kasir-02', kind: 'client', platform: 'macOS 14 · zPos Desktop', version: '1.0.0', status: 'online', minutesAgo: 0 },
  { name: 'Tablet-Kasir', kind: 'client', platform: 'Android 13 · zPos Mobile', version: '1.0.0', status: 'offline', minutesAgo: 127 },
  { name: 'Waiter-iPad', kind: 'client', platform: 'iOS 17 · zPos Mobile', version: '1.0.2', status: 'online', minutesAgo: 0 },
  { name: 'Printer-Kasir-80mm', kind: 'peripheral', platform: 'Xprinter XP-N160II · LAN 192.168.1.50', version: '—', status: 'online', minutesAgo: 1 },
  { name: 'Printer-Dapur-58mm', kind: 'peripheral', platform: 'Rongta RP58 · USB', version: '—', status: 'offline', minutesAgo: 45 },
]

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}

async function main() {
  console.log('Menghapus data lama…')
  await db.stockMove.deleteMany()
  await db.saleItem.deleteMany()
  await db.sale.deleteMany()
  await db.shift.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.device.deleteMany()

  console.log('Seed kategori & produk…')
  const cats: Record<string, string> = {}
  for (const c of CATEGORIES) {
    const row = await db.category.create({ data: c })
    cats[c.name] = row.id
  }

  const products: Array<{ id: string; name: string; price: number; cost: number }> = []
  for (const p of PRODUCTS) {
    const row = await db.product.create({
      data: {
        sku: p.sku, barcode: p.barcode, name: p.name, unit: p.unit,
        price: p.price, cost: p.cost, stock: p.stock, minStock: p.minStock,
        categoryId: cats[p.cat],
      },
    })
    products.push({ id: row.id, name: row.name, price: row.price, cost: row.cost })
  }

  console.log('Seed perangkat…')
  for (const d of DEVICES) {
    await db.device.create({
      data: {
        name: d.name, kind: d.kind, platform: d.platform, version: d.version,
        status: d.status, lastSeen: new Date(Date.now() - d.minutesAgo * 60_000),
      },
    })
  }

  console.log('Seed penjualan 7 hari terakhir…')
  const METHODS = ['cash', 'cash', 'cash', 'cash', 'cash', 'qris', 'qris', 'transfer']
  const CASHIERS = ['Sari', 'Budi']
  const now = new Date()

  for (let dayAgo = 6; dayAgo >= 0; dayAgo--) {
    const isToday = dayAgo === 0
    const count = isToday ? rand(6, 10) : rand(10, 18)
    let seq = 0

    for (let i = 0; i < count; i++) {
      // jam 08:00–20:59 WIB (UTC+7)
      const hour = rand(8, 20)
      const minute = rand(0, 59)
      const created = new Date(now)
      created.setUTCDate(created.getUTCDate() - dayAgo)
      created.setUTCHours(hour - 7, minute, rand(0, 59), 0)
      if (created.getTime() > now.getTime()) created.setTime(now.getTime() - rand(1, 300) * 1000)

      const itemCount = rand(1, 4)
      const chosen = new Set<number>()
      const items: Array<{ productId: string; name: string; qty: number; price: number; cost: number; subtotal: number }> = []
      for (let j = 0; j < itemCount; j++) {
        let idx = rand(0, products.length - 1)
        while (chosen.has(idx)) idx = rand(0, products.length - 1)
        chosen.add(idx)
        const p = products[idx]
        const qty = rand(1, 3)
        items.push({ productId: p.id, name: p.name, qty, price: p.price, cost: p.cost, subtotal: p.price * qty })
      }
      const subtotal = items.reduce((s, it) => s + it.subtotal, 0)
      const method = pick(METHODS)
      const paid = method === 'cash' ? Math.ceil(subtotal / 5000) * 5000 : subtotal
      seq += 1

      const ymd = `${created.getUTCFullYear()}${String(created.getUTCMonth() + 1).padStart(2, '0')}${String(created.getUTCDate()).padStart(2, '0')}`

      await db.sale.create({
        data: {
          invoiceNo: `INV-${ymd}-${String(seq).padStart(4, '0')}`,
          status: 'paid', subtotal, discount: 0, total: subtotal,
          paidAmount: paid, changeAmount: paid - subtotal, method,
          cashierName: pick(CASHIERS), createdAt: created,
          items: { create: items },
        },
      })
    }
  }

  // Shift kemarin (sudah ditutup) — lampirkan sebagian penjualan
  console.log('Seed shift kemarin…')
  const yesterdayStart = new Date(now)
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)
  yesterdayStart.setUTCHours(1, 0, 0, 0) // 08:00 WIB
  const yesterdayEnd = new Date(now)
  yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() - 1)
  yesterdayEnd.setUTCHours(6, 30, 0, 0) // 13:30 WIB

  const shift = await db.shift.create({
    data: {
      cashierName: 'Sari', openingCash: 500000, status: 'closed',
      openedAt: yesterdayStart, closedAt: yesterdayEnd,
    },
  })
  const shiftSales = await db.sale.findMany({
    where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
  })
  let cashSum = 0
  for (const s of shiftSales) {
    await db.sale.update({ where: { id: s.id }, data: { shiftId: shift.id, cashierName: 'Sari' } })
    if (s.method === 'cash') cashSum += s.total
  }
  await db.shift.update({
    where: { id: shift.id },
    data: {
      expectedCash: 500000 + cashSum,
      closingCash: 500000 + cashSum,
      diff: 0,
    },
  })

  const totalSales = await db.sale.count()
  console.log(`Selesai: ${PRODUCTS.length} produk, ${totalSales} penjualan, ${DEVICES.length} perangkat.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
