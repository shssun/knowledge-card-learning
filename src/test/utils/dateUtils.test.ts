/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  formatDate,
  getRelativeTime,
  isToday,
  isPast,
  getDaysBetween,
  addDays,
  getStartOfDay,
  getEndOfDay,
  formatDuration,
} from '../../utils/dateUtils'

describe('日期工具函数', () => {
  describe('formatDate', () => {
    it('应正确格式化日期时间', () => {
      const date = '2026-05-18T10:30:00.000Z'
      const formatted = formatDate(date)

      expect(formatted).toContain('2026')
      expect(formatted).toContain('05')
      expect(formatted).toContain('18')
    })

    it('应支持 date 格式', () => {
      const date = '2026-05-18T10:30:00.000Z'
      const formatted = formatDate(date, 'date')

      expect(formatted).toContain('2026')
      expect(formatted).toContain('05')
      expect(formatted).toContain('18')
    })

    it('应支持 time 格式', () => {
      const date = new Date('2026-05-18T10:30:00.000Z')
      const formatted = formatDate(date, 'time')

      // 不应包含日期部分
      expect(formatted).not.toContain('2026')
    })

    it('应接受 Date 对象', () => {
      const dateObj = new Date('2026-05-18T10:30:00.000Z')
      const formatted = formatDate(dateObj)

      expect(formatted).toContain('2026')
    })
  })

  describe('getRelativeTime', () => {
    it('60秒内应显示"刚刚"', () => {
      const now = new Date()
      expect(getRelativeTime(now)).toBe('刚刚')
    })

    it('60秒内（秒级）应显示分钟前', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(getRelativeTime(fiveMinutesAgo)).toContain('分钟前')
    })

    it('1小时内应显示小时前', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(getRelativeTime(twoHoursAgo)).toContain('小时前')
    })

    it('7天内应显示天前', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(getRelativeTime(threeDaysAgo)).toContain('天前')
    })

    it('30天内应显示周前', () => {
      const twoWeeksAgo = new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000)
      expect(getRelativeTime(twoWeeksAgo)).toContain('周前')
    })

    it('365天内应显示月前', () => {
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      expect(getRelativeTime(threeMonthsAgo)).toContain('个月前')
    })

    it('超过1年应显示年前', () => {
      const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
      expect(getRelativeTime(twoYearsAgo)).toContain('年前')
    })
  })

  describe('isToday', () => {
    it('今天应返回 true', () => {
      const today = new Date()
      expect(isToday(today)).toBe(true)
    })

    it('昨天应返回 false', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isToday(yesterday)).toBe(false)
    })

    it('明天应返回 false', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isToday(tomorrow)).toBe(false)
    })

    it('应接受字符串日期', () => {
      const todayStr = new Date().toISOString()
      expect(isToday(todayStr)).toBe(true)
    })
  })

  describe('isPast', () => {
    it('过去日期应返回 true', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isPast(pastDate)).toBe(true)
    })

    it('未来日期应返回 false', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      expect(isPast(futureDate)).toBe(false)
    })

    it('当前日期应返回 false', () => {
      const now = new Date()
      expect(isPast(now)).toBe(false)
    })
  })

  describe('getDaysBetween', () => {
    it('同一天应返回 0', () => {
      const sameDay = new Date()
      expect(getDaysBetween(sameDay, sameDay)).toBe(0)
    })

    it('相隔1天应返回 1', () => {
      const day1 = new Date('2026-05-01')
      const day2 = new Date('2026-05-02')
      expect(getDaysBetween(day1, day2)).toBe(1)
    })

    it('相隔7天应返回 7', () => {
      const day1 = new Date('2026-05-01')
      const day2 = new Date('2026-05-08')
      expect(getDaysBetween(day1, day2)).toBe(7)
    })

    it('应接受字符串日期', () => {
      expect(getDaysBetween('2026-05-01', '2026-05-08')).toBe(7)
    })

    it('倒序应返回负数', () => {
      expect(getDaysBetween('2026-05-08', '2026-05-01')).toBe(-7)
    })
  })

  describe('addDays', () => {
    it('应正确添加天数', () => {
      const date = new Date('2026-05-18')
      const result = addDays(date, 5)

      expect(result.getDate()).toBe(23)
    })

    it('添加0天应保持不变', () => {
      const date = new Date('2026-05-18')
      const result = addDays(date, 0)

      expect(result.getDate()).toBe(18)
    })

    it('添加负数应减少天数', () => {
      const date = new Date('2026-05-18')
      const result = addDays(date, -5)

      expect(result.getDate()).toBe(13)
    })

    it('不应修改原日期', () => {
      const date = new Date('2026-05-18')
      const originalDate = date.getDate()
      addDays(date, 5)

      expect(date.getDate()).toBe(originalDate)
    })

    it('应接受字符串日期', () => {
      const result = addDays('2026-05-18', 5)
      expect(result.getDate()).toBe(23)
    })
  })

  describe('getStartOfDay', () => {
    it('应设置时间为 00:00:00', () => {
      const date = new Date('2026-05-18T15:30:45.123')
      const startOfDay = getStartOfDay(date)

      expect(startOfDay.getHours()).toBe(0)
      expect(startOfDay.getMinutes()).toBe(0)
      expect(startOfDay.getSeconds()).toBe(0)
      expect(startOfDay.getMilliseconds()).toBe(0)
    })

    it('应保留日期', () => {
      const date = new Date('2026-05-18T15:30:00')
      const startOfDay = getStartOfDay(date)

      expect(startOfDay.getDate()).toBe(18)
      expect(startOfDay.getMonth()).toBe(4) // 5月是索引4
    })
  })

  describe('getEndOfDay', () => {
    it('应设置时间为 23:59:59:999', () => {
      const date = new Date('2026-05-18T10:30:00.000')
      const endOfDay = getEndOfDay(date)

      expect(endOfDay.getHours()).toBe(23)
      expect(endOfDay.getMinutes()).toBe(59)
      expect(endOfDay.getSeconds()).toBe(59)
      expect(endOfDay.getMilliseconds()).toBe(999)
    })

    it('应保留日期', () => {
      const date = new Date('2026-05-18T10:30:00')
      const endOfDay = getEndOfDay(date)

      expect(endOfDay.getDate()).toBe(18)
      expect(endOfDay.getMonth()).toBe(4)
    })
  })

  describe('formatDuration', () => {
    it('应格式化秒', () => {
      expect(formatDuration(30000)).toContain('秒')
    })

    it('应格式化分钟', () => {
      const result = formatDuration(60000) // 1分钟
      expect(result).toContain('分钟')
      expect(result).toContain('1')
    })

    it('应格式化小时', () => {
      const result = formatDuration(3600000) // 1小时
      expect(result).toContain('小时')
      expect(result).toContain('1')
    })

    it('应包含分钟余数（超过1小时）', () => {
      const result = formatDuration(5400000) // 1小时30分钟
      expect(result).toContain('小时')
      expect(result).toContain('30')
    })

    it('应包含秒余数（超过1分钟）', () => {
      const result = formatDuration(90000) // 1分30秒
      expect(result).toContain('分钟')
      expect(result).toContain('30')
    })
  })
})
