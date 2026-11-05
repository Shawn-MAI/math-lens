import { describe, expect, it } from 'vitest'
import { getLesson } from '../../../src/sim/content/loader'
import { createLessonStore } from '../../../src/sim/lessonStore'

describe('lesson store reset (US3)', () => {
  it('B-06: reset() after several changes restores every default, including the curve choice, and the initial outputs', () => {
    const store = createLessonStore(getLesson('function-and-slope')!)
    const initial = store.getState()
    expect(initial.params).toEqual({ x: 1, curve: 'x2' })

    store.getState().setParam('x', 2.5)
    store.getState().setParam('curve', 'sin')
    store.getState().setParam('x', 'abc')
    expect(store.getState().params).toEqual({ x: 2.5, curve: 'sin' })

    store.getState().reset()
    const after = store.getState()
    expect(after.params).toEqual({ x: 1, curve: 'x2' })
    expect(after.outputs).toEqual(initial.outputs)
    expect(after.messages).toEqual({})
  })

  it('B-06: works for a lesson with two number parameters', () => {
    const store = createLessonStore(getLesson('weight-and-bias')!)
    const initial = store.getState().outputs
    store.getState().setParam('w', 2)
    store.getState().setParam('b', 1)
    store.getState().reset()
    expect(store.getState().params).toEqual({ w: 1, b: 0 })
    expect(store.getState().outputs).toEqual(initial)
  })

  it('B-07: reset() at defaults changes nothing and does not throw', () => {
    const store = createLessonStore(getLesson('loss')!)
    const before = store.getState()
    expect(() => store.getState().reset()).not.toThrow()
    expect(store.getState().params).toEqual(before.params)
    expect(store.getState().outputs).toEqual(before.outputs)
    expect(store.getState().messages).toEqual({})
  })
})
