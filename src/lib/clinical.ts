import type { Bilingual } from './types'

// Reference ranges below are general educational thresholds drawn from public
// guidance (CDC/WHO; PARTNER/PARTNER2/HPTN052 for U=U). They are NOT personal
// medical advice — interpretation belongs with a clinician.

export type VLStatus = 'undetectable' | 'suppressed' | 'detectable' | 'unknown'

export function viralLoadStatus(vl?: number): VLStatus {
  if (vl == null || Number.isNaN(vl)) return 'unknown'
  if (vl < 50) return 'undetectable'
  if (vl < 200) return 'suppressed'
  return 'detectable'
}

export const VL_LABEL: Record<VLStatus, Bilingual> = {
  undetectable: { ru: 'Неопределяемая (<50)', en: 'Undetectable (<50)' },
  suppressed: { ru: 'Подавлена · U=U (<200)', en: 'Suppressed · U=U (<200)' },
  detectable: { ru: 'Определяемая (≥200)', en: 'Detectable (≥200)' },
  unknown: { ru: 'Нет данных', en: 'No data' },
}

export const VL_TONE: Record<VLStatus, 'good' | 'warn' | 'bad' | 'muted'> = {
  undetectable: 'good',
  suppressed: 'good',
  detectable: 'bad',
  unknown: 'muted',
}

export type CD4Status = 'normal' | 'reduced' | 'low' | 'unknown'

export function cd4Status(cd4?: number): CD4Status {
  if (cd4 == null || Number.isNaN(cd4)) return 'unknown'
  if (cd4 >= 500) return 'normal'
  if (cd4 >= 200) return 'reduced'
  return 'low'
}

export const CD4_LABEL: Record<CD4Status, Bilingual> = {
  normal: { ru: 'В норме (≥500)', en: 'Normal (≥500)' },
  reduced: { ru: 'Снижен (200–499)', en: 'Reduced (200–499)' },
  low: { ru: 'Низкий, высокий риск (<200)', en: 'Low, high risk (<200)' },
  unknown: { ru: 'Нет данных', en: 'No data' },
}

export const CD4_TONE: Record<CD4Status, 'good' | 'warn' | 'bad' | 'muted'> = {
  normal: 'good',
  reduced: 'warn',
  low: 'bad',
  unknown: 'muted',
}
