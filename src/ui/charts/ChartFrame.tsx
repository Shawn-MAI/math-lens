import type { ReactNode, RefObject } from 'react'
import { H, W } from './geometry'

interface ChartFrameProps {
  ariaLabel: string
  describedBy: string
  overlayRef: RefObject<SVGSVGElement | null>
  /** The drawing. It is an image for assistive technology, so nothing interactive goes in here. */
  children: ReactNode
  /** Draggable handles, in a second SVG of the same size laid over the drawing. */
  overlay?: ReactNode
}

export function ChartFrame({ ariaLabel, describedBy, overlayRef, children, overlay }: ChartFrameProps) {
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} aria-describedby={describedBy} className="chart-svg">
        {children}
      </svg>
      <svg viewBox={`0 0 ${W} ${H}`} ref={overlayRef} className="chart-overlay">
        {overlay}
      </svg>
    </div>
  )
}
