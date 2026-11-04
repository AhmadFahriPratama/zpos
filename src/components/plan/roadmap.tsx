import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import { Flag, Milestone, Timer } from 'lucide-react'

const PHASES = [
  {
    code: 'F0',
    name: 'Fondasi',
    duration: '2–3 minggu',
    deliverable: 'Monorepo, shared-types, CI, desain UI system, skema DB final, prototipe API',
    exit: 'API CRUD produk jalan + review desain disetujui',
    width: '12%',
    color: 'bg-zinc-500',
  },
  {
    code: 'F1',
    name: 'MVP',
    duration: '8–10 minggu',
    deliverable: 'Server .exe (tray + wizard + backup), kasir desktop lengkap, struk, shift, laporan dasar',
    exit: '1 toko pilot transaksi nyata 1 hari penuh tanpa kendala',
    width: '26%',
    color: 'bg-emerald-600',
  },
  {
    code: 'F2',
    name: 'Mobile & Hardware',
    duration: '4–6 minggu',
    deliverable: 'App Android (Expo), pairing QR, printer LAN, customer display, laporan browser',
    exit: 'Kasir pakai HP + printer jaringan stabil',
    width: '18%',
    color: 'bg-teal-600',
  },
  {
    code: 'F3',
    name: 'Multi-outlet & Pembelian',
    duration: '6–8 minggu',
    deliverable: 'Multi-outlet, supplier/PO, loyalitas, promo, laporan lanjutan',
    exit: '2 outlet jalan di 1 server, laba kotor akurat',
    width: '22%',
    color: 'bg-amber-500',
  },
  {
    code: 'F4',
    name: 'Ketangguhan',
    duration: '6–8 minggu',
    deliverable: 'Offline sync client, enkripsi SQLCipher, cloud relay opsional, rilis iOS',
    exit: 'Internet mati 1 hari → data utuh, sinkron bersih',
    width: '22%',
    color: 'bg-rose-500',
  },
]

const MILESTONES = [
  { code: 'M1', when: 'Akhir F1', desc: 'Pilot pertama — momen kebenaran desain' },
  { code: 'M2', when: 'Akhir F2', desc: 'Rilis publik v1.0 (Windows + Android dulu; Mac & iOS menyusul)' },
  { code: 'M3', when: 'Akhir F4', desc: 'v2.0 — tahan offline penuh, siap skala komersial' },
]

export function Roadmap() {
  return (
    <Section id="roadmap">
      <SectionHeader
        icon={<Milestone className="h-4 w-4" />}
        eyebrow="Roadmap"
        title="Timeline Pengembangan"
        description="Estimasi untuk 1–2 developer full-time. Total ke rilis komersial pertama (v1.0): sekitar 3–4 bulan. Beta dengan 2–3 toko nyata dimulai akhir Fase 1."
      />

      {/* Gantt bar */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <Timer className="h-4 w-4" aria-hidden="true" />
          Peta Durasi (± 7 bulan total)
        </p>
        <div className="flex h-9 w-full overflow-hidden rounded-lg">
          {PHASES.map((p) => (
            <div
              key={p.code}
              style={{ width: p.width }}
              className={`${p.color} relative flex items-center justify-center border-r border-white/30 text-[10px] font-bold text-white transition-transform sm:text-xs`}
              title={`${p.code} — ${p.name}: ${p.duration}`}
            >
              <span className="truncate px-1">{p.code}</span>
            </div>
          ))}
        </div>
        <div className="plan-scroll mt-3 flex gap-2 overflow-x-auto">
          {PHASES.map((p) => (
            <span key={p.code} className="flex shrink-0 items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className={`h-2.5 w-2.5 rounded-sm ${p.color}`} aria-hidden="true" />
              {p.code} · {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-4">
        {PHASES.map((p, i) => (
          <div
            key={p.code}
            className="relative rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${p.color} text-sm font-bold text-white`}>
                  {p.code}
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">{p.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Fase {i + 1} dari {PHASES.length}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                {p.duration}
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Deliverable</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">{p.deliverable}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Exit Criteria</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-900 dark:text-emerald-300">{p.exit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <h3 className="mt-10 mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        <Flag className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        Milestone Kunci
      </h3>
      <div className="grid gap-3 md:grid-cols-3">
        {MILESTONES.map((m) => (
          <div
            key={m.code}
            className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{m.code}</span>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">{m.when}</Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-300/90">{m.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
