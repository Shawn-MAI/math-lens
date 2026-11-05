import type { Landscape } from './types'

function oneWeight(weights: readonly number[]): number {
  if (weights.length !== 1) throw new Error('Landscape requires one weight dimension')
  return weights[0]!
}

export const nonconvex1d: Landscape = {
  id: 'nonconvex-1d',
  dimensions: 1,
  loss: (weights) => {
    const weight = oneWeight(weights)
    const square = weight * weight - 1
    return square * square + 0.2 * weight + 0.3
  },
  gradient: (weights) => {
    const weight = oneWeight(weights)
    return [4 * weight * (weight * weight - 1) + 0.2]
  },
}

function twoWeights(weights: readonly number[]): readonly [number, number] {
  if (weights.length !== 2) throw new Error('Landscape requires two weight dimensions')
  return [weights[0]!, weights[1]!]
}

export const convex2d: Landscape = {
  id: 'convex-2d',
  dimensions: 2,
  loss: (weights) => {
    const [x, y] = twoWeights(weights)
    return 0.5 * x * x + 5 * y * y
  },
  gradient: (weights) => {
    const [x, y] = twoWeights(weights)
    return [x, 10 * y]
  },
}

export const convex1d: Landscape = {
  id: 'convex-1d',
  dimensions: 1,
  loss: (weights) => {
    const distance = oneWeight(weights) - 2
    return 0.5 * distance * distance
  },
  gradient: (weights) => [oneWeight(weights) - 2],
}
