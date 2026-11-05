import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

const height = () => screen.getByRole('slider', { name: 'Height of the line (chart handle)' })
const steepness = () => screen.getByRole('slider', { name: 'Steepness of the line (chart handle)' })
const mse = () => screen.getByTestId('readout-mse')
const errors = () => screen.getAllByTestId('error-label').map((e) => e.textContent)

beforeEach(() => {
  render(<LessonLayout lesson={getLesson('loss')!} />)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Loss lesson', () => {
  it('D-10: the default view shows the three errors and the loss, and never names w or b', () => {
    expect(errors()).toEqual(['-1.00', '-2.00', '-2.00'])
    expect(mse()).toHaveTextContent('3.000')
    expect(screen.getByTestId('chart-summary')).toHaveTextContent('Loss (MSE) is 3.000')
    expect(document.body.textContent).not.toMatch(/(^|[\s(])[wb]\s*(=|\)|,)/)
    expect(screen.queryByText('w')).not.toBeInTheDocument()
    expect(screen.queryByText('b')).not.toBeInTheDocument()
  })

  it('D-07: an arrow key on the height handle changes it by 0.1 and updates errors and loss', async () => {
    const user = userEvent.setup()
    height().focus()
    await user.keyboard('{ArrowUp}')
    expect(height()).toHaveAttribute('aria-valuenow', '0.1')
    expect(errors()).toEqual(['-0.90', '-1.90', '-1.90'])
    expect(mse()).toHaveTextContent('2.677')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(height()).toHaveAttribute('aria-valuenow', '-0.1')
    await user.keyboard('{ArrowRight}')
    expect(height()).toHaveAttribute('aria-valuenow', '-0.1')
  })

  it('D-08: Shift and an arrow on the slope handle changes the steepness by 1.0', async () => {
    const user = userEvent.setup()
    steepness().focus()
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')
    expect(steepness()).toHaveAttribute('aria-valuenow', '2')
    expect(errors()).toEqual(['0.00', '0.00', '1.00'])
    expect(mse()).toHaveTextContent('0.333')
    expect(screen.getByTestId('chart-summary')).toHaveTextContent('Errors: 0.00, 0.00, 1.00. Loss (MSE) is 0.333.')
    const lastStep = screen.getByTestId('worked-example').textContent ?? ''
    expect(lastStep).toContain('= 0.333')
  })

  it('D-09: dragging the height handle follows the pointer, snapped to 0.1', () => {
    const rect = { left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect as DOMRect)
    const cy = () => Number(height().querySelector('circle')!.getAttribute('cy'))

    const atZero = cy()
    fireEvent.keyDown(height(), { key: 'ArrowUp', shiftKey: true })
    const perUnit = atZero - cy()
    expect(perUnit).toBeGreaterThan(0)
    fireEvent.keyDown(height(), { key: 'ArrowDown', shiftKey: true })
    expect(height()).toHaveAttribute('aria-valuenow', '0')

    fireEvent.pointerDown(height(), { clientX: 100, clientY: atZero, pointerId: 1 })
    fireEvent.pointerMove(height(), { clientX: 100, clientY: atZero - 2.54 * perUnit, pointerId: 1 })
    expect(height()).toHaveAttribute('aria-valuenow', '2.5')
    fireEvent.pointerMove(height(), { clientX: 100, clientY: atZero + 99 * perUnit, pointerId: 1 })
    expect(height()).toHaveAttribute('aria-valuenow', '-5')
    fireEvent.pointerUp(height(), { pointerId: 1 })
    fireEvent.pointerMove(height(), { clientX: 100, clientY: atZero, pointerId: 1 })
    expect(height()).toHaveAttribute('aria-valuenow', '-5')
  })

  it('G3: the control panel shows the current values read-only, with one decimal', async () => {
    const user = userEvent.setup()
    expect(screen.queryByRole('slider', { name: 'Steepness of the line' })).not.toBeInTheDocument()
    expect(screen.getByTestId('value-steepness')).toHaveTextContent('1.0')
    expect(screen.getByTestId('value-height')).toHaveTextContent('0.0')
    height().focus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByTestId('value-height')).toHaveTextContent('0.1')
  })

  it('draws error segments with values and a solid line, so colour is not the only cue', () => {
    expect(screen.getAllByTestId('error-segment')).toHaveLength(3)
    expect(screen.getByTestId('fit-line')).not.toHaveAttribute('stroke-dasharray')
    expect(screen.getAllByTestId('error-segment')[0]).toHaveAttribute('stroke-dasharray')
  })
})
