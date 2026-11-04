'use client'

import { useEffect, useState } from 'react'
import { useZPos, type View } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Activity, BarChart3, Boxes, Clock, Package, ShoppingCart, UserRound,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from './ui-bits'

const NAV: Array<{ id: View; label: string; icon: typeof ShoppingCart }> = [
  { id: 'kasir', label: 'Kasir', icon: ShoppingCart },
  { id: 'produk', label: 'Produk', icon: Package },
  { id: 'stok', label: 'Stok', icon: Boxes },
  { id: 'laporan', label: 'Laporan', icon: BarChart3 },
  { id: 'shift', label: 'Shift', icon: Clock },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
]

const CASHIERS = ['Sari', 'Budi', 'Owner']

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    const raf = requestAnimationFrame(tick)
    const t = setInterval(tick, 1000)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(t)
    }
  }, [])
  return (
    <div className="hidden text-right md:block">
      <p className="font-mono text-sm font-semibold tabular-nums text-zinc-900">
        {now ? now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
      </p>
      <p className="text-[10px] text-zinc-400">
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

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-3 sm:gap-4 sm:px-5">
        {/* Brand */}
        <button
          onClick={() => setView('kasir')}
          className="flex items-center gap-2.5 focus:outline-none"
          aria-label="zPos — kembali ke kasir"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 font-mono text-base font-bold text-white">
            z
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-bold tracking-tight text-zinc-900">zPos</span>
            <span className="text-[10px] font-medium text-zinc-400">Toko Maju Jaya</span>
          </span>
        </button>

        <span className="h-6 w-px bg-zinc-200" aria-hidden="true" />

        {/* Nav utama — di atas */}
        <nav aria-label="Navigasi utama" className="plan-scroll flex flex-1 items-center gap-0.5 overflow-x-auto">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3',
                view === item.id
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Kanan: jam, kasir, status shift, server */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LiveClock />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-zinc-200 py-1 pl-1 pr-2 transition-colors hover:bg-zinc-50">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="hidden text-xs font-semibold text-zinc-700 lg:inline">{cashier}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs text-zinc-500">Login kasir (demo)</DropdownMenuLabel>
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

          {currentShift ? (
            <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <StatusDot status="online" />
              Shift Aktif
            </Badge>
          ) : (
            <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
              Shift Tutup
            </Badge>
          )}
        </div>
      </div>
    </header>
  )
}
