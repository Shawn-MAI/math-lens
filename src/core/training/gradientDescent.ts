import { assertCompatibleDimensions, type AlgorithmAdapter } from './types'

export const gradientDescent: AlgorithmAdapter = {
  id: 'gradient-descent',
  dimensions: [1, 2],
  step(snapshot, rate, landscape) {
    assertCompatibleDimensions(gradientDescent, landscape)
    if (snapshot.weights.length !== landscape.dimensions || snapshot.gradient.length !== landscape.dimensions) {
      throw new Error('Snapshot dimensions must match the landscape')
    }
    if (!Number.isInteger(snapshot.index) || snapshot.index < 0) {
      throw new Error('Snapshot index must be a non-negative integer')
    }
    if (!Number.isFinite(rate) || !Number.isFinite(snapshot.loss) || !snapshot.weights.every(Number.isFinite)) {
      return { kind: 'non-finite', stage: 'input' }
    }
    if (rate < 0) throw new Error('Learning rate must be non-negative')
    if (!snapshot.gradient.every(Number.isFinite)) return { kind: 'non-finite', stage: 'gradient' }

    const products = snapshot.gradient.map((value) => rate * value)
    if (!products.every(Number.isFinite)) return { kind: 'non-finite', stage: 'product' }
    const update = products.map((value) => value === 0 ? 0 : -value)
    const weights = snapshot.weights.map((value, index) => value + update[index]!)
    if (!weights.every(Number.isFinite)) return { kind: 'non-finite', stage: 'weight' }
    const loss = landscape.loss(weights)
    if (!Number.isFinite(loss)) return { kind: 'non-finite', stage: 'loss' }
    const gradient = landscape.gradient(weights)
    if (gradient.length !== landscape.dimensions) throw new Error('Landscape gradient dimensions do not match')
    if (!gradient.every(Number.isFinite)) return { kind: 'non-finite', stage: 'result-gradient' }

    return {
      kind: 'success',
      snapshot: { index: snapshot.index + 1, weights, loss, gradient },
      transition: {
        rate, oldWeights: [...snapshot.weights], gradient: [...snapshot.gradient], update, newWeights: [...weights],
      },
    }
  },
}
