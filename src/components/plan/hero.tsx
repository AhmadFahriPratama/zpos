import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Apple,
  Globe,
  MonitorSmartphone,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react'

const STATS = [
  { icon: MonitorSmartphone, label: 'Platform Didukung', value: '4+', sub: 'Win · Mac · Android · iOS' },
  { icon: Server, label: 'Server', value: 'Lokal', sub: 'PC / homeserver sendiri' },
  { icon: Wifi, label: 'Koneksi', value: 'WiFi/LAN', sub: 'Tanpa cloud wajib' },
  { icon: WifiOff, label: 'Mode', value: 'Offline-first', sub: 'Internet mati tetap jalan' },
]

export function Hero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-teal-50/60 to-white dark:from-emerald-950/40 dark:via-zinc-950 dark:to-zinc-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20"
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-20">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="mb-5 gap-1.5 border-emerald-300 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Master Plan · Dokumen Perencanaan v1.0
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
            zPos
            <span className="mt-2 block bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 bg-clip-text text-2xl text-transparent sm:text-3xl lg:text-4xl dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400">
              Sistem Kasir Multi-Platform Berbasis Jaringan Lokal
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            Aplikasi POS generasi baru — sekelas iPos &amp; Ketoko, tapi <strong className="font-semibold text-zinc-800 dark:text-zinc-200">data 100% milik Anda</strong>.
            Server utama berjalan di PC/homeserver sebagai aplikasi <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">.exe</code> dengan dashboard monitoring,
            dan semua perangkat kasir tersambung melalui WiFi/LAN tanpa biaya langganan cloud.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="h-11 bg-emerald-600 px-6 text-white hover:bg-emerald-700" asChild>
              <a href="#arsitektur">Lihat Arsitektur</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 border-zinc-300 px-6 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              asChild
            >
              <a href="#roadmap">Roadmap Pengembangan</a>
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Apple className="h-3.5 w-3.5" aria-hidden="true" /> macOS
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium">Windows</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Web Browser
            </span>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <dt className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <stat.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {stat.label}
              </dt>
              <dd className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
                {stat.value}
              </dd>
              <dd className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{stat.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  )
}
