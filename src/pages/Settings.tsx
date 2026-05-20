import { useRef, useState } from 'react'
import { DEFAULT_DATA, useApp } from '../state/AppStore'
import { useI18n } from '../i18n/I18nContext'
import { Button, Card, Field, inputClass, Section } from '../components/ui'
import { Disclaimer } from '../components/Disclaimer'
import { exportData, importData } from '../lib/exportImport'
import { testConnection } from '../lib/ai'
import type { Lang } from '../lib/types'

export default function Settings() {
  const { data, update, replace, reset } = useApp()
  const { t, lang, setLang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [conn, setConn] = useState('')
  const [testing, setTesting] = useState(false)
  const [importErr, setImportErr] = useState('')

  async function test() {
    setTesting(true)
    setConn('')
    const r = await testConnection(data.ai)
    setConn(
      r.ok
        ? `${t('ai.ok')}${r.models?.length ? ': ' + r.models.slice(0, 5).join(', ') : ''}`
        : `${t('ai.fail')} (${r.error})`,
    )
    setTesting(false)
  }

  async function onImport(file: File) {
    setImportErr('')
    try {
      const parsed = await importData(file)
      replace({
        ...DEFAULT_DATA,
        ...parsed,
        ai: { ...DEFAULT_DATA.ai, ...(parsed.ai ?? {}) },
      })
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{t('set.title')}</h1>

      <Section title={t('set.language')}>
        <div className="inline-flex gap-2">
          {(['ru', 'en'] as Lang[]).map((l) => (
            <Button key={l} variant={lang === l ? 'primary' : 'subtle'} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </Button>
          ))}
        </div>
      </Section>

      <Section title={t('set.theme')}>
        <div className="inline-flex gap-2">
          <Button
            variant={data.theme === 'light' ? 'primary' : 'subtle'}
            onClick={() => update({ theme: 'light' })}
          >
            {t('set.theme.light')}
          </Button>
          <Button
            variant={data.theme === 'dark' ? 'primary' : 'subtle'}
            onClick={() => update({ theme: 'dark' })}
          >
            {t('set.theme.dark')}
          </Button>
        </div>
      </Section>

      <Section title={t('set.ai')}>
        <Card className="space-y-3 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('ai.setup.body')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('ai.baseUrl')}>
              <input
                className={inputClass}
                value={data.ai.baseUrl}
                onChange={(e) => update({ ai: { ...data.ai, baseUrl: e.target.value } })}
              />
            </Field>
            <Field label={t('ai.model')}>
              <input
                className={inputClass}
                value={data.ai.model}
                onChange={(e) => update({ ai: { ...data.ai, model: e.target.value } })}
              />
            </Field>
            <Field label={t('ai.temperature')}>
              <input
                type="number"
                step={0.1}
                min={0}
                max={2}
                className={inputClass}
                value={data.ai.temperature}
                onChange={(e) =>
                  update({ ai: { ...data.ai, temperature: Number(e.target.value) } })
                }
              />
            </Field>
            <Field label="API key" hint={t('common.optional')}>
              <input
                type="password"
                className={inputClass}
                value={data.ai.apiKey}
                onChange={(e) => update({ ai: { ...data.ai, apiKey: e.target.value } })}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="subtle" onClick={test} disabled={testing}>
              {testing ? t('ai.testing') : t('ai.test')}
            </Button>
            {conn && <span className="text-sm text-slate-600 dark:text-slate-300">{conn}</span>}
          </div>
        </Card>
      </Section>

      <Section title={t('set.data')}>
        <Card className="space-y-3 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('set.privacy')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" onClick={() => exportData(data)}>
              {t('set.export')}
            </Button>
            <Button variant="subtle" onClick={() => fileRef.current?.click()}>
              {t('set.import')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
                e.target.value = ''
              }}
            />
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm(t('set.clear.confirm'))) reset()
              }}
            >
              {t('set.clear')}
            </Button>
          </div>
          {importErr && <p className="text-xs text-rose-600 dark:text-rose-400">{importErr}</p>}
        </Card>
      </Section>

      <Section title={t('set.about')}>
        <Disclaimer />
      </Section>
    </div>
  )
}
