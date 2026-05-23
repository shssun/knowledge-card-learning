import { KnowledgeCard, DiscussionMessage, FusionCard } from '../types/study.types'

/**
 * AI Prompt Templates for Knowledge Card Generation
 */

/**
 * 用户等级定义，用于控制卡片内容深度
 */
export type PromptUserLevel = '小白' | '初级' | '中级' | '高级' | '大师'

/**
 * 等级到展示字段的映射
 * 小白：只生成核心定义
 * 初级：核心定义 + 适用范围
 * 中级：+ 基础案例
 * 高级/大师：全部字段
 */
export const LEVEL_FIELD_CONFIG: Record<PromptUserLevel, string[]> = {
  小白: ['coreDefinition'],
  初级: ['coreDefinition', 'applicableScope'],
  中级: ['coreDefinition', 'applicableScope', 'basicCase'],
  高级: ['coreDefinition', 'applicableScope', 'basicCase', 'commonMisconceptions'],
  大师: ['coreDefinition', 'applicableScope', 'basicCase', 'commonMisconceptions'],
}

/**
 * 融合卡片等级字段映射
 * 小白：只展示个性化定义
 * 初级：+ 精准边界
 * 中级：+ 实践案例
 * 高级/大师：全部字段（含深层逻辑）
 */
export const FUSION_LEVEL_FIELD_CONFIG: Record<PromptUserLevel, string[]> = {
  小白: ['personalizedDefinition'],
  初级: ['personalizedDefinition', 'refinedBoundary'],
  中级: ['personalizedDefinition', 'refinedBoundary', 'practicalCases'],
  高级: ['personalizedDefinition', 'refinedBoundary', 'practicalCases', 'deepLogic'],
  大师: ['personalizedDefinition', 'refinedBoundary', 'practicalCases', 'deepLogic'],
}

/** 融合卡片字段展示标签 */
export const FUSION_FIELD_LABELS: Record<string, string> = {
  personalizedDefinition: '个性化定义',
  deepLogic: '深层逻辑',
  practicalCases: '实践案例',
  refinedBoundary: '精准边界',
}

/**
 * 生成 prompt for creating a standard knowledge card
 * @param userLevel 用户等级，控制生成内容的深度
 */
export function CARD_GENERATION_PROMPT(
  term: string,
  context: string,
  userLevel: PromptUserLevel = '中级'
): string {
  const fields = LEVEL_FIELD_CONFIG[userLevel]

  const fieldDescriptions: Record<string, string> = {
    coreDefinition: '"coreDefinition": "用1-2句话精确定义这个概念，包含其本质特征"',
    applicableScope: '"applicableScope": "详细说明这个概念在什么情况下适用，什么情况下不适用"',
    originalViewpoint: '"originalViewpoint": "从原始提出者或经典文献角度阐述这个概念"',
    basicCase: '"basicCase": "提供一个日常生活或工作中的实际案例来说明"',
    commonMisconceptions: '"commonMisconceptions": "列出2-3个常见的理解误区"',
  }

  const requiredFields = [
    '"term": "概念名称"',
    '"topic": "所属主题领域"',
    '"source": "来源说明"',
    '"domain": "知识领域"',
    ...fields.map((f) => fieldDescriptions[f]),
  ].join('\n  ')

  return `你是一位专业的知识卡片创作者。请为以下概念创建一张高质量的知识卡片。

概念名称：${term}
学习背景/上下文：${context}
目标读者等级：${userLevel}

请严格按照以下JSON格式返回，不要包含任何markdown代码块标记：

{
  ${requiredFields}
}

请严格返回合法JSON格式，不要包含任何markdown代码块标记。`
}

/**
 * Generate system prompt for discussion agent
 */
export function DISCUSSION_SYSTEM_PROMPT(card: KnowledgeCard): string {
  return `你是一位循循善诱的学习导师，擅长通过提问引导学生深入理解知识。

当前讨论的知识点：
- 概念：${card.term}
- 定义：${card.coreDefinition}
- 适用范围：${card.applicableScope}
- 常见误区：${card.commonMisconceptions}

你的职责：
1. 通过追问帮助学生深化理解
2. 引导学生举一反三
3. 帮助学生识别自己的理解盲区
4. 鼓励学生用自己语言解释概念
5. 及时纠正学生的错误理解

请用温和鼓励的语气，以问题引导为主。每次回复控制在100字以内。`
}

/**
 * Generate user message prompt for discussion continuation
 */
export function DISCUSSION_USER_PROMPT(
  card: KnowledgeCard,
  userMessage: string
): string {
  return `我在学习"${card.term}"这个概念时，有以下思考/疑问：

${userMessage}

请结合这个概念的定义（${card.coreDefinition}）和常见误区（${card.commonMisconceptions}），给我一些反馈和引导。`
}

/**
 * Generate prompt for creating a fusion card
 * @param knownTerms 同一领域已学过的词汇，用于 AI 建立关系
 */
