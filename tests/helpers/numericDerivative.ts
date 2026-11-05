/** Test-only central-difference derivative, used to cross-check the exact derivative rules (A2-11). */
export function numericDerivative(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}
