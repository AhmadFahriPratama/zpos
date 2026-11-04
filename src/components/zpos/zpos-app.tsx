'use client'

import { useEffect } from 'react'
import { useZPos } from '@/lib/store'
import { Toaster } from '@/components/ui/sonner'
import { NavTop } from './nav-top'
import { KasirView } from './kasir-view'
import { ProductsView } from './products-view'
import { StockView } from './stock-view'
import { ReportsView } from './reports-view'
import { ShiftView } from './shift-view'
import { MonitoringView } from './monitoring-view'
import { Loader2 } from 'lucide-react'

function FooterBar() {
  const serverInfo = useZPos((s) => s.serverInfo)
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-5">
        <p className="text-[11px] text-zinc-400">
          <span className="font-semibold text-zinc-600">zPos Server v{serverInfo?.version ?? '1.0.0'}</span>
          {' · '}{serverInfo?.address ?? 'zpos.local:7788'} · Prototipe MVP
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Server lokal terhubung
        </p>
      </div>
    </footer>
  )
}

export function ZPosApp() {
  const booted = useZPos((s) => s.booted)
  const view = useZPos((s) => s.view)
  const bootstrap = useZPos((s) => s.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900">
      <NavTop />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-5 sm:py-6">
        {!booted ? (
          <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" aria-hidden="true" />
          </div>
        ) : (
          <>
            {view === 'kasir' && <KasirView />}
            {view === 'produk' && <ProductsView />}
            {view === 'stok' && <StockView />}
            {view === 'laporan' && <ReportsView />}
            {view === 'shift' && <ShiftView />}
            {view === 'monitoring' && <MonitoringView />}
          </>
        )}
      </main>
      <FooterBar />
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
