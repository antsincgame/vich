import { Link } from 'react-router-dom'
import { useApp } from '../state/AppStore'
import { useI18n } from '../i18n/I18nContext'
import { StatCard } from '../components/StatCard'
import { Badge, Button, Card } from '../components/ui'
import { CD4_LABEL, CD4_TONE, cd4Status, VL_LABEL, VL_TONE, viralLoadStatus } from '../lib/clinical'
import { fmt } from '../lib/format'

export default function Dashboard() {
  const { data } = useApp()
  const { t, bi } = useI18n()

  const byDateDesc = [...data.labs].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  const lastVL = byDateDesc.find((l) => l.viralLoad != null)?.viralLoad
  const lastCD4 = byDateDesc.find((l) => l.cd4 != null)?.cd4
  const vs = viralLoadStatus(lastVL)
  const cs = cd4Status(lastCD4)

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('app.title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t('dash.intro')}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('dash.latestVL')}
          value={lastVL != null ? fmt(lastVL) : '—'}
          sub={<Badge tone={VL_TONE[vs]}>{bi(VL_LABEL[vs])}</Badge>}
        />
        <StatCard
          label={t('dash.latestCD4')}
          value={lastCD4 != null ? fmt(lastCD4) : '—'}
          sub={<Badge tone={CD4_TONE[cs]}>{bi(CD4_LABEL[cs])}</Badge>}
        />
        <StatCard label={t('dash.candidates')} value={data.candidates.length} />
        <StatCard label={t('dash.sims')} value={data.simResults.length} />
      </div>

      <Card className="mt-5 border-brand-200 bg-brand-50 p-4 dark:border-brand-700/40 dark:bg-brand-700/10">
        <h2 className="font-semibold">{t('dash.honest.title')}</h2>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{t('dash.honest.body')}</p>
      </Card>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/lab">
          <Button variant="primary">{t('dash.goLab')}</Button>
        </Link>
        <Link to="/research">
          <Button variant="subtle">{t('dash.goResearch')}</Button>
        </Link>
      </div>
    </div>
  )
}
