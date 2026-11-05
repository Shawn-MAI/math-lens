import { useMemo, useState } from 'react'
import { useStore } from 'zustand'
import { isTrainingLesson, type AnyLesson, type Lesson } from '../../sim/content/schema'
import { createLessonStore } from '../../sim/lessonStore'
import { renderLesson } from '../../sim/lessonView'
import { ChartPanel } from './ChartPanel'
import { ControlPanel } from './ControlPanel'
import { FormulaBlock } from './FormulaBlock'
import { IntuitionText } from './IntuitionText'
import { WorkedExample } from './WorkedExample'

function LessonBody({ lesson }: { lesson: Lesson }) {
  // The store is created when the lesson opens, so a refresh or a direct link always starts at the defaults.
  const [store] = useState(() => createLessonStore(lesson))
  const params = useStore(store, (s) => s.params)
  const outputs = useStore(store, (s) => s.outputs)
  const messages = useStore(store, (s) => s.messages)
  const setParam = useStore(store, (s) => s.setParam)
  const reset = useStore(store, (s) => s.reset)
  const view = useMemo(() => renderLesson(lesson, params, outputs), [lesson, params, outputs])

  return (
    <article className="lesson">
      <h1>{lesson.title}</h1>

      <section aria-labelledby={`${lesson.id}-intuition`}>
        <h2 id={`${lesson.id}-intuition`}>Intuition</h2>
        <IntuitionText markdown={lesson.intuition} />
      </section>

      <section aria-labelledby={`${lesson.id}-demo`}>
        <h2 id={`${lesson.id}-demo`}>Try it</h2>
        <div className="demo">
          <ChartPanel lesson={lesson} params={params} outputs={outputs} view={view} setParam={setParam} />
          <ControlPanel lesson={lesson} params={params} messages={messages} setParam={setParam} reset={reset} />
        </div>
      </section>

      <section aria-labelledby={`${lesson.id}-formula`}>
        <h2 id={`${lesson.id}-formula`}>Formula</h2>
        <FormulaBlock formula={view.formula} />
      </section>

      <section aria-labelledby={`${lesson.id}-worked`}>
        <h2 id={`${lesson.id}-worked`}>Worked example</h2>
        <WorkedExample steps={view.workedExample} />
      </section>
    </article>
  )
}

export function LessonLayout({ lesson }: { lesson: AnyLesson }) {
  if (isTrainingLesson(lesson)) throw new Error(`Training lesson "${lesson.id}" requires a training layout`)
  return <LessonBody key={lesson.id} lesson={lesson} />
}
