import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert } from 'lucide-react'

const RISKS = [
  {
    risk: 'WiFi tidak stabil → transaksi gagal',
    impact: 'Tinggi',
    prob: 'Sedang',
    mitigation: 'Kasir utama pakai kabel LAN; retry + timeout; antre lokal; indikator status koneksi jelas di UI',
  },
  {
    risk: 'PC server mati lampu / dimatikan',
    impact: 'Tinggi',
    prob: 'Sedang',
    mitigation: 'Auto-start + watchdog; disarankan UPS 600VA; mode survival client (F4)',
  },
  {
    risk: 'Kehilangan data (disk rusak)',
    impact: 'Tinggi',
    prob: 'Rendah',
    mitigation: 'Backup harian otomatis ke 2 lokasi + checksum; uji restore bulanan',
  },
  {
    risk: 'Konflik stok saat offline ganda',
    impact: 'Sedang',
    prob: 'Sedang',
    mitigation: 'Stok di-reserve di server; last-write-wins + audit; opname menyusul',
  },
  {
    risk: 'Printer/model tidak kompatibel',
    impact: 'Sedang',
    prob: 'Sedang',
    mitigation: 'Uji 5–8 printer umum di Indonesia (Xprinter, Epson TM, Rongta); publikasikan whitelist',
  },
  {
    risk: 'Driver USB serial di macOS',
    impact: 'Rendah',
    prob: 'Sedang',
    mitigation: 'Utamakan printer LAN; koneksi serial ditangani server via Node serialport',
  },
  {
    risk: 'Review App Store (iOS) lambat',
    impact: 'Rendah',
    prob: 'Tinggi',
    mitigation: 'Android dulu; iOS via TestFlight; mode LAN-only dijelaskan ke reviewer',
  },
  {
    risk: 'Satu titik gagal (1 server)',
    impact: 'Sedang',
    prob: '—',
    mitigation: 'Hot standby server kedua di F5 — cukup untuk 1 lokasi; multi-outlet lintas gedung masuk skema PostgreSQL',
  },
]

const BADGE_TONE: Record<string, string> = {
  Tinggi: 'bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300',
  Sedang: 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300',
  Rendah: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300',
  '—': 'bg-zinc-100 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400',
}

export function Risks() {
  return (
    <Section id="risiko">
      <SectionHeader
        icon={<ShieldAlert className="h-4 w-4" />}
        eyebrow="Manajemen Risiko"
        title="Risiko & Mitigasi"
        description="Arsitektur server-lokal punya tantangan unik. Ini daftar risiko nyata yang sudah diantisipasi sejak desain — bukan ditambahkan belakangan."
      />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Risiko</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Dampak</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Probabilitas</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Mitigasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {RISKS.map((r) => (
              <tr key={r.risk} className="align-top">
                <td className="max-w-[220px] px-4 py-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{r.risk}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-[11px] ${BADGE_TONE[r.impact]}`}>{r.impact}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={`text-[11px] ${BADGE_TONE[r.prob]}`}>{r.prob}</Badge>
                </td>
                <td className="max-w-sm px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{r.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
