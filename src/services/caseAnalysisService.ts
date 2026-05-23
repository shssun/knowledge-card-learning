/**
 * 案例分析 AI 服务
 * 基于用户已掌握的思维模型，对真实场景进行分层分析
 */
import { sendChatRequest } from './openai'
import type { CaseAnalysisRequest, CaseAnalysisResult, LearnedConcept } from '../types/caseAnalysis.types'

/**
 * 构建案例分析的系统提示词
 */
function buildSystemPrompt(): string {
  return `你是一个「多元思维模型」分析助手。

你的任务是：
1. 接收用户已掌握的思维模型（包含定义、边界、易混淆概念等）
2. 接收一个真实场景/案例
3. 基于已有模型，输出「你能想到的分析」（完整、深入）
4. 指出案例中超出已有模型解释范围的部分，标记为 [LOCKED:概念名称]（不透露内容，只给名称和简短理由）
5. 最终给出「综合视角」的完整分析

输出格式：
## 你能想到的
（基于已有模型的完整分析，每个模型单独应用，说明如何在案例中使用）

## 你可能没想到的
[LOCKED:概念A] — 理由：案例中存在XX现象，超出了你当前模型的解释范围
[LOCKED:概念B] — 理由：...

## 综合评估
（结合所有视角的完整分析，既有模型的纵深应用，也补充被锁模型的洞察方向）

重要原则：
- 「你能想到的」只使用用户提供内容的模型，不要自行添加未提供的模型
- [LOCKED] 标签里的概念必须是用户未提供但案例中确实相关的
- 分析要具体，不要泛泛而谈，结合案例的细节展开`
}

/**
 * 构建用户消息（包含模型信息 + 案例内容）
 */
function buildUserMessage(request: CaseAnalysisRequest): string {
  const { caseContent, learnedConcepts } = request

  // 构建已有模型信息（最多10个，控制token）
  const conceptInfo = learnedConcepts.slice(0, 10).map((c) => {
    const lines = [
      `【${c.term}${c.english ? ` (${c.english})` : ''}】`,
      `  最高等级：${c.maxLevel}`,
    ]
    if (c.levelContent?.boundary) {
      lines.push(`  边界/适用范围：${c.levelContent.boundary}`)
    }
    if (c.levelContent?.misconceptions) {
      lines.push(`  常见误区：${c.levelContent.misconceptions}`)
    }
    if (c.levelContent?.similarTerms) {
      lines.push(`  易混淆概念：${c.levelContent.similarTerms}`)
    }
    return lines.join('\n')
  })

  return `## 用户已掌握的思维模型（共${learnedConcepts.length}个）
${conceptInfo.join('\n\n')}

## 待分析的案例
${caseContent}`
}

/**
 * 解析 AI 返回结果，提取各部分内容
 */
function parseAnalysisResult(rawOutput: string): {
  ownedAnalysis: string
  lockedConcepts: Array<{ term: string; reason: string }>
  fullAnalysis: string
} {
  const ownedSection = extractSection(rawOutput, '你能想到的')
  const lockedSection = extractSection(rawOutput, '你可能没想到的')
  const fullSection = extractSection(rawOutput, '综合评估')

  // 解析 LOCKED 标签
  const lockedRegex = /\[LOCKED:([^\]]+)\]\s*—?\s*理由：([^\n]+)/g
  const lockedConcepts: Array<{ term: string; reason: string }> = []
  let match
  while ((match = lockedRegex.exec(lockedSection || rawOutput)) !== null) {
    lockedConcepts.push({ term: match[1].trim(), reason: match[2].trim() })
  }

  // 如果LOCKED解析为空，尝试从整段文字中找
  if (lockedConcepts.length === 0) {
    const fallbackRegex = /[LOCKED|LOCKED概念|概念锁定][:：]\s*([^\n。]+[^\n]*)/g
    while ((match = fallbackRegex.exec(lockedSection || rawOutput)) !== null) {
      const term = match[1].replace(/[【】\[\]]/g, '').trim()
      if (term && !lockedConcepts.some((l) => l.term === term)) {
        lockedConcepts.push({ term, reason: '案例中相关的概念，建议解锁学习' })
      }
    }
  }

  return {
    ownedAnalysis: ownedSection || extractBeforeLocked(rawOutput),
    lockedConcepts,
    fullAnalysis: fullSection || ownedSection || rawOutput,
  }
}

/**
 * 提取指定标题下的内容
 */
function extractSection(text: string, sectionTitle: string): string {
  const lines = text.split('\n')
  const startIndex = lines.findIndex((l) =>
    l.includes(sectionTitle) || l.includes(sectionTitle.replace('##', '').trim())
  )
  if (startIndex === -1) return ''

  const contentLines: string[] = []
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    // 遇到下一个 ## 标题停止
    if (line.trim().startsWith('## ')) break
    contentLines.push(line)
  }
  return contentLines.join('\n').trim()
}

/**
 * 如果没找到「你能想到的」章节，尝试提取LOCKED之前的部分
 */
function extractBeforeLocked(text: string): string {
  const lockedIndex = text.indexOf('[LOCKED')
  if (lockedIndex === -1) return text
  return text.slice(0, lockedIndex).trim()
}

/**
 * 核心函数：分析案例
 */
export async function analyzeCase(
  request: CaseAnalysisRequest,
  onChunk?: (text: string) => void
): Promise<CaseAnalysisResult> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt() },
    { role: 'user' as const, content: buildUserMessage(request) },
  ]

  const rawOutput = await sendChatRequest(messages, onChunk)
  const { ownedAnalysis, lockedConcepts, fullAnalysis } = parseAnalysisResult(rawOutput)

  return {
    ownedAnalysis,
    hiddenConcepts: lockedConcepts.map((l) => l.term),
    rawOutput,
    recommendedConcepts: lockedConcepts,
    usedConcepts: request.learnedConcepts.slice(0, 10).map((c) => c.term),
  }
}

/**
 * 获取用户已点亮概念的详细信息
 * 从归档记录和预设数据中合并
 */
export function getLearnedConceptDetails(
  learnedTerms: string[],
  archiveCards: Array<{ term: string; levelContent?: LearnedConcept['levelContent'] }>
): LearnedConcept[] {
  return learnedTerms.map((term) => {
    const archiveCard = archiveCards.find(
      (c) => c.term === term && c.levelContent
    )
    return {
      term,
      maxLevel: '初级', // 从 scoreStore 获取更准确，这里做简化
      levelRecords: {},
      levelContent: archiveCard?.levelContent,
    }
  })
}
