import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { convex1d } from '../../../src/core/training/landscapes'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import type { AlgorithmAdapter } from '../../../src/core/training/types'
import { createTrainingStore } from '../../../src/sim/training/store'

function create(adapter: AlgorithmAdapter = gradientDescent, rate = 0.2) {
  return createTrainingStore({ adapter, landscape: convex1d, start: [-4], rate })
}

describe('training timeline and retained branches', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('restores 20 exact recorded snapshots and their original transition rates', () => {
    const store = create()
    for (let i = 0; i < 10; i++) store.getState().stepForward()
    store.getState().setRate(0.5)
    for (let i = 0; i < 10; i++) store.getState().stepForward()
    const original = store.getState().history.branches[0]!
    const snapshots = [...original.snapshots]
    const rates = original.transitions.map((transition) => transition.rate)
    expect(rates.slice(0, 10)).toEqual(Array<number>(10).fill(0.2))
    expect(rates.slice(10)).toEqual(Array<number>(10).fill(0.5))
    store.getState().play()
    store.getState().seek(7)
    expect(store.getState().playing).toBe(false)
    for (let index = 7; index <= 20; index++) {
      expect(store.getState().snapshot).toEqual(snapshots[index])
      if (index < 20) store.getState().stepForward()
    }
    expect(store.getState().history.branches[0]!.transitions.map((transition) => transition.rate)).toEqual(rates)
    store.getState().dispose()
  })

  it('rejects invalid seeks and unknown branches', () => {
    const store = create()
    for (const index of [-1, 1, 0.5, NaN]) expect(() => store.getState().seek(index)).toThrow()
    expect(() => store.getState().selectBranch('missing')).toThrow(/branch/i)
    store.getState().dispose()
  })

  it('branches only after a changed-rate update succeeds and restores each branch selection and configured rate', () => {
    const store = create()
    for (let i = 0; i < 20; i++) store.getState().stepForward()
    const oldBranch = store.getState().history.branches[0]!
    const oldSnapshots = oldBranch.snapshots
    store.getState().seek(7)
    store.getState().setRate(0.2)
    store.getState().stepForward()
    expect(store.getState().history.branches).toHaveLength(1)
    expect(store.getState().snapshot).toEqual(oldSnapshots[8])
    store.getState().seek(7)
    store.getState().setRate(0.4)
    expect(store.getState().history.branches).toHaveLength(1)
    store.getState().stepForward()
    expect(store.getState().history.branches).toHaveLength(2)
    const newBranch = store.getState().history.branches[1]!
    expect(newBranch.transitions[7]!.rate).toBe(0.4)
    expect(store.getState().history.branches[0]!.snapshots).toEqual(oldSnapshots)
    store.getState().play()
    store.getState().selectBranch(oldBranch.id)
    expect(store.getState().playing).toBe(false)
    expect(store.getState().snapshot).toEqual(oldSnapshots[7])
    expect(store.getState().rate).toBe(0.2)
    store.getState().selectBranch(newBranch.id)
    expect(store.getState().snapshot).toEqual(newBranch.snapshots[8])
    expect(store.getState().rate).toBe(0.4)
    store.getState().dispose()
  })

  it('does not create a branch or discard the recorded future when a branch update fails', () => {
    let fail = false
    const adapter: AlgorithmAdapter = {
      ...gradientDescent,
      step: (...args) => fail ? { kind: 'non-finite', stage: 'product' } : gradientDescent.step(...args),
    }
    const store = create(adapter)
    for (let i = 0; i < 5; i++) store.getState().stepForward()
    const original = store.getState().history.branches[0]!
    store.getState().seek(2)
    store.getState().setRate(0.4)
    fail = true
    store.getState().stepForward()
    expect(store.getState().history.branches).toEqual([original])
    expect(store.getState().snapshot).toEqual(original.snapshots[2])
    expect(store.getState().stopReason).toBe('diverged')
    store.getState().dispose()
  })

  it('retains all 1001 genuinely computed states and restores each exactly', () => {
    const store = create(gradientDescent, 0.0005)
    for (let i = 0; i < 1000; i++) store.getState().stepForward()
    const branch = store.getState().history.branches[0]!
    expect(branch.snapshots).toHaveLength(1001)
    expect(branch.transitions).toHaveLength(1000)
    expect(new Set(branch.snapshots.map((state) => state.weights[0])).size).toBe(1001)
    expect(store.getState().stopReason).toBe('limit')
    for (let i = 1000; i >= 0; i--) {
      store.getState().seek(i)
      expect(store.getState().snapshot).toEqual(branch.snapshots[i])
    }
    store.getState().dispose()
  })

  it('restores a branch-specific terminal state and its last selected index', () => {
    const store = create(gradientDescent, 0.0005)
    for (let i = 0; i < 1000; i++) store.getState().stepForward()
    store.getState().seek(500)
    store.getState().setRate(0.001)
    store.getState().stepForward()
    store.getState().selectBranch('branch-1')
    store.getState().seek(1000)
    expect(store.getState().stopReason).toBe('limit')
    store.getState().selectBranch('branch-2')
    expect(store.getState().stopReason).not.toBe('limit')
    store.getState().selectBranch('branch-1')
    expect(store.getState().snapshot.index).toBe(1000)
    expect(store.getState().stopReason).toBe('limit')
    store.getState().dispose()
  })
})
