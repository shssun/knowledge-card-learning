export enum ReviewMode {
  SPEED_REVIEW = 'SPEED_REVIEW',
  RECITE_MODE = 'RECITE_MODE',
}

export enum EbbinghausStage {
  DAY_1 = 1,
  DAY_3 = 3,
  DAY_7 = 7,
  DAY_15 = 15,
}

export interface ReviewTask {
  id: string
  cardId: string
  term: string
  mode: ReviewMode
  scheduledAt: string
  completedAt?: string
  isCompleted: boolean
  reviewCount: number
  stage: EbbinghausStage
}

export interface MistakeEntry {
  id: string
  cardId: string
  term: string
  issueType: string
  description: string
  correction: string
  recordedAt: string
}
