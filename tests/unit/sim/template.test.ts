import { describe, expect, it } from 'vitest'
import {
  assertVariantCovers,
  formatNumber,
  formatValue,
  renderTemplate,
  selectVariant,
  type TemplateContext,
} from '../../../src/sim/template'

const where = 'weight-and-bias workedExample[0].latex'

// Hand-computed outputs for dataset loss-3 = (1,2),(2,4),(3,5): slope 2, intercept 0 (A3-02).
const lossCtx: TemplateContext = {
  slope: formatNumber(2, 1),
  predictions: formatValue([2, 4, 6], 2),
  squaredErrors: formatValue([0, 0, 1], 2),
}

describe('formatNumber and formatValue', () => {
  it('formats with a fixed number of decimals', () => {
    expect(formatNumber(1.5, 1)).toBe('1.5')
    expect(formatNumber(2, 2)).toBe('2.00')
  })

  it('trims trailing zeros and caps at 6 decimals when decimals is not given', () => {
    expect(formatNumber(2)).toBe('2')
    expect(formatNumber(0.5)).toBe('0.5')
    expect(formatNumber(1 / 3)).toBe('0.333333')
  })

  it('BT-05: a value that rounds to negative zero is shown without a sign', () => {
    expect(formatNumber(-0.04, 0)).toBe('0')
    expect(formatNumber(-0.04, 1)).toBe('0.0')
    expect(formatNumber(-0, 2)).toBe('0.00')
    expect(formatNumber(-0)).toBe('0')
  })

  it('formats arrays element by element', () => {
    expect(formatValue([1, 2.5], 1)).toEqual(['1.0', '2.5'])
    expect(formatValue(3, 1)).toBe('3.0')
  })
})

describe('renderTemplate', () => {
  it('BT-01: {{w}} with w 1.5', () => {
    expect(renderTemplate('{{w}}', { w: formatNumber(1.5, 1) }, where)).toBe('1.5')
  })

  it('BT-02: {{predictions[0]}} uses the output decimals', () => {
    expect(renderTemplate('{{predictions[0]}}', lossCtx, where)).toBe('2.00')
    expect(renderTemplate('{{predictions[2]}}', lossCtx, where)).toBe('6.00')
  })

  it('BT-03: {{squaredErrors[]| + }} joins with the separator for the loss default', () => {
    const ctx: TemplateContext = { squaredErrors: formatValue([1, 4, 4], 2) }
    expect(renderTemplate('{{squaredErrors[]| + }}', ctx, where)).toBe('1.00 + 4.00 + 4.00')
  })

  it('joins with a comma and space when no separator is given', () => {
    expect(renderTemplate('{{predictions[]}}', lossCtx, where)).toBe('2.00, 4.00, 6.00')
  })

  it('BT-04: |paren wraps negative numbers only', () => {
    expect(renderTemplate('{{b|paren}}', { b: formatNumber(-0.5, 1) }, where)).toBe('(-0.5)')
    expect(renderTemplate('{{b|paren}}', { b: formatNumber(2, 1) }, where)).toBe('2.0')
  })

  it('does not wrap negative zero in parentheses', () => {
    expect(renderTemplate('{{b|paren}}', { b: formatNumber(-0.01, 1) }, where)).toBe('0.0')
  })

  it('replaces several references and keeps the surrounding text', () => {
    expect(renderTemplate('y = {{w}}x + {{b}}', { w: '2.0', b: '1.0' }, where)).toBe('y = 2.0x + 1.0')
  })

  it('leaves text without references unchanged', () => {
    expect(renderTemplate('f(x) = x^2', {}, where)).toBe('f(x) = x^2')
  })

  it('works inside LaTeX when a space separates adjacent braces', () => {
    expect(renderTemplate('\\frac{ {{a}} }{ {{b}} }', { a: '1', b: '2' }, where)).toBe('\\frac{ 1 }{ 2 }')
  })

  it('BT-06: an unknown name is an error naming the field and the name', () => {
    expect(() => renderTemplate('{{missing}}', { w: '1' }, where)).toThrowError(/weight-and-bias workedExample\[0\]\.latex.*missing/)
  })

  it('BT-07: an index past the end is an error', () => {
    expect(() => renderTemplate('{{predictions[3]}}', lossCtx, where)).toThrowError(/predictions\[3\]/)
  })

  it('BT-07: [] on a scalar is an error, and an index on a scalar is an error', () => {
    expect(() => renderTemplate('{{slope[]}}', lossCtx, where)).toThrowError(/slope/)
    expect(() => renderTemplate('{{slope[0]}}', lossCtx, where)).toThrowError(/slope/)
  })

  it('rejects an array used without an index or []', () => {
    expect(() => renderTemplate('{{predictions}}', lossCtx, where)).toThrowError(/predictions/)
  })

  it('rejects an unknown filter on a scalar', () => {
    expect(() => renderTemplate('{{slope|bold}}', lossCtx, where)).toThrowError(/bold/)
  })

  it('BT-08: unbalanced {{ and stray }} are errors', () => {
    expect(() => renderTemplate('{{w', { w: '1' }, where)).toThrowError(/Unbalanced/i)
    expect(() => renderTemplate('w}} and {{w}}', { w: '1' }, where)).toThrowError(/Unbalanced/i)
    expect(() => renderTemplate('{{}}', {}, where)).toThrowError()
  })

  it('BT-09: the final value of the Weight and bias default worked example equals the displayed MSE', () => {
    // dataset weight-bias-4 = (1,3),(2,5),(3,7),(4,8), w = 1.0, b = 0.0: errors -2,-3,-4,-4, MSE 45/4
    const ctx: TemplateContext = {
      w: formatNumber(1, 1),
      b: formatNumber(0, 1),
      squaredErrors: formatValue([4, 9, 16, 16], 2),
      mse: formatNumber(11.25, 2),
    }
    const step = renderTemplate('\\text{MSE} = \\frac{ {{squaredErrors[]| + }} }{4} = {{mse}}', ctx, where)
    expect(step).toBe('\\text{MSE} = \\frac{ 4.00 + 9.00 + 16.00 + 16.00 }{4} = 11.25')
    expect(step.endsWith(formatNumber(11.25, 2))).toBe(true)
  })
})

