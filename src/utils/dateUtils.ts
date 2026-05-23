/**
 * Format date to Chinese locale string
 */
export function formatDate(date: string | Date, format?: 'full' | 'date' | 'time'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'time') {
    return d.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  if (format === 'date') {
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get relative time string (e.g., "3天前", "刚刚")
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.getTime() < new Date().getTime()
}

/**
 * Get days between two dates
 */
export function getDaysBetween(start: string | Date, end: string | Date): number {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = typeof end === 'string' ? new Date(end) : end
  const diff = e.getTime() - s.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Add days to a date
 */
export function addDays(date: string | Date, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime())
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Get start of day
 */
export function getStartOfDay(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 */
export function getEndOfDay(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  }
  return `${seconds}秒`
}
