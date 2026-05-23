import { sendChatRequest } from './openai'
import { parseAIResponse } from './openai'

export interface ExtractedKeyword {
  term: string
  relevance: number // 1-10
}

/**
 * Extract keywords from material content using AI.
 * Returns up to maxKeywords terms.
 */
export async function extractKeywords(
  content: string,
  maxKeywords = 8
): Promise<string[]> {
  const prompt = `请从以下学习资料内容中提取最重要的关键词/核心概念。
要求：
1. 提取最能代表内容核心的术语、概念、方法论
2. 每个关键词 1-6 个中文字符为宜
3. 最多提取 ${maxKeywords} 个
4. 返回 JSON 数组格式，例如 ["关键词1", "关键词2"]

资料内容：
${content.slice(0, 4000)}`

  try {
    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])

    const result = parseAIResponse<string[]>(response)
    if (Array.isArray(result)) {
      return result.slice(0, maxKeywords).map((k) => k.trim()).filter(Boolean)
    }
    return []
  } catch {
    // fallback: simple frequency-based extraction
    return fallbackExtractKeywords(content, maxKeywords)
  }
}

/**
 * Fallback: extract keywords by simple heuristics
 */
function fallbackExtractKeywords(content: string, maxKeywords: number): string[] {
  // Remove punctuation, split into words
  const cleaned = content.replace(/[，。！？、；：""''（）《》\n\r\s]+/g, ' ')
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2 && w.length <= 8)

  // Count frequency
  const freq: Record<string, number> = {}
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1
  })

  // Sort by frequency, filter out very common words
  const stopWords = new Set(['可以', '这个', '那个', '因为', '所以', '但是', '如果', '没有', '已经', '还是', '可以', '不是', '这个', '那个'])
  const sorted = Object.entries(freq)
    .filter(([w]) => !stopWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([w]) => w)

  return sorted
}
