import { describe, expect, it } from 'vitest'
import staticLesson from '../../../src/content/lessons/foundations/weight-and-bias/lesson.json'
import { buildCatalog, type ContentFiles } from '../../../src/sim/content/loader'
import { lessonSchema } from '../../../src/sim/content/schema'
import type { TrainingRegistry } from '../../../src/sim/training/registry'

const weight = {
  type: 'number', id: 'w', label: 'Weight', min: -5, max: 5,
  step: 0.1, default: -4, control: 'slider',
}
const rate = {
  type: 'number', id: 'rate', label: 'Learning rate', min: 0, max: 4,
  step: 0.0005, default: 0.2, control: 'slider',
}
const training = {
  adapter: 'test-adapter',
  landscape: 'test-landscape',
  dimensions: 1,
  weightParameters: ['w'],
  rateParameter: 'rate',
  presets: { small: 0.0005, good: 0.2, large: 4 },
}
const lesson = {
  kind: 'training',
  id: 'one',
  topic: 'optimization',
  order: 1,
  title: 'Training',
  summary: 'Test training lesson',
  chart: { type: 'training-curve' },
  parameters: [weight, rate],
  outputs: [{ key: 'loss', label: 'Loss', decimals: 6 }],
  training,
  formula: {
    latex: 'w - \\eta g',
    symbols: [
      { symbol: 'w', meaning: 'weight' },
      { symbol: '\\eta', meaning: 'learning rate' },
      { symbol: 'g', meaning: 'gradient' },
    ],
  },
  workedExample: [{ text: 'Current loss: {{loss}}', latex: 'L = {{loss}}' }],
  chartSummary: 'Loss {{loss}}',
}
const registry: TrainingRegistry = {
  adapters: {
    'test-adapter': {
      id: 'test-adapter', dimensions: 1,
      step: () => ({ kind: 'non-finite', stage: 'input' }),
    },
  },
  landscapes: {
    'test-landscape': {
      id: 'test-landscape', dimensions: 1, loss: () => 0, gradient: () => [0],
    },
    'two-dimensional': {
      id: 'two-dimensional', dimensions: 2, loss: () => 0, gradient: () => [0, 0],
    },
  },
  charts: { 'training-curve': 1, 'training-contour': 2 },
}

function files(value: unknown): ContentFiles {
  return {
    lessons: { '/src/content/lessons/optimization/one/lesson.json': value },
    intuitions: { '/src/content/lessons/optimization/one/intuition.md': 'Training intuition' },
    datasets: {},
  }
}

describe('training lesson content', () => {
  it('schema accepts a valid training variant and preserves existing static lessons', () => {
    expect(lessonSchema.safeParse(staticLesson).success).toBe(true)
    expect(lessonSchema.safeParse(lesson).success).toBe(true)
  })

  it('loads a valid training variant with a registered test adapter', () => {
    expect(buildCatalog(files(lesson), undefined, registry).getLesson('one')).toMatchObject({ kind: 'training' })
  })

  it.each([
    ['unsupported dimension', { ...lesson, training: { ...training, dimensions: 3 } }],
    ['duplicate parameter IDs', { ...lesson, parameters: [weight, weight, rate] }],
    ['non-finite start', { ...lesson, parameters: [{ ...weight, default: Infinity }, rate] }],
    ['unordered range', { ...lesson, parameters: [{ ...weight, min: 5, max: -5 }, rate] }],
    ['off-grid default', { ...lesson, parameters: [{ ...weight, default: -3.95 }, rate] }],
    ['negative learning rate range', { ...lesson, parameters: [weight, { ...rate, min: -1 }] }],
    ['off-grid preset', { ...lesson, training: { ...training, presets: { ...training.presets, small: 0.0003 } } }],
  ])('rejects %s at the schema boundary', (_name, invalid) => {
    expect(lessonSchema.safeParse(invalid).success).toBe(false)
  })

  it.each([
    ['unknown adapter', { ...lesson, training: { ...training, adapter: 'missing' } }, /adapter/i],
    ['unknown landscape', { ...lesson, training: { ...training, landscape: 'missing' } }, /landscape/i],
    ['unknown chart', { ...lesson, chart: { type: 'missing' } }, /chart/i],
    ['dimension mismatch', { ...lesson, training: { ...training, landscape: 'two-dimensional' } }, /dimension/i],
    ['missing weight binding', { ...lesson, training: { ...training, weightParameters: ['missing'] } }, /weight|binding|parameter/i],
    ['missing rate binding', { ...lesson, training: { ...training, rateParameter: 'missing' } }, /rate|binding|parameter/i],
    ['missing symbol explanation', { ...lesson, formula: { ...lesson.formula, symbols: lesson.formula.symbols.slice(1) } }, /symbol|weight/i],
    ['unknown template reference', { ...lesson, chartSummary: 'Value {{missing}}' }, /template|missing|reference/i],
  ])('reports %s with lesson context', (_name, invalid, message) => {
    expect(() => buildCatalog(files(invalid), undefined, registry)).toThrow(message)
    expect(() => buildCatalog(files(invalid), undefined, registry)).toThrow(/one/)
  })
})
