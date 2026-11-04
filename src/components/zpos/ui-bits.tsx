'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type LucideIcon, Banknote, QrCode, CreditCard, Landmark } from 'lucide-react'

const TONE_MAP = {
  default: 'text-zinc-700 bg-zinc-100',
  emerald: 'text-emerald-700 bg-emerald-100',
  amber: 'text-amber-700 bg-amber-100',
  rose: 'text-rose-700 bg-rose-100',
} as const

export function StatCard({
  label, value, sub, icon: Icon, tone = 'default',
}: {
  label: string
  value: string
  sub?: React.ReactNode
  icon: LucideIcon
  tone?: keyof typeof TONE_MAP
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
          <p className="mt-1.5 truncate text-xl font-bold tracking-tight tabular-nums text-zinc-900 sm:text-2xl">
            {value}
          </p>
          {sub && <p className="mt-1 truncate text-xs text-zinc-500">{sub}</p>}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TONE_MAP[tone])}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

export function StatusDot({ status }: { status: 'online' | 'offline' | string }) {
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      {status === 'online' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span
        className={cn(
          'relative inline-flex h-2.5 w-2.5 rounded-full',
          status === 'online' ? 'bg-emerald-500' : 'bg-zinc-300'
        )}
      />
    </span>
  )
}

export function EmptyState({
  icon: Icon, title, desc,
}: {
  icon: LucideIcon
  title: string
  desc?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      {desc && <p className="mt-1 max-w-xs text-xs text-zinc-500">{desc}</p>}
    </div>
  )
}

export function ViewHeader({
  title, desc, children,
}: {
  title: string
  desc?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-zinc-500">{desc}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

export const METHOD_META: Record<string, { label: string; icon: LucideIcon; dot: string; chip: string }> = {
  cash: { label: 'Tunai', icon: Banknote, dot: 'bg-zinc-900', chip: 'bg-zinc-100 text-zinc-700' },
  qris: { label: 'QRIS', icon: QrCode, dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  card: { label: 'Kartu Debit', icon: CreditCard, dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  transfer: { label: 'Transfer', icon: Landmark, dot: 'bg-teal-500', chip: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' },
}

export function MethodChip({ method, className }: { method: string; className?: string }) {
  const meta = METHOD_META[method] ?? { label: method, icon: Banknote, dot: 'bg-zinc-400', chip: 'bg-zinc-100 text-zinc-600' }
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', meta.chip, className)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

/** Gambar produk dengan fallback inisial bila gagal memuat / tidak ada foto */
export function ProductThumb({
  src, name, className,
}: {
  src?: string | null
  name: string
  className?: string
}) {
  const [err, setErr] = useState(false)
  const initials = name
    .replace(/[^A-Za-z0-9\s]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (!src || err) {
    return (
      <div className={cn('flex items-center justify-center bg-zinc-100 text-zinc-400', className)} aria-hidden="true">
        <span className="text-sm font-bold tracking-wide">{initials || '?'}</span>
      </div>
    )
  }
  return (
     
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setErr(true)}
      className={cn('object-cover', className)}
    />
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500">
      {children}
    </kbd>
  )
}
