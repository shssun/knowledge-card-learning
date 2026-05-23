import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ArchiveRecord, UserStats } from '../types/archive.types'
import { v4 as uuidv4 } from 'uuid'

interface ArchiveState {
  records: ArchiveRecord[]
  stats: UserStats
  
  addRecord: (record: Omit<ArchiveRecord, 'id'>) => void
  updateRecord: (id: string, updates: Partial<ArchiveRecord>) => void
  deleteRecord: (id: string) => void
  getRecordById: (id: string) => ArchiveRecord | undefined
  getRecordsByDomain: (domain: string) => ArchiveRecord[]
  recalculateStats: () => void
}

const initialStats: UserStats = {
  totalTermsLearned: 0,
  averageMasteryScore: 0,
  weakDomains: [],
  totalStudySessions: 0,
  domainScoreMap: {},
}

export const useArchiveStore = create<ArchiveState>()(
  persist(
    (set, get) => ({
      records: [],
      stats: initialStats,
      
      addRecord: (record) => {
        const newRecord: ArchiveRecord = {
          ...record,
          id: uuidv4(),
        }
        set((state) => ({
          records: [newRecord, ...state.records],
        }))
        get().recalculateStats()
      },
      
      updateRecord: (id, updates) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }))
        get().recalculateStats()
      },
      
      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }))
        get().recalculateStats()
      },
      
      getRecordById: (id) => {
        return get().records.find((r) => r.id === id)
      },
      
      getRecordsByDomain: (domain) => {
        return get().records.filter((r) => r.domain === domain)
      },
      
      recalculateStats: () => {
        const { records } = get()
        
        if (records.length === 0) {
          set({ stats: initialStats })
          return
        }
        
        const totalTerms = records.reduce((sum, r) => sum + r.terms.length, 0)
        const avgScore =
          records.reduce((sum, r) => sum + r.averageScore, 0) / records.length
        
        // Calculate domain scores
        const domainScores: Record<string, number[]> = {}
        records.forEach((r) => {
          if (!domainScores[r.domain]) {
            domainScores[r.domain] = []
          }
          domainScores[r.domain].push(r.averageScore)
        })
        
        const domainScoreMap: Record<string, number> = {}
        Object.keys(domainScores).forEach((domain) => {
          domainScoreMap[domain] =
            domainScores[domain].reduce((a, b) => a + b, 0) /
            domainScores[domain].length
        })
        
        // Find weak domains (below 70)
        const weakDomains = Object.entries(domainScoreMap)
          .filter(([, score]) => score < 70)
          .map(([domain]) => domain)
        
        set({
          stats: {
            totalTermsLearned: totalTerms,
            averageMasteryScore: avgScore,
            weakDomains,
            totalStudySessions: records.length,
            domainScoreMap,
          },
        })
      },
    }),
    {
      name: 'zhika-archive-store',
    }
  )
)
