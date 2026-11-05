import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="not-found">
      <h1>Lesson not found</h1>
      <p>We could not find that page. It may have moved, or the address may have a typo.</p>
      <Link to="/">Back to the list of lessons</Link>
    </div>
  )
}
