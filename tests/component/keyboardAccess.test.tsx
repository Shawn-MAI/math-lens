import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../../src/ui/app/App'

function openAt(hash: string) {
  window.location.hash = hash
  return render(<App />)
}

afterEach(() => {
  window.location.hash = '#/'
})

const nameOf = (el: Element | null) => {
  if (!el) return null
  const labelled = el.getAttribute('aria-label')
  if (labelled) return labelled
  if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) return el.textContent
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) return el.labels?.[0]?.textContent ?? el.type
  return el.tagName
}

/** Presses Tab until the Reset button has focus, and returns the accessible name of each stop. */
async function tabUntilReset(user: ReturnType<typeof userEvent.setup>) {
  const stops: string[] = []
  for (let i = 0; i < 20; i++) {
    await user.tab()
    stops.push(nameOf(document.activeElement) ?? '?')
    if (stops[stops.length - 1] === 'Reset') return stops
  }
  throw new Error(`Reset not reached: ${stops.join(' > ')}`)
}

describe('keyboard access (US5)', () => {
  it('D-19: tab order follows reading order: skip link, header toggle, back link, chart handles, controls, Reset', async () => {
    const user = userEvent.setup()
    openAt('#/lessons/function-and-slope')
    expect(await tabUntilReset(user)).toEqual([
      'Skip to content',
      'Dark mode',
      'Back to the list of lessons',
      'Point position (chart handle)',
      'Point position',
      'Point position value',
      'Curve',
      'Reset',
    ])
  })

  it('D-19: Loss has its two chart handles first, then only the Reset button (parameters are chart handles)', async () => {
    const user = userEvent.setup()
    openAt('#/lessons/loss')
    expect(await tabUntilReset(user)).toEqual([
      'Skip to content',
      'Dark mode',
      'Back to the list of lessons',
      'Steepness of the line (chart handle)',
      'Height of the line (chart handle)',
      'Reset',
    ])
  })

  it('D-19: Weight and bias has no chart handles; sliders and number inputs come in parameter order', async () => {
    const user = userEvent.setup()
    openAt('#/lessons/weight-and-bias')
    expect(await tabUntilReset(user)).toEqual(['Skip to content', 'Dark mode', 'Back to the list of lessons', 'Weight', 'Weight value', 'Bias', 'Bias value', 'Reset'])
  })

  it('D-19: a visible focus style is defined for every kind of interactive element, with the focus colour token', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/ui/styles/app.css'), 'utf8')
    // jsdom does not load the stylesheet, so the source is checked instead of the computed style.
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\)/)
    expect(css).toMatch(/\.chart-handle:focus-visible \.handle-ring\s*\{[^}]*stroke:\s*var\(--focus\)/)
    expect(css).not.toMatch(/:focus-visible\s*\{[^}]*outline:\s*none/)
  })

  it('D-20: in Function and slope the point, the number input, Reset and the theme toggle all work from the keyboard', async () => {
    const user = userEvent.setup()
    openAt('#/lessons/function-and-slope')

    screen.getByRole('slider', { name: 'Point position (chart handle)' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('readout-slope')).toHaveTextContent('2.2')
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(screen.getByRole('textbox', { name: 'Point position value' })).toHaveValue('2.1')

    await user.tab() // range slider
    await user.tab() // number input
    await user.keyboard('{Control>}a{/Control}-1{Enter}')
    expect(screen.getByTestId('readout-slope')).toHaveTextContent('-2.0')

    expect(screen.getByRole('combobox', { name: 'Curve' }).tagName).toBe('SELECT')
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('readout-slope')).toHaveTextContent('2.0')

    screen.getByRole('button', { name: 'Dark mode' }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('D-20: in Loss both handles move with the arrow keys (Shift = ten steps) and Reset restores them', async () => {
    const user = userEvent.setup()
    openAt('#/lessons/loss')
    screen.getByRole('slider', { name: 'Steepness of the line (chart handle)' }).focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(screen.getByTestId('value-steepness')).toHaveTextContent('0.0')

    await user.tab()
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByTestId('value-height')).toHaveTextContent('0.2')

    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('value-steepness')).toHaveTextContent('1.0')
    expect(screen.getByTestId('value-height')).toHaveTextContent('0.0')
  })

  it('D-20: in Weight and bias both number inputs can be typed into and confirmed with Enter', async () => {
    const user = userEvent.setup()
    openAt('#/lessons/weight-and-bias')
    await user.click(screen.getByRole('textbox', { name: 'Weight value' }))
    await user.keyboard('{Control>}a{/Control}2{Enter}')
    await user.tab()
    await user.tab()
    await user.keyboard('{Control>}a{/Control}1{Enter}')
    expect(screen.getByTestId('readout-mse')).toHaveTextContent('0.250')
  })

  it('D-20: from the list a lesson link opens with the keyboard', async () => {
    const user = userEvent.setup()
    openAt('#/')
    screen.getByRole('link', { name: /Loss/ }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1, name: 'Loss' })).toBeInTheDocument()
  })
})
