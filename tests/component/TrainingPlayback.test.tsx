import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import references from '../fixtures/training-reference-values.json'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

function openLesson() {
  const lesson = getLesson('gradient-descent-1d')
  if (!lesson) throw new Error('Gradient descent lesson is missing from the catalog')
  return render(<LessonLayout lesson={lesson} />)
}

function setValue(name: string, value: number) {
  const input = screen.getByRole('textbox', { name })
  fireEvent.change(input, { target: { value: String(value) } })
  fireEvent.blur(input)
}

describe('1D training lesson', () => {
  afterEach(() => vi.useRealTimers())

  it('orders intuition, the interactive demo, formula and worked example', () => {
    openLesson()
    expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent))
      .toEqual(['Intuition', 'Try it', 'Formula', 'Worked example'])
    expect(within(screen.getByRole('region', { name: 'Try it' })).getAllByRole('img').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: /play/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /step back/i })).toBeDisabled()
  })

  it.each(references.cases.filter((entry) => entry.landscape === 'convex-1d'))(
    '$id displays the actual starting values and outgoing update',
    (entry) => {
      openLesson()
      setValue('Weight value', entry.start.weights[0]!)
      setValue('Learning rate value', entry.rate)
      const readout = screen.getByTestId('training-inspection')
      expect(readout).toHaveTextContent(entry.start.weights[0]!.toFixed(6))
      expect(readout).toHaveTextContent(entry.start.loss.toFixed(6))
      expect(readout).toHaveTextContent(entry.start.gradient[0]!.toFixed(6))
      expect(readout).toHaveTextContent(entry.rate.toFixed(6))
      expect(readout).toHaveTextContent(entry.result.weights[0]!.toFixed(6))
      expect(readout).toHaveTextContent('≈')
    },
  )

  it('steps and resets to the chosen start, updating chart and numbers together', () => {
    openLesson()
    setValue('Weight value', 0)
    setValue('Learning rate value', 0.5)
    const marker = screen.getByTestId('training-curve-marker')
    expect(marker).toHaveAttribute('data-weight', '0')
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    expect(screen.getByTestId('training-curve-marker')).toHaveAttribute('data-weight', '1')
    expect(screen.getByTestId('training-inspection')).toHaveTextContent('1.000000')
    fireEvent.click(screen.getByRole('button', { name: /^reset$/i }))
    expect(screen.getByTestId('training-curve-marker')).toHaveAttribute('data-weight', '0')
    expect(screen.getByTestId('training-inspection')).toHaveTextContent('2.000000')
  })

  it('rejects invalid rate input and clamps out-of-range values with a message', () => {
    openLesson()
    setValue('Learning rate value', NaN)
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a number/i)
    expect(screen.getByRole('textbox', { name: 'Learning rate value' })).toHaveValue('0.2000')
    setValue('Learning rate value', 8)
    expect(screen.getByRole('alert')).toHaveTextContent(/0.*4/)
    expect(screen.getByRole('textbox', { name: 'Learning rate value' })).toHaveValue('4.0000')
  })

  it('operates step, play and pause from the keyboard', async () => {
    const user = userEvent.setup()
    openLesson()
    screen.getByRole('button', { name: /step forward/i }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('training-inspection')).toHaveTextContent(/step 1/i)
    screen.getByRole('button', { name: /^play$/i }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /^pause$/i })).toBeEnabled()
    screen.getByRole('button', { name: /^pause$/i }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /^play$/i })).toBeEnabled()
  })

  it('changes speed without starting playback and cancels work on unmount', () => {
    vi.useFakeTimers()
    const view = openLesson()
    fireEvent.change(screen.getByRole('combobox', { name: /speed/i }), { target: { value: '4' } })
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByTestId('training-inspection')).toHaveTextContent(/step 0/i)
    fireEvent.click(screen.getByRole('button', { name: /^play$/i }))
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByTestId('training-inspection')).toHaveTextContent(/step 1/i)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
