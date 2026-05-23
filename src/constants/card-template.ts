import { MaterialCategory, DifficultyLevel, BankType, WordEntry } from '../types/material.types'

/**
 * Built-in card templates for quick start
 */

export interface CardTemplate {
  id: string
  name: string
  description: string
  category: MaterialCategory
  words: Omit<WordEntry, 'id'>[]
}

export const CARD_TEMPLATES: CardTemplate[] = [
  // AI基础模板
  {
    id: 'template-ai-basics',
    name: 'AI基础',
    description: '机器学习、神经网络、大语言模型等AI核心概念，适合零基础入门',
    category: MaterialCategory.FREE_RESEARCH,
    words: [
      { term: '机器学习', definition: '让计算机从数据中自动学习规律并做出预测或决策，无需人工编写所有规则。', difficulty: DifficultyLevel.ADVANCED, domain: 'AI基础' },
      { term: '神经网络', definition: '一种模仿人脑神经元连接方式的计算模型，通过多层神经元的协作来学习数据中的复杂模式。', difficulty: DifficultyLevel.INTERMEDIATE, domain: 'AI基础' },
      { term: '大语言模型', definition: '在海量文本数据上训练、拥有数十亿到数万亿参数的语言模型，能够理解、生成、翻译人类语言。', difficulty: DifficultyLevel.ADVANCED, domain: 'AI基础' },
      { term: 'Prompt工程', definition: '通过精心设计输入给大语言模型的提示词，来引导模型输出更准确、更符合预期结果的技术和方法论。', difficulty: DifficultyLevel.BEGINNER, domain: 'AI基础' },
      { term: 'RAG', definition: '在让大语言模型生成回答之前，先从外部知识库中检索相关信息，再把检索到的内容交给模型生成答案。', difficulty: DifficultyLevel.INTERMEDIATE, domain: 'AI基础' },
      { term: 'Token', definition: '大语言模型处理文本时的最小单位，可能是一个单词、一个子词、或一个字符。', difficulty: DifficultyLevel.BEGINNER, domain: 'AI基础' },
      { term: 'Embedding', definition: '把文字转换成的一串数字向量，使得语义相近的文字在向量空间里距离也更近。', difficulty: DifficultyLevel.INTERMEDIATE, domain: 'AI基础' },
      { term: '幻觉', definition: 'AI幻觉指大语言模型生成看似合理但实际不正确、不存在或自相矛盾的内容的现象。', difficulty: DifficultyLevel.BEGINNER, domain: 'AI基础' },
      { term: 'Fine-tuning', definition: '在一个已经预训练好的大语言模型基础上，用特定领域或任务的数据继续训练，使模型更擅长该领域或任务。', difficulty: DifficultyLevel.INTERMEDIATE, domain: 'AI基础' },
      { term: 'Agent', definition: '能够自主理解任务、制定计划、调用工具、多步执行，并最终完成复杂目标的AI系统。', difficulty: DifficultyLevel.BEGINNER, domain: 'AI基础' },
    ],
  },
  // Product Management Template
  {
    id: 'template-product-management',
    name: '产品经理基础',
    description: '涵盖需求分析、产品设计、项目管理等产品管理核心概念',
    category: MaterialCategory.FREE_RESEARCH,
    words: [
      { term: '用户故事', definition: '以用户视角描述功能需求的简短叙述，包含角色、功能和价值', difficulty: DifficultyLevel.BEGINNER, domain: '产品管理' },
      { term: 'MVP', definition: 'Minimum Viable Product，最小可行产品，用最少资源验证核心假设', difficulty: DifficultyLevel.BEGINNER, domain: '产品开发' },
      { term: 'PRD', definition: 'Product Requirement Document，详细描述产品需求和规格的文档', difficulty: DifficultyLevel.BEGINNER, domain: '产品管理' },
      { term: 'Kano模型', definition: '将产品功能分为基本型、期望型和兴奋型的需求分类模型', difficulty: DifficultyLevel.INTERMEDIATE, domain: '需求分析' },
      { term: '用户旅程图', definition: '可视化用户与产品交互全过程的图形化工具', difficulty: DifficultyLevel.INTERMEDIATE, domain: '用户体验' },
      { term: 'A/B测试', definition: '对比两个版本效果的数据驱动决策方法', difficulty: DifficultyLevel.BEGINNER, domain: '数据分析' },
      { term: '产品路线图', definition: '展示产品长期发展方向和里程碑计划的时间线', difficulty: DifficultyLevel.INTERMEDIATE, domain: '产品规划' },
      { term: '数据埋点', definition: '在产品中植入代码以收集用户行为数据的技术手段', difficulty: DifficultyLevel.INTERMEDIATE, domain: '数据分析' },
      { term: '敏捷开发', definition: '强调迭代、协作、快速交付的软件开发方法论', difficulty: DifficultyLevel.INTERMEDIATE, domain: '项目管理' },
      { term: 'Sprint冲刺', definition: '敏捷开发中的固定时间迭代周期，通常1-4周', difficulty: DifficultyLevel.BEGINNER, domain: '项目管理' },
    ],
  },
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: MaterialCategory): CardTemplate[] {
  return CARD_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Difficulty level labels
 */
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.BEGINNER]: '入门',
  [DifficultyLevel.INTERMEDIATE]: '进阶',
  [DifficultyLevel.ADVANCED]: '高级',
}

/**
 * Category labels
 */
export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  [MaterialCategory.SCHOOL_SUBJECT]: '学科课程',
  [MaterialCategory.INDUSTRY_TRACK]: '行业赛道',
  [MaterialCategory.FREE_RESEARCH]: '自由研究',
}
