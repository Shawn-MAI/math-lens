import { createStore, type StoreApi } from 'zustand/vanilla'

export type Theme = 'light' | 'dark'

export interface ThemeState {
  theme: Theme
  toggle(): void
}

export type ThemeStore = StoreApi<ThemeState>

function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyToRoot(theme: Theme): void {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme)
}

/**
 * The light or dark choice. It starts from the system setting and is kept in memory only,
 * so a refresh starts from the system setting again (no storage is written).
 */
export function createThemeStore(): ThemeStore {
  const initial = systemTheme()
  applyToRoot(initial)
  return createStore<ThemeState>((set, get) => ({
    theme: initial,
    toggle() {
      const next: Theme = get().theme === 'light' ? 'dark' : 'light'
      applyToRoot(next)
      set({ theme: next })
    },
  }))
}

let shared: ThemeStore | undefined

/** One store for the whole app, so the choice survives moving between pages. */
export function getThemeStore(): ThemeStore {
  shared ??= createThemeStore()
  return shared
}
