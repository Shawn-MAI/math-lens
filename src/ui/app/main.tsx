import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import '../styles/tokens.css'
import '../styles/app.css'
import { getThemeStore } from '../../sim/themeStore'
import { App } from './App'

// Sets data-theme from the system setting before the first paint.
getThemeStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
