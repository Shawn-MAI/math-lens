import { describe, expect, it } from 'vitest'
import { clamp, roundTo, snapToStep, sum } from '../../../src/core/numeric'

describe('snapToStep (A1-01 to A1-03, A1-05)', () => {
  it('A1-01: removes floating point drift', () => {
    expect(snapToStep(0.30000000000000004, 0.1, -3)).toBe(0.3)
  })

  it('A1-02: rounds to the nearest step from min', () => {
    expect(snapToStep(1.04, 0.1, -3)).toBe(1.0)
    expect(snapToStep(1.06, 0.1, -3)).toBe(1.1)
  })

  it('A1-03: keeps a value already on the grid, including both range ends', () => {
    expect(snapToStep(-3, 0.1, -3)).toBe(-3)
    expect(snapToStep(3, 0.1, -3)).toBe(3)
    expect(snapToStep(0, 0.1, -3)).toBe(0)
    expect(snapToStep(-0.7, 0.1, -3)).toBe(-0.7)
  })

  it('snaps relative to min when min is not a multiple of the step', () => {
    expect(snapToStep(0.33, 0.25, 0.1)).toBe(0.35)
  })

  it('A1-05: non-finite input throws RangeError', () => {
    expect(() => snapToStep(NaN, 0.1, -3)).toThrowError(RangeError)
    expect(() => snapToStep(Infinity, 0.1, -3)).toThrowError(RangeError)
    expect(() => snapToStep(-Infinity, 0.1, -3)).toThrowError(RangeError)
  })

  it('rejects a step that is not a positive finite number', () => {
    expect(() => snapToStep(1, 0, -3)).toThrowError(RangeError)
    expect(() => snapToStep(1, -0.1, -3)).toThrowError(RangeError)
    expect(() => snapToStep(1, NaN, -3)).toThrowError(RangeError)
  })
})

describe('clamp (A1-04, A1-05)', () => {
  it('A1-04: limits to the range', () => {
    expect(clamp(5, -3, 3)).toBe(3)
    expect(clamp(-9, -3, 3)).toBe(-3)
    expect(clamp(1, -3, 3)).toBe(1)
  })

  it('keeps the bounds themselves', () => {
    expect(clamp(3, -3, 3)).toBe(3)
    expect(clamp(-3, -3, 3)).toBe(-3)
  })

  it('A1-05: non-finite input throws RangeError', () => {
    expect(() => clamp(NaN, -3, 3)).toThrowError(RangeError)
    expect(() => clamp(Infinity, -3, 3)).toThrowError(RangeError)
  })

  it('rejects min greater than max', () => {
    expect(() => clamp(0, 3, -3)).toThrowError(RangeError)
  })
})

describe('roundTo (A1-06)', () => {
  it('A1-06: 0.1 + 0.2 rounds to exactly 0.3', () => {
    expect(roundTo(0.1 + 0.2, 1)).toBe(0.3)
  })

  it('rounds half away from zero in the displayed digit', () => {
    expect(roundTo(1.25, 1)).toBe(1.3)
    expect(roundTo(-1.25, 1)).toBe(-1.3)
    expect(roundTo(2.675, 2)).toBe(2.68)
  })

  it('rounds to whole numbers with 0 decimals', () => {
    expect(roundTo(2.5, 0)).toBe(3)
  })

  it('never returns negative zero', () => {
    expect(Object.is(roundTo(-0.04, 1), 0)).toBe(true)
  })

  it('throws RangeError for non-finite input', () => {
    expect(() => roundTo(NaN, 1)).toThrowError(RangeError)
  })
})

describe('sum (A1-07 to A1-09)', () => {
  it('A1-07: compensated summation recovers the small term', () => {
    expect(sum([1e16, 1, -1e16])).toBe(1)
    let naive = 0
    for (const v of [1e16, 1, -1e16]) naive += v
    expect(naive).toBe(0)
  })

  it('A1-08: one hundred values of 0.1 add up to 10 within 1e-12', () => {
    expect(Math.abs(sum(Array<number>(100).fill(0.1)) - 10)).toBeLessThan(1e-12)
  })

  it('A1-09: an empty array sums to 0', () => {
    expect(sum([])).toBe(0)
  })

  it('sums ordinary values', () => {
    expect(sum([1, 2, 3.5])).toBe(6.5)
  })

  it('throws RangeError when a value is not finite', () => {
    expect(() => sum([1, NaN])).toThrowError(RangeError)
    expect(() => sum([Infinity])).toThrowError(RangeError)
  })
})
