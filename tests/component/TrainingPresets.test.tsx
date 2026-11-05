import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'
import { TrainingTrend } from '../../src/ui/components/TrainingTrend'

afterEach(() => vi.useRealTimers())

it('presets keep selection and play state, and notes reflect recorded loss', () => {
  vi.useFakeTimers()
  const lesson = getLesson('gradient-descent-1d')
  if (!lesson) throw new Error('Gradient descent lesson is missing')
  render(<LessonLayout lesson={lesson} />)
  expect(screen.getByText(/not enough.*steps/i)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /small rate/i }))
  expect(screen.getByRole('textbox', { name: 'Learning rate value' })).toHaveValue('0.0005')
  fireEvent.click(screen.getByRole('button', { name: /^play$/i }))
  act(() => vi.advanceTimersByTime(1000))
  fireEvent.click(screen.getByRole('button', { name: /good rate/i }))
  expect(screen.getByRole('button', { name: /^pause$/i })).toBeEnabled()
  expect(screen.getByTestId('training-current-values')).toHaveTextContent(/step 1/i)
  act(() => vi.advanceTimersByTime(9000))
  expect(screen.getByTestId('training-trend')).toHaveTextContent(/loss.*decreas/i)
  fireEvent.click(screen.getByRole('button', { name: /^pause$/i }))
  fireEvent.click(screen.getByRole('button', { name: /large rate/i }))
  expect(screen.getByRole('button', { name: /^play$/i })).toBeEnabled()
  expect(screen.getByTestId('training-current-values')).toHaveTextContent(/step 10/i)
})

it('describes a zero-baseline history without dividing by zero', () => {
  const snapshots = Array.from({ length: 11 }, (_, index) => ({
    index, weights: [index], loss: index === 10 ? 1 : 0, gradient: [1],
  }))
  render(<TrainingTrend snapshots={snapshots} />)
  expect(screen.getByTestId('training-trend')).toHaveTextContent(/loss.*increas/i)
  expect(screen.getByTestId('training-trend')).not.toHaveTextContent(/NaN|Infinity/i)
})
