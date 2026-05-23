/**
 * 经典思维模型归一拆解 - API 模块
 * 按需加载预置思维模型 JSON 数据，提供查询、搜索功能
 */

export interface MentalModelManifestEntry {
  key: string
  name: string
  category: string
  origin: string
  elevator: string
}

export interface MentalModelDeconstruction {
  coreFormula: string
  metaBreakdown: string
  strengths: string
  weaknesses: string
  boundary: string
  upgradeHints: string
}

export interface MentalModel {
  key: string
  name: string
  category: string
  origin: string
  elevator: string
  metaConceptMapping: string[]
  deconstruction: MentalModelDeconstruction
}

interface Manifest {
  name: string
  description: string
  totalModels: number
  models: MentalModelManifestEntry[]
}

let manifestCache: Manifest | null = null
const modelCache = new Map<string, MentalModel>()

async function fetchManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache
  const resp = await fetch('/mental-models/manifest.json')
  if (!resp.ok) throw new Error('思维模型清单加载失败')
  manifestCache = await resp.json()
  return manifestCache!
}

/** 获取所有模型清单 */
export async function getModels(): Promise<MentalModelManifestEntry[]> {
  const m = await fetchManifest()
  return m.models
}

/** 获取单个模型详情 */
export async function getModel(key: string): Promise<MentalModel> {
  if (modelCache.has(key)) return modelCache.get(key)!

  const resp = await fetch(`/mental-models/${key}.json`)
  if (!resp.ok) throw new Error(`模型数据加载失败: ${key}`)
  const data: MentalModel = await resp.json()
  modelCache.set(key, data)
  return data
}

/** 按分类分组 */
export async function getModelsByCategory(): Promise<Map<string, MentalModelManifestEntry[]>> {
  const models = await getModels()
  const map = new Map<string, MentalModelManifestEntry[]>()
  for (const m of models) {
    const list = map.get(m.category) || []
    list.push(m)
    map.set(m.category, list)
  }
  return map
}

/** 搜索模型 */
export async function searchModels(query: string): Promise<MentalModelManifestEntry[]> {
  const models = await getModels()
  const q = query.toLowerCase()
  return models.filter(
    (m) =>
      m.name.includes(q) ||
      m.elevator.includes(q) ||
      m.category.includes(q) ||
      m.origin.includes(q)
  )
}

/** 清空缓存 */
export function clearModelCache(): void {
  manifestCache = null
  modelCache.clear()
}
