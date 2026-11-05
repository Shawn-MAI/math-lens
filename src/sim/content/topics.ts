export const TOPIC_IDS = ['foundations', 'optimization', 'models', 'neural-networks'] as const

export type TopicId = (typeof TOPIC_IDS)[number]

export interface Topic {
  id: TopicId
  title: string
  /** 1 to 4, unique. */
  order: number
}

/** The four topics, in the fixed order learners see them (FR-001). */
export const TOPICS: readonly Topic[] = [
  { id: 'foundations', title: 'Foundations', order: 1 },
  { id: 'optimization', title: 'Optimization', order: 2 },
  { id: 'models', title: 'Models', order: 3 },
  { id: 'neural-networks', title: 'Neural Networks', order: 4 },
]
