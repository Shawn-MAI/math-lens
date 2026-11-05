import { describe, expect, it } from 'vitest'
import { buildTrainingContext } from '../../../src/sim/lessonView'
import { formatTrainingNumber, formatTrainingUpdate } from '../../../src/sim/training/format'

describe('training number formatting', () => {
  it('uses six fixed decimals for zero and the declared ordinary magnitude range', () => {
    expect(formatTrainingNumber(0)).toBe('0.000000')
    expect(formatTrainingNumber(-0)).toBe('0.000000')
    expect(formatTrainingNumber(0.0001)).toBe('0.000100')
    expect(formatTrainingNumber(0.0005)).toBe('0.000500')
    expect(formatTrainingNumber(-4.8)).toBe('-4.800000')
    expect(formatTrainingNumber(999999)).toBe('999999.000000')
  })

  it('uses scientific notation for finite values outside the ordinary range', () => {
    expect(formatTrainingNumber(0.00005)).toBe('5.000000e-5')
    expect(formatTrainingNumber(-0.00005)).toBe('-5.000000e-5')
    expect(formatTrainingNumber(1000000)).toBe('1.000000e+6')
  })

  it('rejects non-finite numbers instead of printing them', () => {
    expect(() => formatTrainingNumber(NaN)).toThrow(/finite/i)
    expect(() => formatTrainingNumber(Infinity)).toThrow(/finite/i)
  })

  it('shows rounded operands and the result of the unrounded update with an approximate sign', () => {
    expect(formatTrainingUpdate(-2.8, 0.2, -4.8, -1.84))
      .toBe('-2.800000 - 0.200000 × (-4.800000) ≈ -1.840000')
    const old = 1.23456789
    const rate = 0.12345678
    const gradient = 2.34567891
    const result = old - rate * gradient
    expect(formatTrainingUpdate(old, rate, gradient, result)).toContain(formatTrainingNumber(result))
    expect(Math.abs(Number(formatTrainingNumber(result)) - result)).toBeLessThanOrEqual(5e-7 + Number.EPSILON)
  })
})

describe('selected training snapshot template context', () => {
  it('uses the selected snapshot for every weight, gradient, loss and step', () => {
    const first = buildTrainingContext({ index: 0, weights: [4, 2], loss: 28, gradient: [4, 20] })
    const second = buildTrainingContext({ index: 1, weights: [3.4, -1], loss: 10.78, gradient: [3.4, -10] })
    expect(first).toMatchObject({
      step: '0',
      weights: ['4.000000', '2.000000'],
      loss: '28.000000',
      gradient: ['4.000000', '20.000000'],
    })
    expect(second).toMatchObject({
      step: '1',
      weights: ['3.400000', '-1.000000'],
      loss: '10.780000',
      gradient: ['3.400000', '-10.000000'],
    })
  })
})
