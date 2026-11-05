import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

function open() {
  render(<LessonLayout lesson={getLesson('function-and-slope')!} />)
}

const slider = () => screen.getByRole('slider', { name: 'Point position' })
const handle = () => screen.getByRole('slider', { name: 'Point position (chart handle)' })
const slopeReadout = () => screen.getByTestId('readout-slope')
const worked = () => screen.getByTestId('worked-example').textContent ?? ''
const formula = () => screen.getByTestId('formula').textContent ?? ''
const summary = () => screen.getByTestId('chart-summary').textContent ?? ''
const attr = (testId: string, name: string) => screen.getByTestId(testId).getAttribute(name)

describe('Function and slope lesson', () => {
  it('D-04: x = 1.5 on x² updates the handle, slope, worked example and summary together', () => {
    open()
    expect(slopeReadout()).toHaveTextContent('2.0')
    fireEvent.change(slider(), { target: { value: '1.5' } })

    expect(handle()).toHaveAttribute('aria-valuenow', '1.5')
    expect(slopeReadout()).toHaveTextContent('3.0')
    expect(screen.getByTestId('readout-y')).toHaveTextContent('2.25')
    expect(worked()).toContain("f'(1.5) = 2 \\cdot 1.5 = 3.0")
    expect(summary()).toContain('At x = 1.5 the point is at y = 2.25 and the slope is 3.0.')
  })

  it('D-04: the chart handle moves with the arrow keys and ignores up and down', async () => {
    open()
    const user = userEvent.setup()
    handle().focus()
    await user.keyboard('{ArrowRight}')
    expect(handle()).toHaveAttribute('aria-valuenow', '1.1')
    expect(slopeReadout()).toHaveTextContent('2.2')
    await user.keyboard('{ArrowUp}{ArrowDown}')
    expect(handle()).toHaveAttribute('aria-valuenow', '1.1')
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(handle()).toHaveAttribute('aria-valuenow', '0.1')
  })

  it('D-05: choosing x³ and then sin x changes the curve, formula, symbols and worked example', async () => {
    open()
    const user = userEvent.setup()
    const curveBefore = attr('curve-path', 'd')
    expect(formula()).toContain('2x')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Curve' }), 'x3')
    expect(attr('curve-path', 'd')).not.toBe(curveBefore)
    expect(formula()).toContain('3x^2')
    expect(worked()).toContain("f'(1.0) = 3 \\cdot 1.0^2 = 3.0")
    expect(summary()).toContain('Curve y = x³')

    const curveX3 = attr('curve-path', 'd')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Curve' }), 'sin')
    expect(attr('curve-path', 'd')).not.toBe(curveX3)
    expect(formula()).toContain('\\cos x')
    expect(within(screen.getByTestId('formula')).getByText(/the sine of x/)).toBeInTheDocument()
    expect(worked()).toContain("f'(1.0) = \\cos(1.0) = 0.5")
  })

  it('D-06: x = 0 on x² gives slope 0.0, no error and a horizontal tangent', () => {
    open()
    fireEvent.change(slider(), { target: { value: '0' } })
    expect(slopeReadout()).toHaveTextContent('0.0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(attr('tangent', 'y1')).toBe(attr('tangent', 'y2'))
  })

  it('G2: a steep tangent is clipped to stay inside the chart', async () => {
    open()
    const user = userEvent.setup()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Curve' }), 'x3')
    fireEvent.change(slider(), { target: { value: '3' } })
    expect(slopeReadout()).toHaveTextContent('27.0')
    const [y1, y2] = [Number(attr('tangent', 'y1')), Number(attr('tangent', 'y2'))]
    for (const y of [y1, y2]) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(400)
    }
    expect(attr('tangent', 'x1')).not.toBe(attr('tangent', 'x2'))
  })

  it('draws the tangent dashed and the curve solid, so colour is not the only cue (D-24)', () => {
    open()
    expect(screen.getByTestId('tangent')).toHaveAttribute('stroke-dasharray')
    expect(screen.getByTestId('curve-path')).not.toHaveAttribute('stroke-dasharray')
  })
})