export function FUSION_CARD_PROMPT(
  card: KnowledgeCard,
  discussion: DiscussionMessage[],
  knownTerms: string[] = []
): string {
  const discussionSummary = discussion
    .map((m) => `${m.role === 'user' ? '学生' : '导师'}: ${m.content}`)
    .join('\n')

  const knownTermsText =
    knownTerms.length > 0
      ? `\n\n已在「${card.domain}」领域学过的词汇（请参考这些词汇建立关系）：\n${knownTerms.join('、')}`
      : ''

  return `基于以下知识卡和讨论记录，请生成一张融合卡（个性化深度理解卡片）。

原始知识卡：
- 概念：${card.term}
- 定义：${card.coreDefinition}
- 适用范围：${card.applicableScope}
- 常见误区：${card.commonMisconceptions}
${knownTermsText}
讨论记录：
${discussionSummary}

请严格按照以下JSON格式返回，不要包含任何markdown代码块标记：

{
  "term": "融合后的概念名称（可以与原概念相同或略有调整）",
  "personalizedDefinition": "基于个人理解重新定义的表述",
  "deepLogic": "深入分析这个概念的底层逻辑和原理",
  "practicalCases": "结合个人经历，举出2-3个实际应用案例",
  "refinedBoundary": "更精准地界定这个概念的适用范围和边界条件",
  "relations": [
    {
      "targetTerm": "目标词汇名称（必须是上面「已学过的词汇」中的一个，如没有关系则留空数组）",
      "relationType": "包含/对比/因果/应用/进阶/基础",
      "label": "该关系的自然语言描述，如「是XX的基础」、「与XX形成对比」"
    }
  ],
  "levelContent": {
    "definition": "【小白】一句话准确定义：30字以内，精炼描述概念本质",
    "boundary": "【初级】边界和适用范围：精确定义这个概念能用在哪儿、不能用在哪儿，100字以内",
    "similarTerms": "【初级】近义词和反义词辨析：指出最容易被混淆的2-3个相近概念，并说明关键区别，100字以内",
    "examples": "【中级】组词造句：给出3个生活/工作中可以直接使用的例句，让用户知道怎么用，100字以内",
    "applicationScenario": "【中级】日常应用场景：说出2-3个这个概念在日常生活中的具体应用实例，100字以内",
    "misconceptions": "【高级】误区辨析：指出2-3个普通人最常见的理解错误，说明正确理解应该是什么，100字以内",
    "relations": "【高级】概念关联：用50字以内说明这个概念和其他相关概念之间的关系（同领域的串讲）",
    "transferTest": "【大师】举一反三：出一道测试题，给出一个新场景/新问题，让用户判断是否适用这个概念，并简要说明原因",
    "teachingOutput": "【大师】教学输出提示：要求用户「用最简单的话，把这个概念讲给完全不懂的人听」，AI据此刻意出题考验"
  }
}

请严格返回合法JSON格式，不要包含任何markdown代码块标记。`
}

/**
 * Generate prompt for scoring user's output
 */
export function SCORING_PROMPT(fusionCard: FusionCard, userOutput: string): string {
  return `请评估用户对以下知识点的理解和输出。

融合卡片内容：
- 概念：${fusionCard.term}
- 个性化定义：${fusionCard.personalizedDefinition}
- 深层逻辑：${fusionCard.deepLogic}
- 实践案例：${fusionCard.practicalCases}
- 精准边界：${fusionCard.refinedBoundary}

用户的输出：
${userOutput}

请从以下四个维度评分（每项0-100分），并给出改进建议：

{
  "definitionAccuracy": 概念准确性得分(0-100),
  "boundaryClarity": 边界清晰度得分(0-100),
  "caseCompleteness": 案例完整性得分(0-100),
  "misconceptionAwareness": 误区意识得分(0-100),
  "annotations": [
    {
      "dimension": "维度名称（概念准确性/边界清晰度/案例完整性/误区意识）",
      "issue": "用户在该维度的具体问题",
      "suggestion": "针对性的改进建议"
    }
  ]
}

请严格返回合法JSON格式，不要包含任何markdown代码块标记。`
}

/**
 * Generate prompt for extracting key terms from material
 */
export const TERM_EXTRACTION_PROMPT = (content: string): string => {
  return `请从以下文本中提取核心概念和术语列表。

文本内容：
${content}

请按以下JSON格式返回，不要包含任何markdown代码块标记：

{
  "keywords": ["术语1", "术语2", "术语3"],
  "mainTopics": ["主题1", "主题2"],
  "difficulty": "BEGINNER | INTERMEDIATE | ADVANCED"
}

请严格返回合法JSON格式，不要包含任何markdown代码块标记。`
}

/**
 * 评分 prompt：根据标准答案，评估用户输出，给出 7-8 分区间分数
 * @param level 当前等级（小白/初级/中级/高级/大师）
 * @param standardAnswer 该等级的 AI 标准答案
 * @param userAnswer 用户的回答
 */
export function LEVEL_SCORING_PROMPT(
  level: string,
  standardAnswer: string,
  userAnswer: string
): string {
  return `你是一位严格但公正的知识评估导师。用户来这是为了真学懂——实话实说，不要同情分。

标准答案：
${standardAnswer}

用户回答：
${userAnswer}

评分规则（满分 10 分，真实质量给分）：
- 10 分：表达精准、无遗漏，有超出标准答案的个人思考
- 9 分：理解完整，表达清晰，仅有个别非关键遗漏
- 7-8 分：理解基本正确，有部分遗漏或表达不够清晰
- 5-6 分：理解了大意，但关键细节有偏差或严重遗漏
- 1-4 分：答非所问，或只触及皮毛
- 0 分：不回答、空白、或明显复制标准答案

请严格返回以下 JSON 格式，不要包含任何 markdown 代码块标记：

{
  "score": 0-10之间的整数（满分10），
  "feedback": "对该用户回答的简要评价，30字以内，指出具体问题或亮点",
  "gap": "与标准答案的主要差距是什么，15字以内"
}

请严格返回合法 JSON 格式，不要包含任何 markdown 代码块标记。`
}

/**
 * Generate prompt for text simplification
 */
export const SIMPLIFICATION_PROMPT = (text: string, level: string): string => {
  return `请将以下专业文本简化解释，使其更容易理解。

原文：
${text}

目标理解水平：${level}

请用通俗易懂的语言重新解释，并给出2-3个生活化的比喻。`
}
