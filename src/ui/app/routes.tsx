import { Link, Route, Routes, useParams } from 'react-router-dom'
import { getLesson } from '../../sim/content/loader'
import { LessonLayout } from '../components/LessonLayout'
import { LessonList } from '../components/LessonList'
import { NotFound } from '../components/NotFound'

function LessonRoute() {
  const { id = '' } = useParams()
  const lesson = getLesson(id)
  if (!lesson) return <NotFound />
  return (
    <>
      <Link to="/" className="back-link">
        Back to the list of lessons
      </Link>
      <LessonLayout lesson={lesson} />
    </>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LessonList />} />
      <Route path="/lessons/:id" element={<LessonRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
