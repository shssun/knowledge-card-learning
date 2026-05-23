import OpenAI from 'openai'
import { useTokenStore } from '../store/tokenStore'

/**
 * 从 localStorage 读取设置
 * 支持自定义 baseURL + API Key + 模型名称
 * 兼容任何 OpenAI API 格式的服务（DeepSeek、硅基流动、本地模型等）
 */
function getSettings() {
  try {
    const raw = localStorage.getItem('zhika-settings')
    if (!raw) return { apiKey: '', baseURL: '', model: '' }
    return JSON.parse(raw)
  } catch {
    return { apiKey: '', baseURL: '', model: '' }
  }
}

/**
 * 获取 OpenAI 客户端（支持自定义 baseURL）
 */
export function getOpenAIClient(): OpenAI {
  const { apiKey, baseURL } = getSettings()

  return new OpenAI({
    apiKey: apiKey || '',
    // 有自定义地址就用自定义，否则走官方
    baseURL: baseURL && baseURL.trim() ? baseURL.trim() : undefined,
    dangerouslyAllowBrowser: true,
    timeout: 60000,
  })
}

/**
 * 获取当前配置的模型名称
 * 优先级：用户自定义 > .env 环境变量 > 默认 gpt-4o-mini
 */
export function getModelName(): string {
  const { model } = getSettings()
  if (model && model.trim()) return model.trim()

  // 从 import.meta.env 读取（构建时注入）
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_OPENAI_MODEL) {
    return (import.meta as any).env.VITE_OPENAI_MODEL
  }

  return 'gpt-4o-mini'  // 默认模型
}

/**
 * 检查是否已配置 API Key
 */
export function hasApiKey(): boolean {
  const { apiKey } = getSettings()
  return Boolean(apiKey && apiKey.trim().length > 0)
}

/**
 * 发送聊天请求（支持流式 & 非流式）
 * 自动使用用户配置的模型
 */
export async function sendChatRequest(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  onChunk?: (content: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const client = getOpenAIClient()
  const model = getModelName()

  if (!hasApiKey()) {
    throw new Error('请先在设置中配置 API Key')
  }

  try {
    if (onChunk) {
      // 流式模式
      const stream = await client.chat.completions.create({
        model,
        messages,
        stream: true,
        stream_options: { include_usage: true },
      }, { signal })

      let fullContent = ''
      let finalUsage: OpenAI.Completions.CompletionUsage | null = null

      for await (const chunk of stream) {
        if (chunk.usage) {
          finalUsage = chunk.usage
          continue
        }
        const content = chunk.choices[0]?.delta?.content || ''
        fullContent += content
        onChunk(content)
      }

      if (finalUsage) {
        const date = new Date().toISOString().split('T')[0]
        useTokenStore.getState().addUsage(date, {
          promptTokens: finalUsage.prompt_tokens,
          completionTokens: finalUsage.completion_tokens,
          totalTokens: finalUsage.total_tokens,
        })
      }

      return fullContent
    } else {
      // 非流式模式
      const response = await client.chat.completions.create({
        model,
        messages,
      }, { signal })

      // 记录 token 用量
      if (response.usage) {
        const date = new Date().toISOString().split('T')[0]
        useTokenStore.getState().addUsage(date, {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        })
      }

      return response.choices[0]?.message?.content || ''
    }
  } catch (error: any) {
    // 用户主动中断
    if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('cancel')) {
      throw new Error('ABORTED')
    }

    // 错误处理
    const msg = error?.message || String(error)
    if (msg.includes('401') || msg.includes('Incorrect API key')) {
      throw new Error('API Key 无效，请检查设置中的 API Key')
    }
    if (msg.includes('429') || msg.includes('rate_limit')) {
      throw new Error('请求过于频繁，请稍后再试')
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      throw new Error('请求超时，请检查网络或增大超时时间')
    }
    if (msg.includes('model_not_found') || msg.includes('does not exist')) {
      throw new Error(`模型 "${model}" 不存在，请在设置中检查模型名称`)
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查 Base URL 和网络')
    }
    throw new Error(`AI 请求失败：${msg.slice(0, 100)}`)
  }
}

/**
 * 解析 AI 返回的 JSON（兼容 markdown 代码块）
 */
export function parseAIResponse<T>(content: string): T {
  let cleanContent = content.trim()

  // 去掉开头的 ```json 或 ```
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```json?\s*/i, '')
  }

  // 去掉结尾的 ```
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.slice(0, -3).trim()
  }

  try {
    return JSON.parse(cleanContent) as T
  } catch {
    // 尝试提取 JSON 部分
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    throw new Error('AI 返回的格式无效，请重试')
  }
}

/**
 * 带重试的 API 调用包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 2000
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 某些错误不重试
      if (
        lastError.message.includes('API Key') ||
        lastError.message.includes('401') ||
        lastError.message.includes('format') ||
        lastError.message.includes('模型')
      ) {
        throw lastError
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError || new Error('请求失败')
}
