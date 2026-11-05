import { useStore } from 'zustand'
import { getThemeStore } from '../../sim/themeStore'

export function ThemeToggle() {
  const store = getThemeStore()
  const theme = useStore(store, (s) => s.theme)
  const toggle = useStore(store, (s) => s.toggle)
  return (
    <button type="button" className="theme-toggle" aria-pressed={theme === 'dark'} onClick={toggle}>
      Dark mode
    </button>
  )
}
