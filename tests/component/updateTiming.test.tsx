import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

afterEach(() => {
  vi.useRealTimers()
})

describe('update timing (D-25 to D-27, G1)', () => {
  const actions: [string, string, () => void, string][] = [
    ['function-and-slope', 'readout-slope', () => fireEvent.change(screen.getByRole('slider', { name: 'Point position' }), { target: { value: '1.5' } }), '3.0'],
    ['loss', 'readout-mse', () => fireEvent.keyDown(screen.getByRole('slider', { name: 'Steepness of the line (chart handle)' }), { key: 'ArrowUp', shiftKey: true }), '0.333'],
    ['weight-and-bias', 'readout-mse', () => fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '2' } }), '0.750'],
  ]

  it.each(actions)('D-25: %s updates the DOM within 100 ms of the event', (id, readout, act1, expected) => {
    // One untimed pass first, so one-off module and JIT warm-up in a busy test worker is not counted as update time.
    render(<LessonLayout lesson={getLesson(id)!} />)
    act1()
    cleanup()

    render(<LessonLayout lesson={getLesson(id)!} />)
    const start = performance.now()
    act1()
    const elapsed = performance.now() - start
    expect(screen.getByTestId(readout)).toHaveTextContent(expected)
    expect(elapsed).toBeLessThan(100)
  })

  it('D-26: the update is already in the DOM right after the event, with no timers pending', () => {
    vi.useFakeTimers()
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '2' } })
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.getByTestId('readout-mse')).toHaveTextContent('0.750')
  })

  it('D-27: 50 rapid changes end with the final value everywhere, and numbers agree with the chart', () => {
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    const slider = screen.getByRole('slider', { name: 'Weight' })
    act(() => {
      for (let i = 0; i < 50; i++) fireEvent.change(slider, { target: { value: String(-3 + i * 0.1) } })
    })
    expect(slider).toHaveValue('1.9')
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('1.9')
    expect(screen.getByTestId('chart-summary')).toHaveTextContent('Line y = 1.9x + 0.0 over 4 points')
    expect(screen.getByTestId('worked-example')).toHaveTextContent('1.9')
    expect(screen.getAllByTestId('error-label').map((e) => e.textContent)).toEqual(['-1.10', '-1.20', '-1.30', '-0.40'])
    expect(screen.getByTestId('readout-mse')).toHaveTextContent('1.125')
  })
})
