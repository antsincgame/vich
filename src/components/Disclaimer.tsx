import { useI18n } from '../i18n/I18nContext'
import type { StringKey } from '../i18n/en'

const MAP = {
  short: 'disclaimer.short',
  lab: 'disclaimer.lab',
  ai: 'disclaimer.ai',
} as const satisfies Record<string, StringKey>

export function Disclaimer({ variant = 'short' }: { variant?: keyof typeof MAP }) {
  const { t } = useI18n()
  return (
    <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
      <span aria-hidden>⚠ </span>
      {t(MAP[variant])}
    </div>
  )
}
