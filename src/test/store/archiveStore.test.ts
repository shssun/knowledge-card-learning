/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useArchiveStore } from '../../store/archiveStore'
import { ArchiveRecord, FusionCard } from '../../types/archive.types'

describe('ArchiveStore', () => {
  beforeEach(() => {
    useArchiveStore.setState({
      records: [],
      stats: {
        totalTermsLearned: 0,
        averageMasteryScore: 0,
        weakDomains: [],
        totalStudySessions: 0,
        domainScoreMap: {},
      },
    })
  })

  describe('addRecord', () => {
    it('应添加归档记录', () => {
      const record: Omit<ArchiveRecord, 'id'> = {
        title: 'AI基础研习',
        materialId: 'bank-ai-basics',
        domain: 'AI基础',
        terms: ['机器学习', '深度学习', '神经网络'],
        averageScore: 85,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      }

      useArchiveStore.getState().addRecord(record)

      const records = useArchiveStore.getState().records
      expect(records.length).toBe(1)
      expect(records[0].title).toBe('AI基础研习')
      expect(records[0].id).toBeDefined()
    })

    it('应自动重新计算统计数据', () => {
      const record: Omit<ArchiveRecord, 'id'> = {
        title: '测试记录',
        materialId: 'test',
        domain: '测试领域',
        terms: ['术语1', '术语2'],
        averageScore: 80,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      }

      useArchiveStore.getState().addRecord(record)

      const stats = useArchiveStore.getState().stats
      expect(stats.totalTermsLearned).toBe(2)
      expect(stats.totalStudySessions).toBe(1)
      expect(stats.domainScoreMap['测试领域']).toBe(80)
    })
  })

  describe('updateRecord', () => {
    it('应更新归档记录', () => {
      const record: Omit<ArchiveRecord, 'id'> = {
        title: '原始标题',
        materialId: 'test',
        domain: '测试',
        terms: ['术语1'],
        averageScore: 70,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      }

      useArchiveStore.getState().addRecord(record)
      const recordId = useArchiveStore.getState().records[0].id

      useArchiveStore.getState().updateRecord(recordId, {
        title: '更新后的标题',
        averageScore: 90,
      })

      const updatedRecord = useArchiveStore.getState().getRecordById(recordId)
      expect(updatedRecord?.title).toBe('更新后的标题')
      expect(updatedRecord?.averageScore).toBe(90)
    })
  })

  describe('deleteRecord', () => {
    it('应删除指定记录', () => {
      const record: Omit<ArchiveRecord, 'id'> = {
        title: '待删除记录',
        materialId: 'test',
        domain: '测试',
        terms: ['术语1'],
        averageScore: 75,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      }

      useArchiveStore.getState().addRecord(record)
      const recordId = useArchiveStore.getState().records[0].id

      useArchiveStore.getState().deleteRecord(recordId)

      expect(useArchiveStore.getState().getRecordById(recordId)).toBeUndefined()
      expect(useArchiveStore.getState().records.length).toBe(0)
    })

    it('删除后应重新计算统计数据', () => {
      useArchiveStore.getState().addRecord({
        title: '记录1',
        materialId: 'test',
        domain: '领域1',
        terms: ['术语1'],
        averageScore: 60,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      useArchiveStore.getState().addRecord({
        title: '记录2',
        materialId: 'test',
        domain: '领域2',
        terms: ['术语2'],
        averageScore: 80,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      const recordId = useArchiveStore.getState().records[0].id
      useArchiveStore.getState().deleteRecord(recordId)

      const stats = useArchiveStore.getState().stats
      expect(stats.totalStudySessions).toBe(1)
      expect(stats.totalTermsLearned).toBe(1)
    })
  })

  describe('getRecordsByDomain', () => {
    it('应按领域筛选记录', () => {
      useArchiveStore.getState().addRecord({
        title: 'AI记录1',
        materialId: 'test',
        domain: 'AI基础',
        terms: ['术语1'],
        averageScore: 80,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      useArchiveStore.getState().addRecord({
        title: 'AI记录2',
        materialId: 'test',
        domain: 'AI基础',
        terms: ['术语2'],
        averageScore: 85,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      useArchiveStore.getState().addRecord({
        title: '产品记录',
        materialId: 'test',
        domain: '产品经理',
        terms: ['术语3'],
        averageScore: 75,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      const aiRecords = useArchiveStore.getState().getRecordsByDomain('AI基础')
      expect(aiRecords.length).toBe(2)
      expect(aiRecords.every(r => r.domain === 'AI基础')).toBe(true)

      const pmRecords = useArchiveStore.getState().getRecordsByDomain('产品经理')
      expect(pmRecords.length).toBe(1)
    })
  })

  describe('recalculateStats', () => {
    it('应正确计算平均分', () => {
      useArchiveStore.getState().addRecord({
        title: '记录1',
        materialId: 'test',
        domain: '测试',
        terms: ['术语1'],
        averageScore: 60,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      useArchiveStore.getState().addRecord({
        title: '记录2',
        materialId: 'test',
        domain: '测试',
        terms: ['术语2'],
        averageScore: 80,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      const stats = useArchiveStore.getState().stats
      expect(stats.averageMasteryScore).toBe(70)
    })

    it('应识别薄弱领域（分数<70）', () => {
      useArchiveStore.getState().addRecord({
        title: '强项记录',
        materialId: 'test',
        domain: '强项',
        terms: ['术语1'],
        averageScore: 85,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      useArchiveStore.getState().addRecord({
        title: '弱项记录',
        materialId: 'test',
        domain: '弱项',
        terms: ['术语2'],
        averageScore: 55,
        fusionCards: [],
        studiedAt: new Date().toISOString(),
      })

      const stats = useArchiveStore.getState().stats
      expect(stats.weakDomains).toContain('弱项')
      expect(stats.weakDomains).not.toContain('强项')
    })

    it('空记录时应重置统计数据', () => {
      useArchiveStore.getState().recalculateStats()

      const stats = useArchiveStore.getState().stats
      expect(stats.totalTermsLearned).toBe(0)
      expect(stats.averageMasteryScore).toBe(0)
      expect(stats.weakDomains).toEqual([])
    })
  })
})
