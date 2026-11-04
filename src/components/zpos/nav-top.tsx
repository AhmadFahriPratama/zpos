'use client'

import { useEffect, useState } from 'react'
import { useZPos, type View } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Activity, BarChart3, Boxes, ChevronDown, Clock, LayoutDashboard, Package,
  ReceiptText, Settings, ShoppingCart, UserRound,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusDot } from './ui-bits'

const NAV: Array<{ id: View; label: string; icon: typeof ShoppingCart }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kasir', label: 'Kasir', icon: ShoppingCart },
  { id: 'produk', label: 'Produk', icon: Package },
  { id: 'stok', label: 'Stok', icon: Boxes },
  { id: 'transaksi', label: 'Transaksi', icon: ReceiptText },
  { id: 'shift', label: 'Shift', icon: Clock },
  { id: 'laporan', label: 'Laporan', icon: BarChart3 },
  { id: 'monitoring', label: 'Server', icon: Activity },
  { id: 'pengaturan', label: 'Setelan', icon: Settings },
]

const CASHIERS = ['Sari', 'Dewi', 'Rio']

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="hidden text-right lg:block">
      <p className="font-mono text-sm font-semibold tabular-nums leading-none text-zinc-900">
        {now ? now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--.--.--'}
      </p>
      <p className="mt-1 text-[10px] leading-none text-zinc-400">
        {now
          ? now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : ''}
      </p>
    </div>
  )
}

export function NavTop() {
  const view = useZPos((s) => s.view)
  const setView = useZPos((s) => s.setView)
  const cashier = useZPos((s) => s.cashier)
  const setCashier = useZPos((s) => s.setCashier)
  const currentShift = useZPos((s) => s.currentShift)
  const storeName = useZPos((s) => s.settings?.storeName)

  return (
    <header className="z-40 shrink-0 border-b border-zinc-200 bg-white">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Brand */}
        <button
          onClick={() => setView('dashboard')}
          className="flex shrink-0 items-center gap-2.5 focus:outline-none"
          aria-label="zPos — ke dashboard"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 font-mono text-lg font-bold leading-none text-white">
            z
          </span>
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span className="text-[15px] font-bold tracking-tight text-zinc-900">zPos</span>
            <span className="mt-1 max-w-[120px] truncate text-[10px] font-medium text-zinc-400">
              {storeName ?? 'Point of Sale'}
            </span>
          </span>
        </button>

        <span className="hidden h-6 w-px bg-zinc-200 md:block" aria-hidden="true" />

        {/* Navigasi utama — di atas */}
        <nav aria-label="Navigasi utama" className="zpos-scroll flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors sm:px-3',
                  active
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span className={cn('hidden md:inline', item.id === 'dashboard' && 'hidden xl:inline')}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Kanan: status shift, jam, kasir */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setView('shift')}
            className={cn(
              'hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors sm:flex',
              currentShift
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
            )}
          >
            <StatusDot status={currentShift ? 'online' : 'offline'} />
            {currentShift ? 'Shift Aktif' : 'Shift Tutup'}
          </button>

          <LiveClock />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-zinc-200 py-1 pl-1 pr-2 transition-colors hover:bg-zinc-50" aria-label="Ganti kasir">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-[11px] font-bold text-white">
                  {cashier.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden text-xs font-semibold text-zinc-700 lg:inline">{cashier}</span>
                <ChevronDown className="hidden h-3 w-3 text-zinc-400 lg:inline" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-zinc-500">
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Login kasir (demo)
              </DropdownMenuLabel>
              {CASHIERS.map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setCashier(c)}
                  className={cn('text-sm', cashier === c && 'bg-zinc-100 font-semibold')}
                >
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
