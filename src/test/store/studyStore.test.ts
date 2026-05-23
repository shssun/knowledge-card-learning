/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useStudyStore } from '../../store/studyStore'
import { StudyStep, SessionStatus } from '../../types/study.types'

describe('StudyStore', () => {
  beforeEach(() => {
    // 重置 store
    useStudyStore.setState({
      sessions: [],
      currentSessionId: null,
    })
  })

  describe('createSession', () => {
    it('应创建一个新的学习会话', () => {
      const sessionId = useStudyStore.getState().createSession('test-material', ['term1', 'term2'])

      expect(sessionId).toBeDefined()
      expect(typeof sessionId).toBe('string')

      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session).toBeDefined()
      expect(session?.materialId).toBe('test-material')
      expect(session?.selectedTerms).toEqual(['term1', 'term2'])
      expect(session?.status).toBe(SessionStatus.ACTIVE)
    })

    it('应设置新会话为当前会话', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      expect(useStudyStore.getState().currentSessionId).toBe(sessionId)
    })

    it('应支持 focused 模式', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'], 'focused')
      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session?.entryMode).toBe('focused')
    })

    it('应支持 full 模式（默认）', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session?.entryMode).toBe('full')
    })
  })

  describe('getCurrentSession', () => {
    it('应返回当前会话', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      const currentSession = useStudyStore.getState().getCurrentSession()
      expect(currentSession?.id).toBe(sessionId)
    })

    it('无当前会话时应返回 undefined', () => {
      useStudyStore.setState({ currentSessionId: null })
      expect(useStudyStore.getState().getCurrentSession()).toBeUndefined()
    })
  })

  describe('updateSession', () => {
    it('应更新会话信息', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      useStudyStore.getState().updateSession(sessionId, {
        selectedTerms: ['term1', 'term2', 'term3'],
      })

      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session?.selectedTerms).toEqual(['term1', 'term2', 'term3'])
    })

    it('不应影响其他会话', () => {
      const sessionId1 = useStudyStore.getState().createSession('material-1', ['term1'])
      const sessionId2 = useStudyStore.getState().createSession('material-2', ['term2'])

      useStudyStore.getState().updateSession(sessionId1, { materialId: 'updated-material' })

      const session2 = useStudyStore.getState().getSessionById(sessionId2)
      expect(session2?.materialId).toBe('material-2')
    })
  })

  describe('setCurrentStep', () => {
    it('应更新当前步骤', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      useStudyStore.getState().setCurrentStep(sessionId, StudyStep.GENERATE_CARD)

      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session?.currentStep).toBe(StudyStep.GENERATE_CARD)
    })

    it('应支持所有步骤', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      const steps = [
        StudyStep.SELECT_CONTENT,
        StudyStep.GENERATE_CARD,
        StudyStep.DISCUSSION,
        StudyStep.FUSION_CARD,
        StudyStep.OUTPUT_SCORE,
      ]

      steps.forEach((step) => {
        useStudyStore.getState().setCurrentStep(sessionId, step)
        const session = useStudyStore.getState().getSessionById(sessionId)
        expect(session?.currentStep).toBe(step)
      })
    })
  })

  describe('completeSession', () => {
    it('应将会话标记为完成', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      useStudyStore.getState().completeSession(sessionId)

      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session?.status).toBe(SessionStatus.COMPLETED)
      expect(session?.completedAt).toBeDefined()
    })

    it('完成后应清除当前会话', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      useStudyStore.getState().completeSession(sessionId)
      expect(useStudyStore.getState().currentSessionId).toBeNull()
    })
  })

  describe('addGeneratedCard', () => {
    it('应添加生成的卡片', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      const card = {
        term: '测试术语',
        domain: 'AI基础',
        difficulty: 'medium' as const,
        definition: '测试定义',
        userInput: {},
      }

      useStudyStore.getState().addGeneratedCard(sessionId, card)

      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session?.generatedCards.length).toBe(1)
      expect(session?.generatedCards[0].term).toBe('测试术语')
    })
  })

  describe('addFusionCard', () => {
    it('应添加融合卡片', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      const fusionCard = {
        term: '融合术语',
        domain: 'AI基础',
        sourceCards: [],
        levelContent: {},
      }

      useStudyStore.getState().addFusionCard(sessionId, fusionCard)

      const session = useStudyStore.getState().getSessionById(sessionId)
      expect(session?.fusionCards.length).toBe(1)
      expect(session?.fusionCards[0].term).toBe('融合术语')
    })
  })

  describe('deleteSession', () => {
    it('应删除指定会话', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      useStudyStore.getState().deleteSession(sessionId)

      expect(useStudyStore.getState().getSessionById(sessionId)).toBeUndefined()
    })

    it('应更新当前会话ID（如果删除的是当前会话）', () => {
      const sessionId = useStudyStore.getState().createSession('material-1', ['term1'])
      useStudyStore.getState().deleteSession(sessionId)

      expect(useStudyStore.getState().currentSessionId).toBeNull()
    })
  })

  describe('会话列表操作', () => {
    it('应维护多个会话', () => {
      const sessionId1 = useStudyStore.getState().createSession('material-1', ['term1'])
      const sessionId2 = useStudyStore.getState().createSession('material-2', ['term2'])
      const sessionId3 = useStudyStore.getState().createSession('material-3', ['term3'])

      const sessions = useStudyStore.getState().sessions
      expect(sessions.length).toBe(3)
      expect(sessions.map(s => s.id)).toContain(sessionId1)
      expect(sessions.map(s => s.id)).toContain(sessionId2)
      expect(sessions.map(s => s.id)).toContain(sessionId3)
    })

    it('最新会话应排在最前', () => {
      useStudyStore.getState().createSession('material-1', ['term1'])
      useStudyStore.getState().createSession('material-2', ['term2'])

      const sessions = useStudyStore.getState().sessions
      expect(sessions[0].materialId).toBe('material-2')
      expect(sessions[1].materialId).toBe('material-1')
    })
  })
})
