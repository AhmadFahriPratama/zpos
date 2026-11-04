'use client'

import { cn } from '@/lib/utils'
import { rupiah, angka, methodLabel } from '@/lib/format'
import type { Stats } from '@/lib/zpos-types'

/* ============ Grafik batang penjualan ============ */
export function RevenueBars({
  data, height = 190,
}: {
  data: Stats['series']
  height?: number
}) {
  const max = Math.max(1, ...data.map((d) => d.revenue))
  return (
    <div>
      <div className="relative flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {/* garis grid */}
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-zinc-100"
            style={{ bottom: `${p}%` }}
            aria-hidden="true"
          />
        ))}
        {data.map((d, i) => {
          const h = d.revenue > 0 ? Math.max(4, Math.round((d.revenue / max) * 100)) : 2
          const isLast = i === data.length - 1
          const isMax = d.revenue === max && d.revenue > 0
          return (
            <div key={d.date} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <div
                title={`${d.label}, ${d.dayNum} — ${rupiah(d.revenue)} (${d.count} transaksi)`}
                style={{ height: `${h}%` }}
                className={cn(
                  'w-full max-w-9 rounded-t-md transition-colors',
                  isLast || isMax ? 'bg-emerald-500' : 'bg-zinc-200 group-hover:bg-zinc-800'
                )}
              />
              <span
                className={cn(
                  'pointer-events-none absolute -top-5 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100',
                  isLast && 'opacity-100'
                )}
              >
                {d.revenue > 0 ? `${Math.round(d.revenue / 1000)}rb` : '—'}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <div key={d.date} className="min-w-0 flex-1 text-center">
            <p className={cn('text-[10px] font-semibold leading-none', i === data.length - 1 ? 'text-emerald-700' : 'text-zinc-400')}>
              {d.dayNum}
            </p>
            <p className="mt-0.5 text-[9px] leading-none text-zinc-300">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ Grafik batang laba ============ */
export function ProfitBars({
  data, height = 190,
}: {
  data: Stats['profitSeries']
  height?: number
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.profit, d.revenue)))
  return (
    <div>
      <div className="relative flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-zinc-100"
            style={{ bottom: `${p}%` }}
            aria-hidden="true"
          />
        ))}
        {data.map((d, i) => {
          const hp = d.profit > 0 ? Math.max(4, Math.round((d.profit / max) * 100)) : 2
          const hr = d.revenue > 0 ? Math.max(6, Math.round((d.revenue / max) * 100)) : 2
          const isLast = i === data.length - 1
          return (
            <div key={d.date} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <div className="relative flex h-full w-full max-w-9 items-end justify-center">
                {/* omzet (belakang, abu) */}
                <div
                  title={`${d.label}, ${d.dayNum} — Omzet ${rupiah(d.revenue)} · Laba ${rupiah(d.profit)}`}
                  style={{ height: `${hr}%` }}
                  className="absolute bottom-0 w-full rounded-t-md bg-zinc-100 transition-colors group-hover:bg-zinc-200"
                />
                {/* laba (depan, emerald) */}
                <div
                  style={{ height: `${hp}%` }}
                  className={cn(
                    'relative z-10 w-1/2 rounded-t-md transition-colors',
                    isLast ? 'bg-emerald-500' : 'bg-emerald-300 group-hover:bg-emerald-500'
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <div key={d.date} className="min-w-0 flex-1 text-center">
            <p className={cn('text-[10px] font-semibold leading-none', i === data.length - 1 ? 'text-emerald-700' : 'text-zinc-400')}>
              {d.dayNum}
            </p>
            <p className="mt-0.5 text-[9px] leading-none text-zinc-300">{d.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] font-semibold text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-zinc-200" aria-hidden="true" /> Omzet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-400" aria-hidden="true" /> Laba Kotor
        </span>
      </div>
    </div>
  )
}

/* ============ Donut metode pembayaran ============ */
const METHOD_COLORS: Record<string, string> = {
  cash: '#18181b',
  qris: '#10b981',
  card: '#f59e0b',
  transfer: '#14b8a6',
}

export function DonutMethod({ data }: { data: Stats['methodBreakdown'] }) {
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const grand = sorted.reduce((a, b) => a + b.total, 0)
  const R = 52
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label="Diagram metode pembayaran">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f4f4f5" strokeWidth="16" />
        {grand > 0 &&
          sorted.map((m) => {
            const frac = m.total / grand
            const dash = frac * C
            const el = (
              <circle
                key={m.method}
                cx="70" cy="70" r={R} fill="none"
                stroke={METHOD_COLORS[m.method] ?? '#a1a1aa'}
                strokeWidth="16"
                strokeDasharray={`${Math.max(dash - 2, 1)} ${C - dash + 2}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return el
          })}
      </svg>
      <div className="min-w-0 flex-1 space-y-2.5">
        {sorted.length === 0 && <p className="text-xs text-zinc-400">Belum ada data.</p>}
        {sorted.map((m) => {
          const pct = grand > 0 ? Math.round((m.total / grand) * 100) : 0
          return (
            <div key={m.method} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: METHOD_COLORS[m.method] ?? '#a1a1aa' }}
                  aria-hidden="true"
                />
                <span className="truncate font-semibold text-zinc-700">{methodLabel(m.method)}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="font-bold tabular-nums text-zinc-900">{pct}%</span>
                <span className="ml-1.5 hidden text-zinc-400 sm:inline">{rupiah(m.total)}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============ Daftar produk terlaris ============ */
export function TopProductList({ items }: { items: Stats['topProducts'] }) {
  const max = Math.max(1, ...items.map((p) => p.qty))
  return (
    <ol className="space-y-3">
      {items.map((p, i) => (
        <li key={p.productId}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                  i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                )}
              >
                {i + 1}
              </span>
              <span className="truncate font-semibold text-zinc-800">{p.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-zinc-400">
              {angka(p.qty)} · {rupiah(p.revenue)}
            </span>
          </div>
          <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn('h-full rounded-full', i === 0 ? 'bg-emerald-500' : 'bg-zinc-300')}
              style={{ width: `${Math.round((p.qty / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
      {items.length === 0 && <p className="text-xs text-zinc-400">Belum ada penjualan.</p>}
    </ol>
  )
}
