import { Section, SectionHeader } from './section'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Database } from 'lucide-react'

interface TableDef {
  name: string
  fields: string
  note?: string
}

const DOMAINS: { domain: string; icon: string; tables: TableDef[] }[] = [
  {
    domain: 'Produk & Inventori',
    icon: '📦',
    tables: [
      {
        name: 'Category',
        fields: 'id, name, sortOrder, parentId?',
        note: 'Kategori bersarang (sub-kategori opsional)',
      },
      {
        name: 'Product',
        fields: 'id, sku, barcode, name, categoryId, unit, priceRetail, priceWholesale?, taxRate, isActive, image?, trackStock',
        note: 'Sumber katalog utama; trackStock=false untuk jasa',
      },
      {
        name: 'Variant',
        fields: 'id, productId, name, sku, barcode, price, attributes(JSON)',
        note: 'Ukuran/warna/rasa — opsional per produk',
      },
      {
        name: 'Stock',
        fields: 'id, productId, variantId?, outletId, qty, minQty, maxQty',
        note: 'Qty per outlet — dasar alert stok minimum',
      },
      {
        name: 'StockMove',
        fields: 'id, productId, outletId, type(in|out|adjust|transfer|sale|purchase), qty, refType?, refId?, note, userId',
        note: 'Buku besar stok: qty TIDAK pernah diubah langsung',
      },
      { name: 'Supplier', fields: 'id, name, phone, address, note' },
      {
        name: 'Purchase / PurchaseItem',
        fields: 'supplierId, outletId, status(draft|ordered|received), total, paid, userId, receivedAt | item: productId, qty, cost, subtotal',
        note: 'PO → terima barang → stok masuk otomatis',
      },
    ],
  },
  {
    domain: 'Penjualan',
    icon: '🛒',
    tables: [
      {
        name: 'Sale',
        fields: 'id, invoiceNo, outletId, shiftId?, userId, customerId?, status(paid|void|refund), subtotal, discountTotal, taxTotal, total, paidAmount, changeAmount, method(cash|qris|card|transfer|multi), note?, deviceId, syncedAt',
        note: 'invoiceNo berurutan tanpa gap (anti-fraud)',
      },
      {
        name: 'SaleItem',
        fields: 'id, saleId, productId, variantId?, name, qty, price, discount, subtotal, cost',
        note: 'cost disimpan saat transaksi → laba kotor historis akurat',
      },
      {
        name: 'Payment',
        fields: 'id, saleId, method, amount, ref?, paidAt',
        note: '1 sale bisa >1 payment (bayar campuran)',
      },
      {
        name: 'Shift',
        fields: 'id, userId, outletId, openedAt, closedAt?, openingCash, closingCash?, expectedCash?, status(open|closed), note?',
        note: 'Rekonsiliasi kas per shift — laporan X/Z',
      },
      { name: 'Customer', fields: 'id, name, phone, email?, points, memberSince, note?' },
      {
        name: 'Promo',
        fields: 'id, name, type(percent|amount|bogo|member), value, scope(all|category|product), refId?, activeFrom, activeTo, isActive',
      },
    ],
  },
  {
    domain: 'Pengguna & Sistem',
    icon: '⚙️',
    tables: [
      { name: 'User', fields: 'id, name, pinHash, passwordHash?, role, isActive, lastSeenAt' },
      {
        name: 'Role',
        fields: 'id, name, permissions(JSON)',
        note: 'owner | manager | cashier | warehouse',
      },
      {
        name: 'Device',
        fields: 'id, name, platform(win|mac|android|ios|web), tokenHash, pairedAt, lastSeenAt, version, isBlocked',
        note: 'Whitelist perangkat yang boleh connect',
      },
      { name: 'Outlet', fields: 'id, name, address, phone, receiptFooter, taxRate, isActive' },
      { name: 'Setting', fields: 'key, value(JSON)', note: 'Pajak, struk, printer default, bahasa' },
      {
        name: 'AuditLog',
        fields: 'id, userId, action, entity, entityId, diff(JSON), ip, at',
      },
      {
        name: 'SyncQueue',
        fields: 'id, deviceId, payload(JSON), status(pending|done|failed), attempts, createdAt, processedAt',
        note: 'Antrean transaksi offline client (Fase 4)',
      },
    ],
  },
]

const RELATIONS = [
  'Product 1—* Variant 1—* Stock (per outlet)',
  'Shift 1—* Sale *—1 User (rekonsiliasi kas per shift)',
  'Sale 1—* SaleItem 1—* Payment (multi-metode bayar)',
  'Semua perubahan stok lewat StockMove — audit penuh',
]

export function DatabaseSchema() {
  return (
    <Section id="database">
      <SectionHeader
        icon={<Database className="h-4 w-4" />}
        eyebrow="Database"
        title="Desain Skema Data Inti"
        description="SQLite dengan mode WAL di server utama — cukup untuk ratusan ribu transaksi per bulan dengan hardware homeserver biasa. Semua tabel punya id (cuid), createdAt, updatedAt."
      />

      <Accordion type="multiple" defaultValue={['item-0']} className="space-y-3">
        {DOMAINS.map((d, di) => (
          <AccordionItem
            key={d.domain}
            value={`item-${di}`}
            className="rounded-xl border border-zinc-200 bg-white px-4 shadow-sm sm:px-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <span className="flex items-center gap-3 text-left">
                <span className="text-xl" aria-hidden="true">{d.icon}</span>
                <span className="text-sm font-semibold text-zinc-900 sm:text-base dark:text-zinc-100">
                  {d.domain}
                </span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                  {d.tables.length} tabel
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="space-y-3">
                {d.tables.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-800/50"
                  >
                    <p className="font-mono text-xs font-bold text-emerald-700 sm:text-sm dark:text-emerald-400">
                      {t.name}
                    </p>
                    <p className="plan-scroll mt-1.5 overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre text-zinc-600 sm:text-xs dark:text-zinc-400">
                      {t.fields}
                    </p>
                    {t.note && (
                      <p className="mt-2 text-[11px] text-amber-700 sm:text-xs dark:text-amber-400">
                        ↳ {t.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Relasi Kunci</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {RELATIONS.map((r) => (
            <li key={r} className="flex gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
