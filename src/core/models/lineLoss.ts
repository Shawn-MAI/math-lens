import { predict } from '../linear'
import { mse, residuals, squaredErrors } from '../loss'
import type { Model } from '../types'

/** The line is drawn between these x values, the ends of the chart's x-axis. */
const LINE_X = [0, 5]

export const lineLoss: Model = {
  id: 'line-loss',
  roles: ['slope', 'intercept'],
  choiceInputs: [],
  needsDataset: true,
  outputKeys: ['n', 'predictions', 'errors', 'squaredErrors', 'mse', 'lineX', 'lineY'],
  compute({ values }, dataset) {
    const { slope, intercept } = values
    if (slope === undefined || intercept === undefined || !Number.isFinite(slope) || !Number.isFinite(intercept)) {
      throw new RangeError(`slope and intercept must be finite numbers, got ${slope} and ${intercept}`)
    }
    if (!dataset) throw new Error('line-loss needs a dataset')

    const actuals = dataset.map((p) => p.y)
    const predictions = dataset.map((p) => predict(slope, intercept, p.x))
    const errors = residuals(predictions, actuals)

    return {
      n: dataset.length,
      predictions,
      errors,
      squaredErrors: squaredErrors(errors),
      mse: mse(predictions, actuals),
      lineX: [...LINE_X],
      lineY: LINE_X.map((x) => predict(slope, intercept, x)),
    }
  },
}
