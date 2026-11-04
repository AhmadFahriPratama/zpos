import { Section, SectionHeader } from './section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Coins,
  Database,
  LayoutGrid,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  Target,
} from 'lucide-react'

const PRINCIPLES = [
  {
    icon: Database,
    title: 'Data Milik Pemilik Toko',
    desc: 'Server berjalan di PC/homeserver sendiri — bukan cloud pihak ketiga. Privasi penuh, kontrol penuh.',
  },
  {
    icon: Coins,
    title: 'Tanpa Langganan Cloud',
    desc: 'Seluruh transaksi mengalir di jaringan lokal. Biaya operasional server: Rp 0 per bulan.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Multi-Platform Penuh',
    desc: 'Windows, macOS, Android, iOS, dan browser — semua tersambung ke satu server yang sama.',
  },
  {
    icon: ShieldCheck,
    title: 'Offline-First',
    desc: 'Internet mati? Kasir tetap jalan penuh. QRIS dinamis jadi opsional dengan fallback tunai.',
  },
  {
    icon: Lock,
    title: 'Monitoring Terpusat',
    desc: 'Aplikasi server (.exe) punya dashboard monitoring perangkat, backup otomatis, dan system tray.',
  },
]

const TARGETS = [
  { name: 'Ritel & Minimarket', detail: '1–10 mesin kasir, barcode, stok' },
  { name: 'Kafe & Restoran', detail: 'Varian menu, meja (v2.0 KDS)' },
  { name: 'Laundry & Jasa', detail: 'Order tanpa stok, pelanggan' },
  { name: 'Multi-Outlet', detail: 'Satu jaringan, banyak kasir & laci' },
]

export function Summary() {
  return (
    <Section id="ringkasan" tint>
      <SectionHeader
        icon={<Target className="h-4 w-4" />}
        eyebrow="Ringkasan Eksekutif"
        title="Visi & Prinsip Desain"
        description="zPos adalah aplikasi kasir generasi baru yang mengambil kekuatan iPos/Ketoko, lalu meningkatkannya dengan arsitektur server-lokal: pemilik toko punya server sendiri, perangkat kasir apa pun bisa terhubung lewat jaringan rumah/toko."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <Card
            key={p.title}
            className="border-zinc-200 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800"
          >
            <CardHeader className="pb-3">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <p.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {p.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.desc}</p>
            </CardContent>
          </Card>
        ))}

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm dark:border-emerald-900 dark:from-emerald-950/50 dark:to-teal-950/30">
          <CardHeader className="pb-3">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
              Target Pasar Awal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {TARGETS.map((t) => (
                <li key={t.name} className="text-sm">
                  <span className="font-medium text-emerald-900 dark:text-emerald-200">{t.name}</span>
                  <span className="block text-xs text-emerald-800/70 dark:text-emerald-400/80">{t.detail}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
