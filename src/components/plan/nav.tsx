'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'arsitektur', label: 'Arsitektur' },
  { id: 'teknologi', label: 'Teknologi' },
  { id: 'database', label: 'Database' },
  { id: 'fitur', label: 'Fitur' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'keamanan', label: 'Keamanan' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'risiko', label: 'Risiko' },
  { id: 'biaya', label: 'Biaya' },
]

export function PlanNav() {
  const [active, setActive] = useState<string>('ringkasan')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 }
    )

    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      aria-label="Navigasi bagian rencana"
      className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="plan-scroll flex gap-1 overflow-x-auto py-2" role="tablist">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm',
                active === item.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              )}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
