/**
 * 个人思维积木库（PRD 模块六）类型定义
 *
 * 统一记录用户在拆解器、MECE、翻译、拆书等工具中的所有产出
 */

export type VaultEntryType = 'deconstruct' | 'mece' | 'translation' | 'book_deconstruct'

export interface VaultEntry {
  /** 唯一 ID */
  id: string
  /** 记录类型 */
  type: VaultEntryType
  /** 用户输入摘要（问题/概念名/书名） */
  input: string
  /** 展示标题 */
  title: string
  /** 创建时间 ISO */
  createdAt: string
  /** 结果摘要（用于列表预览，截取前 150 字） */
  summary: string
  /** 完整原始输出（用于详情展开） */
  fullOutput: string
}
