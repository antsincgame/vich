import { useI18n } from '../i18n/I18nContext'
import { Badge, Card } from '../components/ui'
import { RESEARCH, type ResearchCategory } from '../data/research'
import type { StringKey } from '../i18n/en'

const CATEGORIES: { id: ResearchCategory; key: StringKey; tone: 'info' | 'good' | 'warn' }[] = [
  { id: 'cure', key: 'res.cat.cure', tone: 'info' },
  { id: 'treatment', key: 'res.cat.treatment', tone: 'good' },
  { id: 'prevention', key: 'res.cat.prevention', tone: 'warn' },
]

export default function Research() {
  const { t, bi } = useI18n()
  return (
    <div>
      <h1 className="text-2xl font-bold">{t('res.title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t('res.intro')}</p>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            {t(cat.key)}
            <Badge tone={cat.tone}>{RESEARCH.filter((r) => r.category === cat.id).length}</Badge>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {RESEARCH.filter((r) => r.category === cat.id).map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{bi(item.title)}</h3>
                  <Badge tone="muted">{item.reviewed}</Badge>
                </div>
                <div className="mt-1">
                  <Badge tone={cat.tone}>{bi(item.status)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{bi(item.body)}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {item.sources.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline dark:text-brand-100"
                    >
                      {t('res.source')}: {s.label} ↗
                    </a>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
