import { useId, useState } from 'react'
import { decimalPlaces } from '../../core/numeric'
import type { ChoiceParameter, Lesson, NumberParameter } from '../../sim/content/schema'
import type { ParamValue, SetParamResult } from '../../sim/lessonStore'
import { formatNumber } from '../../sim/template'

interface ControlPanelProps {
  lesson: Lesson
  params: Record<string, ParamValue>
  messages: Record<string, string>
  setParam: (id: string, raw: ParamValue) => SetParamResult
  reset: () => void
}

function formatParameterValue(value: number, parameter: NumberParameter): string {
  const precision = Math.max(1, decimalPlaces(parameter.step), decimalPlaces(parameter.min))
  return precision <= 100 ? formatNumber(value, precision) : String(value)
}

function NumberControl({ p, value, message, setParam }: { p: NumberParameter; value: number; message?: string; setParam: ControlPanelProps['setParam'] }) {
  const sliderId = useId()
  const messageId = useId()
  const [draft, setDraft] = useState<string | null>(null)

  // A typed value is applied when the learner confirms it, so half-typed text such as "-" is not rejected.
  const commit = () => {
    if (draft === null) return
    setParam(p.id, draft)
    setDraft(null)
  }

  return (
    <div className="control">
      <label htmlFor={sliderId}>{p.label}</label>
      {p.symbol && <span className="control-symbol">{p.symbol}</span>}
      <div className="control-row">
        <input
          id={sliderId}
          type="range"
          min={p.min}
          max={p.max}
          step={p.step}
          value={value}
          aria-valuetext={formatParameterValue(value, p)}
          onChange={(e) => setParam(p.id, e.target.value)}
        />
        <input
          type="text"
          inputMode="decimal"
          className="control-number"
          aria-label={`${p.label} value`}
          aria-describedby={message ? messageId : undefined}
          aria-invalid={message ? true : undefined}
          value={draft ?? formatParameterValue(value, p)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
        />
      </div>
      {message && (
        <p id={messageId} role="alert" className="control-message">
          {message}
        </p>
      )}
    </div>
  )
}

function ChoiceControl({ p, value, setParam }: { p: ChoiceParameter; value: string; setParam: ControlPanelProps['setParam'] }) {
  const id = useId()
  return (
    <div className="control">
      <label htmlFor={id}>{p.label}</label>
      <select id={id} value={value} onChange={(e) => setParam(p.id, e.target.value)}>
        {p.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Controls for every parameter. Parameters that are only changed on the chart are shown read-only. */
export function ControlPanel({ lesson, params, messages, setParam, reset }: ControlPanelProps) {
  const hasHandleOnly = lesson.parameters.some((p) => p.type === 'number' && p.control === 'chart-handle')
  // Remounting the number controls on reset also drops any text typed but not yet confirmed.
  const [resets, setResets] = useState(0)
  return (
    <fieldset className="control-panel">
      <legend>Controls</legend>
      {lesson.parameters.map((p) => {
        if (p.type === 'choice') return <ChoiceControl key={p.id} p={p} value={params[p.id] as string} setParam={setParam} />
        if (p.control === 'chart-handle') {
          return (
            <div key={p.id} className="control">
              <span className="control-label">{p.label}</span>
              <output data-testid={`value-${p.id}`} className="control-value">
                {formatParameterValue(params[p.id] as number, p)}
              </output>
            </div>
          )
        }
        return <NumberControl key={`${p.id}-${resets}`} p={p} value={params[p.id] as number} message={messages[p.id]} setParam={setParam} />
      })}
      <button
        type="button"
        className="reset-button"
        onClick={() => {
          reset()
          setResets((n) => n + 1)
        }}
      >
        Reset
      </button>
      {hasHandleOnly && <p className="control-hint">Drag the handles on the chart. Or focus a handle and use the arrow keys (hold Shift for bigger steps).</p>}
    </fieldset>
  )
}
