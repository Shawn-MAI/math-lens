import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

it('retains and restores every displayed state of 1000 real updates', () => {
  const lesson = getLesson('gradient-descent-1d')
  if (!lesson) throw new Error('Gradient descent lesson is missing')
  render(<LessonLayout lesson={lesson} />)
  const timeline = screen.getByRole('slider', { name: /training timeline/i })
  const rate = screen.getByRole('textbox', { name: 'Learning rate value' })
  fireEvent.change(rate, { target: { value: '0.0005' } })
  fireEvent.blur(rate)
  const displayed: string[] = [screen.getByTestId('training-current-values').textContent ?? '']
  const weights: string[] = [screen.getByTestId('training-weights').textContent ?? '']
  for (let index = 1; index <= 1000; index++) {
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    displayed.push(screen.getByTestId('training-current-values').textContent ?? '')
    weights.push(screen.getByTestId('training-weights').textContent ?? '')
  }
  expect(new Set(displayed).size).toBe(1001)
  expect(new Set(weights).size).toBe(1001)
  expect(screen.getByText(/reached the 1000-update limit/i)).toHaveAttribute('role', 'status')
  for (let index = 1000; index >= 0; index--) {
    fireEvent.change(timeline, { target: { value: String(index) } })
    expect(screen.getByTestId('training-current-values').textContent).toBe(displayed[index])
  }
  for (let index = 0; index <= 1000; index++) {
    fireEvent.change(timeline, { target: { value: String(index) } })
    expect(screen.getByTestId('training-current-values').textContent).toBe(displayed[index])
  }
}, 120000)

it('reports zero-rate no progress without claiming a stationary point', () => {
  const lesson = getLesson('gradient-descent-1d')
  if (!lesson) throw new Error('Gradient descent lesson is missing')
  render(<LessonLayout lesson={lesson} />)
  const rate = screen.getByRole('textbox', { name: 'Learning rate value' })
  fireEvent.change(rate, { target: { value: '0' } })
  fireEvent.blur(rate)
  fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  expect(screen.getByText(/no progress/i)).toHaveAttribute('role', 'status')
  expect(screen.getByText(/no progress/i)).not.toHaveTextContent(/stationary/i)
  expect(screen.getByTestId('training-inspection')).toHaveTextContent(/step 1/i)
  const first = screen.getByTestId('training-weights').textContent
  const timeline = screen.getByRole('slider', { name: /training timeline/i })
  fireEvent.change(timeline, { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  expect(screen.getByTestId('training-weights').textContent).toBe(first)
  fireEvent.click(screen.getByRole('button', { name: /^reset$/i }))
  expect(screen.getByTestId('training-inspection')).toHaveTextContent(/step 0/i)
})
