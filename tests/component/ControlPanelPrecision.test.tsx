import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

function renderFinePrecisionLesson(step = 0.0005) {
  const lesson = getLesson('weight-and-bias')
  if (!lesson) throw new Error('Missing weight-and-bias lesson')
  render(
    <LessonLayout
      lesson={{
        ...lesson,
        parameters: lesson.parameters.map((parameter) =>
          parameter.type === 'number' && parameter.id === 'w'
            ? { ...parameter, step, default: step }
            : parameter,
        ),
      }}
    />,
  )
}

describe('control parameter precision', () => {
  it('displays a fine value without rounding it to zero in visible and accessible text', () => {
    renderFinePrecisionLesson()
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('0.0005')
    expect(screen.getByRole('slider', { name: 'Weight' })).toHaveAttribute('aria-valuetext', '0.0005')
  })

  it('connects fine parameter changes to the chart and preserves coarse controls', () => {
    renderFinePrecisionLesson()
    const line = screen.getByTestId('fit-line')
    const initialLine = line.outerHTML
    fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '0.001' } })
    expect(screen.getByTestId('fit-line').outerHTML).not.toBe(initialLine)
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('0.0010')
    expect(screen.getByRole('textbox', { name: 'Bias value' })).toHaveValue('0.0')
  })

  it('accepts and displays values when the step uses scientific notation', () => {
    renderFinePrecisionLesson(1e-7)
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('0.0000001')
    fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '0.0000002' } })
    expect(screen.getByRole('textbox', { name: 'Weight value' })).toHaveValue('0.0000002')
  })
})
