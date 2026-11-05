import { describe, expect, it } from 'vitest'
import references from '../../fixtures/training-reference-values.json'
import { convex2d } from '../../../src/core/training/landscapes'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import { createTrainingStore } from '../../../src/sim/training/store'

// Independent references use abs(actual - expected) <= 1e-10 + 1e-10 * abs(expected).
const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-10 + 1e-10 * Math.abs(expected))

describe('two-dimensional bowl', () => {
  it.each(references.cases.filter((entry) => entry.landscape === 'convex-2d'))('$id matches both coordinates, loss and gradient', (entry) => {
    close(convex2d.loss(entry.start.weights), entry.start.loss)
    const gradient = convex2d.gradient(entry.start.weights)
    gradient.forEach((value, index) => close(value, entry.start.gradient[index]!))
    const result = gradientDescent.step({ index: 0, ...entry.start }, entry.rate, convex2d)
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') throw new Error('Expected finite 2D update')
    result.snapshot.weights.forEach((value, index) => close(value, entry.result.weights[index]!))
    result.snapshot.gradient.forEach((value, index) => close(value, entry.result.gradient[index]!))
    close(result.snapshot.loss, entry.result.loss)
  })

  it('handles the stationary origin and non-finite arithmetic explicitly', () => {
    expect(convex2d.loss([0, 0])).toBe(0)
    expect(convex2d.gradient([0, 0])).toEqual([0, 0])
    expect(() => convex2d.loss([1])).toThrow(/dimension/i)
    expect(convex2d.loss([1e200, 1])).toBe(Infinity)
    expect(gradientDescent.step({ index: 0, weights: [1, 1], loss: 1, gradient: [1, Infinity] }, 1, convex2d))
      .toEqual({ kind: 'non-finite', stage: 'gradient' })
  })

  it.each([
    [0.0005, 'slow'],
    [0.15, 'good'],
    [0.4, 'large'],
  ] as const)('produces the specified ten-step loss ratio for %s', (rate, kind) => {
    const store = createTrainingStore({ adapter: gradientDescent, landscape: convex2d, start: [4, 2], rate })
    for (let i = 0; i < 10; i++) store.getState().stepForward()
    const ratio = store.getState().snapshot.loss / 28
    if (kind === 'slow') expect(ratio).toBeGreaterThanOrEqual(0.9)
    if (kind === 'slow') expect(ratio).toBeLessThan(1)
    if (kind === 'good') expect(ratio).toBeLessThan(0.8)
    if (kind === 'large') expect(ratio).toBeGreaterThan(1)
    store.getState().dispose()
  })
})
