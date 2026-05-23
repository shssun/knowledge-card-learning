/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import {
  exportToJSON,
  exportToCSV,
  exportToMarkdown,
  exportCards,
} from '../../utils/exportUtils'
import type { FusionCard } from '../../types/study.types'

describe('exportUtils', () => {
  const mockCards: FusionCard[] = [
    {
      id: 'card-1',
      baseCardId: 'base-1',
      term: '机器学习',
      personalizedDefinition: '让计算机从数据中学习',
      deepLogic: '数据驱动决策',
      practicalCases: '推荐系统、图像识别',
      refinedBoundary: '适用于有大量数据的问题',
      discussionSnapshot: [],
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'card-2',
      baseCardId: 'base-2',
      term: '深度学习',
      personalizedDefinition: '多层神经网络的学习方式',
      deepLogic: '层次化特征提取',
      practicalCases: '语音识别、NLP',
      refinedBoundary: '需要大量算力和数据',
      discussionSnapshot: [],
      createdAt: '2026-01-16T10:00:00.000Z',
    },
  ]

  describe('exportToJSON', () => {
    it('应输出格式化的 JSON 字符串', () => {
      const json = exportToJSON(mockCards)
      const parsed = JSON.parse(json)
      expect(parsed.length).toBe(2)
      expect(parsed[0].term).toBe('机器学习')
      expect(parsed[1].term).toBe('深度学习')
    })

    it('空数组应输出 []', () => {
      expect(exportToJSON([])).toBe('[]')
    })
  })

  describe('exportToCSV', () => {
    it('应生成包含 BOM 的 CSV', () => {
      const csv = exportToCSV(mockCards)
      // 开头应为 BOM
      expect(csv.startsWith('\uFEFF')).toBe(true)
      // 应包含表头
      expect(csv).toContain('术语')
      expect(csv).toContain('个性化定义')
      // 应包含数据行
      expect(csv).toContain('机器学习')
      expect(csv).toContain('深度学习')
    })

    it('空数组应返回空字符串', () => {
      expect(exportToCSV([])).toBe('')
    })

    it('CSV 中的引号应被转义', () => {
      const cardsWithQuotes: FusionCard[] = [
        {
          ...mockCards[0],
          personalizedDefinition: '包含"引号"的文本',
          deepLogic: '',
          practicalCases: '',
          refinedBoundary: '',
        },
      ]
      const csv = exportToCSV(cardsWithQuotes)
      expect(csv).toContain('""')
    })
  })

  describe('exportToMarkdown', () => {
    it('应生成包含标题和卡片内容的 Markdown', () => {
      const md = exportToMarkdown(mockCards)
      expect(md).toContain('# 知识卡片汇总')
      expect(md).toContain('## 1. 机器学习')
      expect(md).toContain('## 2. 深度学习')
      expect(md).toContain('### 个性化定义')
      expect(md).toContain('让计算机从数据中学习')
    })

    it('应包含卡片数量和导出说明', () => {
      const md = exportToMarkdown(mockCards)
      expect(md).toContain('共 2 张卡片')
    })
  })

  describe('exportCards', () => {
    it('JSON 格式应调用 downloadFile', () => {
      // 模拟 URL.createObjectURL
      const createObjectURL = vi.fn(() => 'blob:url')
      const revokeObjectURL = vi.fn()
      window.URL.createObjectURL = createObjectURL
      window.URL.revokeObjectURL = revokeObjectURL

      exportCards(mockCards, 'json')

      expect(createObjectURL).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalled()
    })

    it('CSV 格式应调用 downloadFile', () => {
      const createObjectURL = vi.fn(() => 'blob:url')
      const revokeObjectURL = vi.fn()
      window.URL.createObjectURL = createObjectURL
      window.URL.revokeObjectURL = revokeObjectURL

      exportCards(mockCards, 'csv')

      expect(createObjectURL).toHaveBeenCalled()
    })
  })
})
