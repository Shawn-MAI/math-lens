import { describe, expect, it } from 'vitest'
import { getModel } from '../../../src/sim/models'
import { getDataset, getLesson } from '../../../src/sim/content/loader'
import { createLessonStore } from '../../../src/sim/lessonStore'
import { isTrainingLesson, type Lesson } from '../../../src/sim/content/schema'

function lessonById(id: string): Lesson {
  const lesson = getLesson(id)
  if (!lesson || isTrainingLesson(lesson)) throw new Error(`missing static lesson ${id}`)
  return lesson
}

/** Recomputes the outputs directly from the core model, to compare with what the store holds. */
function freshOutputs(lesson: Lesson, params: Record<string, number | string>) {
  const model = getModel(lesson.model.id)
  const values: Record<string, number> = {}
  for (const role of model.roles) values[role] = params[lesson.model.bind![role]!] as number
  const choices: Record<string, string> = {}
  for (const name of model.choiceInputs) choices[name] = params[name] as string
  const dataset = lesson.datasetId ? getDataset(lesson.datasetId)!.points : undefined
  return model.compute({ values, choices }, dataset)
}

describe('lesson store: Weight and bias', () => {
  const lesson = () => lessonById('weight-and-bias')

  it('B-01: starts at the defaults with the matching outputs', () => {
    const state = createLessonStore(lesson()).getState()
    expect(state.params).toEqual({ w: 1, b: 0 })
    expect(state.outputs.mse).toBe(11.25)
  })

  it('B-02: setParam recomputes the outputs', () => {
    const store = createLessonStore(lesson())
    expect(store.getState().setParam('w', 2).ok).toBe(true)
    expect(store.getState().setParam('b', 1).ok).toBe(true)
    expect(store.getState().outputs.mse).toBe(0.25)
    expect(store.getState().outputs).toEqual(freshOutputs(lesson(), store.getState().params))
  })

  it('B-03: values snap to the 0.1 step', () => {
    const store = createLessonStore(lesson())
    store.getState().setParam('w', 1.04)
    expect(store.getState().params.w).toBe(1)
    store.getState().setParam('w', 1.06)
    expect(store.getState().params.w).toBe(1.1)
  })

  it('B-04: out-of-range values clamp and report the range', () => {
    const store = createLessonStore(lesson())
    const result = store.getState().setParam('w', 9)
    expect(store.getState().params.w).toBe(3)
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Enter a number from -3.0 to 3.0')
    expect(store.getState().setParam('b', -9).message).toBe('Enter a number from -5.0 to 5.0')
    expect(store.getState().params.b).toBe(-5)
  })

  it('B-05: NaN and non-numeric text are rejected and nothing changes', () => {
    const store = createLessonStore(lesson())
    store.getState().setParam('w', 2)
    const before = store.getState()
    for (const bad of [NaN, Infinity, 'abc', '', '  ', '1,5']) {
      const result = store.getState().setParam('w', bad)
      expect(result.ok).toBe(false)
      expect(result.message).toBe('Enter a number from -3.0 to 3.0')
    }
    expect(store.getState().params).toEqual(before.params)
    expect(store.getState().outputs).toBe(before.outputs)
  })

  it('accepts numeric text', () => {
    const store = createLessonStore(lesson())
    expect(store.getState().setParam('w', '2.5').ok).toBe(true)
    expect(store.getState().params.w).toBe(2.5)
  })

  it('keeps an inline message per parameter, and clears it on the next valid change', () => {
    const store = createLessonStore(lesson())
    store.getState().setParam('w', 9)
    expect(store.getState().messages.w).toBe('Enter a number from -3.0 to 3.0')
    store.getState().setParam('w', 2)
    expect(store.getState().messages.w).toBeUndefined()
  })

  it('throws for an unknown parameter id', () => {
    expect(() => createLessonStore(lesson()).getState().setParam('zzz', 1)).toThrowError(/zzz/)
  })

  it('B-08: stores are independent', () => {
    const a = createLessonStore(lesson())
    const b = createLessonStore(lesson())
    a.getState().setParam('w', 2)
    expect(b.getState().params.w).toBe(1)
  })

  it('B-11: 1000 random valid calls never leave stale outputs', () => {
    const l = lesson()
    const store = createLessonStore(l)
    let seed = 12345
    const next = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
    for (let i = 0; i < 1000; i++) {
      const id = next() < 0.5 ? 'w' : 'b'
      const [min, max] = id === 'w' ? [-3, 3] : [-5, 5]
      const value = min + Math.round(next() * ((max - min) / 0.1)) * 0.1
      store.getState().setParam(id, value)
      expect(store.getState().outputs).toEqual(freshOutputs(l, store.getState().params))
    }
  })

  it('B-13: 1000 setParam calls have a 95th percentile under 5 ms', () => {
    const store = createLessonStore(lesson())
    const times: number[] = []
    for (let i = 0; i < 1000; i++) {
      const start = performance.now()
      store.getState().setParam('w', -3 + (i % 61) * 0.1)
      times.push(performance.now() - start)
    }
    times.sort((x, y) => x - y)
    expect(times[Math.floor(times.length * 0.95)]!).toBeLessThan(5)
  })
})

describe('lesson store: Function and slope', () => {
  const lesson = () => lessonById('function-and-slope')

  it('starts at x = 1.0 on x²', () => {
    const state = createLessonStore(lesson()).getState()
    expect(state.params).toEqual({ x: 1, curve: 'x2' })
    expect(state.outputs.slope).toBe(2)
  })

  it('B-09: changing the curve keeps x and recomputes', () => {
    const store = createLessonStore(lesson())
    store.getState().setParam('x', 1.5)
    const result = store.getState().setParam('curve', 'x3')
    expect(result.ok).toBe(true)
    expect(store.getState().params.x).toBe(1.5)
    expect(store.getState().outputs.y).toBe(3.375)
    expect(store.getState().outputs.slope).toBe(6.75)
  })

  it('B-10: x past the range clamps to the range end', () => {
    const store = createLessonStore(lesson())
    store.getState().setParam('x', 99)
    expect(store.getState().params.x).toBe(3)
    store.getState().setParam('x', -99)
    expect(store.getState().params.x).toBe(-3)
  })

  it('rejects a curve that is not one of the options', () => {
    const store = createLessonStore(lesson())
    expect(store.getState().setParam('curve', 'cubic').ok).toBe(false)
    expect(store.getState().params.curve).toBe('x2')
  })
})
