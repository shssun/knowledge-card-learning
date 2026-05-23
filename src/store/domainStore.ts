import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface Domain {
  id: string
  name: string
  description: string
  createdAt: string
  /** 云端 ID，预留 */
  cloudId?: string
}

interface DomainState {
  domains: Domain[]
  addDomain: (domain: Omit<Domain, 'id' | 'createdAt'>) => string
  updateDomain: (id: string, updates: Partial<Omit<Domain, 'id'>>) => void
  deleteDomain: (id: string) => void
  getDomainById: (id: string) => Domain | undefined
  getDomainByName: (name: string) => Domain | undefined
}

export const useDomainStore = create<DomainState>()(
  persist(
    (set, get) => ({
      domains: [],

      addDomain: (domain) => {
        const id = uuidv4()
        set((state) => ({
          domains: [...state.domains, { ...domain, id, createdAt: new Date().toISOString() }],
        }))
        return id
      },

      updateDomain: (id, updates) => {
        set((state) => ({
          domains: state.domains.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }))
      },

      deleteDomain: (id) => {
        set((state) => ({
          domains: state.domains.filter((d) => d.id !== id),
        }))
      },

      getDomainById: (id) => get().domains.find((d) => d.id === id),

      getDomainByName: (name) => get().domains.find((d) => d.name === name),
    }),
    { name: 'zhika-domain-store' }
  )
)
