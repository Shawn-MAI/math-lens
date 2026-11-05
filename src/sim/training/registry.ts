import type { AlgorithmAdapter, Landscape, TrainingDimension } from '../../core/training/types'

export interface TrainingRegistry {
  readonly adapters: Readonly<Record<string, AlgorithmAdapter>>
  readonly landscapes: Readonly<Record<string, Landscape>>
  readonly charts: Readonly<Record<string, TrainingDimension>>
}

export const TRAINING_REGISTRY: TrainingRegistry = {
  adapters: {},
  landscapes: {},
  charts: { 'training-curve': 1, 'training-contour': 2 },
}
