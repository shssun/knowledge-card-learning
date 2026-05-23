/**
 * 万物拆解器 - API 服务
 * 使用 DeepSeek 对用户输入的任意概念/问题/事件进行逐层元概念拆解
 */
import { sendChatRequest, hasApiKey } from './openai'
import { getAllConcepts } from '../data/meta-concepts-api'

/** 拆解输出结构 */
export interface DeconstructOutput {
  /** 本源层拆解 */
  layer1_本源: string
  /** 逻辑层拆解 */
  layer2_逻辑: string
  /** 人性层拆解 */
  layer3_人性: string
  /** 社会/行动/商业层拆解 */
  layer4_社会行动商业: string
  /** 极简定论 */
  极简定论: string
}

/** 构建拆解 prompt */
async function buildDeconstructPrompt(userInput: string): Promise<string> {
  const allConcepts = await getAllConcepts()

  // 按层整理元概念清单
  const layerConcepts: Record<number, string[]> = {}
  for (const c of allConcepts) {
    if (!layerConcepts[c.layer]) layerConcepts[c.layer] = []
    layerConcepts[c.layer].push(c.term)
  }

  const conceptSummary = Object.entries(layerConcepts)
    .map(([layer, terms]) => `第${layer}层: ${terms.join('、')}`)
    .join('\n')

  return `你是一个「元概念拆解引擎」。你拥有以下 130 个底层元概念作为你的知识库（按 8 层递进）：

${conceptSummary}

---
现在用户给你一段输入，请**严格按照以下格式**逐层拆解，每一层必须引用该层的具体元概念：

## 第一层：本源层拆解
（使用第1层「宇宙本源」的概念：存在/虚无/时间/空间/运动/静止/能量/物质/因果/对立/统一/变化/恒定/整体/局部）
从最底层的本体论角度分析输入内容。

## 第二层：逻辑层拆解
（使用第2层「逻辑思维」的概念：本质/现象/主观/客观/确定/不确定/归纳/演绎/前提/结论/条件/结果/共性/差异/范围/边界/必然/偶然 等）
从思维工具和推理方法角度分析。

## 第三层：人性层拆解
（使用第3层「人性意识」的概念：需求/欲望/动机/情绪/理智/认知/偏见/恐惧/贪婪/自尊/自卑/认同/排斥/取舍/得失/共情/冷漠 等）
从人的驱动力和认知偏误角度分析。

## 第四层：社会/行动/商业层拆解
（综合使用第4-6层概念：利益/价值/信任/博弈/规则/执行/效率/风险/定价/竞争/差异化 等）
从社会关系、成事方法和商业价值角度分析。

## 极简定论
用一句话总结输入内容的本质，不超过 40 字。

---
**输入内容**：
${userInput}

**重要规则**：
1. 每一层分析必须明确引用该层的具体元概念名称（用「」标记）
2. 每层分析控制在 80-150 字
3. 极简定论不超过 40 字
4. 直接输出上述 5 段内容，不要加额外说明`
}

/** 执行拆解（流式） */
export async function deconstruct(
  input: string,
  onChunk: (text: string) => void
): Promise<string> {
  if (!hasApiKey()) {
    throw new Error('请先在设置中配置 API Key（支持 DeepSeek）')
  }

  const systemPrompt = await buildDeconstructPrompt(input)

  return sendChatRequest(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ],
    onChunk
  )
}

/** 构建书籍拆解 prompt */
async function buildBookDeconstructPrompt(bookName: string, author?: string): Promise<string> {
  const allConcepts = await getAllConcepts()

  const layerConcepts: Record<number, string[]> = {}
  for (const c of allConcepts) {
    if (!layerConcepts[c.layer]) layerConcepts[c.layer] = []
    layerConcepts[c.layer].push(c.term)
  }

  const conceptSummary = Object.entries(layerConcepts)
    .map(([layer, terms]) => `第${layer}层: ${terms.join('、')}`)
    .join('\n')

  const authorLine = author ? `，作者：${author}` : ''

  return `你是一个「书籍元概念拆解引擎」。你拥有以下 130 个底层元概念作为你的知识库（按 8 层递进）：

${conceptSummary}

---
现在请你对《${bookName}》${authorLine}进行深度拆解。请基于你对这本书的了解，**严格按照以下格式**输出：

## 书籍核心论点
用一段话概括本书的核心主张（50-80字）。

## 核心概念拆解
提炼本书 3-5 个关键概念或论点，每个概念：
- 用「」标注其涉及的底层元概念
- 说明该概念与元概念的映射关系

## 论证结构
分析本书的论证方式：
- 使用了哪些逻辑层的元概念（如归纳/演绎/因果推理）？
- 论证的前提是什么？结论是否必然来自前提？
- 论证中是否有关键假设未被质疑？

## 人性洞察
- 本书触及了哪些人性层的元概念（如需求/欲望/恐惧/贪婪/认同）？
- 这些洞察是否经得起推敲？

## 实用价值与边界
- 本书的结论在什么范围内有效？（边界）
- 哪些场景下本书的建议可能失效？
- 如果让你用对立统一思维批判这本书，它的盲点在哪里？

## 极简定论
用一句话总结本书可以被还原为哪几个元概念的组合，不超过 40 字。

---
**重要规则**：
1. 每一段必须明确引用具体的元概念名称（用「」标记）
2. 不要列清单式回答，要有分析和洞见
3. 每段控制在 100-200 字
4. 极简定论不超过 40 字
5. 直接输出上述内容，不要加额外说明`
}

