/**
 * i18n plugin for client-side initialization
 * Handles locale detection from Telegram and browser
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  // Use useI18n to get the current i18n instance
  const { setLocale, locale } = nuxtApp.$i18n

  const updateLocale = async (newLocale: string) => {
    if (locale.value === newLocale) return
    
    try {
      if (typeof setLocale === 'function') {
        await setLocale(newLocale)
      } else {
        locale.value = newLocale
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-locale', newLocale)
      }
    } catch (error) {
      console.error(`[i18n] Failed to set locale: ${newLocale}`, error)
    }
  }

  // Try to detect locale from Telegram if available
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    const tgLang = tg.initDataUnsafe?.user?.language_code

    if (tgLang) {
      // Map Telegram language codes to our supported locales
      const langMap: Record<string, string> = {
        en: 'en',
        ru: 'ru',
        ky: 'ky',
        kg: 'ky', // Alternative code for Kyrgyz
      }

      const mappedLang = langMap[tgLang] || 'en'
      await updateLocale(mappedLang)
    }
  }

  // Restore locale preference from localStorage on mount
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('user-locale')
    if (savedLocale && ['en', 'ru', 'ky'].includes(savedLocale)) {
      await updateLocale(savedLocale)
    }
  }

  // Store locale preference in localStorage when it changes
  watch(() => locale.value, (newLocale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-locale', newLocale)
    }
  })
})
