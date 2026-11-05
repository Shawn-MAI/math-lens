import { describe, expect, it } from 'vitest'
import references from '../../fixtures/training-reference-values.json'
import { nonconvex1d } from '../../../src/core/training/landscapes'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import { createTrainingStore } from '../../../src/sim/training/store'

// Independent references use abs(actual - expected) <= 1e-10 + 1e-10 * abs(expected).
const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-10 + 1e-10 * Math.abs(expected))

describe('non-convex loss landscape', () => {
  it.each(references.cases.filter((entry) => entry.landscape === 'nonconvex-1d'))('$id matches the independent loss and gradient reference', (entry) => {
    close(nonconvex1d.loss(entry.start.weights), entry.start.loss)
    close(nonconvex1d.gradient(entry.start.weights)[0]!, entry.start.gradient[0]!)
    const result = gradientDescent.step({ index: 0, ...entry.start }, entry.rate, nonconvex1d)
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') throw new Error('Expected finite non-convex update')
    close(result.snapshot.weights[0]!, entry.result.weights[0]!)
    close(result.snapshot.loss, entry.result.loss)
    close(result.snapshot.gradient[0]!, entry.result.gradient[0]!)
  })

  it.each([
    [-0.5, -1.02412030, 0.09755957],
    [0.5, 0.97399435, 0.49743415],
  ])('at good rate reaches the expected stationary point from %s', (start, weight, loss) => {
    const store = createTrainingStore({ adapter: gradientDescent, landscape: nonconvex1d, start: [start], rate: 0.08 })
    for (let i = 0; i < 1000 && store.getState().stopReason === null; i++) store.getState().stepForward()
    expect(store.getState().stopReason).toBe('stationary')
    expect(store.getState().snapshot.weights[0]).toBeCloseTo(weight, 5)
    expect(store.getState().snapshot.loss).toBeCloseTo(loss, 7)
    store.getState().dispose()
  })

  it('surfaces overflow and rejects invalid dimensions', () => {
    expect(nonconvex1d.loss([1e100])).toBe(Infinity)
    expect(nonconvex1d.gradient([1e200])[0]).toBe(Infinity)
    expect(() => nonconvex1d.loss([1, 2])).toThrow(/dimension/i)
  })

  it('does not imply the starting point alone fixes a basin at arbitrary rates', () => {
    const store = createTrainingStore({ adapter: gradientDescent, landscape: nonconvex1d, start: [0.5], rate: 0.5 })
    for (let i = 0; i < 50 && store.getState().stopReason === null; i++) store.getState().stepForward()
    expect(store.getState().stopReason).toBe('diverged')
    store.getState().dispose()
  })
})
