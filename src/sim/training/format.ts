export function formatTrainingNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error('Training values must be finite')
  if (value === 0) return '0.000000'
  const magnitude = Math.abs(value)
  return magnitude >= 1e-4 && magnitude < 1e6 ? value.toFixed(6) : value.toExponential(6)
}

export function formatTrainingUpdate(old: number, rate: number, gradient: number, next: number): string {
  const formattedGradient = formatTrainingNumber(gradient)
  const operand = gradient < 0 ? `(${formattedGradient})` : formattedGradient
  return `${formatTrainingNumber(old)} - ${formatTrainingNumber(rate)} × ${operand} ≈ ${formatTrainingNumber(next)}`
}
