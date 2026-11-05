import { describe, expect, it } from 'vitest'
import type { TrainingSnapshot, TrainingTransition } from '../../../src/core/training/types'
import {
  appendTrainingStep,
  createTrainingHistory,
  forkTrainingHistory,
} from '../../../src/sim/training/history'

const initial: TrainingSnapshot = { index: 0, weights: [-4], loss: 18, gradient: [-6] }
const first: TrainingSnapshot = { index: 1, weights: [-2.8], loss: 11.52, gradient: [-4.8] }
const firstTransition: TrainingTransition = {
  rate: 0.2,
  oldWeights: [-4],
  gradient: [-6],
  update: [1.2],
  newWeights: [-2.8],
}

describe('training history invariants', () => {
  it('stores snapshots and transitions without mutating earlier histories or input arrays', () => {
    const weights = [-4]
    const history = createTrainingHistory({ ...initial, weights })
    const rootId = history.activeBranchId
    const next = appendTrainingStep(history, rootId, firstTransition, first)
    weights[0] = 10

    expect(history.branches[0]!.snapshots).toHaveLength(1)
    expect(history.branches[0]!.snapshots[0]!.weights).toEqual([-4])
    expect(next.branches[0]!.snapshots).toEqual([initial, first])
    expect(next.branches[0]!.transitions).toEqual([firstTransition])
    expect(next.branches[0]!.snapshots).toHaveLength(next.branches[0]!.transitions.length + 1)
  })

  it('retains the original branch when a new continuation forks from an earlier state', () => {
    const history = createTrainingHistory(initial)
    const rootId = history.activeBranchId
    const withFuture = appendTrainingStep(history, rootId, firstTransition, first)
    const alternative: TrainingSnapshot = { index: 1, weights: [-1], loss: 4.5, gradient: [-3] }
    const alternativeTransition: TrainingTransition = {
      rate: 0.5,
      oldWeights: [-4],
      gradient: [-6],
      update: [3],
      newWeights: [-1],
    }

    const branched = forkTrainingHistory(withFuture, rootId, 0, alternativeTransition, alternative)
    const original = branched.branches.find((branch) => branch.id === rootId)
    const replacement = branched.branches.find((branch) => branch.id === branched.activeBranchId)
    expect(branched.activeBranchId).not.toBe(rootId)
    expect(original?.snapshots).toEqual([initial, first])
    expect(original?.transitions).toEqual([firstTransition])
    expect(replacement?.snapshots).toEqual([initial, alternative])
    expect(replacement?.transitions).toEqual([alternativeTransition])
    expect(withFuture.branches).toHaveLength(1)
  })

  it('rejects non-finite snapshots and transitions without mutating stored history', () => {
    const history = createTrainingHistory(initial)
    const id = history.activeBranchId
    expect(() => appendTrainingStep(history, id, firstTransition, { ...first, loss: NaN }))
      .toThrow(/finite/i)
    expect(() => appendTrainingStep(history, id, { ...firstTransition, rate: Infinity }, first))
      .toThrow(/finite/i)
    expect(history.branches[0]!.snapshots).toEqual([initial])
    expect(history.branches[0]!.transitions).toEqual([])
  })

  it('rejects mismatched indices and transitions', () => {
    const history = createTrainingHistory(initial)
    const id = history.activeBranchId
    expect(() => appendTrainingStep(history, id, firstTransition, { ...first, index: 2 }))
      .toThrow(/index/i)
    expect(() => appendTrainingStep(history, id, { ...firstTransition, oldWeights: [5] }, first))
      .toThrow(/weight/i)
    expect(() => forkTrainingHistory(history, id, 1, firstTransition, first))
      .toThrow(/index/i)
    expect(() => appendTrainingStep(history, id, firstTransition, {
      ...first, weights: [-2.8, 1], gradient: [-4.8, 1],
    })).toThrow(/dimension/i)
    expect(() => appendTrainingStep(history, id, { ...firstTransition, update: [0] }, first))
      .toThrow(/update/i)
  })

  it('retains indices 0 through 1000 and refuses a 1001st transition', () => {
    let history = createTrainingHistory(initial)
    const id = history.activeBranchId
    const noProgress: TrainingTransition = {
      rate: 0,
      oldWeights: [-4],
      gradient: [-6],
      update: [0],
      newWeights: [-4],
    }
    for (let index = 1; index <= 1000; index++) {
      history = appendTrainingStep(history, id, noProgress, { ...initial, index })
    }
    const branch = history.branches[0]!
    expect(branch.snapshots).toHaveLength(1001)
    expect(branch.transitions).toHaveLength(1000)
    expect(branch.snapshots[1000]!.index).toBe(1000)
    expect(() => appendTrainingStep(history, id, noProgress, { ...initial, index: 1001 }))
      .toThrow(/limit|1000/i)
  })
})
