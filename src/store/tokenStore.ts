import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DailyTokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ChartDataPoint {
  date: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

interface TokenState {
  dailyUsage: Record<string, DailyTokenUsage>
  addUsage: (date: string, usage: DailyTokenUsage) => void
  getChartData: () => ChartDataPoint[]
  getTotalTokens: () => number
  clearUsage: () => void
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      dailyUsage: {},

      addUsage: (date, usage) => {
        set((state) => {
          const existing = state.dailyUsage[date]
          if (existing) {
            return {
              dailyUsage: {
                ...state.dailyUsage,
                [date]: {
                  promptTokens: existing.promptTokens + usage.promptTokens,
                  completionTokens: existing.completionTokens + usage.completionTokens,
                  totalTokens: existing.totalTokens + usage.totalTokens,
                },
              },
            }
          }
          return {
            dailyUsage: {
              ...state.dailyUsage,
              [date]: usage,
            },
          }
        })
      },

      getChartData: () => {
        const { dailyUsage } = get()
        return Object.entries(dailyUsage)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, usage]) => ({
            date,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
          }))
      },

      getTotalTokens: () => {
        const { dailyUsage } = get()
        return Object.values(dailyUsage).reduce(
          (sum, u) => sum + u.totalTokens,
          0
        )
      },

      clearUsage: () => set({ dailyUsage: {} }),
    }),
    {
      name: 'zhika-token-store',
    }
  )
)
