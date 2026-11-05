import { describe, expect, it } from 'vitest'
import { convex1d } from '../../../src/core/training/landscapes'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import { createTrainingStore } from '../../../src/sim/training/store'
import { classifyTrainingTrend } from '../../../src/sim/training/trend'
import type { TrainingSnapshot } from '../../../src/core/training/types'

function run(rate: number) {
  const store = createTrainingStore({ adapter: gradientDescent, landscape: convex1d, start: [-4], rate })
  for (let i = 0; i < 10; i++) store.getState().stepForward()
  return store
}

describe('learning-rate observations', () => {
  it.each([
    [0.0005, 'slow'],
    [0.2, 'decrease'],
    [4, 'increase'],
  ] as const)('classifies actual ten-step loss for rate %s as %s', (rate, expected) => {
    const store = run(rate)
    const branch = store.getState().history.branches[0]!
    const ratio = branch.snapshots[10]!.loss / branch.snapshots[0]!.loss
    if (expected === 'slow') expect(ratio).toBeGreaterThanOrEqual(0.9)
    if (expected === 'slow') expect(ratio).toBeLessThan(1)
    if (expected === 'decrease') expect(ratio).toBeLessThan(0.8)
    if (expected === 'increase') expect(ratio).toBeGreaterThan(1)
    expect(classifyTrainingTrend(branch.snapshots).kind).toBe(expected)
    expect(classifyTrainingTrend(branch.snapshots).alternating).toBe(rate === 4)
    store.getState().dispose()
  })

  it('uses recorded transitions when the learning rate changes during a run', () => {
    const store = createTrainingStore({ adapter: gradientDescent, landscape: convex1d, start: [-4], rate: 0.2 })
    store.getState().stepForward()
    store.getState().setRate(0.5)
    store.getState().stepForward()
    expect(store.getState().history.branches[0]!.transitions.map((item) => item.rate)).toEqual([0.2, 0.5])
    store.getState().seek(0)
    store.getState().setRate(0.4)
    store.getState().stepForward()
    expect(store.getState().history.branches).toHaveLength(2)
    expect(store.getState().history.branches[0]!.transitions[0]!.rate).toBe(0.2)
    expect(store.getState().history.branches[1]!.transitions[0]!.rate).toBe(0.4)
    for (const invalid of [-1, NaN, Infinity]) expect(() => store.getState().setRate(invalid)).toThrow()
    store.getState().dispose()
  })

  it('requires ten transitions and compares a zero baseline without division', () => {
    const states = (losses: number[]): TrainingSnapshot[] => losses.map((loss, index) => ({
      index, weights: [index], loss, gradient: [1],
    }))
    expect(classifyTrainingTrend(states(Array<number>(10).fill(1))).kind).toBe('insufficient')
    expect(classifyTrainingTrend(states([0, ...Array<number>(9).fill(0), 1])).kind).toBe('increase')
    expect(classifyTrainingTrend(states(Array<number>(11).fill(0))).kind).toBe('unchanged')
  })
})
