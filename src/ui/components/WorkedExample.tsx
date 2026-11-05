import type { WorkedStep } from '../../sim/content/schema'
import { Math } from './Math'

/** The steps of the worked example, with the current parameter values already substituted. */
export function WorkedExample({ steps }: { steps: WorkedStep[] }) {
  return (
    <ol data-testid="worked-example" className="worked-example">
      {steps.map((step, i) => (
        <li key={i}>
          <p>{step.text}</p>
          <Math latex={step.latex} display />
        </li>
      ))}
    </ol>
  )
}
