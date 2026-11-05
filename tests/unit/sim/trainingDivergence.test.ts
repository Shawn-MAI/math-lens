import { describe, expect, it, vi } from 'vitest'
import { convex1d } from '../../../src/core/training/landscapes'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import { createTrainingStore } from '../../../src/sim/training/store'

describe('divergence and recovery', () => {
  it('keeps the last finite tip, reports the attempted step, and retries after a rate change', () => {
    const store = createTrainingStore({ adapter: gradientDescent, landscape: convex1d, start: [-4], rate: 4 })
    for (let i = 0; i < 1000 && store.getState().stopReason !== 'diverged'; i++) store.getState().stepForward()
    const state = store.getState()
    expect(state.stopReason).toBe('diverged')
    expect(state.message).toMatch(new RegExp(`step ${state.snapshot.index + 1}`, 'i'))
    expect(state.playing).toBe(false)
    const before = state.history
    const preview = gradientDescent.step(state.snapshot, state.rate, convex1d)
    expect(preview.kind).toBe('non-finite')
    expect(store.getState().history).toBe(before)
    store.getState().setRate(0.0005)
    expect(store.getState().stopReason).toBeNull()
    store.getState().stepForward()
    expect(store.getState().snapshot.index).toBe(state.snapshot.index + 1)
    expect(store.getState().snapshot.weights.every(Number.isFinite)).toBe(true)
    store.getState().reset()
    expect(store.getState().snapshot.index).toBe(0)
    expect(store.getState().history.branches).toHaveLength(1)
    store.getState().dispose()
  })

  it('pauses scheduled playback when the first non-finite attempt occurs', () => {
    vi.useFakeTimers()
    try {
      const store = createTrainingStore({ adapter: gradientDescent, landscape: convex1d, start: [-4], rate: 4 })
      store.getState().setSpeed(4)
      store.getState().play()
      vi.advanceTimersByTime(250000)
      expect(store.getState().stopReason).toBe('diverged')
      expect(store.getState().playing).toBe(false)
      expect(vi.getTimerCount()).toBe(0)
      store.getState().dispose()
    } finally {
      vi.useRealTimers()
    }
  })
})
