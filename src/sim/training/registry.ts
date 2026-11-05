import type { AlgorithmAdapter, Landscape, TrainingDimension } from '../../core/training/types'
import { gradientDescent } from '../../core/training/gradientDescent'
import { convex1d, convex2d, nonconvex1d } from '../../core/training/landscapes'

export interface TrainingRegistry {
  readonly adapters: Readonly<Record<string, AlgorithmAdapter>>
  readonly landscapes: Readonly<Record<string, Landscape>>
  readonly charts: Readonly<Record<string, TrainingDimension>>
}

export const TRAINING_REGISTRY: TrainingRegistry = {
  adapters: { [gradientDescent.id]: gradientDescent },
  landscapes: { [convex1d.id]: convex1d, [convex2d.id]: convex2d, [nonconvex1d.id]: nonconvex1d },
  charts: { 'training-curve': 1, 'training-contour': 2 },
}
