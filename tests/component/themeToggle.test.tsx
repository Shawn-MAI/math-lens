import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getThemeStore } from '../../src/sim/themeStore'
import { App } from '../../src/ui/app/App'

const root = () => document.documentElement
const toggle = () => screen.getByRole('button', { name: 'Dark mode' })

function openAt(hash: string) {
  window.location.hash = hash
  return render(<App />)
}

beforeEach(() => {
  act(() => getThemeStore().setState({ theme: 'light' }))
  root().setAttribute('data-theme', 'light')
})

afterEach(() => {
  window.location.hash = '#/'
})

describe('theme toggle (US4)', () => {
  it('D-16: the toggle is on the list and on every lesson', () => {
    for (const hash of ['#/', '#/lessons/function-and-slope', '#/lessons/loss', '#/lessons/weight-and-bias']) {
      const { unmount } = openAt(hash)
      expect(toggle()).toBeInTheDocument()
      unmount()
    }
  })

  it('D-16: pressing it flips data-theme and aria-pressed, and pressing again flips back', async () => {
    const user = userEvent.setup()
    openAt('#/')
    expect(toggle()).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle())
    expect(root()).toHaveAttribute('data-theme', 'dark')
    expect(toggle()).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggle())
    expect(root()).toHaveAttribute('data-theme', 'light')
    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  })

  it('D-16: the choice survives going from the list to a lesson and back', async () => {
    const user = userEvent.setup()
    openAt('#/')
    await user.click(toggle())

    await user.click(screen.getByRole('link', { name: /Loss/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Loss' })).toBeInTheDocument()
    expect(root()).toHaveAttribute('data-theme', 'dark')
    expect(toggle()).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('link', { name: /back to (the )?list/i }))
    expect(root()).toHaveAttribute('data-theme', 'dark')
    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  })

  it('D-16: can be operated from the keyboard', async () => {
    const user = userEvent.setup()
    openAt('#/')
    toggle().focus()
    await user.keyboard('{Enter}')
    expect(root()).toHaveAttribute('data-theme', 'dark')
    await user.keyboard(' ')
    expect(root()).toHaveAttribute('data-theme', 'light')
  })

  it('D-17: changing a parameter and pressing Reset leaves the theme alone', async () => {
    const user = userEvent.setup()
    openAt('#/lessons/weight-and-bias')
    await user.click(toggle())

    fireEvent.change(screen.getByRole('slider', { name: 'Weight' }), { target: { value: '2' } })
    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(screen.getByRole('slider', { name: 'Weight' })).toHaveValue('1')
    expect(root()).toHaveAttribute('data-theme', 'dark')
    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  })
})
