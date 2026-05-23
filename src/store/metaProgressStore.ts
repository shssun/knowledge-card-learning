/**
 * 元概念学习进度存储
 *
 * - 记录每个概念的掌握分数 (0-100)
 * - 判断是否达到「已掌握」阈值 (>=80)
 * - 按层统计进度
 * - 持久化到 localStorage
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 概念评分：key=概念名, value=分数(0-100) */
export interface MetaProgressState {
  /** { 概念名: 分数 } */
  scores: Record<string, number>

  /** 设置/更新单个概念的分数 */
  setScore: (conceptKey: string, score: number) => void

  /** 获取概念分数（未评过返回 0） */
  getScore: (conceptKey: string) => number

  /** 概念是否已掌握 (>=80分) */
  isMastered: (conceptKey: string) => boolean

  /** 获取已掌握概念列表 */
  getMasteredKeys: () => string[]

  /** 获取某层的掌握进度 { learned, total, percent } */
  getLayerProgress: (layerKeys: string[]) => {
    learned: number
    total: number
    percent: number
  }

  /** 某层的已掌握概念数 */
  getLayerLearned: (layerKeys: string[]) => number

  /** 总共掌握的概念数 */
  getTotalLearned: () => number

  /** 是否达到升级门槛 (掌握数 >= 所需数) */
  canAdvanceTo: (requiredCount: number, layerKeys: string[]) => boolean

  /** 重置所有进度 */
  reset: () => void
}

export const useMetaProgressStore = create<MetaProgressState>()(
  persist(
    (set, get) => ({
      scores: {},

      setScore: (conceptKey, score) => {
        set((state) => ({
          scores: { ...state.scores, [conceptKey]: Math.min(100, Math.max(0, score)) },
        }))
      },

      getScore: (conceptKey) => {
        return get().scores[conceptKey] ?? 0
      },

      isMastered: (conceptKey) => {
        return (get().scores[conceptKey] ?? 0) >= 80
      },

      getMasteredKeys: () => {
        return Object.entries(get().scores)
          .filter(([, score]) => score >= 80)
          .map(([key]) => key)
      },

      getLayerProgress: (layerKeys) => {
        const scores = get().scores
        const learned = layerKeys.filter((k) => (scores[k] ?? 0) >= 80).length
        const total = layerKeys.length
        return {
          learned,
          total,
          percent: total > 0 ? Math.round((learned / total) * 100) : 0,
        }
      },

      getLayerLearned: (layerKeys) => {
        const scores = get().scores
        return layerKeys.filter((k) => (scores[k] ?? 0) >= 80).length
      },

      getTotalLearned: () => {
        return Object.values(get().scores).filter((s) => s >= 80).length
      },

      canAdvanceTo: (requiredCount, layerKeys) => {
        return get().getLayerLearned(layerKeys) >= requiredCount
      },

      reset: () => set({ scores: {} }),
    }),
    {
      name: 'zhika-meta-progress',
    }
  )
)
