/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useMaterialStore } from '../../store/materialStore'
import { MaterialCategory, DifficultyLevel, BankType } from '../../types/material.types'

describe('MaterialStore', () => {
  beforeEach(() => {
    // 重置 store（保留 AI 基础词库预置数据）
    useMaterialStore.setState((state) => ({
      materials: [],
      wordBanks: state.wordBanks.filter((b) => b.id === 'bank-ai-basics'),
    }))
  })

  describe('addMaterial', () => {
    it('应添加资料', () => {
      useMaterialStore.getState().addMaterial({
        title: '机器学习入门',
        content: '机器学习是人工智能的核心分支...',
        category: MaterialCategory.INDUSTRY_TRACK,
        difficulty: DifficultyLevel.INTERMEDIATE,
        keywords: ['机器学习', '监督学习'],
        source: '某课程',
      })

      const materials = useMaterialStore.getState().materials
      expect(materials.length).toBe(1)
      expect(materials[0].title).toBe('机器学习入门')
    })

    it('新资料应有 id 和创建时间', () => {
      useMaterialStore.getState().addMaterial({
        title: '测试',
        content: '内容',
        category: MaterialCategory.FREE_RESEARCH,
        difficulty: DifficultyLevel.BEGINNER,
        keywords: [],
      })

      const material = useMaterialStore.getState().materials[0]
      expect(material.id).toBeDefined()
      expect(material.createdAt).toBeDefined()
    })
  })

  describe('updateMaterial', () => {
    it('应更新资料信息', () => {
      useMaterialStore.getState().addMaterial({
        title: '原标题',
        content: '原内容',
        category: MaterialCategory.FREE_RESEARCH,
        difficulty: DifficultyLevel.BEGINNER,
        keywords: [],
      })
      const materialId = useMaterialStore.getState().materials[0].id

      useMaterialStore.getState().updateMaterial(materialId, {
        title: '新标题',
        difficulty: DifficultyLevel.ADVANCED,
      })

      const updated = useMaterialStore.getState().getMaterialById(materialId)
      expect(updated?.title).toBe('新标题')
      expect(updated?.difficulty).toBe(DifficultyLevel.ADVANCED)
      // 未更新的字段应保持不变
      expect(updated?.content).toBe('原内容')
    })
  })

  describe('deleteMaterial', () => {
    it('应删除指定资料', () => {
      useMaterialStore.getState().addMaterial({
        title: '待删除',
        content: '内容',
        category: MaterialCategory.FREE_RESEARCH,
        difficulty: DifficultyLevel.BEGINNER,
        keywords: [],
      })
      const materialId = useMaterialStore.getState().materials[0].id

      useMaterialStore.getState().deleteMaterial(materialId)
      expect(useMaterialStore.getState().getMaterialById(materialId)).toBeUndefined()
    })
  })

  describe('wordBanks', () => {
    it('应默认包含 AI 基础词库', () => {
      const banks = useMaterialStore.getState().wordBanks
      const aiBank = banks.find((b) => b.id === 'bank-ai-basics')
      expect(aiBank).toBeDefined()
      expect(aiBank?.name).toBe('AI基础')
      expect(aiBank?.words.length).toBeGreaterThan(0)
    })

    it('应能添加词库', () => {
      useMaterialStore.getState().addWordBank({
        name: '经济学基础',
        type: BankType.PUBLIC,
        category: MaterialCategory.FREE_RESEARCH,
        words: [],
      })

      const banks = useMaterialStore.getState().wordBanks
      expect(banks.find((b) => b.name === '经济学基础')).toBeDefined()
    })

    it('应能删除词库（不删除 AI 基础预置词库）', () => {
      // 先添加一个自定义词库
      useMaterialStore.getState().addWordBank({
        name: '自定义词库',
        type: BankType.PUBLIC,
        category: MaterialCategory.FREE_RESEARCH,
        words: [],
      })
      const customBank = useMaterialStore.getState().wordBanks.find((b) => b.name === '自定义词库')

      useMaterialStore.getState().deleteWordBank(customBank!.id)
      expect(useMaterialStore.getState().wordBanks.find((b) => b.name === '自定义词库')).toBeUndefined()
      // AI 基础词库应保留
      expect(useMaterialStore.getState().wordBanks.find((b) => b.id === 'bank-ai-basics')).toBeDefined()
    })

    it('应能向词库添加词汇', () => {
      const aiBank = useMaterialStore.getState().wordBanks.find((b) => b.id === 'bank-ai-basics')!
      const originalCount = aiBank.words.length

      useMaterialStore.getState().addWordToBank(aiBank.id, {
        term: '自定义术语',
        definition: '自定义定义',
        difficulty: DifficultyLevel.BEGINNER,
        domain: '测试',
      })

      const updatedBank = useMaterialStore.getState().getBankById(aiBank.id)
      expect(updatedBank?.words.length).toBe(originalCount + 1)
    })

    it('应能删除词库中的词汇', () => {
      const aiBank = useMaterialStore.getState().wordBanks.find((b) => b.id === 'bank-ai-basics')!
      const lastWord = aiBank.words[aiBank.words.length - 1]

      useMaterialStore.getState().removeWordFromBank(aiBank.id, lastWord.id)
      const updatedBank = useMaterialStore.getState().getBankById(aiBank.id)
      expect(updatedBank?.words.find((w) => w.id === lastWord.id)).toBeUndefined()
    })
  })
})
