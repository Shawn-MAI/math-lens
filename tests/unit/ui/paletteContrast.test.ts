import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { palette } from '../../../src/ui/charts/palette'

const tokensCss = readFileSync(resolve(process.cwd(), 'src/ui/styles/tokens.css'), 'utf8')

type Tokens = Record<string, string>

function parseBlocks(css: string): { selector: string; tokens: Tokens }[] {
  const blocks: { selector: string; tokens: Tokens }[] = []
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const tokens: Tokens = {}
    for (const [, name, value] of body!.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) tokens[name!] = value!
    blocks.push({ selector: selector!.trim(), tokens })
  }
  return blocks
}

const blocks = parseBlocks(tokensCss)
const light: Tokens = Object.assign({}, ...blocks.filter((b) => b.selector.includes("[data-theme='light']")).map((b) => b.tokens))
const dark: Tokens = { ...light, ...Object.assign({}, ...blocks.filter((b) => b.selector.includes("[data-theme='dark']")).map((b) => b.tokens)) }
const themes: [string, Tokens][] = [
  ['light', light],
  ['dark', dark],
]

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const varName = (value: string) => /var\((--[\w-]+)\)/.exec(value)![1]!

describe('colour contrast (D-23, WCAG AA)', () => {
  it('has both themes defined with the same set of tokens', () => {
    expect(Object.keys(light).length).toBeGreaterThan(10)
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort())
    expect(blocks.some((b) => b.selector.includes("[data-theme='dark']"))).toBe(true)
  })

  it('the contrast helper matches known values (black on white is 21:1, #777 on white is about 4.48:1)', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
  })

  describe.each(themes)('%s theme', (_name, t) => {
    const backgrounds = ['--bg', '--surface', '--bg-muted']

    it.each(backgrounds.flatMap((bg) => ['--text', '--text-muted'].map((fg) => [fg, bg])))('text %s on %s is at least 4.5:1', (fg, bg) => {
      expect(contrast(t[fg!]!, t[bg!]!)).toBeGreaterThanOrEqual(4.5)
    })

    it('link and accent text on the page background is at least 4.5:1', () => {
      expect(contrast(t['--accent']!, t['--bg']!)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t['--accent']!, t['--surface']!)).toBeGreaterThanOrEqual(4.5)
    })

    it('text on an accent background is at least 4.5:1', () => {
      expect(contrast(t['--accent-contrast']!, t['--accent']!)).toBeGreaterThanOrEqual(4.5)
    })

    it('control borders and the focus ring are at least 3:1 against the page and the chart surface', () => {
      for (const bg of ['--bg', '--surface']) {
        expect(contrast(t['--border']!, t[bg]!)).toBeGreaterThanOrEqual(3)
        expect(contrast(t['--focus']!, t[bg]!)).toBeGreaterThanOrEqual(3)
      }
    })

    it.each(Object.entries(palette).filter(([key]) => key !== 'grid'))('chart colour "%s" is at least 3:1 against the chart surface and page', (_key, value) => {
      const token = t[varName(value)]!
      expect(token, `token ${varName(value)} is defined`).toBeDefined()
      expect(contrast(token, t['--surface']!)).toBeGreaterThanOrEqual(3)
      expect(contrast(token, t['--bg']!)).toBeGreaterThanOrEqual(3)
    })

    it('error text (the error numbers on the chart and validation messages) is at least 4.5:1', () => {
      const token = t[varName(palette.error)]!
      expect(contrast(token, t['--surface']!)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(token, t['--bg']!)).toBeGreaterThanOrEqual(4.5)
    })
  })
})
