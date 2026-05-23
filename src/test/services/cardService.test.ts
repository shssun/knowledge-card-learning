/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCard, generateCardsBatch } from '../../services/cardService'

// Mock openai service
vi.mock('../../services/openai', () => ({
  sendChatRequest: vi.fn(),
  parseAIResponse: vi.fn(),
}))

describe('CardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateCard', () => {
    it('应成功生成卡片', async () => {
      const { parseAIResponse } = await import('../../services/openai')
      vi.mocked(parseAIResponse).mockReturnValue({
        term: '机器学习',
        topic: 'AI基础',
        source: '测试来源',
        domain: 'AI基础',
        coreDefinition: '让计算机从数据中学习',
        applicableScope: '有监督、无监督、强化学习',
        originalViewpoint: '不同于传统规则编程',
        basicCase: '推荐系统、图像识别',
        commonMisconceptions: '不是万能的',
      })

      const result = await generateCard('机器学习', 'AI学习背景', 'session-123')

      expect(result.success).toBe(true)
      expect(result.card).toBeDefined()
      expect(result.card?.term).toBe('机器学习')
      expect(result.card?.domain).toBe('AI基础')
      expect(result.card?.studySessionId).toBe('session-123')
    })

    it('API 错误时应返回失败结果', async () => {
      const { sendChatRequest } = await import('../../services/openai')
      vi.mocked(sendChatRequest).mockRejectedValue(new Error('API Error'))

      const result = await generateCard('机器学习', 'context', 'session-123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('解析失败时应返回失败结果', async () => {
      const { parseAIResponse } = await import('../../services/openai')
      vi.mocked(parseAIResponse).mockImplementation(() => {
        throw new Error('Parse Error')
      })

      const result = await generateCard('机器学习', 'context', 'session-123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('generateCardsBatch', () => {
    it('应触发进度回调', async () => {
      const { parseAIResponse } = await import('../../services/openai')
      vi.mocked(parseAIResponse).mockReturnValue({
        term: '',
        topic: 'topic',
        source: '',
        domain: 'domain',
        coreDefinition: '',
        applicableScope: '',
        originalViewpoint: '',
        basicCase: '',
        commonMisconceptions: '',
      })

      const progressCallback = vi.fn()
      const terms = ['术语1', '术语2', '术语3']

      await generateCardsBatch(terms, 'context', 'session-123', '中级', progressCallback)

      expect(progressCallback).toHaveBeenCalledTimes(3)
      expect(progressCallback).toHaveBeenCalledWith(1, 3)
      expect(progressCallback).toHaveBeenCalledWith(3, 3)
    })

    it('空数组应返回空结果', async () => {
      const results = await generateCardsBatch([], 'context', 'session-123')

      expect(results.length).toBe(0)
    })
  })
})
