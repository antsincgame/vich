import type { WebR as WebRClass } from 'webr'
import type { SimSeriesPoint } from './types'

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error'

let instance: WebRClass | null = null
let initPromise: Promise<WebRClass> | null = null
let status: EngineStatus = 'idle'
const listeners = new Set<(s: EngineStatus) => void>()

function setStatus(s: EngineStatus) {
  status = s
  listeners.forEach((l) => l(s))
}

export function getEngineStatus(): EngineStatus {
  return status
}

export function onEngineStatus(cb: (s: EngineStatus) => void): () => void {
  listeners.add(cb)
  cb(status)
  return () => {
    listeners.delete(cb)
  }
}

/**
 * Lazily start WebR. PostMessage channel is used so no COOP/COEP headers are
 * required — this works on plain static hosting (GitHub Pages). The R
 * WebAssembly binaries are fetched from the WebR CDN on first load.
 */
export async function initWebR(): Promise<WebRClass> {
  if (instance) return instance
  if (initPromise) return initPromise
  setStatus('loading')
  initPromise = (async () => {
    const { WebR, ChannelType } = await import('webr')
    const webR = new WebR({ channelType: ChannelType.PostMessage })
    await webR.init()
    instance = webR
    setStatus('ready')
    return webR
  })()
  try {
    return await initPromise
  } catch (err) {
    setStatus('error')
    initPromise = null
    throw err
  }
}

// Convert WebR's toJs() tree into plain JS objects / arrays.
function rToJs(node: unknown): unknown {
  if (node == null || typeof node !== 'object') return node ?? null
  const n = node as { type: string; names?: (string | null)[] | null; values?: unknown[]; value?: unknown; printname?: string | null }
  switch (n.type) {
    case 'null':
      return null
    case 'string':
      return n.value ?? null
    case 'symbol':
      return n.printname ?? null
    case 'list':
    case 'pairlist':
    case 'environment': {
      const values = (n.values ?? []).map((v) =>
        v && typeof v === 'object' && 'type' in (v as object) ? rToJs(v) : v,
      )
      if (n.names) {
        const obj: Record<string, unknown> = {}
        n.names.forEach((nm, i) => {
          if (nm != null) obj[nm] = values[i]
        })
        return obj
      }
      return values
    }
    default:
      return n.values ?? []
  }
}

export interface RunResult {
  cols: string[]
  series: Record<string, number[]>
  summary: Record<string, number | string>
  points: SimSeriesPoint[]
}

/** Run a simulation script that returns list(cols, series, summary). */
export async function runSimulation(code: string): Promise<RunResult> {
  const webR = await initWebR()
  const robj = await webR.evalR(code)
  let parsed: Record<string, unknown>
  try {
    parsed = rToJs(await robj.toJs()) as Record<string, unknown>
  } finally {
    await webR.destroy(robj)
  }

  const cols = (parsed.cols as string[]) ?? []
  const series = (parsed.series as Record<string, number[]>) ?? {}
  const x = cols[0]
  const len = x ? series[x]?.length ?? 0 : 0

  const points: SimSeriesPoint[] = []
  for (let i = 0; i < len; i++) {
    const pt: SimSeriesPoint = { t: series[x][i] }
    for (let c = 1; c < cols.length; c++) pt[cols[c]] = series[cols[c]][i]
    points.push(pt)
  }

  const summary: Record<string, number | string> = {}
  for (const [k, v] of Object.entries((parsed.summary as Record<string, unknown>) ?? {})) {
    summary[k] = Array.isArray(v) ? (v[0] as number | string) : (v as number | string)
  }

  return { cols, series, summary, points }
}

/** Run arbitrary R for the console and return captured stdout/stderr text. */
export async function runRConsole(code: string): Promise<string> {
  const webR = await initWebR()
  const { output } = await webR.globalShelter.captureR(code)
  await webR.globalShelter.purge()
  return output
    .filter((o: { type: string; data: unknown }) => o.type === 'stdout' || o.type === 'stderr')
    .map((o: { type: string; data: unknown }) => String(o.data))
    .join('\n')
}
