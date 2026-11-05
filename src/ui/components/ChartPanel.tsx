import { useId } from 'react'
import { getDataset } from '../../sim/content/loader'
import type { Lesson } from '../../sim/content/schema'
import type { ParamValue, SetParamResult } from '../../sim/lessonStore'
import type { RenderedLesson } from '../../sim/lessonView'
import type { ModelOutput } from '../../core'
import { getChart } from '../charts/chartRegistry'

interface ChartPanelProps {
  lesson: Lesson
  params: Record<string, ParamValue>
  outputs: ModelOutput
  view: RenderedLesson
  setParam: (id: string, raw: ParamValue) => SetParamResult
}

/** The chart, its text summary and the current output values. */
export function ChartPanel({ lesson, params, outputs, view, setParam }: ChartPanelProps) {
  const summaryId = useId()
  const chart = getChart(lesson.chart.type)
  for (const key of chart.requiredOutputs) {
    if (!(key in outputs)) throw new Error(`Chart "${lesson.chart.type}" needs output "${key}", which model "${lesson.model.id}" did not return`)
  }
  const Chart = chart.component
  const dataset = lesson.datasetId ? getDataset(lesson.datasetId)?.points : undefined

  return (
    <div className="chart-panel">
      <Chart
        params={params}
        outputs={outputs}
        dataset={dataset}
        options={lesson.chart.options ?? {}}
        setParam={setParam}
        parameters={lesson.parameters}
        decimals={Object.fromEntries(lesson.outputs.map((o) => [o.key, o.decimals]))}
        ariaLabel={`${lesson.title} chart`}
        describedBy={summaryId}
      />
      <p id={summaryId} data-testid="chart-summary" className="chart-summary">
        {view.summary}
      </p>
      <dl className="readouts" aria-label="Results">
        {view.readouts.map((r) => (
          <div key={r.key} className="readout">
            <dt>
              {r.label}
              {r.symbol ? ` (${r.symbol})` : ''}
            </dt>
            <dd data-testid={`readout-${r.key}`}>{r.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
