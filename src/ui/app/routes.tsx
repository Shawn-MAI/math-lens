import { Route, Routes, useParams } from 'react-router-dom'
import { getLesson } from '../../sim/content/loader'
import { LessonLayout } from '../components/LessonLayout'

function LessonRoute() {
  const { id = '' } = useParams()
  const lesson = getLesson(id)
  return lesson ? <LessonLayout lesson={lesson} /> : <p>Lesson not found.</p>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/lessons/:id" element={<LessonRoute />} />
      <Route path="*" element={<p>MathLens</p>} />
    </Routes>
  )
}
