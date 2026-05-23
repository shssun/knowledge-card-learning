/**
 * 分级学习系统类型定义
 * 小白/初级/中级/高级/大师 五级内容结构
 */

// 用户能力等级
export type UserLevel = '小白' | '初级' | '中级' | '高级' | '大师'

// 等级展示顺序
export const USER_LEVELS: UserLevel[] = ['小白', '初级', '中级', '高级', '大师']

// 等级颜色映射（用于图谱节点和徽章）
export const LEVEL_COLORS: Record<UserLevel, string> = {
  小白: '#4CAF50',   // 绿色
  初级: '#2196F3',   // 蓝色
  中级: '#FF9800',   // 橙色
  高级: '#9C27B0',   // 紫色
  大师: '#FFD700',    // 金色
}

// 未学习颜色
export const LEVEL_UNLEARNED_COLOR = '#9E9E9E'

// 等级满分（当前维度）
export const LEVEL_MAX_SCORES: Record<UserLevel, number> = {
  小白: 10,
  初级: 10,
  中级: 10,
  高级: 10,
  大师: 10,
}

// 累计满分
export const LEVEL_CUMULATIVE_SCORES: Record<UserLevel, number> = {
  小白: 10,
  初级: 20,
  中级: 30,
  高级: 40,
  大师: 50,
}

// 等级中文描述（基于元概念学习进度）
export const LEVEL_DESCRIPTIONS: Record<UserLevel, string> = {
  小白: '第1-2层元概念学习中（宇宙本源 / 逻辑思维）',
  初级: '第3-5层元概念学习中（人性意识 / 社会人际 / 成事行动）',
  中级: '第6-7层元概念学习中（商业财富 / 认知思维）',
  高级: '第8层元概念学习中（创新创造）',
  大师: '全部8层130个元概念掌握',
}

/** 各等级对应的核心学习层描述 */
export const LEVEL_LAYER_NAMES: Record<UserLevel, string> = {
  小白: '1层「宇宙本源」+ 2层「逻辑思维」共37个概念',
  初级: '3层「人性意识」+ 4层「社会人际」+ 5层「成事行动」共57个概念',
  中级: '6层「商业财富」+ 7层「认知思维」共22个概念',
  高级: '8层「创新创造」共13个概念',
  大师: '全部8层130个概念已掌握',
}

/** 各等级解锁的功能 */
export const LEVEL_UNLOCKS: Record<UserLevel, string> = {
  小白: '元概念浏览',
  初级: '+ 领域术语（查看）',
  中级: '+ 领域术语（学习）',
  高级: '+ 全部工具无限制',
  大师: '全部功能已解锁',
}

/**
 * 各等级学习内容结构
 */
export interface LevelContent {
  /** 小白：一句话准确定义 */
  definition?: string
  /** 初级：边界和适用范围 */
  boundary?: string
  /** 初级：近义词和反义词辨析 */
  similarTerms?: string
  /** 中级：组词造句示例 */
  examples?: string
  /** 中级：日常应用场景 */
  applicationScenario?: string
  /** 高级：常见误区辨析 */
  misconceptions?: string
  /** 高级：与其他概念的关系（同领域内串讲） */
  relations?: string
  /** 大师：举一反三，给出新场景考验 */
  transferTest?: string
  /** 大师：教学输出，用户自述解释 */
  teachingOutput?: string
}

/**
 * 单个等级的学习记录
 */
export interface LevelRecord {
  level: UserLevel
  /** 满分 10 分，根据回答质量给分 */
  score: number
  /** 是否已完成该等级的学习流程 */
  completed: boolean
  /** 完成时间 */
  completedAt?: string
  /** AI 对该等级内容的评价 */
  feedback?: string
}

/**
 * 分数历史记录，支持进步趋势分析
 */
export interface ScoreHistoryEntry {
  id: string
  cardId: string
  term: string
  /** 本次得分（0-10 或 0-100，根据来源） */
  score: number
  /** 来源：等级评分 或 输出评分 */
  source: 'level' | 'output'
  /** 用户对应的等级（如果是 level 评分） */
  userLevel?: UserLevel
  /** 创建时间 */
  createdAt: string
}

/**
 * 用户积分记录
 * 学习力：完成研习获得
 * 社区力：分享传播获得（二期）
 */
export interface ScoreRecord {
  /** 学习力分数 */
  studyScore: number
  /** 社区力分数 */
  communityScore: number
  /** 总分（两个相加） */
  totalScore: number
  /** 每个词各等级的分项记录：词ID -> 等级 -> 记录 */
  levelRecords: Record<string, Record<UserLevel, LevelRecord>>
  /** 连续学习天数 */
  streak: number
  /** 最后学习日期（用于计算连续打卡） */
  lastStudyDate?: string
}
