import { z } from 'zod'
import { TOPIC_IDS } from './topics'

/** True when `value` is a whole number of `step`s away from `origin`, ignoring float noise. */
export function isOnGrid(value: number, step: number, origin: number): boolean {
  const steps = (value - origin) / step
  return Math.abs(steps - Math.round(steps)) < 1e-9
}

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/
const parameterId = /^[a-zA-Z][a-zA-Z0-9]*$/

const numberParameter = z
  .strictObject({
    type: z.literal('number'),
    id: z.string().regex(parameterId),
    label: z.string().min(1),
    symbol: z.string().optional(),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    default: z.number(),
    control: z.enum(['slider', 'chart-handle', 'both']),
  })
  .superRefine((p, ctx) => {
    if (!(p.min < p.max)) ctx.addIssue({ code: 'custom', path: ['max'], message: 'min must be less than max' })
    if (!isOnGrid(p.min, p.step, 0)) ctx.addIssue({ code: 'custom', path: ['min'], message: 'min must be a multiple of step' })
    if (!isOnGrid(p.max, p.step, 0)) ctx.addIssue({ code: 'custom', path: ['max'], message: 'max must be a multiple of step' })
    if (p.default < p.min || p.default > p.max) {
      ctx.addIssue({ code: 'custom', path: ['default'], message: 'default must be in [min, max]' })
    } else if (!isOnGrid(p.default, p.step, p.min)) {
      ctx.addIssue({ code: 'custom', path: ['default'], message: 'default must be a multiple of step from min' })
    }
  })

const choiceParameter = z
  .strictObject({
    type: z.literal('choice'),
    id: z.string().regex(parameterId),
    label: z.string().min(1),
    options: z.array(z.strictObject({ value: z.string().min(1), label: z.string().min(1) })).min(2),
    default: z.string(),
  })
  .superRefine((p, ctx) => {
    const values = p.options.map((o) => o.value)
    if (new Set(values).size !== values.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'option values must be unique' })
    }
    if (!values.includes(p.default)) {
      ctx.addIssue({ code: 'custom', path: ['default'], message: 'default must be one of the option values' })
    }
  })

const parameter = z.union([numberParameter, choiceParameter])

const outputSpec = z.strictObject({
  key: z.string().min(1),
  label: z.string().min(1),
  symbol: z.string().optional(),
  decimals: z.number().int().min(0).max(6),
})

const formula = z.strictObject({
  latex: z.string().min(1),
  symbols: z.array(z.strictObject({ symbol: z.string().min(1), meaning: z.string().min(1) })).min(1),
})

const workedStep = z.strictObject({ text: z.string().min(1), latex: z.string().min(1) })

function variantOf<T extends z.ZodType>(schema: T) {
  return z.union([schema, z.strictObject({ variantBy: z.string().min(1), variants: z.record(z.string(), schema) })])
}

const lessonFields = {
  id: z.string().regex(kebab),
  topic: z.enum(TOPIC_IDS),
  order: z.number().int().min(1),
  title: z.string().min(1).max(60),
  summary: z.string().min(1).max(160),
  chart: z.strictObject({ type: z.string().min(1), options: z.record(z.string(), z.unknown()).optional() }),
  parameters: z.array(parameter).min(1),
  outputs: z.array(outputSpec).min(1),
  formula: variantOf(formula),
  workedExample: variantOf(z.array(workedStep).min(1)),
  chartSummary: variantOf(z.string().min(1)),
}

export const staticLessonSchema = z
  .strictObject({
    ...lessonFields,
    model: z.strictObject({ id: z.string().min(1), bind: z.record(z.string(), z.string()).optional() }),
    datasetId: z.string().regex(kebab).optional(),
  })
  .superRefine((lesson, ctx) => {
    const ids = lesson.parameters.map((p) => p.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['parameters'], message: 'parameter ids must be unique' })
    }
  })

export const trainingLessonSchema = z
  .strictObject({
    ...lessonFields,
    kind: z.literal('training'),
    training: z.strictObject({
      adapter: z.string().min(1),
      landscape: z.string().min(1),
      dimensions: z.union([z.literal(1), z.literal(2)]),
      weightParameters: z.array(z.string().regex(parameterId)).min(1).max(2),
      rateParameter: z.string().regex(parameterId),
      presets: z.strictObject({ small: z.number(), good: z.number(), large: z.number() }),
    }),
  })
  .superRefine((lesson, ctx) => {
    const ids = lesson.parameters.map((p) => p.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['parameters'], message: 'parameter ids must be unique' })
    }
    if (lesson.training.weightParameters.length !== lesson.training.dimensions
      || new Set(lesson.training.weightParameters).size !== lesson.training.weightParameters.length) {
      ctx.addIssue({ code: 'custom', path: ['training', 'weightParameters'], message: 'unique weight parameters must match dimensions' })
    }
    const rate = lesson.parameters.find((p) => p.id === lesson.training.rateParameter)
    if (rate?.type !== 'number') return
    if (rate.min < 0) {
      ctx.addIssue({ code: 'custom', path: ['training', 'rateParameter'], message: 'learning rate range must be non-negative' })
    }
    for (const [name, value] of Object.entries(lesson.training.presets)) {
      if (value < rate.min || value > rate.max || !isOnGrid(value, rate.step, rate.min)) {
        ctx.addIssue({ code: 'custom', path: ['training', 'presets', name], message: 'preset must be in range and on the learning-rate grid' })
      }
    }
  })

export const lessonSchema = z.union([staticLessonSchema, trainingLessonSchema])

export const datasetSchema = z.strictObject({
  id: z.string().regex(kebab),
  label: z.string().min(1),
  points: z
    .array(z.strictObject({ x: z.number().finite(), y: z.number().finite() }))
    .min(1)
    .max(10),
})

export type LessonJson = z.infer<typeof staticLessonSchema>
export type TrainingLessonJson = z.infer<typeof trainingLessonSchema>
export type Dataset = z.infer<typeof datasetSchema>
export type Parameter = LessonJson['parameters'][number]
export type NumberParameter = z.infer<typeof numberParameter>
export type ChoiceParameter = z.infer<typeof choiceParameter>
export type OutputSpec = z.infer<typeof outputSpec>
export type Formula = z.infer<typeof formula>
export type WorkedStep = z.infer<typeof workedStep>
export type Lesson = LessonJson & { intuition: string }
export type TrainingLesson = TrainingLessonJson & { intuition: string }
export type AnyLesson = Lesson | TrainingLesson

export function isTrainingLesson(lesson: AnyLesson): lesson is TrainingLesson {
  return 'kind' in lesson && lesson.kind === 'training'
}
