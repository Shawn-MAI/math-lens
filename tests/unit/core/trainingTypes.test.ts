import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assertCompatibleDimensions,
  type AlgorithmAdapter,
  type Landscape,
} from '../../../src/core/training/types'

function landscape(dimensions: 1 | 2): Landscape {
  return {
    id: `landscape-${dimensions}`,
    dimensions,
    loss: () => 0,
    gradient: () => Array<number>(dimensions).fill(0),
  }
}

function adapter(dimensions: 1 | 2): AlgorithmAdapter {
  return {
    id: `test-adapter-${dimensions}`,
    dimensions,
    step: () => ({ kind: 'non-finite', stage: 'input' }),
  }
}

describe('training adapter and landscape contracts', () => {
  it.each([1, 2] as const)('accepts matching %i-dimensional bindings', (dimensions) => {
    expect(() => assertCompatibleDimensions(adapter(dimensions), landscape(dimensions))).not.toThrow()
  })

  it.each([1, 2] as const)('accepts a multi-dimensional adapter with a %i-dimensional landscape', (dimensions) => {
    const generic: AlgorithmAdapter = { ...adapter(1), dimensions: [1, 2] }
    expect(() => assertCompatibleDimensions(generic, landscape(dimensions))).not.toThrow()
  })

  it.each([
    [1, 2],
    [2, 1],
  ] as const)('rejects a %i-dimensional adapter with a %i-dimensional landscape', (algorithmDimensions, landscapeDimensions) => {
    expect(() => assertCompatibleDimensions(adapter(algorithmDimensions), landscape(landscapeDimensions)))
      .toThrow(/dimension/i)
  })

  it('keeps the core contract free of upper-layer, framework, timer and DOM dependencies', () => {
    const source = readFileSync(resolve(__dirname, '../../../src/core/training/types.ts'), 'utf8')
    expect(source).not.toMatch(/(?:from\s*|import\s*\()['"](?:react|zustand|d3-|.*\/(?:sim|ui)\/)/)
    expect(source).not.toMatch(/\b(?:window|document|navigator|setTimeout|setInterval)\b/)
  })
})
