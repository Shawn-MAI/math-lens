export type TrainingDimension = 1 | 2

export interface TrainingSnapshot {
  readonly index: number
  readonly weights: readonly number[]
  readonly loss: number
  readonly gradient: readonly number[]
}

export interface TrainingTransition {
  readonly rate: number
  readonly oldWeights: readonly number[]
  readonly gradient: readonly number[]
  readonly update: readonly number[]
  readonly newWeights: readonly number[]
}

export interface Landscape {
  readonly id: string
  readonly dimensions: TrainingDimension
  loss(weights: readonly number[]): number
  gradient(weights: readonly number[]): readonly number[]
}

export type NonFiniteStage = 'input' | 'gradient' | 'product' | 'weight' | 'loss' | 'result-gradient'

export type TrainingStepResult =
  | { readonly kind: 'success'; readonly snapshot: TrainingSnapshot; readonly transition: TrainingTransition }
  | { readonly kind: 'non-finite'; readonly stage: NonFiniteStage }

export interface AlgorithmAdapter {
  readonly id: string
  readonly dimensions: TrainingDimension | readonly TrainingDimension[]
  step(snapshot: TrainingSnapshot, rate: number, landscape: Landscape): TrainingStepResult
}

export function assertCompatibleDimensions(adapter: AlgorithmAdapter, landscape: Landscape): void {
  const supported = typeof adapter.dimensions === 'number' ? [adapter.dimensions] : adapter.dimensions
  if (!supported.includes(landscape.dimensions)) {
    throw new Error(`Adapter "${adapter.id}" is incompatible with landscape "${landscape.id}" dimensions`)
  }
}
