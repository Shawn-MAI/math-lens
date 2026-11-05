import { lineLoss, slopeOfCurve, type Model } from '../core'

/** Model registry: model id to core model. Adding a model is one import and one line here. */
export const MODELS: Record<string, Model> = {
  [slopeOfCurve.id]: slopeOfCurve,
  [lineLoss.id]: lineLoss,
}

export function getModel(id: string): Model {
  const model = MODELS[id]
  if (!model) throw new Error(`Unknown model "${id}". Registered models: ${Object.keys(MODELS).join(', ') || 'none'}`)
  return model
}
