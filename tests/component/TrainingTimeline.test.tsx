import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { convex1d } from '../../src/core/training/landscapes'
import { gradientDescent } from '../../src/core/training/gradientDescent'
import { createTrainingStore } from '../../src/sim/training/store'
import { TrainingTimeline } from '../../src/ui/components/TrainingTimeline'

it('exposes a labelled timeline that pauses and seeks the real store', () => {
  const store = createTrainingStore({ adapter: gradientDescent, landscape: convex1d, start: [-4], rate: 0.2 })
  store.getState().stepForward()
  store.getState().stepForward()
  render(<TrainingTimeline store={store} />)
  store.getState().play()
  fireEvent.change(screen.getByRole('slider', { name: /training timeline/i }), { target: { value: '1' } })
  expect(store.getState().playing).toBe(false)
  expect(store.getState().snapshot.index).toBe(1)
  expect(screen.getByRole('combobox', { name: /branch/i })).toHaveValue('branch-1')
  store.getState().dispose()
})
