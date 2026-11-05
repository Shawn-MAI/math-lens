const CURVES: Record<string, { f: (x: number) => number; df: (x: number) => number }> = {
  x2: { f: (x) => x * x, df: (x) => 2 * x },
  x3: { f: (x) => x * x * x, df: (x) => 3 * x * x },
  sin: { f: (x) => Math.sin(x), df: (x) => Math.cos(x) },
}

function curve(id: string, x: number) {
  const entry = CURVES[id]
  if (!entry) throw new Error(`Unknown curve "${id}". Known curves: ${Object.keys(CURVES).join(', ')}`)
  if (!Number.isFinite(x)) throw new RangeError(`x must be a finite number, got ${x}`)
  return entry
}

/** The curve's value at x. */
export function f(curveId: string, x: number): number {
  return curve(curveId, x).f(x)
}

/** The curve's exact derivative (its slope) at x, from the derivative rule and not from nearby points. */
export function df(curveId: string, x: number): number {
  return curve(curveId, x).df(x)
}
