import { useEffect, type ReactNode } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppStoreProvider, useApp } from './state/AppStore'
import { I18nProvider } from './i18n/I18nContext'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Lab from './pages/Lab'
import Copilot from './pages/Copilot'
import Collaborate from './pages/Collaborate'
import Monitoring from './pages/Monitoring'
import Research from './pages/Research'
import Settings from './pages/Settings'

function ThemeApplier({ children }: { children: ReactNode }) {
  const { data } = useApp()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.theme === 'dark')
  }, [data.theme])
  return <>{children}</>
}

export default function App() {
  return (
    <AppStoreProvider>
      <I18nProvider>
        <ThemeApplier>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="lab" element={<Lab />} />
                <Route path="copilot" element={<Copilot />} />
                <Route path="collaborate" element={<Collaborate />} />
                <Route path="monitoring" element={<Monitoring />} />
                <Route path="research" element={<Research />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </HashRouter>
        </ThemeApplier>
      </I18nProvider>
    </AppStoreProvider>
  )
}
