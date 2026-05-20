import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SimSeriesPoint } from '../lib/types'
import { fmt } from '../lib/format'

export interface ChartLine {
  dataKey: string
  name: string
  color: string
  axis?: 'left' | 'right'
}

export const PALETTE = ['#2f6fed', '#e0457b', '#0ea5a4', '#f59e0b', '#8b5cf6', '#16a34a']

export function SimChart({
  data,
  lines,
  xKey = 't',
  xLog = false,
  leftLog = false,
  rightLog = false,
}: {
  data: SimSeriesPoint[]
  lines: ChartLine[]
  xKey?: string
  xLog?: boolean
  leftLog?: boolean
  rightLog?: boolean
}) {
  const hasRight = lines.some((l) => l.axis === 'right')

  // Log axes cannot plot non-positive values; clamp those to a small floor.
  const logKeys = new Set(
    lines.filter((l) => (l.axis === 'right' ? rightLog : leftLog)).map((l) => l.dataKey),
  )
  const plotData =
    logKeys.size || xLog
      ? data.map((d) => {
          const c: SimSeriesPoint = { ...d }
          // Floor log-axis values at 1 (e.g. viral load < 1 copy/mL ≈ undetectable)
          // so the axis spans clean decades instead of extending to ~1e-20.
          logKeys.forEach((k) => {
            if (typeof c[k] === 'number' && c[k] < 1) c[k] = 1
          })
          if (xLog && typeof c[xKey] === 'number' && c[xKey] <= 0) c[xKey] = 0.0001
          return c
        })
      : data

  return (
    <div className="h-72 w-full text-slate-600 dark:text-slate-300">
      <ResponsiveContainer>
        <LineChart data={plotData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis
            dataKey={xKey}
            type="number"
            scale={xLog ? 'log' : 'auto'}
            domain={xLog ? ['auto', 'auto'] : ['dataMin', 'dataMax']}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickFormatter={(v: number) => fmt(v, 1)}
            allowDataOverflow
          />
          <YAxis
            yAxisId="left"
            scale={leftLog ? 'log' : 'auto'}
            domain={leftLog ? ['auto', 'auto'] : ['auto', 'auto']}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickFormatter={(v: number) => fmt(v, 1)}
            width={54}
            allowDataOverflow
          />
          {hasRight && (
            <YAxis
              yAxisId="right"
              orientation="right"
              scale={rightLog ? 'log' : 'auto'}
              domain={rightLog ? ['auto', 'auto'] : ['auto', 'auto']}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              tickFormatter={(v: number) => fmt(v, 1)}
              width={60}
              allowDataOverflow
            />
          )}
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v: number | string) => fmt(v)}
            labelFormatter={(l: number | string) => fmt(l)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line
              key={l.dataKey}
              yAxisId={l.axis ?? 'left'}
              dataKey={l.dataKey}
              name={l.name}
              stroke={l.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
