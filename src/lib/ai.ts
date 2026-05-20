import type { AISettings, Lang, SimResult } from './types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function base(ai: AISettings): string {
  return ai.baseUrl.replace(/\/+$/, '')
}

function authHeaders(ai: AISettings): Record<string, string> {
  return ai.apiKey ? { Authorization: `Bearer ${ai.apiKey}` } : {}
}

export interface ConnResult {
  ok: boolean
  models?: string[]
  error?: string
}

export async function testConnection(ai: AISettings): Promise<ConnResult> {
  try {
    const res = await fetch(`${base(ai)}/models`, { headers: authHeaders(ai) })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = (await res.json()) as { data?: { id: string }[] }
    return { ok: true, models: (data.data ?? []).map((m) => m.id) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  }
}

interface StreamChunk {
  choices?: { delta?: { content?: string } }[]
}

/** Stream a chat completion from an OpenAI-compatible server (LM Studio). */
export async function streamChat(
  ai: AISettings,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${base(ai)}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(ai) },
    body: JSON.stringify({
      model: ai.model,
      messages,
      temperature: ai.temperature,
      stream: true,
    }),
    signal,
  })
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${txt}`.trim())
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]' || !payload) continue
      try {
        const json = JSON.parse(payload) as StreamChunk
        const delta = json.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          full += delta
          onDelta(delta)
        }
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }
  return full
}

export function systemPrompt(lang: Lang): string {
  const common = [
    'You are an assistant inside an in-silico HIV research lab that runs R simulations in the browser (WebR, base R only).',
    'You help reason about antiretroviral pharmacology and HIV cure strategies, interpret simulation results, and propose parameter changes or candidate profiles.',
    'You may output runnable R in ```r fenced code blocks. For the Lab, code must use base R only and END in an expression: list(cols=<character>, series=<named list of equal-length numerics, first is the x column>, summary=<named list of scalars>). For the free R console, any base R is fine.',
    'Always be explicit about uncertainty. Results are simplified hypotheses for education and discussion only — never medical advice, diagnosis, or claims that any molecule cures HIV. Real candidates require lab, ADMET, animal and clinical testing.',
    'Keep numbers plausible and state assumptions. Be concise.',
  ]
  const langLine =
    lang === 'ru'
      ? 'Отвечай по-русски, если пользователь пишет по-русски.'
      : 'Answer in English unless the user writes in another language.'
  return [...common, langLine].join('\n')
}

export function simContext(sim: SimResult): string {
  const params = Object.entries(sim.params)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
  const summary = Object.entries(sim.summary)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
  return [
    `Simulation context — template: ${sim.template}`,
    `parameters: ${params}`,
    `summary: ${summary}`,
    `(${sim.series.length} time points computed in R)`,
  ].join('\n')
}

/** Extract the first ```r fenced code block from an assistant message, if any. */
export function extractRCode(text: string): string | null {
  const m = text.match(/```(?:r|R)\n([\s\S]*?)```/)
  return m ? m[1].trim() : null
}
