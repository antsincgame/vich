export type Lang = 'ru' | 'en'

export interface Bilingual {
  ru: string
  en: string
}

// ---------- Experimental lab ----------

export type DrugClass =
  | 'NRTI'
  | 'NNRTI'
  | 'INSTI'
  | 'PI'
  | 'EntryInhibitor'
  | 'CapsidInhibitor'
  | 'Other'

/**
 * Which term of the viral-dynamics model a mechanism modulates.
 * - "infection": entry / reverse-transcription blockers reduce new infections (eps_RT)
 * - "production": protease / maturation blockers reduce infectious virion output (eps_PI)
 */
export type MechanismTarget = 'infection' | 'production'

export interface Candidate {
  id: string
  name: string
  drugClass: DrugClass
  target: MechanismTarget
  ic50_nM: number
  hill: number
  emax: number // 0..1
  // one-compartment oral PK
  doseMg: number
  ka_perH: number
  ke_perH: number
  vd_L: number
  intervalH: number
  notes?: string
}

export type SimTemplateId = 'viral-dynamics' | 'dose-response' | 'pk' | 'pk-pd-viral'

export interface SimSeriesPoint {
  t: number
  [series: string]: number
}

export interface SimResult {
  id: string
  label: string
  candidateId?: string
  template: SimTemplateId
  createdISO: string
  params: Record<string, number>
  series: SimSeriesPoint[]
  summary: Record<string, number | string>
  rCode: string
}

// ---------- Health monitoring ----------

export interface LabEntry {
  id: string
  dateISO: string
  viralLoad?: number // copies/mL
  cd4?: number // cells/mm^3
  cd4cd8?: number
  weightKg?: number
  note?: string
}

export interface Medication {
  id: string
  name: string
  dose?: string
  timesPerDay: number
  startedISO: string
  active: boolean
}

export interface DoseLog {
  id: string
  medId: string
  dateISO: string // yyyy-mm-dd
  status: 'taken' | 'missed'
}

export interface Appointment {
  id: string
  dateISO: string
  title: string
  location?: string
  note?: string
}

// ---------- Settings & root state ----------

export interface AISettings {
  baseUrl: string
  model: string
  apiKey: string
  temperature: number
}

export interface AppData {
  version: number
  lang: Lang
  theme: 'light' | 'dark'
  candidates: Candidate[]
  simResults: SimResult[]
  labs: LabEntry[]
  meds: Medication[]
  doses: DoseLog[]
  appointments: Appointment[]
  ai: AISettings
}
