import katex from 'katex'
import { useMemo } from 'react'

interface MathProps {
  latex: string
  display?: boolean
}

/** Renders trusted LaTeX from the lesson content with KaTeX (HTML for sight, MathML for screen readers). */
export function Math({ latex, display = false }: MathProps) {
  const html = useMemo(() => katex.renderToString(latex, { displayMode: display, throwOnError: false }), [latex, display])
  return <span className={display ? 'math math-display' : 'math'} dangerouslySetInnerHTML={{ __html: html }} />
}
