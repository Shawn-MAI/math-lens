import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { AppRoutes } from '../../src/ui/app/routes'
import { App } from '../../src/ui/app/App'

it('lists all optimization lessons and retains the foundation catalog', () => {
  render(<MemoryRouter initialEntries={['/']}><AppRoutes /></MemoryRouter>)
  const optimization = screen.getByRole('region', { name: 'Optimization' })
  expect(within(optimization).getAllByRole('link')).toHaveLength(3)
  expect(within(screen.getByRole('region', { name: 'Foundations' })).getAllByRole('link')).toHaveLength(3)
  expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent))
    .toEqual(['Foundations', 'Optimization', 'Models', 'Neural Networks'])
})

it.each([
  ['function-and-slope', 'Function and slope'],
  ['loss', 'Loss'],
  ['weight-and-bias', 'Weight and bias'],
  ['gradient-descent-1d', 'Gradient descent on a curve'],
  ['gradient-descent-nonconvex', 'Different starting points'],
  ['gradient-descent-2d', 'Two weights, one loss'],
])('opens the direct hash route for %s', (id, title) => {
  window.location.hash = `#/lessons/${id}`
  const { unmount } = render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  unmount()
  window.location.hash = '#/'
})

it('keeps the theme on a training route and restores default state after remount', () => {
  window.location.hash = '#/lessons/gradient-descent-2d'
  const { unmount } = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  expect(screen.getByTestId('training-current-values')).toHaveTextContent('Step 1')
  unmount()
  render(<App />)
  expect(screen.getByTestId('training-current-values')).toHaveTextContent('Step 0')
  expect(screen.getByRole('textbox', { name: 'First weight value' })).toHaveValue('4.0')
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }))
  act(() => { window.location.hash = '#/' })
})

it('opens a 2D lesson directly', () => {
  render(<MemoryRouter initialEntries={['/lessons/gradient-descent-2d']}><AppRoutes /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1, name: /two weights/i })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /contour/i })).toBeInTheDocument()
})
