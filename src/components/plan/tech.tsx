import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Atom,
  Binary,
  Check,
  FileCode2,
  FolderTree,
  Layers,
  Package,
  Server,
  Share2,
  Smartphone,
  Monitor,
} from 'lucide-react'

const SERVER_OPTIONS = [
  {
    tag: 'A · Rekomendasi ✅',
    stack: 'Electron (tray) + Node.js + Fastify + Prisma + SQLite',
    pros: 'Satu codebase TypeScript dengan client, ekosistem npm untuk printer/serial, packaging mudah (electron-builder)',
    cons: 'Installer ± 80–120 MB',
    recommended: true,
  },
  {
    tag: 'Opsi B',
    stack: 'Tauri 2 (Rust) + sidecar Node',
    pros: 'Installer kecil ± 15 MB, hemat RAM',
    cons: 'Kompleks 2 runtime; library printer/serial di Rust lebih terbatas',
    recommended: false,
  },
  {
    tag: 'Opsi C',
    stack: '.NET 8 self-contained',
    pros: 'Native Windows, performa tinggi',
    cons: 'Mac/iOS perlu skill terpisah, tidak berbagi tipe dengan client',
    recommended: false,
  },
]

const CLIENT_STACKS = [
  {
    icon: Monitor,
    title: 'Desktop — Tauri 2 + React',
    points: ['Webview bawaan OS → RAM rendah', 'Installer ± 10 MB (vs Electron 100 MB+)', 'Berbagi UI & logic dengan web admin'],
  },
  {
    icon: Smartphone,
    title: 'Mobile — Expo (React Native)',
    points: ['Satu codebase Android & iOS', 'OTA update via EAS Update', 'AsyncStorage untuk cache lokal'],
  },
  {
    icon: Share2,
    title: 'Shared — Turborepo + Bun',
    points: ['packages/shared-types: zod schema = sumber kebenaran API', 'packages/api-client: SDK ter-tipe semua platform', 'packages/escpos: driver printer dipakai bersama'],
  },
]

const MONOREPO = `zpos/
├─ apps/
│  ├─ server/          # zPos Server (Electron + Fastify + Prisma)
│  │  ├─ src/main/     #   tray, autostart, updater
│  │  ├─ src/api/      #   REST + WebSocket
│  │  ├─ src/modules/  #   sales, inventory, shifts, backup, printing
│  │  └─ src/monitor-ui/
│  ├─ kasir-desktop/   # Tauri 2 + React
│  ├─ kasir-mobile/    # Expo (React Native)
│  └─ web-admin/       # laporan via browser
├─ packages/
│  ├─ shared-types/    # zod + TS types
│  ├─ api-client/      # SDK ter-tipe
│  ├─ ui/              # komponen bersama
│  ├─ escpos/          # driver printer
│  └─ sync/            # protokol offline queue
└─ docs/`

const PRINCIPLES = [
  { icon: FileCode2, text: 'Zod schema di shared-types → tipe TS + validasi runtime di server & client sekaligus.' },
  { icon: Binary, text: 'Jalan migrasi: SQLite → PostgreSQL mulus via Prisma untuk toko sangat besar / lintas gedung.' },
  { icon: Layers, text: 'Event realtime: sale.created, stock.low, device.connected — semua lewat satu event bus WebSocket.' },
]

export function TechStack() {
  return (
    <Section id="teknologi" tint>
      <SectionHeader
        icon={<Server className="h-4 w-4" />}
        eyebrow="Teknologi"
        title="Pilihan Stack & Struktur Kode"
        description="Prinsipnya: satu bahasa (TypeScript) dari server sampai client, agar tipe data berbagi dan pengembangan cepat. Berikut opsi server yang dievaluasi dan rekomendasinya."
      />

      {/* Server options */}
      <div className="grid gap-4 lg:grid-cols-3">
        {SERVER_OPTIONS.map((opt) => (
          <Card
            key={opt.tag}
            className={
              opt.recommended
                ? 'relative border-2 border-emerald-500 shadow-md dark:border-emerald-600'
                : 'border-zinc-200 shadow-sm dark:border-zinc-800'
            }
          >
            <CardHeader className="pb-3">
              <Badge
                className={
                  opt.recommended
                    ? 'w-fit bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'w-fit bg-zinc-100 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400'
                }
              >
                {opt.tag}
              </Badge>
              <CardTitle className="mt-3 text-sm leading-snug font-semibold text-zinc-900 dark:text-zinc-100">
                {opt.stack}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <p className="flex gap-2 text-xs leading-relaxed text-emerald-800 dark:text-emerald-400">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {opt.pros}
              </p>
              <p className="flex gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                <span aria-hidden="true">—</span>
                {opt.cons}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client stacks */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {CLIENT_STACKS.map((c) => (
          <Card key={c.title} className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                <c.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {c.points.map((pt) => (
                  <li key={pt} className="flex gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                    {pt}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monorepo structure */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="border-zinc-200 lg:col-span-3 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <FolderTree className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Struktur Monorepo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="plan-scroll overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-200 sm:text-xs">
              {MONOREPO}
            </pre>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 lg:col-span-2 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Atom className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Prinsip Teknis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {PRINCIPLES.map((p) => (
              <p key={p.text} className="flex gap-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <p.icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                {p.text}
              </p>
            ))}
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
              Semua lisensi open source — biaya lisensi software Rp 0.
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
