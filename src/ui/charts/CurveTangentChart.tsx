import { useRef } from 'react'
import { line } from 'd3-shape'
import { formatNumber } from '../../sim/template'
import { Axes } from './Axes'
import { ChartFrame } from './ChartFrame'
import type { ChartProps } from './chartRegistry'
import { clipToYRange, makeScales, paddedDomain, PLOT } from './geometry'
import { dash, palette } from './palette'
import { SliderHandle } from './SliderHandle'

/** The curve, a dashed tangent line and a draggable point. Draws only what the model returned. */
export function CurveTangentChart({ params, outputs, options, setParam, parameters, decimals, ariaLabel, describedBy }: ChartProps) {
  const overlayRef = useRef<SVGSVGElement | null>(null)
  const xParam = parameters.find((p) => p.id === options.xParam)
  if (xParam?.type !== 'number') throw new Error(`curve-tangent needs a number parameter named by options.xParam, got "${String(options.xParam)}"`)

  const curveX = outputs.curveX as number[]
  const curveY = outputs.curveY as number[]
  const tangentX = outputs.tangentX as number[]
  const tangentY = outputs.tangentY as number[]
  const y = outputs.y as number
  const slope = outputs.slope as number
  const x = params[xParam.id] as number

  const scales = makeScales([curveX[0]!, curveX[curveX.length - 1]!], paddedDomain(curveY))
  const [yMin, yMax] = scales.y.domain() as [number, number]

  const curvePath = line<number>()
    .x((_, i) => scales.x(curveX[i]!))
    .y((_, i) => scales.y(curveY[i]!))(curveX)

  // A steep tangent would leave the chart, so only the part inside the visible y range is drawn.
  const tangent = clipToYRange([[tangentX[0]!, tangentY[0]!], [tangentX[1]!, tangentY[1]!]], yMin, yMax)

  const px = scales.x(x)
  const py = scales.y(y)
  const labelOnLeft = px > (PLOT.left + PLOT.right) / 2

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      describedBy={describedBy}
      overlayRef={overlayRef}
      overlay={
        <SliderHandle
          label={`${xParam.label} (chart handle)`}
          value={x}
          min={xParam.min}
          max={xParam.max}
          step={xParam.step}
          valueText={formatNumber(x, 1)}
          axis="x"
          cx={px}
          cy={py}
          svgRef={overlayRef}
          fromPointer={(sx) => scales.x.invert(sx)}
          onChange={(value) => setParam(xParam.id, value)}
        />
      }
    >
      <Axes x={scales.x} y={scales.y} xTitle="x" yTitle="y" />
      <path data-testid="curve-path" d={curvePath ?? ''} fill="none" strokeWidth={3} style={{ stroke: palette.curve }} />
      {tangent && (
        <line
          data-testid="tangent"
          x1={scales.x(tangent[0][0])}
          y1={scales.y(tangent[0][1])}
          x2={scales.x(tangent[1][0])}
          y2={scales.y(tangent[1][1])}
          strokeWidth={2.5}
          strokeDasharray={dash.dashed}
          style={{ stroke: palette.tangent }}
        />
      )}
      <text
        data-testid="slope-label"
        x={labelOnLeft ? px - 14 : px + 14}
        y={Math.max(py - 14, PLOT.top + 12)}
        textAnchor={labelOnLeft ? 'end' : 'start'}
        fontSize={14}
        fontWeight={600}
        style={{ fill: palette.tangent }}
      >
        {`slope ${formatNumber(slope, decimals.slope ?? 1)}`}
      </text>
    </ChartFrame>
  )
}
