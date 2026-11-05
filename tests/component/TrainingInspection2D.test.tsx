import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { TrainingInspection } from '../../src/ui/components/TrainingInspection'

it('displays both simultaneous coordinate updates from the same unrounded snapshot', () => {
  const snapshot = { index: 0, weights: [4, 2], loss: 28, gradient: [4, 20] }
  const transition = {
    rate: 0.15, oldWeights: [4, 2], gradient: [4, 20], update: [-0.6, -3], newWeights: [3.4, -1],
  }
  render(<TrainingInspection snapshot={snapshot} recorded={transition} preview={null} />)
  const inspection = screen.getByTestId('training-inspection')
  expect(inspection).toHaveTextContent('4.000000 - 0.150000 × 4.000000 ≈ 3.400000')
  expect(inspection).toHaveTextContent('2.000000 - 0.150000 × 20.000000 ≈ -1.000000')
  expect(inspection).toHaveTextContent('28.000000')
})
