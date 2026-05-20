import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../lib/storage'
import type { AppData } from '../lib/types'

const STORAGE_KEY = 'hivlab.data.v1'

// Seed candidates use illustrative, rounded pharmacology parameters for teaching —
// they are not exact clinical values.
export const DEFAULT_DATA: AppData = {
  version: 1,
  lang: 'ru',
  theme: 'light',
  ai: {
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
    apiKey: '',
    temperature: 0.4,
  },
  candidates: [
    {
      id: 'seed-insti',
      name: 'INSTI (dolutegravir-like)',
      drugClass: 'INSTI',
      target: 'infection',
      ic50_nM: 150,
      hill: 1.3,
      emax: 0.997,
      doseMg: 50,
      ka_perH: 1.2,
      ke_perH: 0.05,
      vd_L: 17,
      intervalH: 24,
      notes: 'Illustrative parameters',
    },
    {
      id: 'seed-pi',
      name: 'PI (darunavir-like)',
      drugClass: 'PI',
      target: 'production',
      ic50_nM: 5,
      hill: 2,
      emax: 0.997,
      doseMg: 800,
      ka_perH: 1.0,
      ke_perH: 0.046,
      vd_L: 130,
      intervalH: 24,
      notes: 'Illustrative parameters (boosted)',
    },
    {
      id: 'seed-capsid',
      name: 'Capsid inhibitor (lenacapavir-like)',
      drugClass: 'CapsidInhibitor',
      target: 'production',
      ic50_nM: 0.05,
      hill: 2.5,
      emax: 0.999,
      doseMg: 300,
      ka_perH: 0.2,
      ke_perH: 0.0025,
      vd_L: 80,
      intervalH: 24,
      notes: 'Illustrative; real dosing is subcutaneous twice-yearly',
    },
  ],
  simResults: [],
  labs: [],
  meds: [],
  doses: [],
  appointments: [],
}

interface AppCtx {
  data: AppData
  update: (patch: Partial<AppData>) => void
  replace: (data: AppData) => void
  reset: () => void
}

const Ctx = createContext<AppCtx | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<AppData>(STORAGE_KEY, DEFAULT_DATA)

  const value = useMemo<AppCtx>(
    () => ({
      data,
      update: (patch) => setData((prev) => ({ ...prev, ...patch })),
      replace: (next) => setData(next),
      reset: () => setData({ ...DEFAULT_DATA }),
    }),
    [data, setData],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppStoreProvider')
  return v
}
