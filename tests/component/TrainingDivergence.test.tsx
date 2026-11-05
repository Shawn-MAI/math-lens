import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

it('shows finite off-screen data, reports divergence, and recovers at the last valid tip', () => {
  const lesson = getLesson('gradient-descent-1d')
  if (!lesson) throw new Error('Gradient descent lesson is missing')
  const { container } = render(<LessonLayout lesson={lesson} />)
  fireEvent.click(screen.getByRole('button', { name: /large rate/i }))
  for (let i = 0; i < 1000 && !screen.queryByText(/step \d+ is non-finite/i); i++) {
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  }
  const message = screen.getByText(/step \d+ is non-finite/i)
  expect(message).toHaveAttribute('role', 'status')
  expect(screen.getByText(/off.screen/i)).toBeInTheDocument()
  expect(screen.getByTestId('training-inspection')).toHaveTextContent(/preview is unavailable/i)
  expect(container.textContent).not.toMatch(/NaN|Infinity/)
  for (const svg of container.querySelectorAll('svg')) expect(svg.outerHTML).not.toMatch(/NaN|Infinity/)
  const index = Number(screen.getByRole('slider', { name: /training timeline/i }).getAttribute('value'))
  fireEvent.click(screen.getByRole('button', { name: /small rate/i }))
  fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  expect(screen.getByTestId('training-current-values')).toHaveTextContent(`Step ${index + 1}`)
  const timeline = screen.getByRole('slider', { name: /training timeline/i })
  fireEvent.change(timeline, { target: { value: '1' } })
  expect(screen.getByTestId('training-current-values')).toHaveTextContent('Step 1')
}, 120000)
