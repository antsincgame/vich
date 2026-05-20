import { useI18n } from '../i18n/I18nContext'
import type { Lang } from '../lib/types'

const LANGS: Lang[] = ['ru', 'en']

export function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-600">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 font-medium ${
            lang === l
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
