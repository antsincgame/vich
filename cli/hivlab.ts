/**
 * HIV Cure Research Lab — command-line interface.
 *
 * Runs the same R simulation models as the web app (src/lib/rmodels.ts) headless
 * via WebR in Node. Useful for scripting, comparing candidates, or CI checks.
 *
 *   npm run cli -- list
 *   npm run cli -- run viral-dynamics --epsRT 0.97 --epsPI 0.97
 *   npm run cli -- run pk-pd-viral --target production --csv > out.csv
 *
 * First run downloads the WebR runtime from the CDN (needs internet).
 */
import { WebR } from 'webr'
import { SIM_TEMPLATES, defaultParams } from '../src/lib/rmodels.ts'
import type { SimTemplateId } from '../src/lib/types.ts'

const IDS = Object.keys(SIM_TEMPLATES) as SimTemplateId[]

function help() {
  console.log(`HIV Cure Research Lab — CLI

Usage:
  hivlab list
  hivlab run <template> [--<param> <value> ...] [--target infection|production] [--rcode] [--csv]

Templates: ${IDS.join(', ')}

Examples:
  hivlab run viral-dynamics --epsRT 0.97 --epsPI 0.97 --days 90
  hivlab run pk-pd-viral --target production --csv

Educational in-silico models only — not medical advice.`)
}

// Convert WebR's toJs() tree to plain JS (mirror of src/lib/webr.ts).
function rToJs(node: any): any {
  if (node == null || typeof node !== 'object') return node ?? null
  switch (node.type) {
    case 'null':
      return null
    case 'string':
      return node.value ?? null
    case 'list':
    case 'pairlist':
    case 'environment': {
      const values = (node.values ?? []).map((v: any) =>
        v && typeof v === 'object' && 'type' in v ? rToJs(v) : v,
      )
      if (node.names) {
        const obj: Record<string, any> = {}
        node.names.forEach((nm: string | null, i: number) => {
          if (nm != null) obj[nm] = values[i]
        })
        return obj
      }
      return values
    }
    default:
      return node.values ?? []
  }
}

async function main() {
  const argv = process.argv.slice(2)
  const cmd = argv[0]

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') return help()

  if (cmd === 'list') {
    for (const id of IDS) {
      console.log(`\n${id}`)
      for (const p of SIM_TEMPLATES[id].params) {
        console.log(`  --${p.key.padEnd(10)} default ${p.default}`)
      }
    }
    return
  }

  const template = cmd === 'run' ? argv[1] : cmd
  const rest = cmd === 'run' ? argv.slice(2) : argv.slice(1)
  if (!IDS.includes(template as SimTemplateId)) {
    console.error(`Unknown template: ${template}\n`)
    help()
    process.exit(1)
  }
  const id = template as SimTemplateId
  const params = defaultParams(id)
  let target = 'infection'
  let rcode = false
  let csv = false

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--rcode') rcode = true
    else if (a === '--csv') csv = true
    else if (a === '--target') target = rest[++i]
    else if (a.startsWith('--')) {
      const key = a.slice(2)
      const val = Number(rest[++i])
      if (!(key in params)) {
        console.error(`Unknown parameter --${key} for ${id}`)
        process.exit(1)
      }
      if (Number.isNaN(val)) {
        console.error(`--${key} expects a number`)
        process.exit(1)
      }
      params[key] = val
    }
  }

  const code = SIM_TEMPLATES[id].generate(params, target)
  if (rcode) console.log('--- R ---\n' + code + '\n---------')

  process.stderr.write('Running R (downloading WebR runtime on first run)...\n')
  const webR = new WebR()
  await webR.init()
  let parsed: any
  try {
    const obj = await webR.evalR(code)
    parsed = rToJs(await obj.toJs())
    await webR.destroy(obj)
  } finally {
    await webR.close()
  }

  const cols: string[] = parsed.cols ?? []
  const series: Record<string, number[]> = parsed.series ?? {}
  const summary: Record<string, unknown> = parsed.summary ?? {}

  console.log(`\nTemplate:   ${id}`)
  if (id === 'pk-pd-viral') console.log(`Mechanism:  ${target}`)
  console.log('Parameters: ' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', '))
  console.log('Summary:')
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k.padEnd(10)} = ${Array.isArray(v) ? v[0] : v}`)
  }

  if (csv && cols.length) {
    console.log('\n' + cols.join(','))
    const n = series[cols[0]]?.length ?? 0
    for (let i = 0; i < n; i++) console.log(cols.map((c) => series[c][i]).join(','))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
