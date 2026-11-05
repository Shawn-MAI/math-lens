import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { convex1d } from '../../../src/core/training/landscapes'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import { createTrainingStore } from '../../../src/sim/training/store'

function create(start = -4, rate = 0.2) {
  return createTrainingStore({ adapter: gradientDescent, landscape: convex1d, start: [start], rate })
}

describe('training playback', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('steps one state forward and back and does not go below step zero', () => {
    const store = create()
    store.getState().stepBackward()
    expect(store.getState().snapshot.index).toBe(0)
    store.getState().stepForward()
    expect(store.getState().snapshot.weights[0]).toBeCloseTo(-2.8, 10)
    expect(store.getState().snapshot.index).toBe(1)
    store.getState().stepBackward()
    expect(store.getState().snapshot.weights).toEqual([-4])
    store.getState().dispose()
  })

  it.each([1, 2, 4] as const)('plays exactly one step per tick at %i steps per second', (speed) => {
    const store = create()
    store.getState().setSpeed(speed)
    expect(store.getState().playing).toBe(false)
    store.getState().play()
    store.getState().play()
    vi.advanceTimersByTime(1000 / speed - 1)
    expect(store.getState().snapshot.index).toBe(0)
    vi.advanceTimersByTime(1)
    expect(store.getState().snapshot.index).toBe(1)
    vi.advanceTimersByTime(1000 / speed)
    expect(store.getState().snapshot.index).toBe(2)
    store.getState().pause()
    vi.advanceTimersByTime(10000)
    expect(store.getState().snapshot.index).toBe(2)
    store.getState().dispose()
  })

  it('reschedules after a speed change without starting a paused run', () => {
    const store = create()
    store.getState().setSpeed(4)
    vi.advanceTimersByTime(500)
    expect(store.getState().snapshot.index).toBe(0)
    store.getState().play()
    vi.advanceTimersByTime(100)
    store.getState().setSpeed(1)
    vi.advanceTimersByTime(999)
    expect(store.getState().snapshot.index).toBe(0)
    vi.advanceTimersByTime(1)
    expect(store.getState().snapshot.index).toBe(1)
    store.getState().dispose()
  })

  it('applies a mid-play rate change to the next recorded transition without resetting', () => {
    const store = create()
    store.getState().play()
    vi.advanceTimersByTime(1000)
    store.getState().setRate(0.5)
    expect(store.getState().playing).toBe(true)
    expect(store.getState().snapshot.index).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(store.getState().history.branches[0]!.transitions.map((item) => item.rate)).toEqual([0.2, 0.5])
    store.getState().dispose()
  })

  it('reset preserves the chosen start and rate while cancelling playback', () => {
    const store = create()
    store.getState().setStart([0])
    store.getState().setRate(0.5)
    store.getState().play()
    vi.advanceTimersByTime(1000)
    store.getState().reset()
    expect(store.getState().snapshot.index).toBe(0)
    expect(store.getState().snapshot.weights).toEqual([0])
    expect(store.getState().rate).toBe(0.5)
    expect(store.getState().playing).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(store.getState().snapshot.index).toBe(0)
    store.getState().dispose()
  })

  it('stops at a stationary gradient threshold without claiming a minimum', () => {
    const store = create(2 + 5e-7)
    store.getState().stepForward()
    expect(store.getState().snapshot.index).toBe(0)
    expect(store.getState().stopReason).toBe('stationary')
    expect(store.getState().message).toMatch(/stationary/i)
    expect(store.getState().message).not.toMatch(/minimum/i)
    store.getState().dispose()
  })

  it('treats a zero rate away from a stationary point as no progress, not convergence', () => {
    const store = create(-4, 0)
    store.getState().stepForward()
    expect(store.getState().snapshot.index).toBe(1)
    expect(store.getState().snapshot.weights).toEqual([-4])
    expect(store.getState().stopReason).not.toBe('stationary')
    expect(store.getState().message).toMatch(/no progress/i)
    store.getState().dispose()
  })

  it('disposes all timers and prevents late updates', () => {
    const store = create()
    store.getState().play()
    store.getState().dispose()
    vi.advanceTimersByTime(10000)
    expect(store.getState().snapshot.index).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('can reactivate after lifecycle cleanup without reviving an old timer', () => {
    const store = create()
    store.getState().play()
    store.getState().dispose()
    store.getState().activate()
    vi.advanceTimersByTime(2000)
    expect(store.getState().snapshot.index).toBe(0)
    store.getState().stepForward()
    expect(store.getState().snapshot.index).toBe(1)
    store.getState().dispose()
  })
})
