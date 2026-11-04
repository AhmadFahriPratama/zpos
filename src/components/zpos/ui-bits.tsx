'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

export function StatCard({
  label, value, sub, icon: Icon, tone = 'default',
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  tone?: 'default' | 'emerald' | 'amber' | 'rose'
}) {
  const toneMap = {
    default: 'text-zinc-900 bg-zinc-100',
    emerald: 'text-emerald-700 bg-emerald-100',
    amber: 'text-amber-700 bg-amber-100',
    rose: 'text-rose-700 bg-rose-100',
  } as const
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{value}</p>
          {sub && <p className="mt-1 truncate text-xs text-zinc-500">{sub}</p>}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneMap[tone])}>
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