describe('variants', () => {
  const variant = { variantBy: 'curve', variants: { x2: 'two x', x3: 'three x squared', sin: 'cosine' } }

  it('BT-10: returns the value for the current choice', () => {
    expect(selectVariant(variant, { curve: 'x3' }, 'f')).toBe('three x squared')
    expect(selectVariant(variant, { curve: 'sin' }, 'f')).toBe('cosine')
  })

  it('BT-10: returns a plain value unchanged', () => {
    expect(selectVariant('plain', { curve: 'x2' }, 'f')).toBe('plain')
    expect(selectVariant(['a', 'b'], {}, 'f')).toEqual(['a', 'b'])
  })

  it('BT-10: throws when the choice has no variant', () => {
    expect(() => selectVariant(variant, { curve: 'cube' }, 'formula')).toThrowError(/formula.*cube/)
    expect(() => selectVariant(variant, {}, 'formula')).toThrowError(/curve/)
  })

  it('BT-10: a missing variant for any option is a validation error', () => {
    const options = { curve: ['x2', 'x3', 'sin'] }
    expect(() => assertVariantCovers(variant, options, 'formula')).not.toThrow()
    const missing = { variantBy: 'curve', variants: { x2: 'a', x3: 'b' } }
    expect(() => assertVariantCovers(missing, options, 'formula')).toThrowError(/formula.*sin/)
  })

  it('BT-10: an extra variant key and an unknown variantBy are validation errors', () => {
    const options = { curve: ['x2', 'x3', 'sin'] }
    const extra = { variantBy: 'curve', variants: { x2: 'a', x3: 'b', sin: 'c', cos: 'd' } }
    expect(() => assertVariantCovers(extra, options, 'formula')).toThrowError(/cos/)
    const unknown = { variantBy: 'shape', variants: { x2: 'a' } }
    expect(() => assertVariantCovers(unknown, options, 'formula')).toThrowError(/shape/)
  })

  it('a plain value passes the coverage check', () => {
    expect(() => assertVariantCovers('plain', { curve: ['x2'] }, 'formula')).not.toThrow()
  })
})
