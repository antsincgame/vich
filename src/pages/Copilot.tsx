import { Link } from 'react-router-dom'
import { useApp } from '../state/AppStore'
import { useI18n } from '../i18n/I18nContext'
import { AIChat } from '../components/AIChat'
import { Card } from '../components/ui'
import { Disclaimer } from '../components/Disclaimer'

export default function Copilot() {
  const { data } = useApp()
  const { t } = useI18n()
  const latestSim = data.simResults[data.simResults.length - 1]

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('ai.title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t('ai.intro')}</p>
      <div className="mt-3">
        <Disclaimer variant="ai" />
      </div>

      <Card className="mt-4 flex h-[68vh] flex-col p-4">
        <AIChat latestSim={latestSim} />
      </Card>

      <details className="mt-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
        <summary className="cursor-pointer font-medium">{t('ai.setup.title')}</summary>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('ai.setup.body')}</p>
        <p className="mt-2">
          <Link to="/settings" className="text-brand-600 hover:underline dark:text-brand-100">
            → {t('nav.settings')}
          </Link>
        </p>
      </details>
    </div>
  )
}
