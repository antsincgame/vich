import type { ReactNode } from 'react'
import { Card } from './ui'

export function StatCard({
  label,
  value,
  sub,
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1.5">{sub}</div>}
    </Card>
  )
}
