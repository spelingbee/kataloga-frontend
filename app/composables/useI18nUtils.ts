/**
 * Composable for i18n utility functions
 * Provides helpers for formatting dates, numbers, and currency
 */
export const useI18nUtils = () => {
  const { locale, t, d, n } = useI18n()

  /**
   * Format currency with locale-specific formatting
   */
  const formatCurrency = (amount: number): string => {
    return n(amount, 'currency')
  }

  /**
   * Format number with locale-specific formatting
   */
  const formatNumber = (value: number): string => {
    return n(value, 'decimal')
  }

  /**
   * Format percentage with locale-specific formatting
   */
  const formatPercent = (value: number): string => {
    return n(value / 100, 'percent')
  }

  /**
   * Format date with short format
   */
  const formatDateShort = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return d(dateObj, 'short')
  }

  /**
   * Format date with long format
   */
  const formatDateLong = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return d(dateObj, 'long')
  }

  /**
   * Format time only
   */
  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return d(dateObj, 'time')
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return t('date.justNow')
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return t('date.minutesAgo', { count: diffInMinutes })
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return t('date.hoursAgo', { count: diffInHours })
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) {
      return t('date.yesterday')
    }

    if (diffInDays < 7) {
      return t('date.daysAgo', { count: diffInDays })
    }

    return formatDateShort(dateObj)
  }

  /**
   * Get localized phone number format
   */
  const getPhoneFormat = (): string => {
    switch (locale.value) {
      case 'ru':
      case 'ky':
        return '+996 XXX XXX XXX'
      default:
        return '+996 XXX XXX XXX'
    }
  }

  /**
   * Format phone number with locale-specific formatting
   */
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')

    // Format for Kyrgyzstan numbers
    if (cleaned.length === 12 && cleaned.startsWith('996')) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
    }

    if (cleaned.length === 9) {
      return `+996 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }

    return phone
  }

  /**
   * Get current locale code
   */
  const getCurrentLocale = (): string => {
    return locale.value
  }

  /**
   * Check if current locale is RTL
   */
  const isRTL = computed(() => {
    // Add RTL locales here if needed in the future
    return false
  })

  return {
    formatCurrency,
    formatNumber,
    formatPercent,
    formatDateShort,
    formatDateLong,
    formatTime,
    formatRelativeTime,
    getPhoneFormat,
    formatPhoneNumber,
    getCurrentLocale,
    isRTL,
  }
}
