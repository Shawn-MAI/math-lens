import { describe, expect, it } from 'vitest'
import { df, f } from '../../../src/core/curves'
import { numericDerivative } from '../../helpers/numericDerivative'

const TOL = 1e-9

describe('curves: exact values (A2-01 to A2-10)', () => {
  it.each([
    ['A2-01', 'x2', 1.5, 2.25, 3],
    ['A2-02', 'x2', 0, 0, 0],
    ['A2-03', 'x2', -1, 1, -2],
    ['A2-04', 'x2', 3, 9, 6],
    ['A2-05', 'x3', 2, 8, 12],
    ['A2-06', 'x3', -1.5, -3.375, 6.75],
    ['A2-07', 'x3', 0, 0, 0],
    ['A2-08', 'sin', 0, 0, 1],
    ['A2-09', 'sin', 3, 0.1411200080598672, -0.9899924966004454],
    ['A2-10', 'sin', 1.6, 0.9995736030415051, -0.029199522301288815],
  ])('%s: %s at x = %d', (_id, curve, x, y, slope) => {
    expect(f(curve, x)).toBeCloseTo(y, 9)
    expect(Math.abs(f(curve, x) - y)).toBeLessThan(TOL)
    expect(Math.abs(df(curve, x) - slope)).toBeLessThan(TOL)
  })
})

describe('curves: derivative cross-check (A2-11)', () => {
  const curves = ['x2', 'x3', 'sin']
  const xs = [-3, -1.5, 0, 1.5, 3]
  it.each(curves.flatMap((c) => xs.map((x) => [c, x] as const)))('%s at x = %d matches a central difference', (curve, x) => {
    const numeric = numericDerivative((t) => f(curve, t), x)
    expect(Math.abs(df(curve, x) - numeric)).toBeLessThan(1e-6)
  })
})

describe('curves: invalid input (A2-12, A2-13)', () => {
  it('A2-12: an unknown curve id throws an error naming the id', () => {
    expect(() => f('cubic', 1)).toThrowError(/cubic/)
    expect(() => df('cubic', 1)).toThrowError(/cubic/)
  })

  it.each([NaN, Infinity, -Infinity])('A2-13: non-finite x (%s) throws RangeError', (x) => {
    expect(() => f('x2', x)).toThrowError(RangeError)
    expect(() => df('x2', x)).toThrowError(RangeError)
  })
})
