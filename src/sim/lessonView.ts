import type { ModelOutput } from '../core'
import { getDataset } from './content/loader'
import type { Formula, Lesson, WorkedStep } from './content/schema'
import type { ParamValue } from './lessonStore'
import { formatNumber, formatValue, renderTemplate, selectVariant, type TemplateContext } from './template'

export interface Readout {
  key: string
  label: string
  symbol?: string
  /** The value, already formatted with the output's decimals. */
  text: string
}

/** Everything a lesson shows that depends on the current parameters, all rendered from one state. */
export interface RenderedLesson {
  formula: Formula
  workedExample: WorkedStep[]
  summary: string
  readouts: Readout[]
}

/** The values a template can refer to, formatted as the contract describes. */
export function buildContext(lesson: Lesson, params: Record<string, ParamValue>, outputs: ModelOutput): TemplateContext {
  const context: TemplateContext = {}

  for (const p of lesson.parameters) {
    const value = params[p.id]
    if (p.type === 'number') context[p.id] = formatNumber(value as number, 1)
    else context[p.id] = p.options.find((o) => o.value === value)?.label ?? String(value)
  }

  const decimals = new Map(lesson.outputs.map((o) => [o.key, o.decimals]))
  for (const [key, value] of Object.entries(outputs)) context[key] = formatValue(value, decimals.get(key))

  const dataset = lesson.datasetId ? getDataset(lesson.datasetId) : undefined
  if (dataset) {
    context.dataX = dataset.points.map((p) => formatNumber(p.x))
    context.dataY = dataset.points.map((p) => formatNumber(p.y))
  }
  return context
}

export function renderLesson(lesson: Lesson, params: Record<string, ParamValue>, outputs: ModelOutput): RenderedLesson {
  const choices: Record<string, string> = {}
  for (const p of lesson.parameters) if (p.type === 'choice') choices[p.id] = params[p.id] as string

  const context = buildContext(lesson, params, outputs)
  const where = `lesson "${lesson.id}"`

  const workedExample = selectVariant(lesson.workedExample, choices, `${where} workedExample`).map((step, i) => ({
    text: renderTemplate(step.text, context, `${where} workedExample[${i}].text`),
    latex: renderTemplate(step.latex, context, `${where} workedExample[${i}].latex`),
  }))

  const readouts: Readout[] = []
  for (const o of lesson.outputs) {
    const value = outputs[o.key]
    if (typeof value === 'number') {
      readouts.push({ key: o.key, label: o.label, symbol: o.symbol, text: formatNumber(value, o.decimals) })
    }
  }

  return {
    formula: selectVariant(lesson.formula, choices, `${where} formula`),
    workedExample,
    summary: renderTemplate(selectVariant(lesson.chartSummary, choices, `${where} chartSummary`), context, `${where} chartSummary`),
    readouts,
  }
}
