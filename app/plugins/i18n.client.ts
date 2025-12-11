/**
 * i18n plugin for client-side initialization
 * Handles locale detection from Telegram and browser
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Access i18n instance directly from nuxtApp
  const i18n = nuxtApp.$i18n

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
      i18n.locale.value = mappedLang
    }
  }

  // Restore locale preference from localStorage on mount
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('user-locale')
    if (savedLocale && ['en', 'ru', 'ky'].includes(savedLocale)) {
      i18n.locale.value = savedLocale
    }
  }

  // Store locale preference in localStorage when it changes
  watch(() => i18n.locale.value, (newLocale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-locale', newLocale)
    }
  })
})