/** 执行书籍拆解（流式） */
export async function deconstructBook(
  bookName: string,
  author: string | undefined,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  if (!hasApiKey()) {
    throw new Error('请先在设置中配置 API Key（支持 DeepSeek）')
  }

  const systemPrompt = await buildBookDeconstructPrompt(bookName, author)

  return sendChatRequest(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请拆解《${bookName}》${author ? `（作者：${author}）` : ''}` },
    ],
    onChunk,
    signal
  )
}

/** MECE 分析输出结构 */
export interface MECEAnalysisOutput {
  /** 问题陈述 */
  question: string
  /** 匹配的对立概念组（3-5 组） */
  pairs: MECEPair[]
  /** MECE 完整性校验 */
  validation: string
  /** 最终综合结论 */
  conclusion: string
}

export interface MECEPair {
  /** 概念 A */
  sideA: string
  /** 概念 B（对立方） */
  sideB: string
  /** A 侧分析 */
  analysisA: string
  /** B 侧分析 */
  analysisB: string
}

/** 构建 MECE 分析 prompt */
async function buildMECEPrompt(userInput: string): Promise<string> {
  const allConcepts = await getAllConcepts()

  // 只提取有对立面的概念对
  const pairs: string[] = []
  for (const c of allConcepts) {
    if (c.opposingConcept) {
      // 避免重复
      const sorted = [c.term, c.opposingConcept].sort()
      const pairKey = `${sorted[0]}↔${sorted[1]}`
      if (!pairs.includes(pairKey)) {
        pairs.push(pairKey)
      }
    }
  }

  const pairsSummary = pairs.join('\n')

  return `你是一个「MECE 对立思考训练引擎」。你的知识库包含以下全部底层对立元概念对（共 ${pairs.length} 组）：

${pairsSummary}

---
现在用户向你提出一个问题或决策场景，请**严格按照以下格式**进行 MECE 双向分析：

## 问题陈述
用一句话复述用户的问题/决策（20字以内）。

## 匹配对立概念组
从知识库中选出 3-4 组与用户问题最相关的对立元概念对。每组按以下格式：

### 概念组1：[概念A]↔[概念B]
**「[概念A]」侧分析**：从 [概念A] 视角分析用户问题的状态/影响/后果（80-120字）
**「[概念B]」侧分析**：从 [概念B] 视角分析用户问题的状态/影响/后果（80-120字）

（重复 3-4 组，从不同对立维度覆盖）

## MECE 校验
回答以下三个问题：
1. 各维度是否**相互独立**（Mutually Exclusive）？有无重叠？
2. 覆盖是否**完全穷尽**（Collectively Exhaustive）？有无遗漏的关键维度？
3. 如果不够完整，补充 1-2 个被遗漏的对立维度并简要说明。

## 综合结论
基于以上全方位的对立分析，给出一个综合性的、考虑到正反双方的结论建议（100-150字），不要偏袒任何一侧。

---
**用户输入**：
${userInput}

**重要规则**：
1. 必须使用知识库中具体的元概念对
2. 每侧分析必须指向该概念的核心含义，不是泛泛而谈
3. 校验部分必须诚实评估，如果覆盖不完整要明确指出
4. 结论部分必须综合正反双方，避免单一视角
5. 直接输出上述格式，不要加额外说明`
}

/** 执行 MECE 分析（流式） */
export async function meceAnalyze(
  input: string,
  onChunk: (text: string) => void
): Promise<string> {
  if (!hasApiKey()) {
    throw new Error('请先在设置中配置 API Key（支持 DeepSeek）')
  }

  const systemPrompt = await buildMECEPrompt(input)

  return sendChatRequest(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请对以下问题进行 MECE 对立分析：${input}` },
    ],
    onChunk
  )
}

