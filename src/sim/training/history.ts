import type { TrainingSnapshot, TrainingTransition } from '../../core/training/types'
import type { TrainingBranch, TrainingHistory } from './types'

const MAX_TRANSITIONS = 1000

function assertFiniteValues(values: readonly number[], name: string): void {
  if (!values.every(Number.isFinite)) throw new Error(`${name} must contain only finite numbers`)
}

function copySnapshot(snapshot: TrainingSnapshot): TrainingSnapshot {
  if (!Number.isInteger(snapshot.index) || snapshot.index < 0 || snapshot.index > MAX_TRANSITIONS) {
    throw new Error('Snapshot index must be an integer from 0 to 1000')
  }
  if (snapshot.weights.length < 1 || snapshot.weights.length > 2 || snapshot.gradient.length !== snapshot.weights.length) {
    throw new Error('Snapshot weight and gradient dimensions must match and be one or two')
  }
  assertFiniteValues([...snapshot.weights, snapshot.loss, ...snapshot.gradient], 'Snapshot')
  return Object.freeze({
    index: snapshot.index,
    weights: Object.freeze([...snapshot.weights]),
    loss: snapshot.loss,
    gradient: Object.freeze([...snapshot.gradient]),
  })
}

function copyTransition(
  transition: TrainingTransition,
  previous: TrainingSnapshot,
  next: TrainingSnapshot,
): TrainingTransition {
  if (!Number.isFinite(transition.rate) || transition.rate < 0) {
    throw new Error('Transition rate must be finite and non-negative')
  }
  if (next.weights.length !== previous.weights.length) {
    throw new Error('Adjacent snapshot dimensions must match')
  }
  const arrays = [transition.oldWeights, transition.gradient, transition.update, transition.newWeights]
  for (const values of arrays) {
    if (values.length !== previous.weights.length) throw new Error('Transition dimensions must match snapshot weights')
    assertFiniteValues(values, 'Transition')
  }
  for (let i = 0; i < previous.weights.length; i++) {
    if (transition.oldWeights[i] !== previous.weights[i] || transition.newWeights[i] !== next.weights[i]) {
      throw new Error('Transition weights must match the adjacent snapshots')
    }
    if (transition.gradient[i] !== previous.gradient[i]) {
      throw new Error('Transition gradient must match the previous snapshot')
    }
    const update = transition.update[i]!
    if (previous.weights[i]! + update !== next.weights[i]) {
      throw new Error('Transition update must match the resulting weight')
    }
  }
  return Object.freeze({
    rate: transition.rate,
    oldWeights: Object.freeze([...transition.oldWeights]),
    gradient: Object.freeze([...transition.gradient]),
    update: Object.freeze([...transition.update]),
    newWeights: Object.freeze([...transition.newWeights]),
  })
}

function findBranch(history: TrainingHistory, id: string): TrainingBranch {
  const branch = history.branches.find((item) => item.id === id)
  if (!branch) throw new Error(`Unknown training branch "${id}"`)
  return branch
}

function createBranch(
  id: string,
  snapshots: readonly TrainingSnapshot[],
  transitions: readonly TrainingTransition[],
): TrainingBranch {
  return Object.freeze({
    id,
    snapshots: Object.freeze([...snapshots]),
    transitions: Object.freeze([...transitions]),
  })
}

export function createTrainingHistory(initial: TrainingSnapshot): TrainingHistory {
  if (initial.index !== 0) throw new Error('Initial snapshot index must be 0')
  const branch = createBranch('branch-1', [copySnapshot(initial)], [])
  return Object.freeze({ activeBranchId: branch.id, branches: Object.freeze([branch]) })
}

export function appendTrainingStep(
  history: TrainingHistory,
  branchId: string,
  transition: TrainingTransition,
  snapshot: TrainingSnapshot,
): TrainingHistory {
  const branch = findBranch(history, branchId)
  if (branch.transitions.length >= MAX_TRANSITIONS) throw new Error('Training branch reached the 1000-update limit')
  const previous = branch.snapshots[branch.snapshots.length - 1]!
  if (snapshot.index !== previous.index + 1) throw new Error('Snapshot index must follow the branch tip')
  const next = copySnapshot(snapshot)
  const storedTransition = copyTransition(transition, previous, next)
  const updated = createBranch(branch.id, [...branch.snapshots, next], [...branch.transitions, storedTransition])
  return Object.freeze({
    activeBranchId: history.activeBranchId,
    branches: Object.freeze(history.branches.map((item) => item.id === branchId ? updated : item)),
  })
}

export function forkTrainingHistory(
  history: TrainingHistory,
  branchId: string,
  index: number,
  transition: TrainingTransition,
  snapshot: TrainingSnapshot,
): TrainingHistory {
  const source = findBranch(history, branchId)
  if (!Number.isInteger(index) || index < 0 || index >= source.snapshots.length - 1) {
    throw new Error('Branch index must refer to a snapshot before the tip')
  }
  if (snapshot.index !== index + 1) throw new Error('Snapshot index must follow the branch point')
  const previous = source.snapshots[index]!
  const next = copySnapshot(snapshot)
  const storedTransition = copyTransition(transition, previous, next)
  const branch = createBranch(
    `branch-${history.branches.length + 1}`,
    [...source.snapshots.slice(0, index + 1), next],
    [...source.transitions.slice(0, index), storedTransition],
  )
  return Object.freeze({
    activeBranchId: branch.id,
    branches: Object.freeze([...history.branches, branch]),
  })
}
