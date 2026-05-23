import { FusionCard } from '../types/study.types'

/**
 * Export cards to JSON format
 */
export function exportToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Export cards to CSV format
 */
export function exportToCSV(cards: FusionCard[]): string {
  if (cards.length === 0) return ''
  
  const headers = [
    '术语',
    '个性化定义',
    '深层逻辑',
    '实践案例',
    '精准边界',
    '创建时间',
  ]
  
  const rows = cards.map((card) => [
    card.term,
    card.personalizedDefinition.replace(/"/g, '""'),
    card.deepLogic.replace(/"/g, '""'),
    card.practicalCases.replace(/"/g, '""'),
    card.refinedBoundary.replace(/"/g, '""'),
    new Date(card.createdAt).toLocaleDateString('zh-CN'),
  ])
  
  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')
  
  return '\uFEFF' + csvContent // BOM for UTF-8
}

/**
 * Export cards to Markdown format
 */
export function exportToMarkdown(cards: FusionCard[]): string {
  let markdown = '# 知识卡片汇总\n\n'
  markdown += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`
  markdown += `共 ${cards.length} 张卡片\n\n---\n\n`
  
  cards.forEach((card, index) => {
    markdown += `## ${index + 1}. ${card.term}\n\n`
    markdown += `### 个性化定义\n\n${card.personalizedDefinition}\n\n`
    markdown += `### 深层逻辑\n\n${card.deepLogic}\n\n`
    markdown += `### 实践案例\n\n${card.practicalCases}\n\n`
    markdown += `### 精准边界\n\n${card.refinedBoundary}\n\n`
    markdown += `> 创建时间：${new Date(card.createdAt).toLocaleString('zh-CN')}\n\n`
    markdown += `---\n\n`
  })
  
  return markdown
}

/**
 * Download content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export cards with format selection
 */
export function exportCards(
  cards: FusionCard[],
  format: 'json' | 'csv' | 'markdown'
): void {
  const timestamp = new Date().toISOString().split('T')[0]
  
  switch (format) {
    case 'json':
      downloadFile(
        exportToJSON(cards),
        `zhika-cards-${timestamp}.json`,
        'application/json'
      )
      break
    case 'csv':
      downloadFile(
        exportToCSV(cards),
        `zhika-cards-${timestamp}.csv`,
        'text/csv;charset=utf-8'
      )
      break
    case 'markdown':
      downloadFile(
        exportToMarkdown(cards),
        `zhika-cards-${timestamp}.md`,
        'text/markdown;charset=utf-8'
      )
      break
  }
}
