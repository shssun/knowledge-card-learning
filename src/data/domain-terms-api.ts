/**
 * 领域术语 API 模块
 *
 * 从 public/domain-terms/ 目录按需加载领域术语 JSON 数据。
 * 含内存缓存层，避免重复 fetch。
 * 仅供中级及以上用户访问。
 */


/** 领域术语的完整数据结构 */
export interface DomainTerm {
  term: string
  domain: string
  domainName: string
  difficulty: string
  definition: string
  /** 映射到的元概念列表（用于展示底层关联） */
  metaConceptMappings: string[]
  /** 对立术语 */
  opposingTerm?: string
  /** 五级学习内容 */
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

/** manifest 中的领域定义 */
export interface DomainManifestEntry {
  name: string
  description: string
  termCount: number
}

/** manifest 结构 */
export interface DomainManifest {
  totalTerms: number
  domains: Record<string, DomainManifestEntry>
  domainTerms: Record<string, string[]>
}

// ── 缓存 ──
let manifestCache: DomainManifest | null = null
const termCache = new Map<string, Record<string, DomainTerm>>()

const BASE = '/domain-terms'

/** 加载 manifest.json */
async function fetchManifest(): Promise<DomainManifest> {
  if (manifestCache) return manifestCache
  const res = await fetch(`${BASE}/manifest.json`)
  if (!res.ok) throw new Error(`Failed to load domain-terms manifest: ${res.status}`)
  manifestCache = await res.json()
  return manifestCache!
}

/** 加载某个领域的全部术语 */
async function fetchDomainTerms(domainKey: string): Promise<Record<string, DomainTerm>> {
  if (termCache.has(domainKey)) return termCache.get(domainKey)!
  const res = await fetch(`${BASE}/${domainKey}.json`)
  if (!res.ok) throw new Error(`Failed to load domain terms: ${domainKey} (${res.status})`)
  const data: Record<string, DomainTerm> = await res.json()
  termCache.set(domainKey, data)
  return data
}

/** 获取所有领域列表 */
export async function getDomains(): Promise<Array<{ key: string } & DomainManifestEntry>> {
  const manifest = await fetchManifest()
  return Object.entries(manifest.domains).map(([key, entry]) => ({ key, ...entry }))
}

/** 获取某个领域的全部术语列表 */
export async function getTermsByDomain(domainKey: string): Promise<DomainTerm[]> {
  const data = await fetchDomainTerms(domainKey)
  return Object.values(data)
}

/** 获取单个术语 */
export async function getTerm(
  domainKey: string,
  termName: string
): Promise<DomainTerm | null> {
  const data = await fetchDomainTerms(domainKey)
  return data[termName] || null
}

/** 搜索术语（在所有已加载领域中模糊匹配） */
export async function searchTerms(query: string): Promise<DomainTerm[]> {
  const manifest = await fetchManifest()
  const results: DomainTerm[] = []
  const lower = query.toLowerCase()

  for (const domainKey of Object.keys(manifest.domainTerms)) {
    const terms = await fetchDomainTerms(domainKey)
    for (const term of Object.values(terms)) {
      if (
        term.term.toLowerCase().includes(lower) ||
        term.definition.toLowerCase().includes(lower)
      ) {
        results.push(term)
      }
    }
  }

  return results
}

/** 通过元概念名查找关联的领域术语 */
export async function getTermsByMetaConcept(conceptName: string): Promise<DomainTerm[]> {
  const manifest = await fetchManifest()
  const results: DomainTerm[] = []

  for (const domainKey of Object.keys(manifest.domainTerms)) {
    const terms = await fetchDomainTerms(domainKey)
    for (const term of Object.values(terms)) {
      if (term.metaConceptMappings.includes(conceptName)) {
        results.push(term)
      }
    }
  }

  return results
}

/** 清空缓存 */
export function clearDomainCache(): void {
  manifestCache = null
  termCache.clear()
}
