/**
 * 知识图谱类型定义
 * 领域内词汇之间的关联关系图
 */

export type RelationType =
  | '包含'
  | '对比'
  | '因果'
  | '应用'
  | '进阶'
  | '基础'

export interface GraphNode {
  id: string
  term: string
  cardId: string
  domain: string
}

export interface GraphEdge {
  id: string
  sourceTerm: string
  targetTerm: string
  relationType: RelationType
  label: string
}

export interface DomainGraph {
  domain: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  updatedAt: string
}

/** AI 返回的原始关系数据 */
export interface CardRelation {
  targetTerm: string
  relationType: string
  label: string
}
