/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '../../store/graphStore'
import { RelationType } from '../../types/graph.types'
import type { FusionCard } from '../../types/study.types'

describe('GraphStore', () => {
  beforeEach(() => {
    useGraphStore.setState({ graphs: {} })
  })

  const mockCard = (term: string, domain: string = 'AI基础'): FusionCard => ({
    id: `card-${term}`,
    baseCardId: 'base-1',
    term,
    personalizedDefinition: `这是关于${term}的个人定义`,
    deepLogic: '',
    practicalCases: '',
    refinedBoundary: '',
    discussionSnapshot: [],
    createdAt: new Date().toISOString(),
  })

  describe('addCardToGraph', () => {
    it('应添加节点到指定领域', () => {
      const card = mockCard('机器学习')
      useGraphStore.getState().addCardToGraph('AI基础', card, [])

      const graph = useGraphStore.getState().getGraph('AI基础')
      expect(graph).toBeDefined()
      expect(graph?.nodes.length).toBe(1)
      expect(graph?.nodes[0].term).toBe('机器学习')
      expect(graph?.nodes[0].domain).toBe('AI基础')
    })

    it('多次添加相同术语不应重复节点', () => {
      const card1 = mockCard('机器学习')
      const card2 = mockCard('机器学习')
      useGraphStore.getState().addCardToGraph('AI基础', card1, [])
      useGraphStore.getState().addCardToGraph('AI基础', card2, [])

      const graph = useGraphStore.getState().getGraph('AI基础')
      expect(graph?.nodes.length).toBe(1)
    })

    it('不同领域的图谱应隔离', () => {
      useGraphStore.getState().addCardToGraph('AI基础', mockCard('机器学习'), [])
      useGraphStore.getState().addCardToGraph('经济学', mockCard('机会成本'), [])

      const aiGraph = useGraphStore.getState().getGraph('AI基础')
      const ecoGraph = useGraphStore.getState().getGraph('经济学')
      expect(aiGraph?.nodes.length).toBe(1)
      expect(ecoGraph?.nodes.length).toBe(1)
      expect(aiGraph?.nodes[0].term).toBe('机器学习')
      expect(ecoGraph?.nodes[0].term).toBe('机会成本')
    })

    it('应添加关系边', () => {
      const card1 = mockCard('监督学习')
      const card2 = mockCard('机器学习')
      useGraphStore.getState().addCardToGraph('AI基础', card1, [])
      useGraphStore.getState().addCardToGraph('AI基础', card2, [
        { targetTerm: '机器学习', relationType: '基础' as RelationType, label: '监督学习是机器学习的基础' },
      ])

      const graph = useGraphStore.getState().getGraph('AI基础')
      expect(graph?.edges.length).toBe(1)
      expect(graph?.edges[0].relationType).toBe('基础')
    })

    it('应支持所有关系类型', () => {
      const types: RelationType[] = ['包含', '对比', '因果', '应用', '进阶', '基础']
      // 先添加目标节点
      const targetTerms = ['目标0', '目标1', '目标2', '目标3', '目标4', '目标5']
      targetTerms.forEach((t) => {
        useGraphStore.getState().addCardToGraph('AI基础', mockCard(t), [])
      })
      // 添加带关系的卡片
      const card = mockCard('测试术语')
      useGraphStore.getState().addCardToGraph('AI基础', card, [
        ...types.map((t, i) => ({
          targetTerm: `目标${i}`,
          relationType: t as RelationType,
          label: `${t}关系`,
        })),
      ])

      const graph = useGraphStore.getState().getGraph('AI基础')
      expect(graph?.edges.length).toBe(6)
    })
  })

  describe('removeCardFromGraph', () => {
    it('应删除指定术语的节点和关联边', () => {
      const card1 = mockCard('A')
      const card2 = mockCard('B')
      useGraphStore.getState().addCardToGraph('AI基础', card1, [])
      useGraphStore.getState().addCardToGraph('AI基础', card2, [
        { targetTerm: 'A', relationType: '包含' as RelationType, label: '包含关系' },
      ])

      useGraphStore.getState().removeCardFromGraph('AI基础', 'A')

      const graph = useGraphStore.getState().getGraph('AI基础')
      expect(graph?.nodes.length).toBe(1)
      expect(graph?.nodes[0].term).toBe('B')
      expect(graph?.edges.length).toBe(0)
    })
  })

  describe('getKnownTerms', () => {
    it('应返回指定领域的所有术语', () => {
      useGraphStore.getState().addCardToGraph('AI基础', mockCard('机器学习'), [])
      useGraphStore.getState().addCardToGraph('AI基础', mockCard('深度学习'), [])

      const terms = useGraphStore.getState().getKnownTerms('AI基础')
      expect(terms).toContain('机器学习')
      expect(terms).toContain('深度学习')
      expect(terms.length).toBe(2)
    })

    it('不存在的领域应返回空数组', () => {
      const terms = useGraphStore.getState().getKnownTerms('不存在的领域')
      expect(terms).toEqual([])
    })
  })

  describe('buildGraphFromArchive', () => {
    it('应从归档记录重建图谱节点', () => {
      const archiveRecords = [
        { fusionCards: [mockCard('机器学习'), mockCard('深度学习')] },
        { fusionCards: [mockCard('监督学习')] },
      ]

      useGraphStore.getState().buildGraphFromArchive('AI基础', archiveRecords)

      const graph = useGraphStore.getState().getGraph('AI基础')
      expect(graph?.nodes.length).toBe(3)
      const terms = graph?.nodes.map((n) => n.term) || []
      expect(terms).toContain('机器学习')
      expect(terms).toContain('深度学习')
      expect(terms).toContain('监督学习')
    })
  })
})
