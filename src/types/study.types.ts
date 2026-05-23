export enum CardType {
  STANDARD = 'STANDARD',
  FUSION = 'FUSION',
}

export enum StudyStep {
  SELECT_CONTENT = 0,
  GENERATE_CARD = 1,
  DISCUSSION = 2,
  FUSION_CARD = 3,
  OUTPUT_SCORE = 4,
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

export enum OutputType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface DiscussionMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
}

export interface DiscussionRecord {
  id: string
  cardId: string
  messages: DiscussionMessage[]
  createdAt: string
}

export interface OutputRecord {
  id: string
  cardId: string
  userOutput: string
  outputType: OutputType
  scoreResult: ScoreResult
  createdAt: string
}

export interface ScoreResult {
  definitionAccuracy: number
  boundaryClarity: number
  caseCompleteness: number
  misconceptionAwareness: number
  totalScore: number
  annotations: ScoreAnnotation[]
}

export interface ScoreAnnotation {
  dimension: string
  issue: string
  suggestion: string
}

export interface StudySession {
  id: string
  materialId: string
  entryMode: 'focused' | 'full'
  selectedTerms: string[]
  currentStep: StudyStep
  generatedCards: KnowledgeCard[]
  fusionCards: FusionCard[]
  discussions: DiscussionRecord[]
  outputRecords: OutputRecord[]
  startedAt: string
  completedAt?: string
  status: SessionStatus
}

export interface KnowledgeCard {
  id: string
  term: string
  topic: string
  source: string
  domain: string
  coreDefinition: string
  applicableScope: string
  originalViewpoint: string
  basicCase: string
  commonMisconceptions: string
  type: CardType
  studySessionId: string
  createdAt: string
  /** 标签系统（二期 UI），用于跨领域关联 */
  tags?: string[]
}

export interface FusionCard {
  id: string
  baseCardId: string
  term: string
  personalizedDefinition: string
  deepLogic: string
  practicalCases: string
  refinedBoundary: string
  discussionSnapshot: DiscussionMessage[]
  createdAt: string
  /** 标签系统（二期 UI），用于跨领域关联 */
  tags?: string[]
  /** 五级分级学习内容 */
  levelContent?: {
    definition?: string
    boundary?: string
    similarTerms?: string
    examples?: string
    applicationScenario?: string
    misconceptions?: string
    relations?: string
    transferTest?: string
    teachingOutput?: string
  }
  /** 各等级完成记录 */
  levelRecords?: Record<string, {
    level: string
    score: number
    completed: boolean
    completedAt?: string
    feedback?: string
  }>
}
