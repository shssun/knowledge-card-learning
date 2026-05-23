/**
 * 元概念 JSON 按需加载 API
 *
 * 替代原有的 meta-concepts.ts 全量 import（155KB → 按层 fetch，每次约 40-60KB）
 *
 * 数据存放：public/meta-concepts/layer-{1..8}.json
 * 清单文件：public/meta-concepts/manifest.json
 */

/** 元概念卡片字段 */
export interface MetaConceptCard {
  term: string
  layer: number
  layerName: string
  opposingConcept?: string
  levelContent: {
    definition: string
    boundary: string
    similarTerms: string
    examples: string
    applicationScenario: string
    misconceptions: string
    relations: string
    transferTest: string
    teachingOutput: string
  }
}

/** Manifest 结构 */
export interface MetaManifest {
  total: number
  layers: Record<number, string>
  layerConcepts: Record<number, string[]>
}

// ────── 缓存 & 内部状态 ──────

/** 已加载的层：layer → concept map */
let layerCache = new Map<number, Record<string, MetaConceptCard>>()

/** manifest 缓存 */
let manifestCache: MetaManifest | null = null

// ────── 公开 API ──────

/** 获取 manifest（概念清单，极轻量，~1KB） */
export async function fetchManifest(): Promise<MetaManifest> {
  if (manifestCache) return manifestCache
  const res = await fetch('/meta-concepts/manifest.json')
  manifestCache = await res.json()
  return manifestCache!
}

/** 按层加载概念（首次 fetch JSON，之后走内存缓存） */
export async function fetchLayer(layer: number): Promise<Record<string, MetaConceptCard>> {
  if (layerCache.has(layer)) return layerCache.get(layer)!

  const res = await fetch(`/meta-concepts/layer-${layer}.json`)
  const data: Record<string, MetaConceptCard> = await res.json()
  layerCache.set(layer, data)
  return data
}

/** 按 key 查询单个概念（会遍历缓存或 fetch） */
export async function fetchConcept(key: string): Promise<MetaConceptCard | null> {
  // 先查缓存
  for (const [, concepts] of layerCache) {
    if (concepts[key]) return concepts[key]
  }

  // 未命中：用 manifest 确定所属层
  const manifest = await fetchManifest()
  const layerStr = Object.entries(manifest.layerConcepts).find(([, keys]) =>
    keys.includes(key)
  )?.[0]

  if (!layerStr) return null

  const layer = parseInt(layerStr)
  const concepts = await fetchLayer(layer)
  return concepts[key] ?? null
}

/** 获取所有概念 key 列表（从 manifest，不 fetch JSON） */
export async function getAllKeys(): Promise<string[]> {
  const manifest = await fetchManifest()
  return Object.values(manifest.layerConcepts).flat()
}

/** 获取每层的概念 key 列表（从 manifest，不 fetch JSON） */
export async function getLayerKeys(layer: number): Promise<string[]> {
  const manifest = await fetchManifest()
  return manifest.layerConcepts[layer] ?? []
}

/** 获取层的概念数量（从 manifest） */
export async function getLayerCount(layer: number): Promise<number> {
  const keys = await getLayerKeys(layer)
  return keys.length
}

/** 清空缓存（用于刷新） */
export function clearCache(): void {
  layerCache.clear()
  manifestCache = null
}

/** 获取全部 130 个概念（按需加载所有层，用于拆解器等需要全量上下文的场景） */
export async function getAllConcepts(): Promise<MetaConceptCard[]> {
  const manifest = await fetchManifest()
  const all: MetaConceptCard[] = []

  for (const layerStr of Object.keys(manifest.layerConcepts)) {
    const layer = parseInt(layerStr)
    const concepts = await fetchLayer(layer)
    for (const c of Object.values(concepts)) {
      all.push(c)
    }
  }

  return all
}
