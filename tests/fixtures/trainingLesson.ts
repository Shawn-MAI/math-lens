import { trainingLessonSchema } from '../../src/sim/content/schema'

export const trainingLesson = {
  ...trainingLessonSchema.parse({
    kind: 'training', id: 'one', topic: 'optimization', order: 1, title: 'Training', summary: 'Training',
    chart: { type: 'training-curve' },
    parameters: [
      { type: 'number', id: 'w', label: 'Weight', min: -5, max: 5, step: 0.1, default: -4, control: 'slider' },
      { type: 'number', id: 'rate', label: 'Learning rate', min: 0, max: 4, step: 0.0005, default: 0.2, control: 'slider' },
    ],
    outputs: [{ key: 'loss', label: 'Loss', decimals: 6 }],
    training: { adapter: 'gradient-descent', landscape: 'convex-1d', dimensions: 1, weightParameters: ['w'], rateParameter: 'rate', presets: { small: 0.0005, good: 0.2, large: 4 } },
    formula: { latex: 'w', symbols: [{ symbol: 'w', meaning: 'weight' }] },
    workedExample: [{ text: 'Example {{loss}}', latex: 'L = {{loss}}' }], chartSummary: 'Loss {{loss}}',
  }),
  intuition: 'Training intuition',
}
