import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../../../src')

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listSourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function importSpecifiers(code: string): string[] {
  const specifiers: string[] = []
  const pattern = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
  for (const match of code.matchAll(pattern)) specifiers.push((match[1] ?? match[2] ?? match[3])!)
  return specifiers
}

const frameworkPackage = /^(react|react-dom|react-router-dom|react-markdown|zustand|katex|d3-[\w-]+|rehype-[\w-]+|remark-[\w-]+)(\/.*)?$/
const reachesLayer = (specifier: string, layer: 'sim' | 'ui') =>
  specifier.startsWith('.') && specifier.split('/').includes(layer)

describe('layer boundaries (Principle VI)', () => {
  it('A5-01: src/core imports no framework, chart library, sim or ui, and uses no DOM globals', () => {
    const files = listSourceFiles(join(root, 'core'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf8'))
      for (const specifier of importSpecifiers(code)) {
        expect(frameworkPackage.test(specifier), `${file} imports ${specifier}`).toBe(false)
        expect(reachesLayer(specifier, 'sim'), `${file} imports ${specifier}`).toBe(false)
        expect(reachesLayer(specifier, 'ui'), `${file} imports ${specifier}`).toBe(false)
      }
      expect(/\b(window|document|navigator|localStorage)\b/.test(code), `${file} uses a DOM global`).toBe(false)
    }
  })

  it('A5-02: src/sim imports no ui and no React', () => {
    const files = listSourceFiles(join(root, 'sim'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf8'))
      for (const specifier of importSpecifiers(code)) {
        expect(reachesLayer(specifier, 'ui'), `${file} imports ${specifier}`).toBe(false)
        expect(/^(react|react-dom|react-router-dom|react-markdown|katex)(\/.*)?$/.test(specifier), `${file} imports ${specifier}`).toBe(false)
      }
    }
  })

  it('the scanner detects a forbidden import (guards against a vacuous pass)', () => {
    const code = "import React from 'react'\nimport { x } from '../ui/a'\nexport * from '../sim/b'\nconst m = import('katex')"
    expect(importSpecifiers(code)).toEqual(['react', '../ui/a', '../sim/b', 'katex'])
  })
})
