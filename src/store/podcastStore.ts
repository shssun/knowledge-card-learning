import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export type PodcastStatus = 'pending' | 'generated' | 'failed' | 'reviewed'

export interface Podcast {
  id: string
  /** 播客名称 */
  name: string
  domainId: string
  /** 关联的术语 ID 列表 */
  termIds: string[]
  status: PodcastStatus
  /** 本地 base64 音频，或云端 URL */
  audioData?: string
  audioName?: string
  /** 质量审核备注 */
  reviewNote?: string
  /** 生成失败原因 */
  errorMessage?: string
  createdAt: string
  updatedAt: string
  /** 云端 ID，预留 */
  cloudId?: string
}

interface PodcastState {
  podcasts: Podcast[]
  addPodcast: (podcast: Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>) => string
  updatePodcast: (id: string, updates: Partial<Omit<Podcast, 'id'>>) => void
  deletePodcast: (id: string) => void
  getPodcastsByDomain: (domainId: string) => Podcast[]
  getPodcastById: (id: string) => Podcast | undefined
  /** 统计各状态数量 */
  getStatusCounts: () => Record<PodcastStatus, number>
}

export const usePodcastStore = create<PodcastState>()(
  persist(
    (set, get) => ({
      podcasts: [],

      addPodcast: (podcast) => {
        const id = uuidv4()
        const now = new Date().toISOString()
        set((state) => ({
          podcasts: [...state.podcasts, { ...podcast, id, createdAt: now, updatedAt: now }],
        }))
        return id
      },

      updatePodcast: (id, updates) => {
        set((state) => ({
          podcasts: state.podcasts.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }))
      },

      deletePodcast: (id) => {
        set((state) => ({
          podcasts: state.podcasts.filter((p) => p.id !== id),
        }))
      },

      getPodcastsByDomain: (domainId) => get().podcasts.filter((p) => p.domainId === domainId),

      getPodcastById: (id) => get().podcasts.find((p) => p.id === id),

      getStatusCounts: () => {
        const counts: Record<PodcastStatus, number> = {
          pending: 0,
          generated: 0,
          failed: 0,
          reviewed: 0,
        }
        get().podcasts.forEach((p) => {
          counts[p.status]++
        })
        return counts
      },
    }),
    { name: 'zhika-podcast-store' }
  )
)
