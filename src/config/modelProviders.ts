/**
 * 内置 AI 模型厂家预设配置
 * 支持：预设选中后自动填充 Base URL + 默认模型
 * 填入 API Key 后可自动获取模型列表
 */
export interface ModelProvider {
  id: string
  name: string
  nameEn: string
  baseURL: string
  /** 调用 /models 接口时用的 header */
  authHeader?: string
  /** 有些厂家的 models 端点不在 baseURL 下 */
  modelsEndpoint?: string
  defaultModels: string[]
  /** 在模型列表中显示的名称映射 */
  modelAliases?: Record<string, string>
  website: string
  websiteLabel: string
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek 深度求索',
    nameEn: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    defaultModels: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat'],
    website: 'https://platform.deepseek.com',
    websiteLabel: 'platform.deepseek.com',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    nameEn: 'Zhipu',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModels: ['glm-4-flash', 'glm-4-plus', 'glm-z1-flash'],
    website: 'https://open.bigmodel.cn',
    websiteLabel: 'open.bigmodel.cn',
  },
  {
    id: 'minimax',
    name: 'MiniMax 海螺',
    nameEn: 'MiniMax',
    baseURL: 'https://api.minimax.chat/v',
    defaultModels: ['MiniMax-Text-01', 'abab6.5s-chat'],
    website: 'https://platform.minimax.chat',
    websiteLabel: 'platform.minimax.chat',
  },
  {
    id: 'siliconflow',
    name: '硅基流动 SiliconFlow',
    nameEn: 'SiliconFlow',
    baseURL: 'https://api.siliconflow.cn/v1',
    defaultModels: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
    website: 'https://siliconflow.cn',
    websiteLabel: 'siliconflow.cn',
  },
  {
    id: 'ollama',
    name: 'Ollama 本地模型',
    nameEn: 'Ollama',
    baseURL: 'http://localhost:11434/v1',
    defaultModels: ['llama3', 'qwen2.5', 'deepseek-r1'],
    website: 'https://ollama.com',
    websiteLabel: 'ollama.com',
  },
  {
    id: 'openai',
    name: 'OpenAI 官方',
    nameEn: 'OpenAI',
    baseURL: '',
    defaultModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    website: 'https://platform.openai.com',
    websiteLabel: 'platform.openai.com',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    nameEn: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    defaultModels: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
    website: 'https://console.anthropic.com',
    websiteLabel: 'console.anthropic.com',
  },
  {
    id: 'custom',
    name: '自定义（手动填写）',
    nameEn: 'Custom',
    baseURL: '',
    defaultModels: [],
    website: '',
    websiteLabel: '',
  },
]

/**
 * 从 provider 获取可用模型列表
 * 各厂家的 /models 接口格式略有不同，统一适配
 */
export async function fetchModelList(
  baseURL: string,
  apiKey: string,
  providerId: string
): Promise<{ id: string; displayName: string }[]> {
  const cleanBase = baseURL.replace(/\/$/, '')
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  // 有些厂家需要在 header 中特殊处理
  if (providerId === 'anthropic') {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
  }

  try {
    const response = await fetch(`${cleanBase}/models`, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    // OpenAI 格式：{ data: [{ id: "gpt-4o-mini", ... }] }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((m: any) => ({
        id: m.id,
        displayName: m.id,
      }))
    }

    // 智谱格式：{ data: [{ id: "glm-4-flash", ... }] }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((m: any) => ({
        id: m.id,
        displayName: m.id,
      }))
    }

    // 通用格式：直接是数组
    if (Array.isArray(data)) {
      return data.map((m: any) => ({
        id: typeof m === 'string' ? m : m.id || m.model || String(m),
        displayName: typeof m === 'string' ? m : m.id || m.model || String(m),
      }))
    }

    return []
  } catch (err) {
    console.warn('[fetchModelList] failed:', err)
    return []
  }
}
