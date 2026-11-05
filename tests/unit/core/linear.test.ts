import { describe, expect, it } from 'vitest'
import { predict } from '../../../src/core/linear'

describe('linear (A3-01)', () => {
  it('predict(2, 1, 3) = 7', () => {
    expect(predict(2, 1, 3)).toBe(7)
  })
})
