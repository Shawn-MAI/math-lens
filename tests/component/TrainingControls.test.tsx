import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { convex1d } from '../../src/core/training/landscapes'
import { gradientDescent } from '../../src/core/training/gradientDescent'
import { createTrainingStore } from '../../src/sim/training/store'
import { TrainingControls } from '../../src/ui/components/TrainingControls'
import { trainingLesson } from '../fixtures/trainingLesson'

it('validates controls, updates the actual store, and preserves fine precision', () => {
  const store = createTrainingStore({ adapter: gradientDescent, landscape: convex1d, start: [-4], rate: 0.2 })
  render(<TrainingControls lesson={trainingLesson} store={store} />)
  fireEvent.change(screen.getByRole('slider', { name: 'Learning rate' }), { target: { value: '0.0005' } })
  expect(store.getState().rate).toBe(0.0005)
  expect(screen.getByRole('textbox', { name: 'Learning rate value' })).toHaveValue('0.0005')
  fireEvent.change(screen.getByRole('textbox', { name: 'Learning rate value' }), { target: { value: 'invalid' } })
  fireEvent.blur(screen.getByRole('textbox', { name: 'Learning rate value' }))
  expect(screen.getByRole('alert')).toHaveTextContent(/enter a number/i)
  expect(store.getState().rate).toBe(0.0005)
  fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  expect(store.getState().snapshot.index).toBe(1)
  store.getState().dispose()
})
