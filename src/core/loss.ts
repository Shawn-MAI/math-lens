import { sum } from './numeric'

function assertSameLength(predictions: number[], actuals: number[]): void {
  if (predictions.length !== actuals.length) {
    throw new RangeError(`predictions (${predictions.length}) and actual values (${actuals.length}) must have the same length`)
  }
}

/** error = prediction - actual, so a line below the data gives negative errors. */
export function residuals(predictions: number[], actuals: number[]): number[] {
  assertSameLength(predictions, actuals)
  return predictions.map((p, i) => p - actuals[i]!)
}

export function squaredErrors(errors: number[]): number[] {
  return errors.map((e) => e * e)
}

/** Mean squared error: the sum of squared errors divided by the number of points. */
export function mse(predictions: number[], actuals: number[]): number {
  assertSameLength(predictions, actuals)
  if (predictions.length === 0) throw new RangeError('MSE needs at least one data point')
  return sum(squaredErrors(residuals(predictions, actuals))) / predictions.length
}
