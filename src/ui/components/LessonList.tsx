import { Link } from 'react-router-dom'
import { getLessonCatalog, type Catalog } from '../../sim/content/loader'
import { TOPICS } from '../../sim/content/topics'

/** Lessons grouped under the four topics. A topic with no lessons says "coming soon". */
export function LessonList({ catalog = getLessonCatalog() }: { catalog?: Catalog }) {
  return (
    <div className="lesson-list">
      <h1>Lessons</h1>
      {TOPICS.map((topic) => {
        const lessons = catalog.getLessonsByTopic(topic.id)
        const headingId = `topic-${topic.id}`
        return (
          <section key={topic.id} aria-labelledby={headingId} className="topic">
            <h2 id={headingId}>{topic.title}</h2>
            {lessons.length === 0 ? (
              <p className="coming-soon">Coming soon</p>
            ) : (
              <ul>
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link to={`/lessons/${lesson.id}`}>{lesson.title}</Link>
                    <span className="lesson-summary">{lesson.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
