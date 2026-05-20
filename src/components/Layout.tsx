import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import type { StringKey } from '../i18n/en'
import { LanguageToggle } from './LanguageToggle'
import { Disclaimer } from './Disclaimer'

const NAV: { to: string; key: StringKey }[] = [
  { to: '/', key: 'nav.dashboard' },
  { to: '/lab', key: 'nav.lab' },
  { to: '/copilot', key: 'nav.copilot' },
  { to: '/collaborate', key: 'nav.collaborate' },
  { to: '/monitoring', key: 'nav.monitoring' },
  { to: '/research', key: 'nav.research' },
  { to: '/settings', key: 'nav.settings' },
]

export function Layout() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2">
          <div className="mr-2 flex items-center gap-2">
            <span aria-hidden className="text-lg">
              🧬
            </span>
            <span className="font-semibold">{t('app.title')}</span>
          </div>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1 text-sm font-medium ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                {t(n.key)}
              </NavLink>
            ))}
          </nav>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4">
          <Disclaimer />
        </div>
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-slate-400">
        {t('app.tagline')}
      </footer>
    </div>
  )
}
