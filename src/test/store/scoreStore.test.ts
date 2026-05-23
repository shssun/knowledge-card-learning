/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useScoreStore } from '../../store/scoreStore'
import { UserLevel, ScoreHistoryEntry } from '../../types/level.types'

describe('ScoreStore', () => {
  beforeEach(() => {
    useScoreStore.setState({
      studyScore: 0,
      communityScore: 0,
      totalScore: 0,
      levelRecords: {},
      streak: 0,
      lastStudyDate: undefined,
      scoreHistory: [],
    })
  })

  describe('completeLevel', () => {
    it('应完成等级并增加积分', () => {
      useScoreStore.getState().completeLevel('card-1', '测试术语', '小白' as UserLevel, 10, '反馈')

      const state = useScoreStore.getState()
      expect(state.studyScore).toBe(10)
      expect(state.totalScore).toBe(10)
    })

    it('应记录等级完成信息', () => {
      useScoreStore.getState().completeLevel('card-1', '测试术语', '小白' as UserLevel, 10, '反馈')

      const record = useScoreStore.getState().getLevelRecord('card-1', '小白' as UserLevel)
      expect(record).toBeDefined()
      expect(record?.level).toBe('小白')
      expect(record?.score).toBe(10)
      expect(record?.completed).toBe(true)
      expect(record?.completedAt).toBeDefined()
      expect(record?.feedback).toBe('反馈')
    })

    it('不应重复加分（同一等级）', () => {
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 10)

      // 使用 mock 时间使两次调用在同一天
      useScoreStore.setState({ streak: 1, lastStudyDate: new Date().toISOString() })

      // 再次完成同一等级
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 10)

      expect(useScoreStore.getState().studyScore).toBe(10)
    })

    it('应允许完成不同等级', () => {
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 10)
      useScoreStore.getState().completeLevel('card-1', '术语', '初级' as UserLevel, 15)

      const state = useScoreStore.getState()
      expect(state.studyScore).toBe(25)
    })

    it('应累积到不同卡片', () => {
      useScoreStore.getState().completeLevel('card-1', '术语1', '小白' as UserLevel, 10)
      useScoreStore.getState().completeLevel('card-2', '术语2', '小白' as UserLevel, 8)

      const state = useScoreStore.getState()
      expect(state.studyScore).toBe(18)
    })
  })

  describe('updateStreak', () => {
    it('第一次学习应设置 streak 为 1', () => {
      useScoreStore.getState().updateStreak()

      const state = useScoreStore.getState()
      expect(state.streak).toBe(1)
      expect(state.lastStudyDate).toBeDefined()
    })

    it('同一天多次学习不应重复计数', () => {
      const today = new Date().toISOString()
      useScoreStore.setState({ streak: 1, lastStudyDate: today })

      useScoreStore.getState().updateStreak()

      expect(useScoreStore.getState().streak).toBe(1)
    })

    it('昨天学习今天继续应增加连续天数', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      useScoreStore.setState({ streak: 5, lastStudyDate: yesterday.toISOString() })

      useScoreStore.getState().updateStreak()

      expect(useScoreStore.getState().streak).toBe(6)
    })

    it('连续天数中断应重新开始', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      useScoreStore.setState({ streak: 10, lastStudyDate: twoDaysAgo.toISOString() })

      useScoreStore.getState().updateStreak()

      expect(useScoreStore.getState().streak).toBe(1)
    })
  })

  describe('getLevelRecord', () => {
    it('应获取指定卡片指定等级的记录', () => {
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 10)

      const record = useScoreStore.getState().getLevelRecord('card-1', '小白' as UserLevel)
      expect(record).toBeDefined()
      expect(record?.completed).toBe(true)
    })

    it('不存在的记录应返回 undefined', () => {
      const record = useScoreStore.getState().getLevelRecord('non-existent', '小白' as UserLevel)
      expect(record).toBeUndefined()
    })
  })

  describe('getMaxLevel', () => {
    it('应返回卡片最高完成的等级', () => {
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 10)
      useScoreStore.getState().completeLevel('card-1', '术语', '初级' as UserLevel, 15)
      useScoreStore.getState().completeLevel('card-1', '术语', '中级' as UserLevel, 20)

      const maxLevel = useScoreStore.getState().getMaxLevel('card-1')
      expect(maxLevel).toBe('中级')
    })

    it('无记录应返回 undefined', () => {
      const maxLevel = useScoreStore.getState().getMaxLevel('non-existent')
      expect(maxLevel).toBeUndefined()
    })

    it('应正确排序等级顺序', () => {
      // 只完成高级
      useScoreStore.getState().completeLevel('card-1', '术语', '高级' as UserLevel, 30)

      const maxLevel = useScoreStore.getState().getMaxLevel('card-1')
      expect(maxLevel).toBe('高级')
    })
  })

  describe('getCardTotalScore', () => {
    it('应返回卡片累计分数', () => {
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 10)
      useScoreStore.getState().completeLevel('card-1', '术语', '初级' as UserLevel, 15)
      useScoreStore.getState().completeLevel('card-1', '术语', '中级' as UserLevel, 20)

      const total = useScoreStore.getState().getCardTotalScore('card-1')
      expect(total).toBe(45)
    })

    it('无记录应返回 0', () => {
      const total = useScoreStore.getState().getCardTotalScore('non-existent')
      expect(total).toBe(0)
    })

    it('不同卡片分数应独立', () => {
      useScoreStore.getState().completeLevel('card-1', '术语1', '小白' as UserLevel, 10)
      useScoreStore.getState().completeLevel('card-2', '术语2', '小白' as UserLevel, 15)

      expect(useScoreStore.getState().getCardTotalScore('card-1')).toBe(10)
      expect(useScoreStore.getState().getCardTotalScore('card-2')).toBe(15)
    })
  })

  describe('recordScore & scoreHistory', () => {
    it('应记录评分到历史', () => {
      useScoreStore.getState().recordScore('card-1', '机器学习', 8, 'level', '小白')

      const history = useScoreStore.getState().scoreHistory
      expect(history.length).toBe(1)
      expect(history[0].term).toBe('机器学习')
      expect(history[0].score).toBe(8)
      expect(history[0].source).toBe('level')
      expect(history[0].userLevel).toBe('小白')
    })

    it('应支持 output 类型的评分记录', () => {
      useScoreStore.getState().recordScore('card-1', '深度学习', 85, 'output')

      const history = useScoreStore.getState().scoreHistory
      expect(history.length).toBe(1)
      expect(history[0].source).toBe('output')
      expect(history[0].userLevel).toBeUndefined()
    })

    it('新记录应在最前面', () => {
      useScoreStore.getState().recordScore('card-1', '术语A', 7, 'level', '小白')
      useScoreStore.getState().recordScore('card-2', '术语B', 8, 'level', '初级')

      const history = useScoreStore.getState().scoreHistory
      expect(history[0].term).toBe('术语B')
      expect(history[1].term).toBe('术语A')
    })

    it('getHistoryForTerm 应只返回指定术语的记录', () => {
      useScoreStore.getState().recordScore('card-2', '深度学习', 9, 'level', '高级')
      useScoreStore.getState().recordScore('card-1', '机器学习', 6, 'output')
      useScoreStore.getState().recordScore('card-1', '机器学习', 8, 'output')

      const termHistory = useScoreStore.getState().getHistoryForTerm('机器学习')
      expect(termHistory.length).toBe(2)
      expect(termHistory.map((h) => h.score).sort()).toEqual([6, 8])
    })

    it('getHistoryForTerm 应返回空数组（无记录时）', () => {
      const history = useScoreStore.getState().getHistoryForTerm('不存在的术语')
      expect(history).toEqual([])
    })

    it('completeLevel 应同时写入 scoreHistory', () => {
      useScoreStore.getState().completeLevel('card-1', '过拟合', '小白' as UserLevel, 8, '不错')

      const state = useScoreStore.getState()
      expect(state.studyScore).toBe(8)
      expect(state.scoreHistory.length).toBe(1)
      expect(state.scoreHistory[0].term).toBe('过拟合')
      expect(state.scoreHistory[0].source).toBe('level')
      expect(state.scoreHistory[0].score).toBe(8)
    })

    it('重复完成同一等级不应重复记录 history', () => {
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 8)
      useScoreStore.getState().completeLevel('card-1', '术语', '小白' as UserLevel, 8)

      // completeLevel 内部不重复加分，所以不会重复调用 recordScore
      expect(useScoreStore.getState().scoreHistory.length).toBe(1)
    })
  })
})
