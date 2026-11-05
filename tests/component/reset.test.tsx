import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

/** Everything a learner sees that depends on the parameters. */
function snapshot() {
  const testIds = ['chart-summary', 'worked-example', 'formula']
  const readouts = screen.queryAllByTestId(/^readout-/).map((e) => e.textContent)
  const values = screen.queryAllByTestId(/^value-/).map((e) => e.textContent)
  const inputs = screen.queryAllByRole('textbox').map((e) => (e as HTMLInputElement).value)
  const sliders = screen.queryAllByRole('slider').map((e) => e.getAttribute('aria-valuenow') ?? (e as HTMLInputElement).value)
  const select = screen.queryAllByRole('combobox').map((e) => (e as HTMLSelectElement).value)
  const texts = testIds.map((id) => screen.getByTestId(id).textContent)
  const geometry = ['curve-path', 'tangent', 'fit-line'].flatMap((id) => screen.queryAllByTestId(id).map((e) => e.outerHTML))
  return { readouts, values, inputs, sliders, select, texts, geometry }
}

const reset = () => screen.getByRole('button', { name: /reset/i })

describe('Reset button (US3)', () => {
  it('D-14: Function and slope returns to x = 1.0 on x²', async () => {
    const user = userEvent.setup()
    render(<LessonLayout lesson={getLesson('function-and-slope')!} />)
    const initial = snapshot()

    fireEvent.change(screen.getByRole('slider', { name: 'Point position' }), { target: { value: '2.5' } })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Curve' }), 'sin')
    expect(snapshot()).not.toEqual(initial)

    await user.click(reset())
    expect(snapshot()).toEqual(initial)
    expect(screen.getByRole('combobox', { name: 'Curve' })).toHaveValue('x2')
  })

  it('D-14: Loss returns to its default line, with the button available even though its parameters are chart handles', async () => {
    const user = userEvent.setup()
    render(<LessonLayout lesson={getLesson('loss')!} />)
    const initial = snapshot()

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Steepness of the line (chart handle)' }), { key: 'ArrowUp', shiftKey: true })
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Height of the line (chart handle)' }), { key: 'ArrowDown' })
    expect(snapshot()).not.toEqual(initial)

    await user.click(reset())
    expect(snapshot()).toEqual(initial)
  })

  it('D-14: Weight and bias returns to w = 1.0, b = 0.0 and loss 11.250, and clears a validation message', async () => {
    const user = userEvent.setup()
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    const initial = snapshot()

    fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '2' } })
    fireEvent.change(screen.getByRole('slider', { name: 'Bias' }), { target: { value: '1' } })
    await user.type(screen.getByRole('textbox', { name: 'Weight value' }), '{Control>}a{/Control}abc{Enter}')
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(reset())
    expect(snapshot()).toEqual(initial)
    expect(screen.getByTestId('readout-mse')).toHaveTextContent('11.250')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('also discards text that was typed but not yet confirmed', async () => {
    const user = userEvent.setup()
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    const input = screen.getByRole('textbox', { name: 'Weight value' })
    await user.clear(input)
    await user.type(input, '2.')
    await user.click(reset())
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('1.0')
  })

  it('D-15: reset at defaults changes nothing and does not throw', async () => {
    const user = userEvent.setup()
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    const initial = snapshot()
    await user.click(reset())
    expect(snapshot()).toEqual(initial)
  })

  it('can be operated from the keyboard', async () => {
    const user = userEvent.setup()
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '2' } })
    reset().focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('slider', { name: 'Weight' })).toHaveValue('1')
  })
})
