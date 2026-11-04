import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Gift, Rocket, ShoppingCart, Sparkles, Warehouse } from 'lucide-react'

const PHASES = [
  {
    icon: ShoppingCart,
    color: 'emerald',
    version: 'MVP · v1.0',
    title: 'Rilis Pertama — Siap Pakai',
    groups: [
      {
        name: 'Kasir',
        items: [
          'Katalog + pencarian + scan barcode (HID)',
          'Keranjang: qty, diskon item, hold/parkir order',
          'Bayar: tunai, QRIS statis, kartu manual, transfer',
          'Cetak struk 58/80 mm (ESC/POS) + header/footer',
          'Shift kasir: buka/tutup, setoran, laporan X/Z',
          'Refund/void dengan izin manager',
        ],
      },
      {
        name: 'Server & Monitoring',
        items: [
          'Setup wizard: toko, outlet, pajak, user pertama',
          'CRUD produk/kategori + impor CSV',
          'Dashboard harian + item terlaris',
          'Pairing perangkat via QR + PIN',
          'Backup otomatis harian + restore 1 klik',
          'System tray + auto-start Windows/Mac',
        ],
      },
      {
        name: 'Stok',
        items: [
          'Stok real-time + alert minimum',
          'Opname dengan alasan tercatat',
          'Riwayat pergerakan stok (StockMove)',
        ],
      },
    ],
  },
  {
    icon: Warehouse,
    color: 'teal',
    version: 'v1.x',
    title: 'Penguatan Operasional',
    groups: [
      {
        name: 'Bisnis',
        items: [
          'Multi-outlet dalam satu server',
          'Pembelian & supplier (PO → terima → stok)',
          'Harga pokok rata-rata bergerak',
          'Pelanggan & poin loyalitas',
          'Promo: %, nominal, member price, happy hour',
        ],
      },
      {
        name: 'Laporan & Pembayaran',
        items: [
          'Laba kotor, per kasir, per jam',
          'Ekspor Excel/CSV',
          'Laporan via browser (HP owner tanpa install app)',
          'QRIS dinamis (Midtrans/Xendit — opsional)',
        ],
      },
      {
        name: 'Pelanggan',
        items: ['Multi-bahasa & multi-mata uang'],
      },
    ],
  },
  {
    icon: Sparkles,
    color: 'amber',
    version: 'v2.0',
    title: 'Kelas Enterprise Lokal',
    groups: [
      {
        name: 'Ketangguhan',
        items: [
          'Mode offline penuh client + sinkron konflik',
          'Enkripsi disk SQLCipher',
          'Cloud relay opsional (monitoring dari luar, E2E encrypted)',
        ],
      },
      {
        name: 'Restoran & Kanal',
        items: [
          'Kitchen Display (KDS) + manajemen meja',
          'Integrasi marketplace (Tokopedia/Shopee)',
          'Kiosk self-order + customer display',
        ],
      },
      {
        name: 'Keuangan',
        items: [
          'Jurnal akuntansi dasar',
          'Ekspor ke Accurate/Jurnal',
          'Timbangan digital serial (toko buah/daging)',
        ],
      },
    ],
  },
]

const COLOR_MAP: Record<string, { badge: string; iconWrap: string }> = {
  emerald: {
    badge: 'bg-emerald-600 text-white hover:bg-emerald-700',
    iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  teal: {
    badge: 'bg-teal-600 text-white hover:bg-teal-700',
    iconWrap: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  },
  amber: {
    badge: 'bg-amber-500 text-white hover:bg-amber-600',
    iconWrap: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
}

export function Features() {
  return (
    <Section id="fitur" tint>
      <SectionHeader
        icon={<Rocket className="h-4 w-4" />}
        eyebrow="Fitur"
        title="Evolusi Fitur: MVP → v2.0"
        description="Rilis cepat dengan fitur kasir inti yang solid, lalu tumbuh sesuai umpan balik toko pilot. Tidak ada fitur yang dikunci langganan — semua berjalan di server Anda."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {PHASES.map((phase) => {
          const c = COLOR_MAP[phase.color]
          return (
            <Card
              key={phase.version}
              className="flex flex-col border-zinc-200 shadow-sm dark:border-zinc-800"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.iconWrap}`}>
                    <phase.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Badge className={c.badge}>{phase.version}</Badge>
                </div>
                <CardTitle className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {phase.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {phase.groups.map((g) => (
                  <div key={g.name}>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {g.name}
                    </p>
                    <ul className="space-y-1.5">
                      {g.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          <strong>Prinsip produk:</strong> semua fitur inti kasir berjalan tanpa internet dan tanpa
          langganan. Fitur yang memang butuh internet (QRIS dinamis, marketplace) dibuat opsional dengan
          fallback yang jelas.
        </p>
      </div>
    </Section>
  )
}
