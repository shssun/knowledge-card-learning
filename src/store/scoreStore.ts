import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ScoreRecord, UserLevel, LevelRecord, ScoreHistoryEntry } from '../types/level.types'
import { v4 as uuidv4 } from 'uuid'

interface ScoreState extends ScoreRecord {
  /** 分数历史列表（按时间降序），用于展示进步曲线 */
  scoreHistory: ScoreHistoryEntry[]

  /** 完成某个等级，获得积分 */
  completeLevel: (
    cardId: string,
    term: string,
    level: UserLevel,
    score: number,
    feedback?: string
  ) => void

  /** 记录一次评分（输出评分或等级评分），不区分是否重复 */
  recordScore: (
    cardId: string,
    term: string,
    score: number,
    source: 'level' | 'output',
    userLevel?: UserLevel
  ) => void

  /** 获取某个术语的历史评分趋势 */
  getHistoryForTerm: (term: string) => ScoreHistoryEntry[]

  /** 更新连续学习打卡天数 */
  updateStreak: () => void

  /** 获取某张卡片在某个等级的记录 */
  getLevelRecord: (cardId: string, level: UserLevel) => LevelRecord | undefined

  /** 获取某张卡片的最高等级 */
  getMaxLevel: (cardId: string) => UserLevel | undefined

  /** 获取某张卡片的累计分数 */
  getCardTotalScore: (cardId: string) => number
}

function isSameDay(d1: string, d2: string): boolean {
  return d1.split('T')[0] === d2.split('T')[0]
}

function isYesterday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      studyScore: 0,
      communityScore: 0,
      totalScore: 0,
      levelRecords: {},
      streak: 0,
      lastStudyDate: undefined,
      scoreHistory: [],

      completeLevel: (cardId, term, level, score, feedback) => {
        const existingRecord = get().levelRecords[cardId]?.[level]
        // 已完成该等级，不重复操作
        if (existingRecord?.completed) return

        set((state) => {
          const cardRecords = state.levelRecords[cardId] || {}
          const now = new Date().toISOString()
          const newRecord: LevelRecord = {
            level,
            score,
            completed: true,
            completedAt: now,
            feedback,
          }

          const updatedCardRecords = {
            ...cardRecords,
            [level]: newRecord,
          }

          const newStudyScore = state.studyScore + score

          return {
            studyScore: newStudyScore,
            totalScore: newStudyScore + state.communityScore,
            levelRecords: {
              ...state.levelRecords,
              [cardId]: updatedCardRecords,
            },
          }
        })

        // 同时记录分数历史
        get().recordScore(cardId, term, score, 'level', level)

        // 同时更新打卡天数
        get().updateStreak()
      },

      recordScore: (cardId, term, score, source, userLevel) => {
        const entry: ScoreHistoryEntry = {
          id: uuidv4(),
          cardId,
          term,
          score,
          source,
          userLevel,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          scoreHistory: [entry, ...state.scoreHistory],
        }))
      },

      getHistoryForTerm: (term) => {
        return get().scoreHistory
          .filter((e) => e.term === term)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      },

      updateStreak: () => {
        set((state) => {
          const now = new Date().toISOString()
          const today = now.split('T')[0]

          if (!state.lastStudyDate) {
            // 第一次学习
            return {
              streak: 1,
              lastStudyDate: now,
            }
          }

          if (isSameDay(state.lastStudyDate, now)) {
            // 今天已打卡，不重复计算
            return state
          }

          if (isYesterday(state.lastStudyDate)) {
            // 连续打卡
            return {
              streak: state.streak + 1,
              lastStudyDate: now,
            }
          }

          // 断了，重新开始
          return {
            streak: 1,
            lastStudyDate: now,
          }
        })
      },

      getLevelRecord: (cardId, level) => {
        return get().levelRecords[cardId]?.[level]
      },

      getMaxLevel: (cardId) => {
        const cardRecords = get().levelRecords[cardId]
        if (!cardRecords) return undefined

        const levels: UserLevel[] = ['小白', '初级', '中级', '高级', '大师']
        for (const lvl of [...levels].reverse()) {
          if (cardRecords[lvl]?.completed) {
            return lvl
          }
        }
        return undefined
      },

      getCardTotalScore: (cardId) => {
        const cardRecords = get().levelRecords[cardId]
        if (!cardRecords) return 0

        const levels: UserLevel[] = ['小白', '初级', '中级', '高级', '大师']
        let total = 0
        for (const lvl of levels) {
          if (cardRecords[lvl]?.completed) {
            total += cardRecords[lvl].score
          }
        }
        return total
      },
    }),
    {
      name: 'zhika-score-store',
    }
  )
)
