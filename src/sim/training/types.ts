import type { TrainingSnapshot, TrainingTransition } from '../../core/training/types'

export interface TrainingBranch {
  readonly id: string
  readonly snapshots: readonly TrainingSnapshot[]
  readonly transitions: readonly TrainingTransition[]
}

export interface TrainingHistory {
  readonly activeBranchId: string
  readonly branches: readonly TrainingBranch[]
}
