import { describe, expect, it } from 'vitest'
import { lineLoss } from '../../../src/core/models/lineLoss'
import { slopeOfCurve } from '../../../src/core/models/slopeOfCurve'
import type { Point } from '../../../src/core/types'

const LOSS_3: Point[] = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 5 }]
const WB_4: Point[] = [{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 8 }]

const slope = (x: number, curve = 'x2') => slopeOfCurve.compute({ values: { x }, choices: { curve } })
const loss = (s: number, i: number, data: Point[]) => lineLoss.compute({ values: { slope: s, intercept: i }, choices: {} }, data)

describe('slope-of-curve', () => {
  it('A4-01: x² at x = 1', () => {
    const o = slope(1)
    expect(o.y).toBe(1)
    expect(o.slope).toBe(2)
    expect(o.tangentIntercept).toBe(-1)
  })

  it('A4-02: x² at x = 1.5', () => {
    const o = slope(1.5)
    expect([o.y, o.slope, o.tangentIntercept]).toEqual([2.25, 3, -2.25])
  })

  it('A4-03: x³ at x = 2', () => {
    const o = slope(2, 'x3')
    expect([o.y, o.slope, o.tangentIntercept]).toEqual([8, 12, -16])
  })

  it('A4-04: sin x at x = 0', () => {
    const o = slope(0, 'sin')
    expect([o.y, o.slope, o.tangentIntercept]).toEqual([0, 1, 0])
  })

  it('A4-05: x² at x = 0 has a horizontal tangent', () => {
    const o = slope(0)
    expect(o.slope).toBe(0)
    const ty = o.tangentY as number[]
    expect(ty[0]).toBe(ty[1])
  })

  it('A4-06: 201 samples from -3 to 3 with curveY = f(curveX)', () => {
    const o = slope(1, 'x3')
    const cx = o.curveX as number[]
    const cy = o.curveY as number[]
    expect(cx).toHaveLength(201)
    expect(cx[0]).toBe(-3)
    expect(cx[200]).toBe(3)
    cx.forEach((x, i) => expect(Math.abs(cy[i]! - x ** 3)).toBeLessThan(1e-9))
  })

  it.each([['x2', 1.3], ['x3', -2.2], ['sin', 0.7]])('A4-07: the %s tangent passes through the point', (curve, x) => {
    const o = slope(x, curve)
    const tx = o.tangentX as number[]
    const ty = o.tangentY as number[]
    const m = (ty[1]! - ty[0]!) / (tx[1]! - tx[0]!)
    expect(Math.abs(m - (o.slope as number))).toBeLessThan(1e-9)
    expect(Math.abs(ty[0]! + (o.slope as number) * (x - tx[0]!) - (o.y as number))).toBeLessThan(1e-12)
  })

  it('A4-08: an unknown curve choice throws', () => {
    expect(() => slope(1, 'cubic')).toThrowError(/cubic/)
    expect(() => slopeOfCurve.compute({ values: { x: 1 }, choices: {} })).toThrow()
  })

  it('A4-09: outputs match outputKeys exactly', () => {
    expect(Object.keys(slope(1)).sort()).toEqual([...slopeOfCurve.outputKeys].sort())
  })

  it('declares its contract', () => {
    expect(slopeOfCurve.id).toBe('slope-of-curve')
    expect(slopeOfCurve.roles).toEqual(['x'])
    expect(slopeOfCurve.choiceInputs).toEqual(['curve'])
    expect(slopeOfCurve.needsDataset).toBe(false)
  })

  it('A4-11: pure, and the input is not mutated', () => {
    const input = { values: { x: 1.5 }, choices: { curve: 'x3' } }
    const copy = structuredClone(input)
    const a = slopeOfCurve.compute(input)
    const b = slopeOfCurve.compute(input)
    expect(a).toEqual(b)
    expect(input).toEqual(copy)
  })

  it('rejects non-finite x', () => {
    expect(() => slope(NaN)).toThrowError(RangeError)
  })
})

describe('line-loss', () => {
  it('A4-09: outputs match outputKeys exactly', () => {
    expect(Object.keys(loss(1, 0, LOSS_3)).sort()).toEqual([...lineLoss.outputKeys].sort())
  })

  it('declares its contract', () => {
    expect(lineLoss.id).toBe('line-loss')
    expect(lineLoss.roles).toEqual(['slope', 'intercept'])
    expect(lineLoss.needsDataset).toBe(true)
  })

  it.each([
    ['A3-02', LOSS_3, 2, 0, [0, 0, 1], 1 / 3],
    ['A3-03', LOSS_3, 1, 0, [-1, -2, -2], 3],
    ['A3-04', LOSS_3, 1.5, 0.5, [0, -0.5, 0], 0.25 / 3],
    ['A3-05', WB_4, 1, 0, [-2, -3, -4, -4], 11.25],
    ['A3-06', WB_4, 2, 1, [0, 0, 0, 1], 0.25],
    ['A3-07', WB_4, 1.5, 2, [0.5, 0, -0.5, 0], 0.125],
  ])('A4-10: %s agrees with the loss functions', (_id, data, s, i, errors, expectedMse) => {
    const o = loss(s, i, data)
    expect(o.n).toBe(data.length)
    expect(o.errors).toEqual(errors)
    expect(Math.abs((o.mse as number) - expectedMse)).toBeLessThan(1e-9)
    expect(o.squaredErrors).toEqual(errors.map((e) => e * e))
  })

  it('draws the line from the chart ends', () => {
    const o = loss(2, 1, WB_4)
    expect(o.lineX).toEqual([0, 5])
    expect(o.lineY).toEqual([1, 11])
  })

  it('requires a dataset', () => {
    expect(() => lineLoss.compute({ values: { slope: 1, intercept: 0 }, choices: {} })).toThrow()
  })

  it('A4-11: pure, and inputs are not mutated', () => {
    const input = { values: { slope: 1.5, intercept: 2 }, choices: {} }
    const data = structuredClone(WB_4)
    const a = lineLoss.compute(input, data)
    expect(a).toEqual(lineLoss.compute(input, data))
    expect(data).toEqual(WB_4)
    expect(input.values).toEqual({ slope: 1.5, intercept: 2 })
  })

  it('rejects non-finite input', () => {
    expect(() => loss(NaN, 0, LOSS_3)).toThrowError(RangeError)
  })
})
