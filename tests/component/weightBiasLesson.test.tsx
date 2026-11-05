import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

const wSlider = () => screen.getByRole('slider', { name: 'Weight' })
const bSlider = () => screen.getByRole('slider', { name: 'Bias' })
const wInput = () => screen.getByRole('textbox', { name: 'Weight value' })
const mse = () => screen.getByTestId('readout-mse')
const errors = () => screen.getAllByTestId('error-label').map((e) => e.textContent)
const worked = () => screen.getByTestId('worked-example').textContent ?? ''

beforeEach(() => {
  render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
})

describe('Weight and bias lesson', () => {
  it('starts at w = 1.0, b = 0.0 with a loss of 11.250', () => {
    expect(wSlider()).toHaveValue('1')
    expect(bSlider()).toHaveValue('0')
    expect(mse()).toHaveTextContent('11.250')
    expect(errors()).toEqual(['-2.00', '-3.00', '-4.00', '-4.00'])
  })

  it('D-11: w = 2.0 and b = 1.0 move the line and update errors, loss, worked example and summary', () => {
    const lineBefore = screen.getByTestId('fit-line').getAttribute('y2')
    fireEvent.change(wSlider(), { target: { value: '2' } })
    fireEvent.change(bSlider(), { target: { value: '1' } })

    expect(screen.getByTestId('fit-line').getAttribute('y2')).not.toBe(lineBefore)
    expect(errors()).toEqual(['0.00', '0.00', '0.00', '1.00'])
    expect(mse()).toHaveTextContent('0.250')
    expect(worked()).toContain('\\hat{y} = 2.0 \\cdot x + 1.0')
    expect(worked()).toContain('\\text{MSE} = \\frac{ 0.00 + 0.00 + 0.00 + 1.00 }{ 4 } = 0.250')
    expect(screen.getByTestId('chart-summary')).toHaveTextContent('Line y = 2.0x + 1.0 over 4 points. Errors: 0.00, 0.00, 0.00, 1.00. Loss (MSE) is 0.250.')
    expect(wInput()).toHaveValue('2.0')
  })

  it('shows a negative bias in parentheses in the worked example', () => {
    fireEvent.change(bSlider(), { target: { value: '-0.5' } })
    expect(worked()).toContain('\\hat{y} = 1.0 \\cdot x + (-0.5)')
  })

  it('D-12: typing 9 into the w input clamps to 3.0 and shows the range message', async () => {
    const user = userEvent.setup()
    await user.clear(wInput())
    await user.type(wInput(), '9{Enter}')
    expect(wInput()).toHaveValue('3.0')
    expect(wSlider()).toHaveValue('3')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number from -3.0 to 3.0')
    expect(mse()).toHaveTextContent('5.250')
  })

  it('D-13: typing abc keeps the previous value and shows the same message', async () => {
    const user = userEvent.setup()
    fireEvent.change(wSlider(), { target: { value: '2' } })
    await user.clear(wInput())
    await user.type(wInput(), 'abc')
    await user.tab()
    expect(wInput()).toHaveValue('2.0')
    expect(wSlider()).toHaveValue('2')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number from -3.0 to 3.0')
  })

  it('clears the message after the next valid change', async () => {
    const user = userEvent.setup()
    await user.clear(wInput())
    await user.type(wInput(), 'abc{Enter}')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(wSlider(), { target: { value: '1.5' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('accepts a typed value that is valid and snaps it to the step', async () => {
    const user = userEvent.setup()
    await user.clear(wInput())
    await user.type(wInput(), '1.54{Enter}')
    expect(wInput()).toHaveValue('1.5')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
