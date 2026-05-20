import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/AppStore'
import { useI18n } from '../i18n/I18nContext'
import {
  SIM_TEMPLATES,
  defaultParams,
} from '../lib/rmodels'
import {
  getEngineStatus,
  initWebR,
  onEngineStatus,
  runSimulation,
  type EngineStatus,
} from '../lib/webr'
import { SimChart, PALETTE, type ChartLine } from '../components/SimChart'
import { SimControls } from '../components/SimControls'
import { RConsole } from '../components/RConsole'
import { Disclaimer } from '../components/Disclaimer'
import { Badge, Button, Card, Field, inputClass, Section, type Tone } from '../components/ui'
import { uid } from '../lib/storage'
import { fmt } from '../lib/format'
import type { StringKey } from '../i18n/en'
import type {
  Candidate,
  DrugClass,
  MechanismTarget,
  SimResult,
  SimSeriesPoint,
  SimTemplateId,
} from '../lib/types'

const TEMPLATE_IDS: SimTemplateId[] = ['viral-dynamics', 'dose-response', 'pk', 'pk-pd-viral']
const ENGINE_TONE: Record<EngineStatus, Tone> = {
  idle: 'muted',
  loading: 'warn',
  ready: 'good',
  error: 'bad',
}

type DisplayResult = { points: SimSeriesPoint[]; summary: Record<string, number | string> }

