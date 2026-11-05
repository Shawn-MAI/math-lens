import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import references from '../fixtures/training-reference-values.json'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

function open() {
  const lesson = getLesson('gradient-descent-nonconvex')
  if (!lesson) throw new Error('Non-convex lesson is missing')
  return render(<LessonLayout lesson={lesson} />)
}

function setValue(name: string, value: number) {
  const input = screen.getByRole('textbox', { name })
  fireEvent.change(input, { target: { value: String(value) } })
  fireEvent.blur(input)
}

describe('non-convex lesson', () => {
  it.each(references.cases.filter((entry) => entry.landscape === 'nonconvex-1d'))(
    '$id displays every reference operand and resulting weight',
    (entry) => {
      open()
      setValue('Weight value', entry.start.weights[0]!)
      setValue('Learning rate value', entry.rate)
      const inspection = screen.getByTestId('training-inspection')
      expect(inspection).toHaveTextContent(entry.start.weights[0]!.toFixed(6))
      expect(inspection).toHaveTextContent(entry.start.loss.toFixed(6))
      expect(inspection).toHaveTextContent(entry.start.gradient[0]!.toFixed(6))
      expect(inspection).toHaveTextContent(entry.rate.toFixed(6))
      expect(inspection).toHaveTextContent(entry.result.weights[0]!.toFixed(6))
    },
  )

  it('resets and pauses when the starting handle changes by keyboard or pointer', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    const handle = screen.getByRole('slider', { name: /start weight on chart/i })
    fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true })
    expect(screen.getByTestId('training-current-values')).toHaveTextContent('Step 0')
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('-0.5')
    const svg = handle.closest('svg')
    if (!svg) throw new Error('Missing start handle overlay')
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 600, bottom: 400, x: 0, y: 0, width: 600, height: 400, toJSON: () => ({}),
    })
    fireEvent.pointerDown(handle, { pointerId: 1 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 365, clientY: 200 })
    fireEvent.pointerUp(handle, { pointerId: 1 })
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('0.5')
    expect(screen.getByTestId('training-curve-marker')).toHaveAttribute('data-weight', '0.5')
  })

  it('reaches two different observed stationary losses at the good rate', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /good rate/i }))
    const losses: number[] = []
    for (const start of [-0.5, 0.5]) {
      setValue('Weight value', start)
      for (let index = 0; index < 100 && !screen.queryByText(/stationary point reached/i); index++) {
        fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
      }
      expect(screen.getByText(/stationary point reached/i)).toBeInTheDocument()
      const match = screen.getByTestId('training-current-values').textContent?.match(/Loss:\s*([0-9.]+)/)
      if (!match) throw new Error('Stationary loss is missing')
      losses.push(Number(match[1]))
    }
    expect(losses[0]).toBeCloseTo(0.09755957, 5)
    expect(losses[1]).toBeCloseTo(0.49743415, 5)
  })

  it.each([
    ['Small rate', 'slow'],
    ['Good rate', 'decreased'],
    ['Large rate', 'increased'],
  ])('%s produces its observed ten-step loss trend', (preset, trend) => {
    open()
    fireEvent.click(screen.getByRole('button', { name: preset }))
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    expect(screen.getByTestId('training-trend')).toHaveTextContent(new RegExp(trend, 'i'))
  })
})
