import type { TrainingSnapshot } from '../../core/training/types'
import { classifyTrainingTrend } from '../../sim/training/trend'

export function TrainingTrend({ snapshots }: { snapshots: readonly TrainingSnapshot[] }) {
  const trend = classifyTrainingTrend(snapshots)
  const descriptions = {
    insufficient: 'Not enough steps to establish a trend.',
    slow: 'The loss decreased slowly over the last ten steps.',
    decrease: 'The loss decreased over the last ten steps.',
    increase: 'The loss increased over the last ten steps.',
    unchanged: 'The loss did not change over the last ten steps.',
  }
  return (
    <p data-testid="training-trend">
      {descriptions[trend.kind]}{trend.alternating && ' The path also alternated direction.'}
    </p>
  )
}
