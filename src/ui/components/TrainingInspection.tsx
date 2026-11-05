import type { TrainingSnapshot, TrainingStepResult, TrainingTransition } from '../../core/training/types'
import { formatTrainingNumber, formatTrainingUpdate } from '../../sim/training/format'

interface Props {
  snapshot: TrainingSnapshot
  recorded: TrainingTransition | null
  preview: TrainingStepResult | null
}

function equations(transition: TrainingTransition): string[] {
  return transition.oldWeights.map((weight, index) =>
    formatTrainingUpdate(weight, transition.rate, transition.gradient[index]!, transition.newWeights[index]!))
}

export function TrainingInspection({ snapshot, recorded, preview }: Props) {
  return (
    <div data-testid="training-inspection">
      <div data-testid="training-current-values">
        <p>Step {snapshot.index}</p>
        <p data-testid="training-weights">Weight: {snapshot.weights.map(formatTrainingNumber).join(', ')}</p>
        <p>Loss: {formatTrainingNumber(snapshot.loss)}</p>
        <p>Gradient: {snapshot.gradient.map(formatTrainingNumber).join(', ')}</p>
      </div>
      {recorded && <div><p>Recorded update:</p>{equations(recorded).map((text, index) => <p key={index}>{text}</p>)}</div>}
      {preview?.kind === 'success' && <div><p>Next update preview:</p>{equations(preview.transition).map((text, index) => <p key={index}>{text}</p>)}</div>}
      {preview?.kind === 'non-finite' && <p>Next update preview is unavailable because it is non-finite.</p>}
    </div>
  )
}
