import { describe, expect, it } from 'vitest'
import { gradientDescent } from '../../../src/core/training/gradientDescent'
import type { Landscape } from '../../../src/core/training/types'

const landscape: Landscape = {
  id: 'finite-test',
  dimensions: 1,
  loss: () => 1,
  gradient: () => [1],
}
const start = { index: 0, weights: [1], loss: 1, gradient: [1] }

describe('finite training arithmetic', () => {
  it.each([NaN, Infinity, -Infinity])('rejects %s at the input and both gradient boundaries', (value) => {
    expect(gradientDescent.step({ ...start, weights: [value] }, 1, landscape)).toEqual({ kind: 'non-finite', stage: 'input' })
    expect(gradientDescent.step({ ...start, gradient: [value] }, 1, landscape)).toEqual({ kind: 'non-finite', stage: 'gradient' })
    expect(gradientDescent.step(start, 1, { ...landscape, loss: () => value })).toEqual({ kind: 'non-finite', stage: 'loss' })
    expect(gradientDescent.step(start, 1, { ...landscape, gradient: () => [value] })).toEqual({ kind: 'non-finite', stage: 'result-gradient' })
  })

  it('rejects overflowing products and weights without returning partial results', () => {
    expect(gradientDescent.step({ ...start, gradient: [Number.MAX_VALUE] }, 4, landscape))
      .toEqual({ kind: 'non-finite', stage: 'product' })
    expect(gradientDescent.step({ ...start, weights: [Number.MAX_VALUE], gradient: [-Number.MAX_VALUE] }, 1, landscape))
      .toEqual({ kind: 'non-finite', stage: 'weight' })
    expect(start).toEqual({ index: 0, weights: [1], loss: 1, gradient: [1] })
  })

  it('surfaces unrelated programming errors rather than calling them divergence', () => {
    expect(() => gradientDescent.step(start, 1, { ...landscape, gradient: () => { throw new Error('test failure') } }))
      .toThrow('test failure')
    expect(() => gradientDescent.step(start, 1, { ...landscape, gradient: () => [] })).toThrow(/dimension/i)
  })
})
