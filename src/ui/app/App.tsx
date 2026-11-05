import { HashRouter, Route, Routes } from 'react-router-dom'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<p>MathLens</p>} />
    </Routes>
  )
}

export function App() {
  return (
    <HashRouter>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <strong>MathLens</strong>
      </header>
      <main id="main" className="app-main">
        <AppRoutes />
      </main>
    </HashRouter>
  )
}
