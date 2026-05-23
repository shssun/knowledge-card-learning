import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import {
  GraphNode,
  GraphEdge,
  DomainGraph,
  CardRelation,
  RelationType,
} from '../types/graph.types'
import type { FusionCard } from '../types/study.types'

interface GraphState {
  graphs: Record<string, DomainGraph>

  /** 将一张融合卡片加入指定领域的图谱 */
  addCardToGraph: (domain: string, card: FusionCard, relations: CardRelation[]) => void

  /** 从归档记录重建某领域的图谱（仅建节点，边需要 AI 关系） */
  buildGraphFromArchive: (domain: string, archiveRecords: { fusionCards?: FusionCard[] }[]) => void

  /** 获取指定领域的图谱 */
  getGraph: (domain: string) => DomainGraph | undefined

  /** 获取所有图谱中已知的词汇列表（用于 AI 生成关系时参考） */
  getKnownTerms: (domain: string) => string[]

  /** 删除某张卡片对应的节点及关联边（按 term 匹配） */
  removeCardFromGraph: (domain: string, term: string) => void
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      graphs: {},

      addCardToGraph: (domain, card, relations) => {
        set((state) => {
          const existing = state.graphs[domain] || {
            domain,
            nodes: [],
            edges: [],
            updatedAt: new Date().toISOString(),
          }

          // 去重：按 term 判断
          if (existing.nodes.some((n) => n.term === card.term)) {
            return state
          }

          const newNode: GraphNode = {
            id: uuidv4(),
            term: card.term,
            cardId: (card as any).id || '',
            domain,
          }
          const updatedNodes = [...existing.nodes, newNode]

          const updatedEdges = [...existing.edges]
          for (const rel of relations) {
            const targetExists = updatedNodes.some((n) => n.term === rel.targetTerm)
            if (targetExists) {
              const exists = updatedEdges.some(
                (e) =>
                  e.sourceTerm === card.term &&
                  e.targetTerm === rel.targetTerm
              )
              if (!exists) {
                updatedEdges.push({
                  id: uuidv4(),
                  sourceTerm: card.term,
                  targetTerm: rel.targetTerm,
                  relationType: rel.relationType as RelationType,
                  label: rel.label,
                })
              }
            }
          }

          return {
            graphs: {
              ...state.graphs,
              [domain]: {
                ...existing,
                nodes: updatedNodes,
                edges: updatedEdges,
                updatedAt: new Date().toISOString(),
              },
            },
          }
        })
      },

      buildGraphFromArchive: (domain, archiveRecords) => {
        set((state) => {
          const nodes: GraphNode[] = []
          const seen = new Set<string>()

          for (const record of archiveRecords) {
            if (!record.fusionCards) continue
            for (const card of record.fusionCards) {
              if (seen.has(card.term)) continue
              seen.add(card.term)
              nodes.push({
                id: uuidv4(),
                term: card.term,
                cardId: card.id || '',
                domain,
              })
            }
          }

          return {
            graphs: {
              ...state.graphs,
              [domain]: {
                domain,
                nodes,
                edges: [],
                updatedAt: new Date().toISOString(),
              },
            },
          }
        })
      },

      getGraph: (domain) => {
        return get().graphs[domain]
      },

      getKnownTerms: (domain) => {
        const graph = get().graphs[domain]
        if (!graph) return []
        return graph.nodes.map((n) => n.term)
      },

      removeCardFromGraph: (domain, term) => {
        set((state) => {
          const existing = state.graphs[domain]
          if (!existing) return state

          return {
            graphs: {
              ...state.graphs,
              [domain]: {
                ...existing,
                nodes: existing.nodes.filter((n) => n.term !== term),
                edges: existing.edges.filter(
                  (e) => e.sourceTerm !== term && e.targetTerm !== term
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          }
        })
      },
    }),
    {
      name: 'zhika-graph-store',
    }
  )
)
