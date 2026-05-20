import type { AppData } from './types'

export function exportData(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hivlab-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<Partial<AppData>> {
  const text = await file.text()
  const parsed = JSON.parse(text) as unknown
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid backup file')
  }
  return parsed as Partial<AppData>
}
