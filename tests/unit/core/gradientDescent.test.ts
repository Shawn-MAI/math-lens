import { describe, expect, it } from 'vitest'
import reference from '../../fixtures/training-reference-values.json'
import { convex1d } from '../../../src/core/training/landscapes'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import type { Landscape, TrainingSnapshot } from '../../../src/core/training/types'

// Independent references use abs(actual - expected) <= 1e-10 + 1e-10 * abs(expected).
function expectReference(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-10 + 1e-10 * Math.abs(expected))
}

function snapshot(weights: number[], gradient: number[], loss = 1): TrainingSnapshot {
  return { index: 0, weights, gradient, loss }
}

function landscape(overrides: Partial<Landscape> = {}): Landscape {
  return {
    id: 'test',
    dimensions: 1,
    loss: () => 1,
    gradient: () => [1],
    ...overrides,
  }
}

describe('convex 1D landscape and gradient descent', () => {
  it.each(reference.cases.filter((entry) => entry.landscape === 'convex-1d'))(
    '$id matches hand-calculated loss, gradient and every transition value',
    (entry) => {
      expectReference(convex1d.loss(entry.start.weights), entry.start.loss)
      expectReference(convex1d.gradient(entry.start.weights)[0]!, entry.start.gradient[0]!)
      const start = { index: 0, ...entry.start }
      const result = gradientDescent.step(start, entry.rate, convex1d)
      expect(result.kind).toBe('success')
      if (result.kind !== 'success') throw new Error('Expected a finite transition')
      expect(result.snapshot.index).toBe(1)
      expect(result.transition.rate).toBe(entry.rate)
      expectReference(result.transition.oldWeights[0]!, entry.start.weights[0]!)
      expectReference(result.transition.gradient[0]!, entry.start.gradient[0]!)
      expectReference(result.transition.update[0]!, entry.transition.update[0]!)
      expectReference(result.transition.newWeights[0]!, entry.result.weights[0]!)
      expectReference(result.snapshot.weights[0]!, entry.result.weights[0]!)
      expectReference(result.snapshot.loss, entry.result.loss)
      expectReference(result.snapshot.gradient[0]!, entry.result.gradient[0]!)
      expect(start).toEqual({ index: 0, ...entry.start })
    },
  )

  it('updates coordinates simultaneously using the selected snapshot gradient', () => {
    const surface = landscape({
      dimensions: 2,
      loss: ([x = 0, y = 0]) => x * x + y * y,
      gradient: ([x = 0, y = 0]) => [2 * x, 2 * y],
    })
    const result = gradientDescent.step(snapshot([4, 2], [4, 20], 28), 0.15, surface)
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') throw new Error('Expected a finite transition')
    expectReference(result.snapshot.weights[0]!, 3.4)
    expectReference(result.snapshot.weights[1]!, -1)
    expectReference(result.transition.gradient[0]!, 4)
    expectReference(result.transition.gradient[1]!, 20)
  })

  it.each([NaN, Infinity, -Infinity])('rejects non-finite inputs: %s', (value) => {
    expect(gradientDescent.step(snapshot([value], [1]), 0.2, landscape())).toEqual({ kind: 'non-finite', stage: 'input' })
    expect(gradientDescent.step(snapshot([1], [1], value), 0.2, landscape())).toEqual({ kind: 'non-finite', stage: 'input' })
    expect(gradientDescent.step(snapshot([1], [1]), value, landscape())).toEqual({ kind: 'non-finite', stage: 'input' })
    expect(gradientDescent.step(snapshot([1], [value]), 0.2, landscape())).toEqual({ kind: 'non-finite', stage: 'gradient' })
  })

  it('rejects non-finite products, new weights, loss and new gradients without returning partial results', () => {
    expect(gradientDescent.step(snapshot([1], [Number.MAX_VALUE]), 2, landscape()))
      .toEqual({ kind: 'non-finite', stage: 'product' })
    expect(gradientDescent.step(snapshot([Number.MAX_VALUE], [-Number.MAX_VALUE]), 1, landscape()))
      .toEqual({ kind: 'non-finite', stage: 'weight' })
    expect(gradientDescent.step(snapshot([1], [1]), 0.2, landscape({ loss: () => Infinity })))
      .toEqual({ kind: 'non-finite', stage: 'loss' })
    expect(gradientDescent.step(snapshot([1], [1]), 0.2, landscape({ gradient: () => [NaN] })))
      .toEqual({ kind: 'non-finite', stage: 'result-gradient' })
    const boundary = reference.overflowBoundary
    expect(gradientDescent.step({ index: 0, ...boundary.start }, boundary.rate, convex1d))
      .toEqual({ kind: 'non-finite', stage: 'loss' })
  })

  it('preserves a zero-rate finite update and rejects invalid dimensions or rates explicitly', () => {
    const result = gradientDescent.step(snapshot([1], [-1]), 0, convex1d)
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') throw new Error('Expected a finite transition')
    expect(result.snapshot.weights).toEqual([1])
    expect(result.transition.update[0]).toBe(0)
    expect(() => gradientDescent.step(snapshot([1, 2], [1, 2]), 0.1, convex1d)).toThrow(/dimension/i)
    expect(() => gradientDescent.step(snapshot([1], [1]), -1, convex1d)).toThrow(/rate/i)
  })

  it('propagates unexpected landscape errors instead of reporting divergence', () => {
    const failure = new Error('broken landscape')
    expect(() => gradientDescent.step(snapshot([1], [1]), 0.2, landscape({
      loss: () => { throw failure },
    }))).toThrow(failure)
  })
})
