import { useState } from 'react'
import { runRConsole } from '../lib/webr'
import { Button, inputClass } from './ui'

export function RConsole({ seed }: { seed?: string }) {
  const [code, setCode] = useState(seed ?? '# base R runs here, e.g.\nx <- rnorm(1000)\nsummary(x)\n')
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    setOut('')
    try {
      setOut(await runRConsole(code))
    } catch (e) {
      setOut(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        className={`${inputClass} h-32 font-mono text-xs`}
        value={code}
        spellCheck={false}
        onChange={(e) => setCode(e.target.value)}
      />
      <div className="flex justify-end">
        <Button variant="primary" onClick={run} disabled={busy}>
          {busy ? 'R…' : 'Run R'}
        </Button>
      </div>
      {out && (
        <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
          {out}
        </pre>
      )}
    </div>
  )
}