/** 解析 MECE 分析结果 */
export function parseMECEResult(raw: string): MECEAnalysisOutput {
  const extractSection = (label: string): string => {
    const regex = new RegExp(`##\\s*${label}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, 'i')
    const m = raw.match(regex)
    return m?.[1]?.trim() || ''
  }

  // 提取概念对
  const pairRegex = /###\s*概念组\d+[：:]\s*(.+?)↔(.+?)\n\*\*「(.+?)」侧分析\*\*[：:]?\s*([\s\S]*?)(?:\n\*\*「(.+?)」侧分析\*\*[：:]?\s*([\s\S]*?))(?=\n###|\n##|$)/g
  const pairs: MECEPair[] = []
  let pm
  while ((pm = pairRegex.exec(raw)) !== null) {
    pairs.push({
      sideA: pm[1].trim(),
      sideB: pm[2].trim(),
      analysisA: pm[4].trim(),
      analysisB: pm[6].trim(),
    })
  }

  return {
    question: extractSection('问题陈述') || raw.split('\n')[2]?.replace(/^#+\s*/, '') || '',
    pairs,
    validation: extractSection('MECE\\s*校验'),
    conclusion: extractSection('综合结论'),
  }
}

/** 解析拆解结果为结构化对象 */
export function parseDeconstructResult(raw: string): DeconstructOutput {
  const extract = (label: string): string => {
    const regex = new RegExp(`##\\s*${label}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, 'i')
    const match = raw.match(regex)
    return match?.[1]?.trim() || ''
  }

  return {
    layer1_本源: extract('第一层[：:]\\s*本源层拆解'),
    layer2_逻辑: extract('第二层[：:]\\s*逻辑层拆解'),
    layer3_人性: extract('第三层[：:]\\s*人性层拆解'),
    layer4_社会行动商业: extract('第四层[：:]\\s*社会.*拆解'),
    极简定论: extract('极简定论'),
  }
}

// ==================== 概念翻译练习 ====================

/** 翻译练习输出结构 */
export interface TranslationOutput {
  /** 上层概念 */
  concept: string
  /** 元概念翻译（用底层概念解释上层概念） */
  translation: string
  /** 使用的元概念列表 */
  usedMetaConcepts: string[]
  /** 一句话总结 */
  oneLiner: string
}

/** 构建概念翻译 prompt */
async function buildTranslationPrompt(concept: string): Promise<string> {
  const allConcepts = await getAllConcepts()

  const layerConcepts: Record<number, string[]> = {}
  for (const c of allConcepts) {
    if (!layerConcepts[c.layer]) layerConcepts[c.layer] = []
    layerConcepts[c.layer].push(c.term)
  }

  const conceptSummary = Object.entries(layerConcepts)
    .map(([layer, terms]) => `第${layer}层: ${terms.join('、')}`)
    .join('\n')

  return `你是一个「概念翻译引擎」。你拥有以下 130 个底层元概念作为你的翻译词汇库（8 层递进）：

${conceptSummary}

---
现在用户想理解一个上层概念，请**只用底层元概念**来解释它。严格按以下格式输出：

## 目标概念
（重复用户输入的概念名）

## 元概念翻译
用底层元概念重新表述这个概念的本质。规则：
1. 只能使用上面列出的元概念名称（用「」标记）
2. 用因果关系、组合关系或类比关系连接这些元概念
3. 让一个不了解这个概念的人也能通过这个翻译理解它
4. 控制在 80-150 字

## 使用的元概念
列出你在翻译中使用的元概念名称，每行一个，用 - 开头。

## 一句话
用不超过 30 字的一句话总结这个概念。

---
**要翻译的概念**：
${concept}

**重要规则**：
1. **只使用给定的元概念名称**，不要引入新术语
2. 翻译要让门外汉也能理解
3. 直接输出上述格式，不要加额外说明`
}

/** 执行概念翻译（流式） */
export async function translateConcept(
  concept: string,
  onChunk: (text: string) => void
): Promise<string> {
  if (!hasApiKey()) {
    throw new Error('请先在设置中配置 API Key（支持 DeepSeek）')
  }

  const systemPrompt = await buildTranslationPrompt(concept)

  return sendChatRequest(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请翻译这个概念：${concept}` },
    ],
    onChunk
  )
}

/** 解析翻译练习结果 */
export function parseTranslationResult(raw: string): TranslationOutput {
  const extract = (label: string): string => {
    const regex = new RegExp(`##\\s*${label}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, 'i')
    const m = raw.match(regex)
    return m?.[1]?.trim() || ''
  }

  const conceptsRaw = extract('使用的元概念')
  const metaConcepts = conceptsRaw
    .split('\n')
    .map((l) => l.replace(/^-\s*/, '').trim())
    .filter(Boolean)

  return {
    concept: extract('目标概念') || '',
    translation: extract('元概念翻译') || '',
    usedMetaConcepts: metaConcepts,
    oneLiner: extract('一句话') || '',
  }
}
