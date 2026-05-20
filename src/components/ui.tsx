import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type Tone = 'good' | 'warn' | 'bad' | 'muted' | 'info'

const toneClasses: Record<Tone, string> = {
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  bad: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  muted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  info: 'bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-100',
}

export function Badge({ tone = 'muted', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  )
}

export function Section({
  title,
  desc,
  actions,
  children,
}: {
  title?: ReactNode
  desc?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-6">
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {desc && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{desc}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

type BtnVariant = 'primary' | 'subtle' | 'ghost' | 'danger'

const btn: Record<BtnVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  subtle:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

export function Button({
  variant = 'subtle',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${btn[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800'
