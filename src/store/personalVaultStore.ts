/**
 * 个人思维积木库 Store
 *
 * 持久化用户所有工具产出：拆解、MECE、翻译、拆书
 * localStorage key: zhika-personal-vault
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { VaultEntry, VaultEntryType } from '../types/vault.types'

/** 生成摘要：截取前 150 字符，去除 markdown 标记 */
function makeSummary(raw: string): string {
  const cleaned = raw
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim()
  return cleaned.length > 150 ? cleaned.slice(0, 147) + '...' : cleaned
}

/** 生成标题 */
function makeTitle(type: VaultEntryType, input: string): string {
  const short = input.length > 50 ? input.slice(0, 47) + '...' : input
  switch (type) {
    case 'deconstruct':
      return `拆解: ${short}`
    case 'mece':
      return `MECE分析: ${short}`
    case 'translation':
      return `翻译: ${short}`
    case 'book_deconstruct':
      return `拆书: ${short}`
  }
}

interface PersonalVaultState {
  /** 所有记录，按时间倒序 */
  entries: VaultEntry[]

  /** 添加一条记录 */
  addEntry: (type: VaultEntryType, input: string, fullOutput: string) => void

  /** 删除记录 */
  removeEntry: (id: string) => void

  /** 按类型过滤 */
  getByType: (type: VaultEntryType) => VaultEntry[]

  /** 按类型统计数量 */
  countByType: () => Record<VaultEntryType, number>

  /** 清空全部 */
  clearAll: () => void
}

export const usePersonalVaultStore = create<PersonalVaultState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (type, input, fullOutput) => {
        const entry: VaultEntry = {
          id: uuidv4(),
          type,
          input,
          title: makeTitle(type, input),
          createdAt: new Date().toISOString(),
          summary: makeSummary(fullOutput),
          fullOutput,
        }
        set((state) => ({
          entries: [entry, ...state.entries],
        }))
      },

      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }))
      },

      getByType: (type) => {
        return get().entries.filter((e) => e.type === type)
      },

      countByType: () => {
        const counts: Record<VaultEntryType, number> = {
          deconstruct: 0,
          mece: 0,
          translation: 0,
          book_deconstruct: 0,
        }
        for (const e of get().entries) {
          counts[e.type]++
        }
        return counts
      },

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'zhika-personal-vault',
    }
  )
)
