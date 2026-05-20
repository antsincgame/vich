import { useState } from 'react'
import { useApp } from '../state/AppStore'
import { useI18n } from '../i18n/I18nContext'
import { Badge, Button, Card, Field, inputClass, Section } from '../components/ui'
import { TrendChart } from '../components/TrendChart'
import { uid } from '../lib/storage'
import { fmt, todayISO } from '../lib/format'
import {
  CD4_LABEL,
  CD4_TONE,
  cd4Status,
  VL_LABEL,
  VL_TONE,
  viralLoadStatus,
} from '../lib/clinical'
import type { Appointment, LabEntry, Medication } from '../lib/types'

type Tab = 'labs' | 'meds' | 'appts'

export default function Monitoring() {
  const { data } = useApp()
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('labs')

  const labsAsc = [...data.labs].sort((a, b) => a.dateISO.localeCompare(b.dateISO))
  const vlTrend = labsAsc
    .filter((l) => l.viralLoad != null)
    .map((l) => ({ x: l.dateISO, y: l.viralLoad as number }))
  const cd4Trend = labsAsc
    .filter((l) => l.cd4 != null)
    .map((l) => ({ x: l.dateISO, y: l.cd4 as number }))

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('mon.title')}</h1>

      <div className="mt-4 inline-flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(['labs', 'meds', 'appts'] as Tab[]).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              tab === tb ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'
            }`}
          >
            {t(tb === 'labs' ? 'mon.tab.labs' : tb === 'meds' ? 'mon.tab.meds' : 'mon.tab.appts')}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'labs' && <LabsTab />}
        {tab === 'meds' && <MedsTab />}
        {tab === 'appts' && <ApptsTab />}
      </div>

      {tab === 'labs' && (vlTrend.length > 0 || cd4Trend.length > 0) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {vlTrend.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium">{t('mon.trendVL')}</h3>
              <TrendChart data={vlTrend} color="#e0457b" name={t('mon.vl')} log />
            </Card>
          )}
          {cd4Trend.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium">{t('mon.trendCD4')}</h3>
              <TrendChart data={cd4Trend} color="#2f6fed" name={t('mon.cd4')} />
            </Card>
          )}
        </div>
      )}

      {tab === 'labs' && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          {t('mon.uequ')}
        </p>
      )}
    </div>
  )
}

function LabsTab() {
  const { data, update } = useApp()
  const { t, bi } = useI18n()
  const [form, setForm] = useState({ dateISO: todayISO(), vl: '', cd4: '', cd4cd8: '', weight: '' })

  function add() {
    const entry: LabEntry = {
      id: uid(),
      dateISO: form.dateISO,
      viralLoad: form.vl ? Number(form.vl) : undefined,
      cd4: form.cd4 ? Number(form.cd4) : undefined,
      cd4cd8: form.cd4cd8 ? Number(form.cd4cd8) : undefined,
      weightKg: form.weight ? Number(form.weight) : undefined,
    }
    update({ labs: [...data.labs, entry] })
    setForm({ dateISO: todayISO(), vl: '', cd4: '', cd4cd8: '', weight: '' })
  }
  const list = [...data.labs].sort((a, b) => b.dateISO.localeCompare(a.dateISO))

  return (
    <Section title={t('mon.addLab')}>
      <Card className="mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
        <Field label={t('common.date')}>
          <input type="date" className={inputClass} value={form.dateISO} onChange={(e) => setForm({ ...form, dateISO: e.target.value })} />
        </Field>
        <Field label={t('mon.vl')}>
          <input type="number" className={inputClass} value={form.vl} onChange={(e) => setForm({ ...form, vl: e.target.value })} />
        </Field>
        <Field label={t('mon.cd4')}>
          <input type="number" className={inputClass} value={form.cd4} onChange={(e) => setForm({ ...form, cd4: e.target.value })} />
        </Field>
        <Field label={t('mon.cd4cd8')}>
          <input type="number" step={0.1} className={inputClass} value={form.cd4cd8} onChange={(e) => setForm({ ...form, cd4cd8: e.target.value })} />
        </Field>
        <Field label={t('mon.weight')}>
          <input type="number" step={0.1} className={inputClass} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        </Field>
        <div className="col-span-2 flex items-end sm:col-span-5">
          <Button variant="primary" onClick={add}>
            {t('common.add')}
          </Button>
        </div>
      </Card>

      {list.length === 0 ? (
        <p className="text-sm text-slate-400">{t('common.none')}</p>
      ) : (
        <div className="space-y-2">
          {list.map((l) => {
            const vs = viralLoadStatus(l.viralLoad)
            const cs = cd4Status(l.cd4)
            return (
              <Card key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
                <span className="font-medium tabular-nums">{l.dateISO}</span>
                {l.viralLoad != null && (
                  <span className="flex items-center gap-1">
                    VL {fmt(l.viralLoad)} <Badge tone={VL_TONE[vs]}>{bi(VL_LABEL[vs])}</Badge>
                  </span>
                )}
                {l.cd4 != null && (
                  <span className="flex items-center gap-1">
                    CD4 {fmt(l.cd4)} <Badge tone={CD4_TONE[cs]}>{bi(CD4_LABEL[cs])}</Badge>
                  </span>
                )}
                {l.cd4cd8 != null && <span>CD4/CD8 {fmt(l.cd4cd8)}</span>}
                {l.weightKg != null && <span>{fmt(l.weightKg)} kg</span>}
                <button
                  className="ml-auto text-xs text-rose-500 hover:underline"
                  onClick={() => update({ labs: data.labs.filter((x) => x.id !== l.id) })}
                >
                  {t('common.delete')}
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </Section>
  )
}

function MedsTab() {
  const { data, update } = useApp()
  const { t } = useI18n()
  const [form, setForm] = useState({ name: '', dose: '', timesPerDay: '1' })
  const today = todayISO()
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  function add() {
    if (!form.name.trim()) return
    const med: Medication = {
      id: uid(),
      name: form.name.trim(),
      dose: form.dose.trim() || undefined,
      timesPerDay: Math.max(1, Number(form.timesPerDay) || 1),
      startedISO: today,
      active: true,
    }
    update({ meds: [...data.meds, med] })
    setForm({ name: '', dose: '', timesPerDay: '1' })
  }
  function logDose(medId: string, status: 'taken' | 'missed') {
    update({ doses: [...data.doses, { id: uid(), medId, dateISO: today, status }] })
  }
  function adherence(med: Medication): number {
    const expected = med.timesPerDay * 30
    const taken = data.doses.filter(
      (d) => d.medId === med.id && d.status === 'taken' && d.dateISO >= since,
    ).length
    return expected ? Math.min(100, Math.round((taken / expected) * 100)) : 0
  }

  return (
    <Section title={t('mon.addMed')}>
      <Card className="mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <Field label={t('mon.medName')}>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label={t('mon.dose')}>
          <input className={inputClass} value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} />
        </Field>
        <Field label={t('mon.timesPerDay')}>
          <input type="number" min={1} className={inputClass} value={form.timesPerDay} onChange={(e) => setForm({ ...form, timesPerDay: e.target.value })} />
        </Field>
        <div className="flex items-end">
          <Button variant="primary" onClick={add}>
            {t('common.add')}
          </Button>
        </div>
      </Card>

      {data.meds.length === 0 ? (
        <p className="text-sm text-slate-400">{t('common.none')}</p>
      ) : (
        <div className="space-y-2">
          {data.meds.map((m) => {
            const a = adherence(m)
            return (
              <Card key={m.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="font-medium">{m.name}</span>
                {m.dose && <span className="text-slate-500">{m.dose}</span>}
                <span className="text-slate-500">×{m.timesPerDay}/day</span>
                <Badge tone={a >= 90 ? 'good' : a >= 70 ? 'warn' : 'bad'}>
                  {t('mon.adherence')}: {a}%
                </Badge>
                <div className="ml-auto flex gap-2">
                  <Button variant="subtle" onClick={() => logDose(m.id, 'taken')}>
                    {t('mon.markTaken')}
                  </Button>
                  <Button variant="ghost" onClick={() => logDose(m.id, 'missed')}>
                    {t('mon.markMissed')}
                  </Button>
                  <button
                    className="text-xs text-rose-500 hover:underline"
                    onClick={() => update({ meds: data.meds.filter((x) => x.id !== m.id) })}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Section>
  )
}

function ApptsTab() {
  const { data, update } = useApp()
  const { t } = useI18n()
  const [form, setForm] = useState({ dateISO: todayISO(), title: '', location: '', note: '' })

  function add() {
    if (!form.title.trim()) return
    const appt: Appointment = {
      id: uid(),
      dateISO: form.dateISO,
      title: form.title.trim(),
      location: form.location.trim() || undefined,
      note: form.note.trim() || undefined,
    }
    update({ appointments: [...data.appointments, appt] })
    setForm({ dateISO: todayISO(), title: '', location: '', note: '' })
  }
  const upcoming = [...data.appointments].sort((a, b) => a.dateISO.localeCompare(b.dateISO))

  return (
    <Section title={t('mon.addAppt')}>
      <Card className="mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <Field label={t('common.date')}>
          <input type="date" className={inputClass} value={form.dateISO} onChange={(e) => setForm({ ...form, dateISO: e.target.value })} />
        </Field>
        <Field label={t('common.name')}>
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Location" hint={t('common.optional')}>
          <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <div className="flex items-end">
          <Button variant="primary" onClick={add}>
            {t('common.add')}
          </Button>
        </div>
      </Card>

      <h3 className="mb-2 text-sm font-medium">{t('mon.upcoming')}</h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-slate-400">{t('common.none')}</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="font-medium tabular-nums">{a.dateISO}</span>
              <span>{a.title}</span>
              {a.location && <span className="text-slate-500">{a.location}</span>}
              <button
                className="ml-auto text-xs text-rose-500 hover:underline"
                onClick={() => update({ appointments: data.appointments.filter((x) => x.id !== a.id) })}
              >
                {t('common.delete')}
              </button>
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}
