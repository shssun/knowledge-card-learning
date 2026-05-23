import type { FusionCard } from './study.types'

export interface ArchiveRecord {
  id: string
  studySessionId: string
  title: string
  terms: string[]
  averageScore: number
  domain: string
  studiedAt: string
  /** 存储完整卡片内容，支持全文搜索 */
  fusionCards?: FusionCard[]
}

export interface UserStats {
  totalTermsLearned: number
  averageMasteryScore: number
  weakDomains: string[]
  totalStudySessions: number
  domainScoreMap: Record<string, number>
}
