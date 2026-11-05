/** Okabe-Ito colours as CSS variables, so both themes stay colour-blind safe. Meaning also uses dash style and labels. */
export const palette = {
  curve: 'var(--c-blue)',
  tangent: 'var(--c-vermillion)',
  point: 'var(--c-ink)',
  data: 'var(--c-ink)',
  line: 'var(--c-blue)',
  error: 'var(--c-vermillion)',
  handle: 'var(--c-orange)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
} as const

export const dash = {
  solid: undefined,
  dashed: '6 4',
  dotted: '2 3',
} as const
