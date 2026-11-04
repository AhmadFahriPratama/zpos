import { cn } from '@/lib/utils'

interface SectionProps {
  id: string
  children: React.ReactNode
  className?: string
  tint?: boolean
}

export function Section({ id, children, className, tint }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 py-12 sm:py-16',
        tint && 'bg-zinc-50 dark:bg-zinc-900/40',
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  )
}

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description?: string
  icon?: React.ReactNode
}

export function SectionHeader({ eyebrow, title, description, icon }: SectionHeaderProps) {
  return (
    <div className="mb-8 max-w-3xl sm:mb-10">
      <div className="mb-3 flex items-center gap-2">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            {icon}
          </span>
        )}
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          {eyebrow}
        </span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          {description}
        </p>
      )}
    </div>
  )
}
