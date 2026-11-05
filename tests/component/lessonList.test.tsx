import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../src/ui/app/routes'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )

describe('lesson list (US2)', () => {
  it('D-01: shows the four topics in order; Foundations has three lessons, the others say "coming soon" with no link', () => {
    renderAt('/')
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Foundations', 'Optimization', 'Models', 'Neural Networks'])

    const foundations = screen.getByRole('region', { name: 'Foundations' })
    const links = within(foundations).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual([expect.stringContaining('Function and slope'), expect.stringContaining('Loss'), expect.stringContaining('Weight and bias')])

    for (const name of ['Optimization', 'Models', 'Neural Networks']) {
      const region = screen.getByRole('region', { name })
      expect(within(region).getByText(/coming soon/i)).toBeInTheDocument()
      expect(within(region).queryByRole('link')).toBeNull()
    }
  })

  it('shows a one-line summary with each lesson', () => {
    renderAt('/')
    expect(screen.getByText('Drag a line over data points and see how far off it is.')).toBeInTheDocument()
  })

  it('D-02: opens a lesson from the list, and the "back to list" link returns to the list', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('link', { name: /Loss/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Loss' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /back to (the )?list/i }))
    expect(screen.getByRole('heading', { level: 2, name: 'Foundations' })).toBeInTheDocument()
  })
})
