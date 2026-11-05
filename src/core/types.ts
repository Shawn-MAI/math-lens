/** A data point of a lesson dataset. */
export interface Point {
  x: number
  y: number
}

/** What a model returns: scalars and arrays of numbers, keyed by output name. */
export type ModelOutput = Record<string, number | number[]>

export interface ModelInput {
  /** Numeric inputs keyed by model role, already snapped and clamped by the store. */
  values: Record<string, number>
  /** Choice inputs, for example the selected curve. */
  choices: Record<string, string>
}

/** The model contract from specs/001-lesson-framework-foundations/contracts/model-and-template.md. */
export interface Model {
  id: string
  /** Numeric inputs the lesson must bind to number parameters. */
  roles: string[]
  /** Choice inputs the model reads from `ModelInput.choices`. */
  choiceInputs: string[]
  needsDataset: boolean
  /** Every key `compute` returns. */
  outputKeys: string[]
  /** Pure: same input gives the same output, and non-finite input throws RangeError. */
  compute(input: ModelInput, dataset?: Point[]): ModelOutput
}
