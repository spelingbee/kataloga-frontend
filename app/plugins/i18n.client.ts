/**
 * i18n plugin for client-side initialization
 * Handles locale detection from Telegram and browser
 */
import { isDefined, isNonEmptyString } from '~/types/utils/type-guards'

export default defineNuxtPlugin((nuxtApp) => {
  // Access i18n instance directly from nuxtApp with null safety
  const i18n = nuxtApp.$i18n as any
  
  if (!isDefined(i18n)) {
    console.warn('i18n instance not available')
    return
  }

  // Try to detect locale from Telegram if available
  if (typeof window !== 'undefined') {
    const telegramWebApp = window?.Telegram?.WebApp
    
    if (isDefined(telegramWebApp)) {
      const tgUser = telegramWebApp.initDataUnsafe?.user
      const tgLang = tgUser?.language_code

      if (isDefined(tgLang) && isNonEmptyString(tgLang)) {
        // Map Telegram language codes to our supported locales
        const langMap: Record<string, string> = {
          en: 'en',
          ru: 'ru',
          ky: 'ky',
          kg: 'ky', // Alternative code for Kyrgyz
        }

        const mappedLang = langMap[tgLang] ?? 'en'
        i18n.locale.value = mappedLang
        console.log(`Detected Telegram language: ${tgLang}, mapped to: ${mappedLang}`)
      }
    }

    // Restore locale preference from localStorage on mount
    const savedLocale = localStorage.getItem('user-locale')
    if (isDefined(savedLocale) && isNonEmptyString(savedLocale) && ['en', 'ru', 'ky'].includes(savedLocale)) {
      i18n.locale.value = savedLocale
      console.log(`Restored saved locale: ${savedLocale}`)
    }
  }

  // Store locale preference in localStorage when it changes
  watch(() => i18n.locale.value, (newLocale) => {
    if (typeof window !== 'undefined' && isDefined(newLocale)) {
      localStorage.setItem('user-locale', newLocale)
      console.log(`Saved locale preference: ${newLocale}`)
    }
  })
})
