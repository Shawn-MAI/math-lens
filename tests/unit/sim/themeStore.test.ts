import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThemeStore, getThemeStore } from '../../../src/sim/themeStore'

function mockSystemTheme(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: query.includes('dark') ? dark : !dark, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('theme store (US4)', () => {
  it('B-12: starts dark when the system asks for dark, and sets data-theme on the root element', () => {
    mockSystemTheme(true)
    const store = createThemeStore()
    expect(store.getState().theme).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('B-12: starts light when the system asks for light', () => {
    mockSystemTheme(false)
    const store = createThemeStore()
    expect(store.getState().theme).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('B-12: starts light when the system setting is not available', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(createThemeStore().getState().theme).toBe('light')
  })

  it('B-12: toggle() flips the theme both ways and keeps data-theme in step', () => {
    mockSystemTheme(false)
    const store = createThemeStore()
    store.getState().toggle()
    expect(store.getState().theme).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    store.getState().toggle()
    expect(store.getState().theme).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('B-12: the choice is held in memory only (nothing written to browser storage)', () => {
    mockSystemTheme(false)
    const local = vi.spyOn(Storage.prototype, 'setItem')
    const cookie = vi.spyOn(document, 'cookie', 'set')
    createThemeStore().getState().toggle()
    expect(local).not.toHaveBeenCalled()
    expect(cookie).not.toHaveBeenCalled()
  })

  it('getThemeStore() always returns the same store, so the choice survives navigation', () => {
    expect(getThemeStore()).toBe(getThemeStore())
  })
})
