import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import references from '../fixtures/training-reference-values.json'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

function open() {
  const lesson = getLesson('gradient-descent-2d')
  if (!lesson) throw new Error('2D training lesson is missing')
  return render(<LessonLayout lesson={lesson} />)
}

function setValue(name: string, value: number) {
  const input = screen.getByRole('textbox', { name })
  fireEvent.change(input, { target: { value: String(value) } })
  fireEvent.blur(input)
}

describe('two-dimensional training', () => {
  it.each(references.cases.filter((entry) => entry.landscape === 'convex-2d'))(
    '$id displays both coordinates, gradient components and next values',
    (entry) => {
      open()
      setValue('First weight value', entry.start.weights[0]!)
      setValue('Second weight value', entry.start.weights[1]!)
      setValue('Learning rate value', entry.rate)
      const readout = screen.getByTestId('training-inspection')
      for (const value of [...entry.start.weights, entry.start.loss, ...entry.start.gradient, entry.rate, ...entry.result.weights]) {
        expect(readout).toHaveTextContent(value.toFixed(6))
      }
      expect(readout).toHaveTextContent('≈')
    },
  )

  it('updates both coordinates simultaneously and synchronizes the contour and history', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    const marker = screen.getByTestId('training-contour-marker')
    expect(marker).toHaveAttribute('data-x', '3.4')
    expect(marker).toHaveAttribute('data-y', '-1')
    expect(screen.getByTestId('loss-history-cursor')).toHaveAttribute('data-step', '1')
    expect(screen.getByTestId('training-inspection')).toHaveTextContent('10.780000')
    fireEvent.change(screen.getByRole('slider', { name: /training timeline/i }), { target: { value: '0' } })
    expect(screen.getByTestId('training-contour-marker')).toHaveAttribute('data-x', '4')
  })

  it('sets a two-coordinate start by pointer and resets playback', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    const handle = screen.getByRole('button', { name: /drag starting point/i })
    const svg = handle.closest('svg')
    if (!svg) throw new Error('Missing contour interaction layer')
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 600, bottom: 400, x: 0, y: 0, width: 600, height: 400, toJSON: () => ({}),
    })
    fireEvent.pointerDown(handle, { pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerMove(handle, { pointerId: 1, pointerType: 'touch', clientX: 352, clientY: 232 })
    fireEvent.pointerUp(handle, { pointerId: 1, pointerType: 'touch' })
    expect(screen.getByRole('textbox', { name: 'First weight value' })).toHaveValue('1.0')
    expect(screen.getByRole('textbox', { name: 'Second weight value' })).toHaveValue('-1.0')
    expect(screen.getByTestId('training-current-values')).toHaveTextContent('Step 0')
  })

  it('lets a keyboard user enter each coordinate separately', async () => {
    const user = userEvent.setup()
    open()
    const first = screen.getByRole('textbox', { name: 'First weight value' })
    const second = screen.getByRole('textbox', { name: 'Second weight value' })
    await user.clear(first)
    await user.type(first, '-2{Enter}')
    await user.clear(second)
    await user.type(second, '1{Enter}')
    expect(screen.getByTestId('training-contour-marker')).toHaveAttribute('data-x', '-2')
    expect(screen.getByTestId('training-contour-marker')).toHaveAttribute('data-y', '1')
    expect(screen.getByRole('img', { name: /contour/i })).toHaveAttribute('aria-describedby')
  })

  it('moves the starting point with arrow keys and displays actual contours', () => {
    open()
    const image = screen.getByRole('img', { name: /contour/i })
    expect(image.querySelectorAll('g path').length).toBeGreaterThan(1)
    const handle = screen.getByRole('button', { name: /drag starting point/i })
    fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true })
    fireEvent.keyDown(handle, { key: 'ArrowDown', shiftKey: true })
    expect(screen.getByTestId('training-contour-marker')).toHaveAttribute('data-x', '3')
    expect(screen.getByTestId('training-contour-marker')).toHaveAttribute('data-y', '1')
  })

  it.each([
    ['Small rate', 0.9, 1],
    ['Good rate', 0, 0.8],
    ['Large rate', 1, Number.POSITIVE_INFINITY],
  ])('%s meets the ten-step loss threshold', (preset, minimum, maximum) => {
    open()
    fireEvent.click(screen.getByRole('button', { name: preset }))
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    const lossText = screen.getByTestId('training-current-values').textContent?.match(/Loss:\s*([0-9.e+-]+)/i)
    if (!lossText) throw new Error('Current loss is missing')
    const ratio = Number(lossText[1]) / 28
    expect(ratio).toBeGreaterThanOrEqual(minimum)
    expect(ratio).toBeLessThan(maximum)
  })

  it('retains the original branch after changing rate at an earlier 2D state', () => {
    open()
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    fireEvent.change(screen.getByRole('slider', { name: /training timeline/i }), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /large rate/i }))
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    const branch = screen.getByRole('combobox', { name: /branch/i })
    expect(branch.querySelectorAll('option')).toHaveLength(2)
    fireEvent.change(branch, { target: { value: 'branch-1' } })
    expect(screen.getByTestId('training-contour-marker')).toHaveAttribute('data-x', '3.4')
    expect(screen.getByTestId('training-contour-marker')).toHaveAttribute('data-y', '-1')
  })

  it('reports real 2D overflow without invalid chart coordinates', () => {
    const { container } = open()
    fireEvent.click(screen.getByRole('button', { name: /large rate/i }))
    for (let i = 0; i < 1000 && !screen.queryByText(/step \d+ is non-finite/i); i++) {
      fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
    }
    expect(screen.getByText(/step \d+ is non-finite/i)).toBeInTheDocument()
    for (const svg of container.querySelectorAll('svg')) expect(svg.outerHTML).not.toMatch(/NaN|Infinity/)
  }, 120000)
})
