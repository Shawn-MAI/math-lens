import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { buildCatalog } from '../../../src/sim/content/loader'
import { LessonLayout } from '../../../src/ui/components/LessonLayout'
import { LessonList } from '../../../src/ui/components/LessonList'

const bundled = {
  lessons: import.meta.glob('/src/content/lessons/*/*/lesson.json', { eager: true, import: 'default' }) as Record<string, unknown>,
  intuitions: import.meta.glob('/src/content/lessons/*/*/intuition.md', { eager: true, import: 'default', query: '?raw' }) as Record<string, string>,
  datasets: import.meta.glob('/src/content/datasets/*.json', { eager: true, import: 'default' }) as Record<string, unknown>,
}

// A new lesson made only of content: it reuses the bundled line-loss model, the line-fit chart and a bundled dataset.
const fixtureLesson = {
  id: 'fixture-fit',
  topic: 'foundations',
  order: 4,
  title: 'Fixture fit',
  summary: 'A lesson added with content only.',
  model: { id: 'line-loss', bind: { slope: 'w', intercept: 'b' } },
  datasetId: 'weight-bias-4',
  chart: { type: 'line-fit', options: { slopeParam: 'w', interceptParam: 'b', handles: false } },
  parameters: [
    { type: 'number', id: 'w', label: 'Weight', symbol: 'w', min: -3, max: 3, step: 0.1, default: 2, control: 'slider' },
    { type: 'number', id: 'b', label: 'Bias', symbol: 'b', min: -5, max: 5, step: 0.1, default: 0, control: 'slider' },
  ],
  outputs: [{ key: 'mse', label: 'Loss', symbol: 'MSE', decimals: 3 }],
  formula: { latex: 'L = \\text{MSE}', symbols: [{ symbol: 'L', meaning: 'the loss' }, { symbol: 'MSE', meaning: 'mean squared error' }] },
  workedExample: [{ text: 'With w = {{w}} the loss is', latex: '{{mse}}' }],
  chartSummary: 'Line over {{n}} points with loss {{mse}}.',
}

describe('adding a lesson is content only (FR-022, C-14)', () => {
  const catalog = buildCatalog({
    ...bundled,
    lessons: { ...bundled.lessons, '/src/content/lessons/foundations/fixture-fit/lesson.json': fixtureLesson },
    intuitions: { ...bundled.intuitions, '/src/content/lessons/foundations/fixture-fit/intuition.md': 'Some intuition.' },
  })

  it('appears in the catalog after the three bundled lessons', () => {
    expect(catalog.getLessonsByTopic('foundations').map((l) => l.id)).toEqual(['function-and-slope', 'loss', 'weight-and-bias', 'fixture-fit'])
  })

  it('appears in the list', () => {
    render(
      <MemoryRouter>
        <LessonList catalog={catalog} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Fixture fit/ })).toBeInTheDocument()
  })

  it('opens and computes real values (w = 2 gives loss 0.750)', () => {
    render(<LessonLayout lesson={catalog.getLesson('fixture-fit')!} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Fixture fit' })).toBeInTheDocument()
    expect(screen.getByTestId('readout-mse')).toHaveTextContent('0.750')
  })
})
