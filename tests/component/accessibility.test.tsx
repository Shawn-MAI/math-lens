import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { configureAxe } from 'vitest-axe'
import { getThemeStore } from '../../src/sim/themeStore'
import { App } from '../../src/ui/app/App'

// jsdom cannot compute colours, so contrast is checked from the tokens instead (D-23).
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } })

const pages: [string, string][] = [
  ['the lesson list', '#/'],
  ['Function and slope', '#/lessons/function-and-slope'],
  ['Loss', '#/lessons/loss'],
  ['Weight and bias', '#/lessons/weight-and-bias'],
  ['the not-found page', '#/lessons/nope'],
]

afterEach(() => {
  window.location.hash = '#/'
  getThemeStore().setState({ theme: 'light' })
  document.documentElement.setAttribute('data-theme', 'light')
})

describe('accessibility scan (D-21)', () => {
  describe.each(['light', 'dark'])('%s theme', (theme) => {
    it.each(pages)('%s has no violations', async (_name, hash) => {
      window.location.hash = hash
      const { container } = render(<App />)
      if (theme === 'dark') await userEvent.setup().click(screen.getByRole('button', { name: 'Dark mode' }))
      expect(document.documentElement).toHaveAttribute('data-theme', theme)
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  it('a lesson still has no violations after a parameter is out of range (the validation message is shown)', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/lessons/weight-and-bias'
    const { container } = render(<App />)
    await user.click(screen.getByRole('textbox', { name: 'Weight value' }))
    await user.keyboard('{Control>}a{/Control}9{Enter}')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
