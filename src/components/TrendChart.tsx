import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmt } from '../lib/format'

export function TrendChart({
  data,
  color,
  name,
  log = false,
}: {
  data: { x: string; y: number }[]
  color: string
  name: string
  log?: boolean
}) {
  if (data.length === 0) return null
  // Log axis can't render non-positive values; floor them for display only.
  const plot = log ? data.map((d) => (d.y > 0 ? d : { ...d, y: 1 })) : data
  return (
    <div className="h-56 w-full text-slate-600 dark:text-slate-300">
      <ResponsiveContainer>
        <LineChart data={plot} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="x" tick={{ fontSize: 11, fill: 'currentColor' }} />
          <YAxis
            scale={log ? 'log' : 'auto'}
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickFormatter={(v: number) => fmt(v, 1)}
            width={54}
            allowDataOverflow
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v: number | string) => fmt(v)}
          />
          <Line
            dataKey="y"
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
