import { Hero } from '@/components/plan/hero'
import { PlanNav } from '@/components/plan/nav'
import { Summary } from '@/components/plan/summary'
import { Architecture } from '@/components/plan/architecture'
import { TechStack } from '@/components/plan/tech'
import { DatabaseSchema } from '@/components/plan/database'
import { Features } from '@/components/plan/features'
import { Roadmap } from '@/components/plan/roadmap'
import { Hardware } from '@/components/plan/hardware'
import { Security } from '@/components/plan/security'
import { Monitoring } from '@/components/plan/monitoring'
import { Risks } from '@/components/plan/risks'
import { Costs } from '@/components/plan/costs'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Hero />
      <PlanNav />
      <main className="flex-1">
        <Summary />
        <Architecture />
        <TechStack />
        <DatabaseSchema />
        <Features />
        <Roadmap />
        <Hardware />
        <Security />
        <Monitoring />
        <Risks />
        <Costs />
      </main>
      <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                zPos — Sistem Kasir Multi-Platform Berbasis Jaringan Lokal
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Master Plan v1.0 · Dokumen lengkap tersedia di <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800">docs/zpos-master-plan.md</code>
              </p>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Perencanaan produk · Belum termasuk implementasi kode
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
