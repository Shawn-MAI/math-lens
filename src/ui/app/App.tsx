import { HashRouter } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { AppRoutes } from './routes'

export function App() {
  return (
    <HashRouter>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <strong>MathLens</strong>
        <ThemeToggle />
      </header>
      <main id="main" className="app-main">
        <AppRoutes />
      </main>
    </HashRouter>
  )
}
