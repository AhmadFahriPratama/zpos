import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Apple,
  ArrowDown,
  Boxes,
  Cable,
  Database,
  Globe,
  HardDriveDownload,
  Laptop,
  Monitor,
  Network,
  Printer,
  Radio,
  ScanBarcode,
  Server,
  Smartphone,
  Wallet,
  Zap,
} from 'lucide-react'

const CLIENTS = [
  { icon: Monitor, name: 'Kasir Windows', tech: 'Tauri app', note: '+ printer USB' },
  { icon: Apple, name: 'Kasir macOS', tech: 'Tauri app', note: 'webview ringan' },
  { icon: Smartphone, name: 'Tablet / HP Android', tech: 'Expo (RN)', note: 'waiter & kasir mobile' },
  { icon: Smartphone, name: 'iPhone / iPad', tech: 'Expo (RN)', note: 'rilis F2–F4' },
  { icon: Globe, name: 'Browser', tech: 'Web Admin', note: 'laporan owner' },
]

const SERVER_MODULES = [
  { icon: Network, name: 'REST API', detail: 'Fastify · port 7788' },
  { icon: Zap, name: 'WebSocket', detail: 'event bus realtime' },
  { icon: Database, name: 'Database', detail: 'SQLite + WAL mode' },
  { icon: Monitor, name: 'Monitoring UI', detail: 'dashboard embedded' },
  { icon: HardDriveDownload, name: 'Backup Engine', detail: 'otomatis harian' },
  { icon: Radio, name: 'mDNS Discovery', detail: 'zpos.local' },
]

const FLOW = [
  { step: '1', title: 'Scan & Keranjang', desc: 'Barcode diskan → harga diambil dari cache lokal (instan, tanpa jeda jaringan).' },
  { step: '2', title: 'Kirim Transaksi', desc: 'POST /api/sales → server memvalidasi stok & harga sebelum menerima.' },
  { step: '3', title: 'Commit Atomic', desc: 'SQLite transaction: tulis penjualan + kurangi stok dalam satu operasi atomik.' },
  { step: '4', title: 'Broadcast Realtime', desc: 'Event WebSocket ke semua perangkat: stok, laporan live, notifikasi.' },
  { step: '5', title: 'Cetak Struk', desc: 'Server perintahkan printer thermal (LAN/USB) mencetak struk.' },
  { step: '6', title: 'Kas Tercatat', desc: 'Shift kasir & saldo laci kas diperbarui otomatis.' },
]

const SCENARIOS = [
  { scenario: 'Internet mati, LAN hidup', behavior: 'Semua fitur tetap jalan. QRIS dinamis fallback ke QRIS statis / tunai.', ok: true },
  { scenario: 'Server restart', behavior: 'Client auto-reconnect + refresh token otomatis, tanpa input ulang.', ok: true },
  { scenario: 'Perangkat baru mau gabung', behavior: 'Scan QR pairing di layar server + PIN 6 digit sekali pakai.', ok: true },
  { scenario: 'Server mati total (Fase 4)', behavior: 'Desktop masuk mode survival: transaksi antre di SQLite lokal, sinkron saat server hidup.', ok: false },
]

export function Architecture() {
  return (
    <Section id="arsitektur">
      <SectionHeader
        icon={<Server className="h-4 w-4" />}
        eyebrow="Arsitektur Sistem"
        title="Satu Server Lokal, Banyak Perangkat"
        description="Semua kecerdasan hidup di server utama. Client dibuat setipis mungkin (UI + cache) sehingga mudah dipelihara dan aman diganti-ganti perangkat."
      />

      {/* ===== Diagram ===== */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-8 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        {/* Client layer */}
        <div>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Lapis Client — aplikasi kasir &amp; pelaporan
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            {CLIENTS.map((c) => (
              <Card
                key={c.name}
                className="border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <CardContent className="p-3 sm:p-4">
                  <c.icon className="mb-2 h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  <p className="text-xs font-semibold text-zinc-900 sm:text-sm dark:text-zinc-100">{c.name}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{c.tech}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{c.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Connector down */}
        <div className="flex flex-col items-center py-3" aria-hidden="true">
          <ArrowDown className="h-4 w-4 text-zinc-400" />
        </div>

        {/* Network layer */}
        <div className="mx-auto flex max-w-xl items-center justify-center gap-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
          <WifiIcon />
          <div className="text-center">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              WiFi / LAN — Router atau Switch
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              REST + WebSocket · pairing QR + PIN · mDNS discovery (zpos.local)
            </p>
          </div>
        </div>

        {/* Connector down */}
        <div className="flex flex-col items-center py-3" aria-hidden="true">
          <ArrowDown className="h-4 w-4 text-zinc-400" />
        </div>

        {/* Server layer */}
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-300 bg-white p-4 shadow-md sm:p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <Server className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">zPos Server</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Aplikasi desktop .exe / .dmg — PC atau homeserver
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Sumber Kebenaran Data</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {SERVER_MODULES.map((m) => (
              <div
                key={m.name}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <m.icon className="mb-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{m.name}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Peripherals */}
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
          <span className="text-[11px] font-medium uppercase tracking-wider dark:text-zinc-500">
            Periferal via server / LAN:
          </span>
          <Badge variant="outline" className="gap-1 border-zinc-300 dark:border-zinc-700">
            <Printer className="h-3 w-3" aria-hidden="true" /> Printer thermal
          </Badge>
          <Badge variant="outline" className="gap-1 border-zinc-300 dark:border-zinc-700">
            <ScanBarcode className="h-3 w-3" aria-hidden="true" /> Scanner barcode
          </Badge>
          <Badge variant="outline" className="gap-1 border-zinc-300 dark:border-zinc-700">
            <Wallet className="h-3 w-3" aria-hidden="true" /> Cash drawer
          </Badge>
          <Badge variant="outline" className="gap-1 border-zinc-300 dark:border-zinc-700">
            <Cable className="h-3 w-3" aria-hidden="true" /> Timbangan (F2)
          </Badge>
        </div>
      </div>

      {/* ===== Golden path ===== */}
      <h3 className="mt-12 mb-5 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        <Boxes className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        Alur Transaksi (Golden Path)
      </h3>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLOW.map((f) => (
          <li
            key={f.step}
            className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              {f.step}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{f.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* ===== Skenario konektivitas ===== */}
      <h3 className="mt-12 mb-5 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        <Laptop className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        Skenario Konektivitas
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {SCENARIOS.map((s) => (
          <div
            key={s.scenario}
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span
              className={
                s.ok
                  ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              }
            >
              {s.ok ? '✓' : '⏳'}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.scenario}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{s.behavior}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function WifiIcon() {
  return (
    <svg
      className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13a10 10 0 0 1 14 0" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 20 0" />
      <line x1="12" x2="12.01" y1="20" y2="20" />
    </svg>
  )
}
