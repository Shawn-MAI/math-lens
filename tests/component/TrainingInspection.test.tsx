import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

it('scrubs and branches while keeping recorded and preview calculations inspectable', async () => {
  const lesson = getLesson('gradient-descent-1d')
  if (!lesson) throw new Error('Gradient descent lesson is missing')
  const user = userEvent.setup()
  render(<LessonLayout lesson={lesson} />)
  for (let i = 0; i < 10; i++) fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  const timeline = screen.getByRole('slider', { name: /training timeline/i })
  fireEvent.change(timeline, { target: { value: '3' } })
  const original = screen.getByTestId('training-inspection').textContent
  expect(screen.getByTestId('loss-history-cursor')).toHaveAttribute('data-step', '3')
  expect(screen.getByTestId('training-inspection')).toHaveTextContent(/recorded/i)
  timeline.focus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByTestId('loss-history-cursor')).toHaveAttribute('data-step', '4')
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByTestId('loss-history-cursor')).toHaveAttribute('data-step', '3')
  const rate = screen.getByRole('textbox', { name: 'Learning rate value' })
  fireEvent.change(rate, { target: { value: '0.4' } })
  fireEvent.blur(rate)
  const inspection = screen.getByTestId('training-inspection')
  expect(inspection).toHaveTextContent(/recorded/i)
  expect(inspection).toHaveTextContent(/preview/i)
  expect(inspection).toHaveTextContent('≈')
  fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  const branch = screen.getByRole('combobox', { name: /branch/i })
  expect(within(branch).getAllByRole('option')).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: /^play$/i }))
  await user.selectOptions(branch, 'branch-1')
  expect(screen.getByRole('button', { name: /^play$/i })).toBeEnabled()
  expect(screen.getByTestId('training-inspection').textContent).toBe(original)
  expect(screen.getByRole('textbox', { name: 'Learning rate value' })).toHaveValue('0.2000')
  await user.selectOptions(branch, 'branch-2')
  expect(screen.getByTestId('loss-history-cursor')).toHaveAttribute('data-step', '4')
  expect(screen.getByRole('textbox', { name: 'Learning rate value' })).toHaveValue('0.4000')
})
