import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { clamp, snapToStep } from '../../core'
import type { NumberParameter, TrainingLesson } from '../../sim/content/schema'
import { buildTrainingContext } from '../../sim/lessonView'
import { renderTemplate, selectVariant } from '../../sim/template'
import { formatTrainingNumber } from '../../sim/training/format'
import { TRAINING_REGISTRY } from '../../sim/training/registry'
import { createTrainingStore } from '../../sim/training/store'
import { LossHistoryChart } from '../charts/LossHistoryChart'
import { TrainingContourChart } from '../charts/TrainingContourChart'
import { TrainingCurveChart } from '../charts/TrainingCurveChart'
import { FormulaBlock } from './FormulaBlock'
import { IntuitionText } from './IntuitionText'
import { TrainingControls } from './TrainingControls'
import { TrainingInspection } from './TrainingInspection'
import { TrainingTimeline } from './TrainingTimeline'
import { TrainingTrend } from './TrainingTrend'
import { WorkedExample } from './WorkedExample'

function numberParameter(lesson: TrainingLesson, id: string): NumberParameter {
  const parameter = lesson.parameters.find((item) => item.id === id)
  if (!parameter || parameter.type !== 'number') throw new Error(`Missing numeric training parameter "${id}"`)
  return parameter
}

export function TrainingLessonLayout({ lesson }: { lesson: TrainingLesson }) {
  const adapter = TRAINING_REGISTRY.adapters[lesson.training.adapter]
  const landscape = TRAINING_REGISTRY.landscapes[lesson.training.landscape]
  if (!adapter || !landscape) throw new Error(`Training lesson "${lesson.id}" has an unknown adapter or landscape`)
  const [store] = useState(() => createTrainingStore({
    adapter,
    landscape,
    start: lesson.training.weightParameters.map((id) => numberParameter(lesson, id).default),
    rate: numberParameter(lesson, lesson.training.rateParameter).default,
  }))
  useEffect(() => {
    store.getState().activate()
    return () => store.getState().dispose()
  }, [store])
  const state = useStore(store)
  const branch = state.history.branches.find((item) => item.id === state.history.activeBranchId)
  if (!branch) throw new Error('Active training branch is missing')
  if (lesson.chart.type !== 'training-curve' && lesson.chart.type !== 'training-contour') {
    throw new Error(`Unsupported training chart "${lesson.chart.type}"`)
  }
  const startParameter = numberParameter(lesson, lesson.training.weightParameters[0]!)
  const secondParameter = lesson.chart.type === 'training-contour'
    ? numberParameter(lesson, lesson.training.weightParameters[1]!) : null
  const recorded = branch.transitions[state.snapshot.index] ?? null
  const preview = !recorded || state.pendingRate ? adapter.step(state.snapshot, state.rate, landscape) : null
  const outgoing = recorded ?? (preview?.kind === 'success' ? preview.transition : null)
  const context = buildTrainingContext(state.snapshot, outgoing)
  lesson.training.weightParameters.forEach((id, index) => { context[id] = formatTrainingNumber(state.snapshot.weights[index]!) })
  context[lesson.training.rateParameter] = formatTrainingNumber(outgoing?.rate ?? state.rate)
  context.updates ??= state.snapshot.weights.map(() => 'unavailable')
  context.nextWeights ??= state.snapshot.weights.map(() => 'unavailable')
  const choices = Object.fromEntries(lesson.parameters.filter((parameter) => parameter.type === 'choice').map((parameter) => [parameter.id, parameter.default]))
  const where = `lesson "${lesson.id}"`
  const worked = selectVariant(lesson.workedExample, choices, `${where} workedExample`).map((step, index) => ({
    text: renderTemplate(step.text, context, `${where} workedExample[${index}].text`),
    latex: renderTemplate(step.latex, context, `${where} workedExample[${index}].latex`),
  }))

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
          <div className="training-charts">
            {secondParameter ? <TrainingContourChart
              landscape={landscape} snapshot={state.snapshot} history={branch.snapshots}
              xDomain={[startParameter.min, startParameter.max]} yDomain={[secondParameter.min, secondParameter.max]}
              start={{
                value: [state.start[0]!, state.start[1]!], step: [startParameter.step, secondParameter.step],
                onChange: ([x, y]) => state.setStart([
                  clamp(snapToStep(x, startParameter.step, startParameter.min), startParameter.min, startParameter.max),
                  clamp(snapToStep(y, secondParameter.step, secondParameter.min), secondParameter.min, secondParameter.max),
                ]),
              }}
            /> : <TrainingCurveChart
              landscape={landscape} snapshot={state.snapshot}
              domain={[startParameter.min, startParameter.max]} history={branch.snapshots}
              start={{
                value: state.start[0]!, step: startParameter.step,
                onChange: (value) => state.setStart([
                  clamp(snapToStep(value, startParameter.step, startParameter.min), startParameter.min, startParameter.max),
                ]),
              }}
            />}
            <LossHistoryChart snapshots={branch.snapshots} selectedIndex={state.snapshot.index} />
          </div>
          <TrainingControls lesson={lesson} store={store} />
        </div>
        <TrainingTimeline store={store} />
        <TrainingInspection snapshot={state.snapshot} recorded={recorded} preview={preview} />
        <TrainingTrend snapshots={branch.snapshots.slice(0, state.snapshot.index + 1)} />
      </section>
      <section aria-labelledby={`${lesson.id}-formula`}>
        <h2 id={`${lesson.id}-formula`}>Formula</h2>
        <FormulaBlock formula={selectVariant(lesson.formula, choices, `${where} formula`)} />
      </section>
      <section aria-labelledby={`${lesson.id}-worked`}>
        <h2 id={`${lesson.id}-worked`}>Worked example</h2>
        <WorkedExample steps={worked} />
      </section>
    </article>
  )
}
