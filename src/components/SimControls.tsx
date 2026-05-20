import { useI18n } from '../i18n/I18nContext'
import type { ParamDef } from '../lib/rmodels'
import { Field, inputClass } from './ui'

export function SimControls({
  params,
  values,
  onChange,
}: {
  params: ParamDef[]
  values: Record<string, number>
  onChange: (key: string, value: number) => void
}) {
  const { bi } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {params.map((p) => (
        <Field key={p.key} label={bi(p.label)}>
          <input
            type="number"
            className={inputClass}
            value={Number.isFinite(values[p.key]) ? values[p.key] : ''}
            min={p.min}
            max={p.max}
            step={p.step}
            onChange={(e) => onChange(p.key, Number(e.target.value))}
          />
        </Field>
      ))}
    </div>
  )
}
