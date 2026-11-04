'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, tanggalWaktu, jamWaktu } from '@/lib/format'
import type { Sale } from '@/lib/zpos-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard, ViewHeader, StatusDot } from './ui-bits'
import {
  Activity, CircleCheck, Cpu, HardDrive, Monitor, Network, Printer,
  RefreshCw, Send, Server, Smartphone, TriangleAlert, Users,
} from 'lucide-react'

export function MonitoringView() {
  const devices = useZPos((s) => s.devices)
  const serverInfo = useZPos((s) => s.serverInfo)
  const products = useZPos((s) => s.products)
  const currentShift = useZPos((s) => s.currentShift)

  const [recent, setRecent] = useState<Sale[]>([])
  const [uptime, setUptime] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/sales?days=1&limit=12')
        if (r.ok) setRecent((await r.json()) as Sale[])
      } catch {
        /* diamkan — feed boleh kosong */
      }
    }
    void load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const tick = () => {
      if (!serverInfo) return
      const ms = Date.now() - new Date(serverInfo.startedAt).getTime()
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setUptime(`${h} jam ${m} mnt ${s} dtk`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [serverInfo])

  const clients = devices.filter((d) => d.kind === 'client')
  const peripherals = devices.filter((d) => d.kind === 'peripheral')
  const lowStock = products.filter((p) => p.isActive && p.stock <= p.minStock)
  const onlineCount = devices.filter((d) => d.status === 'online').length
  const todayRevenue = recent.reduce((a, b) => a + b.total, 0)

  const testPrint = (name: string) => {
    toast.success(`Tes cetak dikirim ke ${name}`, { description: 'ESC/POS · 58 kolom · dummy struk' })
  }

  return (
    <div>
      <ViewHeader
        title="Monitoring Server"
        desc="Pusat kendali zPos Server — perangkat, periferal, dan aktivitas realtime."
      >
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-zinc-200 bg-white"
          onClick={() => {
            toast.promise(new Promise((r) => setTimeout(r, 600)), {
              loading: 'Menyegarkan status perangkat…',
              success: 'Status diperbarui',
              error: 'Gagal memperbarui',
            })
          }}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Refresh
        </Button>
      </ViewHeader>

      {/* Kartu server */}
      <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Server className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold">{serverInfo?.name ?? 'zPos Server'} <span className="font-normal text-zinc-400">v{serverInfo?.version}</span></p>
              <p className="font-mono text-[11px] text-zinc-400">{serverInfo?.address} · {serverInfo?.ip}</p>
            </div>
          </div>
          <Badge className="gap-1.5 border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-950/60">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
            RUNNING · uptime {uptime}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-px bg-zinc-800 sm:grid-cols-4">
          {[
            { icon: Cpu, label: 'Mode', value: 'Server Lokal' },
            { icon: HardDrive, label: 'Database', value: 'SQLite · WAL' },
            { icon: Network, label: 'Discovery', value: 'mDNS aktif' },
            { icon: Users, label: 'Perangkat Online', value: `${onlineCount}/${devices.length}` },
          ].map((x) => (
            <div key={x.label} className="bg-zinc-900 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
                <x.icon className="h-3 w-3" aria-hidden="true" /> {x.label}
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold">{x.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kartu ringkas */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Penjualan Hari Ini" value={rupiah(todayRevenue)} sub={`${recent.length} transaksi terakhir`} icon={Activity} tone="emerald" />
        <StatCard label="Client Terhubung" value={`${clients.filter((d) => d.status === 'online').length}/${clients.length}`} icon={Monitor} />
        <StatCard
          label="Printer Periferal"
          value={`${peripherals.filter((p) => p.status === 'online').length}/${peripherals.length}`}
          sub="siap cetak"
          icon={Printer}
          tone={peripherals.every((p) => p.status === 'online') ? 'default' : 'amber'}
        />
        <StatCard
          label="Alert Stok"
          value={String(lowStock.length)}
          sub={currentShift ? 'shift aktif' : 'shift tutup'}
          icon={TriangleAlert}
          tone={lowStock.length > 0 ? 'amber' : 'default'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Perangkat */}
        <div className="min-w-0 xl:col-span-3">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-bold text-zinc-900">Perangkat Terpasang</p>
              <span className="text-[10px] text-zinc-400">pairing QR + PIN</span>
            </div>
            <ul className="divide-y divide-zinc-100">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                      {d.kind === 'peripheral' ? <Printer className="h-4 w-4" aria-hidden="true" /> : <Smartphone className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-zinc-900">
                        {d.name}
                        <StatusDot status={d.isBlocked ? 'blocked' : d.status} />
                      </p>
                      <p className="truncate font-mono text-[11px] text-zinc-400">
                        {d.platform} · v{d.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          d.isBlocked
                            ? 'bg-rose-100 text-rose-700'
                            : d.status === 'online'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-zinc-100 text-zinc-400'
                        )}
                      >
                        {d.isBlocked ? 'Diblokir' : d.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                      <p className="mt-0.5 text-[10px] text-zinc-400">terlihat {tanggalWaktu(d.lastSeen)}</p>
                    </div>
                    {d.kind === 'peripheral' && d.status === 'online' && (
                      <Button variant="outline" size="sm" className="h-8 border-zinc-200 text-xs" onClick={() => testPrint(d.name)}>
                        <Send className="mr-1 h-3 w-3" aria-hidden="true" /> Tes
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feed aktivitas + alert */}
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
              <Activity className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <p className="text-sm font-bold text-zinc-900">Feed Aktivitas</p>
              <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" /> LIVE
              </span>
            </div>
            <div className="plan-scroll max-h-[300px] overflow-y-auto">
              {recent.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-zinc-400">Belum ada aktivitas hari ini.</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {recent.map((s) => (
                    <li key={s.id} className="flex items-start gap-2.5 px-4 py-2.5">
                      <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-700">
                          <span className="font-mono font-semibold">{s.invoiceNo}</span> — {rupiah(s.total)}
                          <span className="text-zinc-400"> · {s.cashierName}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {jamWaktu(s.createdAt)} · {s.items.length} item · {s.method === 'cash' ? 'Tunai' : s.method === 'qris' ? 'QRIS' : s.method === 'transfer' ? 'Transfer' : 'Kartu'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-100 px-4 py-3">
              <TriangleAlert className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <p className="text-sm font-bold text-amber-800">Notifikasi</p>
              <span className="ml-auto rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {lowStock.length + peripherals.filter((p) => p.status === 'offline').length}
              </span>
            </div>
            <ul className="divide-y divide-amber-100/70">
              {peripherals.filter((p) => p.status === 'offline').map((p) => (
                <li key={p.id} className="px-4 py-2.5 text-xs text-amber-900">
                  <span className="font-semibold">{p.name}</span> tidak merespons — periksa kabel/jaringan.
                </li>
              ))}
              {lowStock.slice(0, 4).map((p) => (
                <li key={p.id} className="px-4 py-2.5 text-xs text-amber-900">
                  Stok <span className="font-semibold">{p.name}</span> tinggal{' '}
                  <span className="font-mono font-bold">{p.stock} {p.unit}</span> (min. {p.minStock}).
                </li>
              ))}
              {lowStock.length === 0 && peripherals.every((p) => p.status === 'online') && (
                <li className="px-4 py-4 text-center text-xs text-emerald-700">
                  Semua sistem normal ✓
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
