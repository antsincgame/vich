export function fmt(n: unknown, digits = 2): string {
  if (typeof n === 'string') return n
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs >= 1e5 || abs < 1e-3)) return n.toExponential(2)
  return n.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
