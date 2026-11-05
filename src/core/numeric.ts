function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number, got ${value}`)
}

/** Limits `value` to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  assertFinite(value, 'value')
  if (min > max) throw new RangeError(`min (${min}) must not be greater than max (${max})`)
  return Math.min(max, Math.max(min, value))
}

/** Rounds to `decimals` places, half away from zero, without float drift. Never returns -0. */
export function roundTo(value: number, decimals: number): number {
  assertFinite(value, 'value')
  const rounded = Number(`${Math.round(Number(`${Math.abs(value)}e${decimals}`))}e-${decimals}`)
  const result = value < 0 ? -rounded : rounded
  return result === 0 ? 0 : result
}

/** Number of decimal places in the shortest decimal form of `value`. */
function decimalPlaces(value: number): number {
  const text = String(value)
  const exponent = /e-(\d+)$/.exec(text)
  if (exponent) return Number(exponent[1]) + (text.split('e')[0]!.split('.')[1]?.length ?? 0)
  return text.split('.')[1]?.length ?? 0
}

/**
 * Snaps `value` to the nearest multiple of `step` counted from `min`.
 * The result is rounded to the decimals of `step` and `min` so 0.1 steps give exact values like 0.3.
 */
export function snapToStep(value: number, step: number, min: number): number {
  assertFinite(value, 'value')
  assertFinite(min, 'min')
  if (!Number.isFinite(step) || step <= 0) throw new RangeError(`step must be a positive finite number, got ${step}`)
  const steps = Math.round((value - min) / step)
  const snapped = min + steps * step
  return roundTo(snapped, Math.max(decimalPlaces(step), decimalPlaces(min)))
}

/** Neumaier compensated summation, so rounding error does not accumulate. */
export function sum(values: readonly number[]): number {
  let total = 0
  let compensation = 0
  for (const value of values) {
    assertFinite(value, 'value')
    const next = total + value
    compensation += Math.abs(total) >= Math.abs(value) ? total - next + value : value - next + total
    total = next
  }
  return total + compensation
}
