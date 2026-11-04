import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Banknote, ListChecks } from 'lucide-react'

const COSTS = [
  { item: 'Lisensi software (Electron, Tauri, Prisma, SQLite, Expo — semua open source)', cost: 'Rp 0', note: 'tanpa royalti bulanan' },
  { item: 'Code signing Windows (opsional, disarankan)', cost: '~$70–200/thn', note: 'Certum / SSL.com' },
  { item: 'Apple Developer (distribusi iOS/Mac via store)', cost: '$99/thn', note: 'baru saat masuk F2–F4' },
  { item: 'Google Play Console', cost: '$25 sekali', note: 'akun developer' },
  { item: 'Perangkat uji: printer thermal LAN, scanner, drawer, tablet Android bekas', cost: '± Rp 1,5–3 jt', note: 'sekali beli, aset lab' },
  { item: 'QRIS dinamis (opsional di v1.x)', cost: 'MDR per transaksi', note: 'via Midtrans/Xendit' },
  { item: 'VPS cloud relay (opsional di F4)', cost: '~$5/bln', note: 'hanya jika monitoring remote diaktifkan' },
]

const ACTIONS = [
  'Konfirmasi lingkup MVP (fitur v1.0) & nama brand final',
  'Setup monorepo (Turborepo + Bun) + repo GitHub + CI lint/test',
  'Finalisasi skema database → generate Prisma → migrasi v0',
  'Desain kontrak API v1 (zod/OpenAPI) di packages/shared-types',
  'Wireframe 4 layar inti kasir (katalog, keranjang, bayar, shift) + dashboard monitoring',
  'Beli perangkat uji: printer thermal LAN, scanner USB, drawer, tablet Android',
  'Prototipe end-to-end 2 minggu: CRUD produk → transaksi → cetak struk (bukti konsep)',
  'Rekrut 1–2 toko pilot (kenalan/kerabat) untuk milestone M1',
]

export function Costs() {
  return (
    <Section id="biaya" tint>
      <SectionHeader
        icon={<Banknote className="h-4 w-4" />}
        eyebrow="Biaya & Eksekusi"
        title="Estimasi Biaya & Langkah Selanjutnya"
        description="Kabar baik: seluruh stack open source, jadi biaya pengembangan software lisensinya Rp 0. Biaya nyata ada di perangkat uji dan akun store (opsional)."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Costs */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Banknote className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Rincian Biaya Teknis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {COSTS.map((c) => (
                <li key={c.item} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-xs font-medium leading-relaxed text-zinc-800 sm:text-sm dark:text-zinc-200">{c.item}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{c.note}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">{c.cost}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Next steps */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-900 dark:from-emerald-950/50 dark:to-teal-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Action Plan — 2 Minggu Pertama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5">
              {ACTIONS.map((a, i) => (
                <li key={a} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed text-emerald-900/90 sm:text-sm dark:text-emerald-200/90">{a}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-center sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
        <Badge className="mb-4 bg-emerald-600 text-white hover:bg-emerald-700">Langkah Berikutnya</Badge>
        <h3 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
          Siap mulai membangun zPos?
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Rencana ini sudah siap jadi fondasi. Langkah paling logis berikutnya: mulai Fase 0 — setup
          monorepo, finalisasi skema database, dan prototipe transaksi → struk dalam 2 minggu.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#arsitektur"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Tinjau Ulang Arsitektur
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="#roadmap"
            className="inline-flex h-10 items-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Lihat Roadmap
          </a>
        </div>
      </div>
    </Section>
  )
}
