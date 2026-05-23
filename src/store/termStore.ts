import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface Term {
  id: string
  name: string
  domainId: string
  description?: string
  createdAt: string
  /** 云端 ID，预留 */
  cloudId?: string
}

interface TermState {
  terms: Term[]
  addTerm: (term: Omit<Term, 'id' | 'createdAt'>) => string
  updateTerm: (id: string, updates: Partial<Omit<Term, 'id'>>) => void
  deleteTerm: (id: string) => void
  getTermsByDomain: (domainId: string) => Term[]
  getTermById: (id: string) => Term | undefined
}

export const useTermStore = create<TermState>()(
  persist(
    (set, get) => ({
      terms: [],

      addTerm: (term) => {
        const id = uuidv4()
        set((state) => ({
          terms: [...state.terms, { ...term, id, createdAt: new Date().toISOString() }],
        }))
        return id
      },

      updateTerm: (id, updates) => {
        set((state) => ({
          terms: state.terms.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
      },

      deleteTerm: (id) => {
        set((state) => ({
          terms: state.terms.filter((t) => t.id !== id),
        }))
      },

      getTermsByDomain: (domainId) => get().terms.filter((t) => t.domainId === domainId),

      getTermById: (id) => get().terms.find((t) => t.id === id),
    }),
    { name: 'zhika-term-store' }
  )
)
