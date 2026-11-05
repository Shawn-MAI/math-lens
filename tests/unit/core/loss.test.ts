import { describe, expect, it } from 'vitest'
import { predict } from '../../../src/core/linear'
import { mse, residuals, squaredErrors } from '../../../src/core/loss'
import reference from '../../fixtures/reference-values.json'

const LOSS_3 = { x: [1, 2, 3], y: [2, 4, 5] }
const WB_4 = { x: [1, 2, 3, 4], y: [3, 5, 7, 8] }

function run(data: { x: number[]; y: number[] }, slope: number, intercept: number) {
  const predictions = data.x.map((x) => predict(slope, intercept, x))
  const errors = residuals(predictions, data.y)
  const squared = squaredErrors(errors)
  return { predictions, errors, squared, mse: mse(predictions, data.y) }
}

const near = (actual: number[], expected: number[]) => {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((v, i) => expect(Math.abs(v - expected[i]!)).toBeLessThan(1e-9))
}

describe('loss: hand-calculated values', () => {
  it('A3-02: loss-3, slope 2, intercept 0', () => {
    const r = run(LOSS_3, 2, 0)
    near(r.predictions, [2, 4, 6])
    near(r.errors, [0, 0, 1])
    near(r.squared, [0, 0, 1])
    expect(r.mse).toBeCloseTo(1 / 3, 12)
  })

  it('A3-03 and A3-15: Loss default has negative errors (prediction minus actual)', () => {
    const r = run(LOSS_3, 1, 0)
    near(r.errors, [-1, -2, -2])
    near(r.squared, [1, 4, 4])
    expect(r.mse).toBe(3)
    expect(r.errors.every((e) => e < 0)).toBe(true)
  })

  it('A3-04: loss-3, slope 1.5, intercept 0.5', () => {
    const r = run(LOSS_3, 1.5, 0.5)
    near(r.predictions, [2, 3.5, 5])
    near(r.errors, [0, -0.5, 0])
    expect(r.mse).toBeCloseTo(0.25 / 3, 12)
  })

  it('A3-05: weight-bias-4 default', () => {
    const r = run(WB_4, 1, 0)
    near(r.errors, [-2, -3, -4, -4])
    near(r.squared, [4, 9, 16, 16])
    expect(r.mse).toBe(11.25)
  })

  it('A3-06: weight-bias-4, w 2, b 1', () => {
    const r = run(WB_4, 2, 1)
    near(r.errors, [0, 0, 0, 1])
    expect(r.mse).toBe(0.25)
  })

  it('A3-07: weight-bias-4, w 1.5, b 2', () => {
    const r = run(WB_4, 1.5, 2)
    near(r.predictions, [3.5, 5, 6.5, 8])
    near(r.errors, [0.5, 0, -0.5, 0])
    expect(r.mse).toBe(0.125)
  })
})

describe('loss: edge cases', () => {
  it('A3-08: a perfect fit has MSE exactly 0', () => {
    const r = run({ x: [1, 2, 3], y: [2, 4, 6] }, 2, 0)
    expect(r.errors.every((e) => e === 0)).toBe(true)
    expect(r.mse).toBe(0)
  })

  it('A3-09: a single data point', () => {
    const r = run({ x: [1], y: [3] }, 1, 0)
    near(r.errors, [-2])
    expect(r.mse).toBe(4)
  })

  it('A3-10: an empty dataset throws RangeError instead of returning NaN', () => {
    expect(() => mse([], [])).toThrowError(RangeError)
  })

  it('A3-11: mismatched lengths throw RangeError', () => {
    expect(() => mse([1, 2], [1])).toThrowError(RangeError)
    expect(() => residuals([1, 2], [1])).toThrowError(RangeError)
  })

  it('A3-12: large magnitudes', () => {
    const r = run({ x: [1, 2], y: [1e8, 2e8] }, 1e8 + 1, 0)
    near(r.errors, [1, 2])
    expect(r.mse).toBe(2.5)
  })

  it('A3-13: large magnitudes, exact fit', () => {
    expect(run({ x: [1, 2], y: [1e8, 2e8] }, 1e8, 0).mse).toBe(0)
  })

  it('A3-14: small magnitudes keep relative precision', () => {
    const { mse: value } = run({ x: [1, 2], y: [1e-8, 2e-8] }, 0, 0)
    expect(Math.abs(value - 2.5e-16) / 2.5e-16).toBeLessThan(1e-12)
  })
})

describe('loss: NumPy reference (A3-16)', () => {
  it('has 40 cases at tolerance 1e-9', () => {
    expect(reference.cases).toHaveLength(40)
    expect(reference.tolerance).toBe(1e-9)
  })

  it.each(reference.cases.map((c, i) => [i, c] as const))('case %d matches NumPy', (_i, c) => {
    const data = reference.datasets[c.dataset as keyof typeof reference.datasets]
    const value = run(data, c.slope, c.intercept).mse
    expect(Math.abs(value - c.mse)).toBeLessThan(reference.tolerance)
  })
})
