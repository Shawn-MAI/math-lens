import { formatNumber } from '../../sim/template'
import { palette } from './palette'
import { PLOT, type Scale } from './geometry'

interface AxesProps {
  x: Scale
  y: Scale
  xTitle: string
  yTitle: string
}

/** Grid, tick labels, zero lines and axis titles. */
export function Axes({ x, y, xTitle, yTitle }: AxesProps) {
  const [yMin, yMax] = y.domain() as [number, number]
  const [xMin, xMax] = x.domain() as [number, number]
  const text = { fill: palette.axis, fontSize: 12 }

  return (
    <g>
      {y.ticks(6).map((t) => (
        <g key={`y${t}`}>
          <line x1={PLOT.left} x2={PLOT.right} y1={y(t)} y2={y(t)} style={{ stroke: palette.grid }} />
          <text x={PLOT.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" style={text}>
            {formatNumber(t)}
          </text>
        </g>
      ))}
      {x.ticks(6).map((t) => (
        <g key={`x${t}`}>
          <line x1={x(t)} x2={x(t)} y1={PLOT.top} y2={PLOT.bottom} style={{ stroke: palette.grid }} />
          <text x={x(t)} y={PLOT.bottom + 18} textAnchor="middle" style={text}>
            {formatNumber(t)}
          </text>
        </g>
      ))}
      {yMin < 0 && yMax > 0 && <line x1={PLOT.left} x2={PLOT.right} y1={y(0)} y2={y(0)} style={{ stroke: palette.axis }} />}
      {xMin < 0 && xMax > 0 && <line x1={x(0)} x2={x(0)} y1={PLOT.top} y2={PLOT.bottom} style={{ stroke: palette.axis }} />}
      <rect x={PLOT.left} y={PLOT.top} width={PLOT.right - PLOT.left} height={PLOT.bottom - PLOT.top} fill="none" style={{ stroke: palette.axis }} />
      <text x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 40} textAnchor="middle" style={text}>
        {xTitle}
      </text>
      <text transform={`translate(14 ${(PLOT.top + PLOT.bottom) / 2}) rotate(-90)`} textAnchor="middle" style={text}>
        {yTitle}
      </text>
    </g>
  )
}
