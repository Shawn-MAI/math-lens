import type { TrainingSnapshot } from '../../core/training/types'

export type TrainingTrendKind = 'insufficient' | 'slow' | 'decrease' | 'increase' | 'unchanged'

export function classifyTrainingTrend(snapshots: readonly TrainingSnapshot[]): { kind: TrainingTrendKind; alternating: boolean } {
  if (snapshots.some((snapshot) => !Number.isFinite(snapshot.loss) || !snapshot.weights.every(Number.isFinite))) {
    throw new Error('Trend requires finite loss and weight values')
  }
  if (snapshots.length < 11) return { kind: 'insufficient', alternating: false }
  const window = snapshots.slice(-11)
  const dimensions = window[0]!.weights.length
  if (dimensions < 1 || window.some((snapshot) => snapshot.weights.length !== dimensions)) {
    throw new Error('Trend weight dimensions must match')
  }
  let alternating = false
  for (let coordinate = 0; coordinate < dimensions; coordinate++) {
    let previousDirection = 0
    for (let index = 1; index < window.length; index++) {
      const current = window[index]!.weights[coordinate]!
      const previous = window[index - 1]!.weights[coordinate]!
      const direction = current > previous ? 1 : current < previous ? -1 : 0
      if (direction !== 0 && previousDirection !== 0 && direction !== previousDirection) alternating = true
      if (direction !== 0) previousDirection = direction
    }
  }
  const first = window[0]!.loss
  const last = window[10]!.loss
  let kind: TrainingTrendKind
  if (last > first) kind = 'increase'
  else if (last === first) kind = 'unchanged'
  else if (first > 0 && last >= first * 0.9) kind = 'slow'
  else kind = 'decrease'
  return { kind, alternating }
}
