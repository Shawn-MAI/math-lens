import { render, screen } from '@testing-library/react'
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

describe('not found (FR-020)', () => {
  it('D-18: an unknown lesson address shows "Lesson not found" and a link to the list', async () => {
    const user = userEvent.setup()
    renderAt('/lessons/does-not-exist')
    expect(screen.getByRole('heading', { level: 1, name: /lesson not found/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /list of lessons|back to (the )?list/i }))
    expect(screen.getByRole('heading', { level: 2, name: 'Foundations' })).toBeInTheDocument()
  })

  it('any other unknown address also shows the not-found page', () => {
    renderAt('/something/else')
    expect(screen.getByRole('heading', { level: 1, name: /not found/i })).toBeInTheDocument()
  })
})
