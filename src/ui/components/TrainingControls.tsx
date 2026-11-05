import { useId, useState } from 'react'
import { useStore } from 'zustand'
import type { StoreApi } from 'zustand/vanilla'
import { clamp, snapToStep } from '../../core'
import type { TrainingLesson } from '../../sim/content/schema'
import type { ParamValue, SetParamResult } from '../../sim/lessonStore'
import { formatTrainingNumber } from '../../sim/training/format'
import type { TrainingState } from '../../sim/training/store'
import { ControlPanel } from './ControlPanel'

interface Props {
  lesson: TrainingLesson
  store: StoreApi<TrainingState>
}

export function TrainingControls({ lesson, store }: Props) {
  const state = useStore(store)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const speedId = useId()
  const params: Record<string, ParamValue> = {}
  lesson.training.weightParameters.forEach((id, index) => { params[id] = state.start[index]! })
  params[lesson.training.rateParameter] = state.rate

  function setParam(id: string, raw: ParamValue): SetParamResult {
    const parameter = lesson.parameters.find((item) => item.id === id)
    if (!parameter || parameter.type !== 'number') throw new Error(`Unknown numeric training parameter "${id}"`)
    const value = typeof raw === 'string' ? (raw.trim() === '' ? NaN : Number(raw)) : raw
    const message = `Enter a number from ${formatTrainingNumber(parameter.min)} to ${formatTrainingNumber(parameter.max)}`
    if (!Number.isFinite(value)) {
      setMessages((current) => ({ ...current, [id]: message }))
      return { ok: false, message }
    }
    const snapped = snapToStep(value, parameter.step, parameter.min)
    const bounded = clamp(snapped, parameter.min, parameter.max)
    const outOfRange = bounded !== snapped
    setMessages((current) => {
      const next = { ...current }
      if (outOfRange) next[id] = message
      else delete next[id]
      return next
    })
    if (id === lesson.training.rateParameter) {
      state.setRate(bounded)
    } else {
      const index = lesson.training.weightParameters.indexOf(id)
      if (index < 0) throw new Error(`Unbound training parameter "${id}"`)
      const start = [...state.start]
      start[index] = bounded
      state.setStart(start)
    }
    return outOfRange ? { ok: false, message } : { ok: true }
  }

  return (
    <div>
      <ControlPanel lesson={lesson} params={params} messages={messages} setParam={setParam} reset={() => {
        state.reset()
        setMessages({})
      }} />
      <div role="group" aria-label="Learning rate presets" className="training-presets">
        <button type="button" onClick={() => setParam(lesson.training.rateParameter, lesson.training.presets.small)}>Small rate</button>
        <button type="button" onClick={() => setParam(lesson.training.rateParameter, lesson.training.presets.good)}>Good rate</button>
        <button type="button" onClick={() => setParam(lesson.training.rateParameter, lesson.training.presets.large)}>Large rate</button>
      </div>
      <div role="group" aria-label="Playback controls">
        <button type="button" onClick={state.stepBackward} disabled={state.snapshot.index === 0}>Step back</button>
        <button type="button" onClick={state.playing ? state.pause : state.play}>
          {state.playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={state.stepForward}>Step forward</button>
        <label htmlFor={speedId}>Speed</label>
        <select id={speedId} value={state.speed} onChange={(event) => {
          const speed = Number(event.target.value)
          if (speed !== 1 && speed !== 2 && speed !== 4) throw new Error('Unsupported playback speed')
          state.setSpeed(speed)
        }}>
          <option value="1">1 step per second</option>
          <option value="2">2 steps per second</option>
          <option value="4">4 steps per second</option>
        </select>
      </div>
      {state.message && <p role="status">{state.message}</p>}
    </div>
  )
}
