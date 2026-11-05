import { roundTo } from '../core/numeric'

/** Formatted values a template can refer to: a string for scalars, a list of strings for arrays. */
export type TemplateContext = Record<string, string | string[]>

export type Variant<T> = T | { variantBy: string; variants: Record<string, T> }

/**
 * Formats a number for display. With `decimals` the result always has that many decimals.
 * Without it, up to 6 decimals are kept and trailing zeros are trimmed. Negative zero loses its sign.
 */
export function formatNumber(value: number, decimals?: number): string {
  const rounded = roundTo(value, decimals ?? 6)
  return decimals === undefined ? String(rounded) : rounded.toFixed(decimals)
}

export function formatValue(value: number | number[], decimals?: number): string | string[] {
  return Array.isArray(value) ? value.map((v) => formatNumber(v, decimals)) : formatNumber(value, decimals)
}

const REFERENCE = /^\s*([a-zA-Z][a-zA-Z0-9]*)(?:\[(\d*)\])?(?:\|(.*))?$/s

function resolveReference(inner: string, context: TemplateContext, where: string): string {
  const match = REFERENCE.exec(inner)
  if (!match) throw new Error(`${where}: invalid template reference "{{${inner}}}"`)
  const [, name, index, filter] = match as unknown as [string, string, string | undefined, string | undefined]
  const hasBrackets = inner.includes('[') && inner.indexOf('[') < (inner.includes('|') ? inner.indexOf('|') : inner.length)
  const value = context[name]
  if (value === undefined) throw new Error(`${where}: unknown name "${name}" in "{{${inner}}}"`)

  if (Array.isArray(value)) {
    if (!hasBrackets) throw new Error(`${where}: "${name}" is a list, use ${name}[0] or ${name}[]`)
    if (index === '') return value.join(filter ?? ', ')
    const position = Number(index)
    const item = value[position]
    if (item === undefined) throw new Error(`${where}: ${name}[${position}] is past the end (length ${value.length})`)
    return applyFilter(item, filter, name, where)
  }

  if (hasBrackets) throw new Error(`${where}: "${name}" is not a list, so ${name}[${index ?? ''}] is not allowed`)
  return applyFilter(value, filter, name, where)
}

function applyFilter(text: string, filter: string | undefined, name: string, where: string): string {
  if (filter === undefined) return text
  if (filter !== 'paren') throw new Error(`${where}: unknown filter "${filter}" on "${name}"`)
  return text.startsWith('-') ? `(${text})` : text
}

/** Replaces every `{{...}}` reference. Throws, naming `where`, on any content error. */
export function renderTemplate(template: string, context: TemplateContext, where: string): string {
  let result = ''
  let position = 0
  while (position < template.length) {
    const open = template.indexOf('{{', position)
    const close = template.indexOf('}}', position)
    if (open === -1) {
      if (close !== -1) throw new Error(`${where}: Unbalanced "}}" in template`)
      result += template.slice(position)
      break
    }
    if (close !== -1 && close < open) throw new Error(`${where}: Unbalanced "}}" in template`)
    const end = template.indexOf('}}', open + 2)
    if (end === -1) throw new Error(`${where}: Unbalanced "{{" in template`)
    result += template.slice(position, open) + resolveReference(template.slice(open + 2, end), context, where)
    position = end + 2
  }
  return result
}

function isVariantObject<T>(value: Variant<T>): value is { variantBy: string; variants: Record<string, T> } {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'variantBy' in value && 'variants' in value
}

/** Returns the value for the current choice, or the plain value when it is not a variant. */
export function selectVariant<T>(variant: Variant<T>, choices: Record<string, string>, where: string): T {
  if (!isVariantObject(variant)) return variant
  const choice = choices[variant.variantBy]
  if (choice === undefined) throw new Error(`${where}: no choice named "${variant.variantBy}" to select a variant`)
  const selected = variant.variants[choice]
  if (selected === undefined) throw new Error(`${where}: no variant for "${choice}"`)
  return selected
}

/**
 * Validates that `variantBy` names a choice parameter and that `variants` has exactly one key per option.
 * `options` maps each choice parameter id to its option values.
 */
export function assertVariantCovers<T>(variant: Variant<T>, options: Record<string, string[]>, where: string): void {
  if (!isVariantObject(variant)) return
  const values = options[variant.variantBy]
  if (values === undefined) throw new Error(`${where}: variantBy "${variant.variantBy}" is not a choice parameter`)
  for (const value of values) {
    if (!(value in variant.variants)) throw new Error(`${where}: missing variant for "${value}"`)
  }
  for (const key of Object.keys(variant.variants)) {
    if (!values.includes(key)) throw new Error(`${where}: variant "${key}" is not an option of "${variant.variantBy}"`)
  }
}
