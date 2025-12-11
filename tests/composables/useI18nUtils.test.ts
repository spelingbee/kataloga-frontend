import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useI18nUtils } from '~/composables/useI18nUtils'

// Mock useI18n
vi.mock('#app', () => ({
  useI18n: () => ({
    locale: { value: 'en' },
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'date.justNow': 'Just now',
        'date.minutesAgo': `${params?.count} minutes ago`,
        'date.hoursAgo': `${params?.count} hours ago`,
        'date.yesterday': 'Yesterday',
        'date.daysAgo': `${params?.count} days ago`,
      }
      return translations[key] || key
    },
    d: (date: Date, format: string) => {
      if (format === 'short') return '12/25/2023'
      if (format === 'long') return 'Monday, December 25, 2023, 10:30 AM'
      if (format === 'time') return '10:30 AM'
      return date.toISOString()
    },
    n: (value: number, format: string) => {
      if (format === 'currency') return `${value.toFixed(2)} som`
      if (format === 'decimal') return value.toFixed(2)
      if (format === 'percent') return `${(value * 100).toFixed(0)}%`
      return value.toString()
    },
  }),
}))

describe('useI18nUtils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const { formatCurrency } = useI18nUtils()
      const result = formatCurrency(1000)
      expect(result).toContain('1000')
      expect(result).toContain('som')
    })

    it('should handle decimal values', () => {
      const { formatCurrency } = useI18nUtils()
      const result = formatCurrency(1234.56)
      expect(result).toContain('1234.56')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with decimals', () => {
      const { formatNumber } = useI18nUtils()
      const result = formatNumber(1234.5678)
      expect(result).toBe('1234.57')
    })
  })

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      const { formatPercent } = useI18nUtils()
      const result = formatPercent(50)
      expect(result).toContain('50')
      expect(result).toContain('%')
    })
  })

  describe('formatRelativeTime', () => {
    it('should return "Just now" for recent times', () => {
      const { formatRelativeTime } = useI18nUtils()
      const now = new Date()
      const result = formatRelativeTime(now)
      expect(result).toBe('Just now')
    })

    it('should return minutes ago for times within an hour', () => {
      const { formatRelativeTime } = useI18nUtils()
      const date = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      const result = formatRelativeTime(date)
      expect(result).toContain('minutes ago')
    })

    it('should return hours ago for times within a day', () => {
      const { formatRelativeTime } = useI18nUtils()
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      const result = formatRelativeTime(date)
      expect(result).toContain('hours ago')
    })

    it('should return "Yesterday" for yesterday', () => {
      const { formatRelativeTime } = useI18nUtils()
      const date = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      const result = formatRelativeTime(date)
      expect(result).toBe('Yesterday')
    })

    it('should return days ago for recent days', () => {
      const { formatRelativeTime } = useI18nUtils()
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      const result = formatRelativeTime(date)
      expect(result).toContain('days ago')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format Kyrgyzstan phone numbers correctly', () => {
      const { formatPhoneNumber } = useI18nUtils()
      const result = formatPhoneNumber('996555123456')
      expect(result).toBe('+996 555 123 456')
    })

    it('should format 9-digit numbers with country code', () => {
      const { formatPhoneNumber } = useI18nUtils()
      const result = formatPhoneNumber('555123456')
      expect(result).toBe('+996 555 123 456')
    })

    it('should handle already formatted numbers', () => {
      const { formatPhoneNumber } = useI18nUtils()
      const result = formatPhoneNumber('+996 555 123 456')
      expect(result).toBe('+996 555 123 456')
    })
  })

  describe('getPhoneFormat', () => {
    it('should return correct phone format', () => {
      const { getPhoneFormat } = useI18nUtils()
      const result = getPhoneFormat()
      expect(result).toBe('+996 XXX XXX XXX')
    })
  })

  describe('getCurrentLocale', () => {
    it('should return current locale', () => {
      const { getCurrentLocale } = useI18nUtils()
      const result = getCurrentLocale()
      expect(result).toBe('en')
    })
  })

  describe('isRTL', () => {
    it('should return false for LTR languages', () => {
      const { isRTL } = useI18nUtils()
      expect(isRTL.value).toBe(false)
    })
  })
})
