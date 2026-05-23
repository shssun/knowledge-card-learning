/**
 * 案例分析功能类型定义
 */

/** 预置快捷案例 */
export interface SampleCase {
  id: string
  title: string
  description: string
  content: string
  /** 推荐分析的关键词，用于匹配相关概念 */
  keywords: string[]
}

/** 用户点亮状态的概念 */
export interface LearnedConcept {
  term: string
  english?: string
  /** 最高完成等级 */
  maxLevel: '小白' | '初级' | '中级' | '高级' | '大师'
  /** 各等级完成情况 */
  levelRecords: Record<string, { score: number; completed: boolean }>
  /** 概念的分级内容（从归档记录或预设数据读取） */
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
}

/** 案例分析结果 */
export interface CaseAnalysisResult {
  /** 用户已有模型的完整分析（可读性强） */
  ownedAnalysis: string
  /** 用户未掌握但可能相关的概念名称（用于渲染遮盖） */
  hiddenConcepts: string[]
  /** AI 综合评估（含隐藏标记的原始输出） */
  rawOutput: string
  /** 推荐的解锁概念列表 */
  recommendedConcepts: {
    term: string
    reason: string
  }[]
  /** 使用的已掌握模型列表 */
  usedConcepts: string[]
}

/** 案例分析请求 */
export interface CaseAnalysisRequest {
  caseContent: string
  /** 用户已点亮概念（最多传10个，控制token） */
  learnedConcepts: LearnedConcept[]
}

/** 遮盖的概念（未解锁） */
export interface HiddenConcept {
  term: string
  reason: string
}
