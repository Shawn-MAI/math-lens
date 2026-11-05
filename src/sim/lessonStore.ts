import { createStore, type StoreApi } from 'zustand/vanilla'
import { clamp, snapToStep } from '../core'
import type { ModelOutput, Point } from '../core'
import { getDataset } from './content/loader'
import { isTrainingLesson, type AnyLesson, type Lesson, type NumberParameter } from './content/schema'
import { formatNumber } from './template'
import { getModel } from './models'

export type ParamValue = number | string

export interface SetParamResult {
  ok: boolean
  message?: string
}

export interface LessonState {
  params: Record<string, ParamValue>
  outputs: ModelOutput
  /** Inline validation message per parameter id. Cleared by the next valid change. */
  messages: Record<string, string>
  setParam(id: string, raw: ParamValue): SetParamResult
  /** Restores every parameter to its declared default. */
  reset(): void
}

export type LessonStore = StoreApi<LessonState>

function rangeMessage(p: NumberParameter): string {
  return `Enter a number from ${formatNumber(p.min, 1)} to ${formatNumber(p.max, 1)}`
}

function computeOutputs(lesson: Lesson, params: Record<string, ParamValue>, dataset: Point[] | undefined): ModelOutput {
  const model = getModel(lesson.model.id)
  const bind = lesson.model.bind ?? {}
  const values: Record<string, number> = {}
  for (const role of model.roles) values[role] = params[bind[role]!] as number
  const choices: Record<string, string> = {}
  for (const name of model.choiceInputs) choices[name] = params[name] as string
  return model.compute({ values, choices }, dataset)
}

/**
 * Creates the state of one open lesson: current parameters and the outputs computed from them.
 * Outputs are recomputed synchronously on every change, so numbers and chart never disagree.
 */
export function createLessonStore(lesson: AnyLesson): LessonStore {
  if (isTrainingLesson(lesson)) throw new Error(`Training lesson "${lesson.id}" requires a training store`)
  const dataset = lesson.datasetId ? getDataset(lesson.datasetId)?.points : undefined
  const defaults = Object.fromEntries(lesson.parameters.map((p) => [p.id, p.default])) as Record<string, ParamValue>

  return createStore<LessonState>((set, get) => {
    const apply = (id: string, value: ParamValue, message: string | undefined): void => {
      const params = { ...get().params, [id]: value }
      const messages = { ...get().messages }
      if (message) messages[id] = message
      else delete messages[id]
      set({ params, outputs: computeOutputs(lesson, params, dataset), messages })
    }

    const reject = (id: string, message: string): SetParamResult => {
      set({ messages: { ...get().messages, [id]: message } })
      return { ok: false, message }
    }

    return {
      params: defaults,
      outputs: computeOutputs(lesson, defaults, dataset),
      messages: {},
      setParam(id, raw) {
        const parameter = lesson.parameters.find((p) => p.id === id)
        if (!parameter) throw new Error(`Unknown parameter "${id}" in lesson "${lesson.id}"`)

        if (parameter.type === 'choice') {
          if (typeof raw !== 'string' || !parameter.options.some((o) => o.value === raw)) {
            return reject(id, 'Choose one of the listed options')
          }
          apply(id, raw, undefined)
          return { ok: true }
        }

        const text = typeof raw === 'string' ? raw.trim() : undefined
        const value = typeof raw === 'string' ? (text === '' ? NaN : Number(text)) : raw
        if (!Number.isFinite(value)) return reject(id, rangeMessage(parameter))

        const snapped = snapToStep(value, parameter.step, parameter.min)
        const stored = clamp(snapped, parameter.min, parameter.max)
        if (stored !== snapped) {
          const message = rangeMessage(parameter)
          apply(id, stored, message)
          return { ok: false, message }
        }
        apply(id, stored, undefined)
        return { ok: true }
      },
      reset() {
        set({ params: defaults, outputs: computeOutputs(lesson, defaults, dataset), messages: {} })
      },
    }
  })
}
