import { contours as makeContours, type ContourMultiPolygon } from 'd3-contour'
import type { Landscape } from '../../core/training/types'

export type Domain = readonly [number, number]

export interface TrainingContours {
  readonly size: number
  readonly values: readonly number[]
  readonly contours: readonly ContourMultiPolygon[]
}

const cache = new WeakMap<Landscape, Map<string, TrainingContours>>()

function assertDomain(domain: Domain): void {
  if (!domain.every(Number.isFinite) || domain[0] >= domain[1] || !Number.isFinite(domain[1] - domain[0])) {
    throw new Error('Contour domain must be finite and ordered')
  }
}

export function contourPoint(point: readonly [number, number], xDomain: Domain, yDomain: Domain): [number, number] {
  assertDomain(xDomain)
  assertDomain(yDomain)
  if (!point.every(Number.isFinite) || point[0] < xDomain[0] || point[0] > xDomain[1]
    || point[1] < yDomain[0] || point[1] > yDomain[1]) {
    throw new Error('Contour point is outside the finite domain')
  }
  return [
    40 + (point[0] - xDomain[0]) / (xDomain[1] - xDomain[0]) * 520,
    360 - (point[1] - yDomain[0]) / (yDomain[1] - yDomain[0]) * 320,
  ]
}

export function buildTrainingContours(landscape: Landscape, xDomain: Domain, yDomain: Domain): TrainingContours {
  assertDomain(xDomain)
  assertDomain(yDomain)
  if (landscape.dimensions !== 2) throw new Error('Contours require a two-dimensional landscape')
  const key = `${xDomain[0]},${xDomain[1]},${yDomain[0]},${yDomain[1]}`
  const existing = cache.get(landscape)?.get(key)
  if (existing) return existing
  const size = 61
  const values: number[] = []
  for (let row = 0; row < size; row++) {
    const y = yDomain[1] - (yDomain[1] - yDomain[0]) * (row / (size - 1))
    for (let column = 0; column < size; column++) {
      const x = xDomain[0] + (xDomain[1] - xDomain[0]) * (column / (size - 1))
      const value = landscape.loss([x, y])
      if (!Number.isFinite(value)) throw new Error('Contour samples must be finite')
      values.push(value)
    }
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const magnitude = Math.max(1, Math.abs(min), Math.abs(max))
  const low = min / magnitude
  const span = max / magnitude - low
  const normalized = span === 0 ? [] : values.map((value) => (value / magnitude - low) / span)
  const thresholds = Array.from({ length: 9 }, (_, index) => (index + 1) / 10)
  const shapes = normalized.length === 0 ? [] : makeContours().size([size, size]).thresholds(thresholds)(normalized)
    .map((shape) => ({ ...shape, value: min * (1 - shape.value) + max * shape.value }))
  const result: TrainingContours = { size, values, contours: shapes }
  const entries = cache.get(landscape) ?? new Map<string, TrainingContours>()
  entries.set(key, result)
  cache.set(landscape, entries)
  return result
}
