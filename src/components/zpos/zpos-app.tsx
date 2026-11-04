'use client'

import { useEffect } from 'react'
import { useZPos } from '@/lib/store'
import { Toaster } from '@/components/ui/sonner'
import { NavTop } from './nav-top'
import { DashboardView } from './dashboard-view'
import { KasirView } from './kasir-view'
import { ProductsView } from './products-view'
import { StockView } from './stock-view'
import { PurchasingView } from './purchasing-view'
import { CustomersView } from './customers-view'
import { EmployeesView } from './employees-view'
import { PromosView } from './promos-view'
import { OutletsView } from './outlets-view'
import { TransactionsView } from './transactions-view'
import { ShiftView } from './shift-view'
import { ReportsView } from './reports-view'
import { MonitoringView } from './monitoring-view'
import { SettingsView } from './settings-view'

function StatusBar() {
  const serverInfo = useZPos((s) => s.serverInfo)
  const currentShift = useZPos((s) => s.currentShift)
  const devices = useZPos((s) => s.devices)
  const setView = useZPos((s) => s.setView)

  const online = devices.filter((d) => d.status === 'online').length
  return (
    <footer className="z-40 shrink-0 border-t border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[11px] text-zinc-400">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-zinc-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
            Server Lokal · {serverInfo?.address ?? 'zpos.local:7788'}
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            {online}/{devices.length} perangkat
          </span>
          <span className="hidden md:inline">SQLite · WAL</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('shift')} className="hidden font-medium hover:text-zinc-600 sm:inline">
            {currentShift ? 'Shift sedang berjalan' : 'Shift tidak aktif'}
          </button>
          <span className="font-mono">v{serverInfo?.version ?? '1.0.0'}</span>
        </div>
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
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 text-zinc-900">
      <NavTop />
      <main className="min-h-0 flex-1 overflow-y-auto">
        {!booted ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-zinc-900 font-mono text-xl font-bold text-white">
                z
              </span>
              <p className="text-xs font-medium text-zinc-400">Menyambung ke server lokal…</p>
            </div>
          </div>
        ) : (
          <>
            {view === 'dashboard' && <DashboardView />}
            {view === 'kasir' && <KasirView />}
            {view === 'produk' && <ProductsView />}
            {view === 'stok' && <StockView />}
            {view === 'pembelian' && <PurchasingView />}
            {view === 'pelanggan' && <CustomersView />}
            {view === 'karyawan' && <EmployeesView />}
            {view === 'promo' && <PromosView />}
            {view === 'outlet' && <OutletsView />}
            {view === 'transaksi' && <TransactionsView />}
            {view === 'shift' && <ShiftView />}
            {view === 'laporan' && <ReportsView />}
            {view === 'monitoring' && <MonitoringView />}
            {view === 'pengaturan' && <SettingsView />}
          </>
        )}
      </main>
      <StatusBar />
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
