import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getLesson } from '../../src/sim/content/loader'
import { LessonLayout } from '../../src/ui/components/LessonLayout'

describe('lesson layout (D-03)', () => {
  it.each(['function-and-slope', 'loss', 'weight-and-bias'])('%s shows intuition, demo with controls, formula, then worked example', (id) => {
    const lesson = getLesson(id)!
    render(<LessonLayout lesson={lesson} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(lesson.title)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Intuition', 'Try it', 'Formula', 'Worked example'])

    const intuition = screen.getByRole('region', { name: 'Intuition' })
    const demo = screen.getByRole('region', { name: 'Try it' })
    const formula = screen.getByRole('region', { name: 'Formula' })
    const worked = screen.getByRole('region', { name: 'Worked example' })
    const order = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(order(intuition, demo)).toBe(true)
    expect(order(demo, formula)).toBe(true)
    expect(order(formula, worked)).toBe(true)

    expect(demo.querySelector('svg')).not.toBeNull()
    expect(screen.getByRole('group', { name: 'Controls' })).toBeInTheDocument()
    expect(intuition.textContent!.length).toBeGreaterThan(50)
  })

  it('explains every symbol of the formula in a table', () => {
    const lesson = getLesson('weight-and-bias')!
    render(<LessonLayout lesson={lesson} />)
    const table = screen.getByRole('table', { name: 'What each symbol means' })
    const rows = table.querySelectorAll('tbody tr')
    expect(rows.length).toBe(10)
    expect(table).toHaveTextContent('the bias: the height of the line at x = 0')
  })

  it('gives every chart a role img with an accessible name and a visible text summary (D-22)', () => {
    render(<LessonLayout lesson={getLesson('loss')!} />)
    const chart = screen.getByRole('img', { name: /Loss chart/ })
    expect(chart).toHaveAttribute('aria-describedby', screen.getByTestId('chart-summary').id)
    expect(screen.getByTestId('chart-summary')).toBeVisible()
  })

  it('creates a fresh store each time a lesson opens, so it always starts at defaults', () => {
    const lesson = getLesson('weight-and-bias')!
    const first = render(<LessonLayout lesson={lesson} />)
    first.unmount()
    render(<LessonLayout lesson={lesson} />)
    expect(screen.getByTestId('readout-mse')).toHaveTextContent('11.250')
  })
})
