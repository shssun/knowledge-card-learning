import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Material, MaterialCategory, DifficultyLevel, WordBank, BankType, WordEntry } from '../types/material.types'
import { v4 as uuidv4 } from 'uuid'
import { AI_BASICS_PRESET_CARDS } from '../data/ai-basics-10-words'

/** difficulty mapping for AI basics 10 words */
const AI_BASICS_DIFFICULTY: Record<string, DifficultyLevel> = {
  '机器学习': DifficultyLevel.ADVANCED,
  '神经网络': DifficultyLevel.INTERMEDIATE,
  '大语言模型': DifficultyLevel.ADVANCED,
  'Prompt工程': DifficultyLevel.BEGINNER,
  'RAG': DifficultyLevel.INTERMEDIATE,
  'Token': DifficultyLevel.BEGINNER,
  'Embedding': DifficultyLevel.INTERMEDIATE,
  '幻觉': DifficultyLevel.BEGINNER,
  'Fine-tuning': DifficultyLevel.INTERMEDIATE,
  'Agent': DifficultyLevel.BEGINNER,
}

interface MaterialState {
  materials: Material[]
  wordBanks: WordBank[]
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => void
  updateMaterial: (id: string, updates: Partial<Material>) => void
  deleteMaterial: (id: string) => void
  addWordBank: (bank: Omit<WordBank, 'id' | 'createdAt'>) => void
  updateWordBank: (id: string, updates: Partial<WordBank>) => void
  deleteWordBank: (id: string) => void
      addWordToBank: (bankId: string, word: Omit<WordEntry, 'id'>) => void
      addWordsToCategoryBank: (category: MaterialCategory, words: Omit<WordEntry, 'id'>[]) => void
      removeWordFromBank: (bankId: string, wordId: string) => void
  getMaterialById: (id: string) => Material | undefined
  getBankById: (id: string) => WordBank | undefined
  getMaterialOrBank: (id: string) => { type: 'material'; data: Material } | { type: 'bank'; data: WordBank } | undefined
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: [],
      wordBanks: [
        // AI基础词库
        {
          id: 'bank-ai-basics',
          name: 'AI基础',
          type: BankType.PUBLIC,
          category: MaterialCategory.FREE_RESEARCH,
          createdAt: new Date().toISOString(),
          words: Object.values(AI_BASICS_PRESET_CARDS).map((card) => ({
            id: uuidv4(),
            term: card.term,
            english: card.english,
            definition: card.levelContent.definition,
            difficulty: AI_BASICS_DIFFICULTY[card.term] || DifficultyLevel.BEGINNER,
            domain: 'AI基础',
            levelContent: card.levelContent,
          })),
        },
      ],
      
      addMaterial: (material) => {
        const newMaterial: Material = {
          ...material,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          materials: [newMaterial, ...state.materials],
        }))
      },
      
      updateMaterial: (id, updates) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }))
      },
      
      deleteMaterial: (id) => {
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        }))
      },
      
      addWordBank: (bank) => {
        const newBank: WordBank = {
          ...bank,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          wordBanks: [newBank, ...state.wordBanks],
        }))
      },
      
      updateWordBank: (id, updates) => {
        set((state) => ({
          wordBanks: state.wordBanks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }))
      },
      
      deleteWordBank: (id) => {
        set((state) => ({
          wordBanks: state.wordBanks.filter((b) => b.id !== id),
        }))
      },
      
      addWordToBank: (bankId, word) => {
        const newWord: WordEntry = {
          ...word,
          id: uuidv4(),
        }
        set((state) => ({
          wordBanks: state.wordBanks.map((b) =>
            b.id === bankId ? { ...b, words: [...b.words, newWord] } : b
          ),
        }))
      },

      addWordsToCategoryBank: (category, words) => {
        const categoryName: Record<MaterialCategory, string> = {
          [MaterialCategory.SCHOOL_SUBJECT]: '学科课程词库',
          [MaterialCategory.INDUSTRY_TRACK]: '行业赛道词库',
          [MaterialCategory.FREE_RESEARCH]: '自由研究词库',
        }
        set((state) => {
          const existingBank = state.wordBanks.find((b) => b.category === category)
          const newWords = words.map((w) => ({ ...w, id: uuidv4() }))
          if (existingBank) {
            return {
              wordBanks: state.wordBanks.map((b) =>
                b.id === existingBank.id ? { ...b, words: [...b.words, ...newWords] } : b
              ),
            }
          }
          const newBank: WordBank = {
            id: uuidv4(),
            name: categoryName[category] || '自定义词库',
            type: BankType.PUBLIC,
            category,
            createdAt: new Date().toISOString(),
            words: newWords,
          }
          return { wordBanks: [newBank, ...state.wordBanks] }
        })
      },
      
      removeWordFromBank: (bankId, wordId) => {
        set((state) => ({
          wordBanks: state.wordBanks.map((b) =>
            b.id === bankId
              ? { ...b, words: b.words.filter((w) => w.id !== wordId) }
              : b
          ),
        }))
      },
      
      getMaterialById: (id: string) => {
        return get().materials.find((m) => m.id === id)
      },
      getBankById: (id: string) => {
        return get().wordBanks.find((b) => b.id === id)
      },
      /** 统一查询：优先查 materials，再查 wordBanks */
      getMaterialOrBank: (id) => {
        const mat = get().materials.find((m) => m.id === id)
        if (mat) return { type: 'material' as const, data: mat }
        const bank = get().wordBanks.find((b) => b.id === id)
        if (bank) return { type: 'bank' as const, data: bank }
        return undefined
      },
    }),
    {
      name: 'zhika-material-store',
    }
  )
)