export default function Lab() {
  const { data, update } = useApp()
  const { t, bi } = useI18n()

  const [templateId, setTemplateId] = useState<SimTemplateId>('viral-dynamics')
  const [params, setParams] = useState<Record<string, number>>(() => defaultParams('viral-dynamics'))
  const [target, setTarget] = useState<MechanismTarget>('infection')
  const [candId, setCandId] = useState('')
  const [result, setResult] = useState<DisplayResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [showR, setShowR] = useState(false)
  const [engine, setEngine] = useState<EngineStatus>(getEngineStatus())

  useEffect(() => onEngineStatus(setEngine), [])

  const tpl = SIM_TEMPLATES[templateId]
  const code = useMemo(() => tpl.generate(params, target), [tpl, params, target])

  const lines: ChartLine[] = tpl.series.map((s, i) => ({
    dataKey: s.key,
    name: bi(s.label),
    color: PALETTE[i % PALETTE.length],
    axis: s.axis,
  }))
  const leftLog = tpl.series.some((s) => (s.axis ?? 'left') === 'left' && s.log)
  const rightLog = tpl.series.some((s) => s.axis === 'right' && s.log)

  function pickTemplate(id: SimTemplateId) {
    setTemplateId(id)
    setParams(defaultParams(id))
    setResult(null)
    setError('')
    setCandId('')
  }

  function applyCandidate(id: string) {
    setCandId(id)
    const c = data.candidates.find((x) => x.id === id)
    if (!c) return
    setParams((prev) => {
      const p = { ...prev }
      if (templateId === 'dose-response') {
        p.ic50 = c.ic50_nM
        p.hill = c.hill
        p.emax = c.emax
      } else if (templateId === 'pk') {
        p.dose = c.doseMg
        p.ka = c.ka_perH
        p.ke = c.ke_perH
        p.vd = c.vd_L
        p.interval = c.intervalH
      } else if (templateId === 'pk-pd-viral') {
        p.dose = c.doseMg
        p.ka = c.ka_perH
        p.ke = c.ke_perH
        p.vd = c.vd_L
        p.interval = c.intervalH
        p.hill = c.hill
        p.emax = c.emax
      }
      return p
    })
    setTarget(c.target)
  }

  async function run() {
    setError('')
    setRunning(true)
    try {
      setResult(await runSimulation(code))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  function save() {
    if (!result) return
    const sim: SimResult = {
      id: uid(),
      label: `${t(('lab.tpl.' + templateId) as StringKey)} · ${new Date().toLocaleTimeString()}`,
      candidateId: candId || undefined,
      template: templateId,
      createdISO: new Date().toISOString(),
      params: { ...params },
      series: result.points,
      summary: result.summary,
      rCode: code,
    }
    update({ simResults: [...data.simResults, sim] })
  }

  function loadSaved(s: SimResult) {
    setTemplateId(s.template)
    setParams({ ...defaultParams(s.template), ...s.params })
    setResult({ points: s.series, summary: s.summary })
    setError('')
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('lab.title')}</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t('lab.engine')}:</span>
          <Badge tone={ENGINE_TONE[engine]}>{t(`lab.engine.${engine}` as StringKey)}</Badge>
          {engine === 'idle' && (
            <Button variant="subtle" onClick={() => void initWebR().catch(() => {})}>
              {t('lab.engine.load')}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t('lab.intro')}</p>
      <div className="mt-3">
        <Disclaimer variant="lab" />
      </div>

      {/* template picker */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TEMPLATE_IDS.map((id) => (
          <Button
            key={id}
            variant={id === templateId ? 'primary' : 'subtle'}
            onClick={() => pickTemplate(id)}
          >
            {t(`lab.tpl.${id}` as StringKey)}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {t(`lab.tpl.${templateId}.desc` as StringKey)}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* controls */}
        <Card className="p-4 lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <Field label={t('lab.useCandidate')}>
              <select
                className={inputClass}
                value={candId}
                onChange={(e) => applyCandidate(e.target.value)}
              >
                <option value="">—</option>
                {data.candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {templateId === 'pk-pd-viral' && (
              <Field label={t('cand.target')}>
                <select
                  className={inputClass}
                  value={target}
                  onChange={(e) => setTarget(e.target.value as MechanismTarget)}
                >
                  <option value="infection">{t('cand.target.infection')}</option>
                  <option value="production">{t('cand.target.production')}</option>
                </select>
              </Field>
            )}
          </div>

          <h3 className="mb-2 text-sm font-medium">{t('lab.params')}</h3>
          <SimControls
            params={tpl.params}
            values={params}
            onChange={(k, v) => setParams((p) => ({ ...p, [k]: v }))}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={run} disabled={running || engine === 'loading'}>
              {running ? t('lab.running') : t('lab.run')}
            </Button>
            <Button variant="ghost" onClick={() => setShowR((s) => !s)}>
              {showR ? t('lab.hideR') : t('lab.showR')}
            </Button>
            {result && (
              <Button variant="subtle" onClick={save}>
                {t('lab.saveResult')}
              </Button>
            )}
          </div>
          {engine === 'loading' && (
            <p className="mt-2 text-xs text-slate-400">{t('lab.engine.hint')}</p>
          )}
          {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}

          {showR && (
            <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
              {code}
            </pre>
          )}
        </Card>

        {/* results */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-medium">{t('lab.results')}</h3>
          {!result ? (
            <p className="py-12 text-center text-sm text-slate-400">{t('lab.noResult')}</p>
          ) : (
            <>
              <SimChart
                data={result.points}
                lines={lines}
                xLog={tpl.xLog}
                leftLog={leftLog}
                rightLog={rightLog}
              />
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(result.summary).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                    <dt className="text-xs text-slate-500">
                      {k === 't2s' ? t('lab.t2s') : k}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {k === 't2s'
                        ? Number(v) < 0
                          ? t('lab.t2s.never')
                          : `${fmt(v)} ${t('lab.days')}`
                        : fmt(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Card>
      </div>

      {/* saved simulations */}
      {data.simResults.length > 0 && (
        <Section title={t('lab.saved')}>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {[...data.simResults].reverse().map((s) => (
              <Card key={s.id} className="p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{s.label}</span>
                  <button
                    className="text-xs text-rose-500 hover:underline"
                    onClick={() =>
                      update({ simResults: data.simResults.filter((x) => x.id !== s.id) })
                    }
                  >
                    {t('common.delete')}
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(s.summary)
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <Badge key={k} tone="muted">
                        {k === 't2s' ? t('lab.t2s') : k}: {k === 't2s' && Number(v) < 0 ? '—' : fmt(v)}
                      </Badge>
                    ))}
                </div>
                <Button variant="ghost" className="mt-2" onClick={() => loadSaved(s)}>
                  {t('common.edit')} ↺
                </Button>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* candidate library */}
      <CandidateLibrary />

      {/* R console */}
      <Section title="R">
        <Card className="p-4">
          <RConsole />
        </Card>
      </Section>
    </div>
  )

  function CandidateLibrary() {
    const empty: Omit<Candidate, 'id'> = {
      name: '',
      drugClass: 'INSTI',
      target: 'infection',
      ic50_nM: 10,
      hill: 1.5,
      emax: 0.99,
      doseMg: 50,
      ka_perH: 1.2,
      ke_perH: 0.05,
      vd_L: 17,
      intervalH: 24,
    }
    const [form, setForm] = useState<Omit<Candidate, 'id'>>(empty)
    const classes: DrugClass[] = ['NRTI', 'NNRTI', 'INSTI', 'PI', 'EntryInhibitor', 'CapsidInhibitor', 'Other']

    function addCandidate() {
      if (!form.name.trim()) return
      update({ candidates: [...data.candidates, { ...form, id: uid() }] })
      setForm(empty)
    }

    return (
      <Section title={t('cand.title')}>
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.candidates.map((c) => (
            <Card key={c.id} className="p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {c.drugClass} · IC50 {fmt(c.ic50_nM)} nM · t½≈{fmt(Math.log(2) / c.ke_perH, 0)} h
                  </div>
                </div>
                <button
                  className="text-xs text-rose-500 hover:underline"
                  onClick={() => update({ candidates: data.candidates.filter((x) => x.id !== c.id) })}
                >
                  {t('common.delete')}
                </button>
              </div>
              <Button variant="ghost" className="mt-2" onClick={() => applyCandidate(c.id)}>
                {t('lab.useCandidate')}
              </Button>
            </Card>
          ))}
        </div>

        <details className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <summary className="cursor-pointer text-sm font-medium">{t('cand.add')}</summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label={t('common.name')}>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('cand.class')}>
              <select className={inputClass} value={form.drugClass} onChange={(e) => setForm({ ...form, drugClass: e.target.value as DrugClass })}>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('cand.target')}>
              <select className={inputClass} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as MechanismTarget })}>
                <option value="infection">{t('cand.target.infection')}</option>
                <option value="production">{t('cand.target.production')}</option>
              </select>
            </Field>
            <Field label={t('cand.ic50')}>
              <input type="number" className={inputClass} value={form.ic50_nM} onChange={(e) => setForm({ ...form, ic50_nM: Number(e.target.value) })} />
            </Field>
            <Field label={t('cand.hill')}>
              <input type="number" className={inputClass} value={form.hill} onChange={(e) => setForm({ ...form, hill: Number(e.target.value) })} />
            </Field>
            <Field label={t('cand.emax')}>
              <input type="number" className={inputClass} value={form.emax} onChange={(e) => setForm({ ...form, emax: Number(e.target.value) })} />
            </Field>
            <Field label={t('cand.dose')}>
              <input type="number" className={inputClass} value={form.doseMg} onChange={(e) => setForm({ ...form, doseMg: Number(e.target.value) })} />
            </Field>
            <Field label={t('cand.ka')}>
              <input type="number" className={inputClass} value={form.ka_perH} onChange={(e) => setForm({ ...form, ka_perH: Number(e.target.value) })} />
            </Field>
            <Field label={t('cand.ke')}>
              <input type="number" className={inputClass} value={form.ke_perH} onChange={(e) => setForm({ ...form, ke_perH: Number(e.target.value) })} />
            </Field>
            <Field label={t('cand.vd')}>
              <input type="number" className={inputClass} value={form.vd_L} onChange={(e) => setForm({ ...form, vd_L: Number(e.target.value) })} />
            </Field>
            <Field label={t('cand.interval')}>
              <input type="number" className={inputClass} value={form.intervalH} onChange={(e) => setForm({ ...form, intervalH: Number(e.target.value) })} />
            </Field>
            <div className="flex items-end">
              <Button variant="primary" onClick={addCandidate}>
                {t('common.add')}
              </Button>
            </div>
          </div>
        </details>
      </Section>
    )
  }
}
