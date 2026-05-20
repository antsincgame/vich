import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { en, type StringKey } from './en'
import { ru } from './ru'
import type { Bilingual, Lang } from '../lib/types'
import { useApp } from '../state/AppStore'

const DICTS: Record<Lang, Record<StringKey, string>> = { en, ru }

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey) => string
  bi: (b: Bilingual) => string
}

const Ctx = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data, update } = useApp()
  const lang = data.lang

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (l) => update({ lang: l }),
      t: (key) => DICTS[lang][key] ?? DICTS.en[key] ?? key,
      bi: (b) => b[lang],
    }),
    [lang, update],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18nValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n must be used within I18nProvider')
  return v
}
