import { df, f } from '../curves'
import type { Model } from '../types'

const X_MIN = -3
const X_MAX = 3
const SAMPLES = 201

export const slopeOfCurve: Model = {
  id: 'slope-of-curve',
  roles: ['x'],
  choiceInputs: ['curve'],
  needsDataset: false,
  outputKeys: ['y', 'slope', 'tangentIntercept', 'curveX', 'curveY', 'tangentX', 'tangentY'],
  compute({ values, choices }) {
    const x = values.x
    const curve = choices.curve
    if (x === undefined || !Number.isFinite(x)) throw new RangeError(`x must be a finite number, got ${x}`)
    if (curve === undefined) throw new Error('slope-of-curve needs a "curve" choice')

    const y = f(curve, x)
    const slope = df(curve, x)
    const tangentIntercept = y - slope * x

    const curveX = Array.from({ length: SAMPLES }, (_, i) => X_MIN + ((X_MAX - X_MIN) * i) / (SAMPLES - 1))
    curveX[SAMPLES - 1] = X_MAX
    const curveY = curveX.map((t) => f(curve, t))
    const tangentX = [X_MIN, X_MAX]
    const tangentY = tangentX.map((t) => slope * (t - x) + y)

    return { y, slope, tangentIntercept, curveX, curveY, tangentX, tangentY }
  },
}
