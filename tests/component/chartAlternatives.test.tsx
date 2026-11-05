import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

describe('chart text alternatives (D-22)', () => {
  it.each([
    ['function-and-slope', 'Function and slope chart'],
    ['loss', 'Loss chart'],
    ['weight-and-bias', 'Weight and bias chart'],
  ])('%s: the chart is an image with a name, described by the visible summary', (id, name) => {
    render(<LessonLayout lesson={getLesson(id)!} />)
    const chart = screen.getByRole('img', { name })
    const summary = screen.getByTestId('chart-summary')
    expect(summary).toBeVisible()
    expect(summary.textContent).not.toBe('')
    expect(chart.getAttribute('aria-describedby')).toBe(summary.id)
  })

  it('the summary changes when a parameter changes (Function and slope)', () => {
    render(<LessonLayout lesson={getLesson('function-and-slope')!} />)
    const before = screen.getByTestId('chart-summary').textContent
    fireEvent.change(screen.getByRole('slider', { name: 'Point position' }), { target: { value: '2' } })
    expect(screen.getByTestId('chart-summary').textContent).not.toBe(before)
    expect(screen.getByTestId('chart-summary')).toHaveTextContent('slope is 4.0')
  })

  it('the summary changes when a parameter changes (Weight and bias)', () => {
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    const before = screen.getByTestId('chart-summary').textContent
    fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '2' } })
    expect(screen.getByTestId('chart-summary').textContent).not.toBe(before)
  })

  it('the handles are not inside the image, so assistive technology can reach them', () => {
    render(<LessonLayout lesson={getLesson('loss')!} />)
    const chart = screen.getByRole('img', { name: 'Loss chart' })
    for (const handle of screen.getAllByRole('slider', { name: /chart handle/ })) expect(chart.contains(handle)).toBe(false)
  })
})

describe('no information by colour alone (D-24)', () => {
  it('the tangent is dashed while the curve is solid, and the slope is also written as text', () => {
    render(<LessonLayout lesson={getLesson('function-and-slope')!} />)
    expect(screen.getByTestId('tangent')).toHaveAttribute('stroke-dasharray')
    expect(screen.getByTestId('curve-path')).not.toHaveAttribute('stroke-dasharray')
    expect(screen.getByTestId('slope-label')).toHaveTextContent('slope 2.0')
  })

  it('error segments are dashed while the line is solid, each error has its number as text, and points are filled markers', () => {
    render(<LessonLayout lesson={getLesson('weight-and-bias')!} />)
    for (const segment of screen.getAllByTestId('error-segment')) expect(segment).toHaveAttribute('stroke-dasharray')
    expect(screen.getByTestId('fit-line')).not.toHaveAttribute('stroke-dasharray')
    expect(screen.getAllByTestId('error-label').map((e) => e.textContent)).toEqual(['-2.00', '-3.00', '-4.00', '-4.00'])
    for (const point of screen.getAllByTestId('data-point')) {
      expect(point.tagName.toLowerCase()).toBe('circle')
      expect(point).toHaveAttribute('r')
    }
  })
})
