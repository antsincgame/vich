import { useRef, useState } from 'react'
import { useApp } from '../state/AppStore'
import { useI18n } from '../i18n/I18nContext'
import { extractRCode, simContext, streamChat, systemPrompt, type ChatMessage } from '../lib/ai'
import { runRConsole } from '../lib/webr'
import type { SimResult } from '../lib/types'
import { Button, inputClass } from './ui'

export function AIChat({ latestSim }: { latestSim?: SimResult }) {
  const { data } = useApp()
  const { t, lang } = useI18n()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [attach, setAttach] = useState(true)
  const [error, setError] = useState('')
  const [runOut, setRunOut] = useState<Record<number, string>>({})
  const abortRef = useRef<AbortController | null>(null)

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError('')
    setInput('')

    const history: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    const assistantIdx = history.length

    const payload: ChatMessage[] = [{ role: 'system', content: systemPrompt(lang) }]
    if (attach && latestSim) payload.push({ role: 'user', content: simContext(latestSim) })
    payload.push(...history)

    setBusy(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      await streamChat(
        data.ai,
        payload,
        (delta) =>
          setMessages((m) => {
            const copy = m.slice()
            copy[assistantIdx] = {
              role: 'assistant',
              content: (copy[assistantIdx]?.content ?? '') + delta,
            }
            return copy
          }),
        ctrl.signal,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setMessages((m) => m.slice(0, assistantIdx))
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  async function runCode(i: number, code: string) {
    setRunOut((o) => ({ ...o, [i]: '…' }))
    try {
      const res = await runRConsole(code)
      setRunOut((o) => ({ ...o, [i]: res || '(no output)' }))
    } catch (e) {
      setRunOut((o) => ({ ...o, [i]: `Error: ${e instanceof Error ? e.message : String(e)}` }))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-500">
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
          {t('ai.attach')}
        </label>
        <button
          className="hover:text-slate-700 dark:hover:text-slate-200"
          onClick={() => {
            setMessages([])
            setRunOut({})
            setError('')
          }}
        >
          {t('ai.clearChat')}
        </button>
      </div>

      <div className="min-h-[16rem] flex-1 space-y-3 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">{t('ai.placeholder')}</p>
        )}
        {messages.map((m, i) => {
          const code = m.role === 'assistant' ? extractRCode(m.content) : null
          return (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
                }`}
              >
                {m.content || (busy ? t('ai.thinking') : '')}
                {code && (
                  <div className="mt-2">
                    <Button variant="subtle" onClick={() => runCode(i, code)}>
                      {t('ai.runSuggested')}
                    </Button>
                    {runOut[i] !== undefined && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-900 p-2 font-mono text-xs text-slate-100">
                        {runOut[i]}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="mt-2 flex gap-2">
        <input
          className={inputClass}
          value={input}
          placeholder={t('ai.placeholder')}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
        />
        <Button variant="primary" onClick={send} disabled={busy || !input.trim()}>
          {busy ? t('ai.thinking') : t('ai.send')}
        </Button>
      </div>
    </div>
  )
}
