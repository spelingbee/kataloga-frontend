import { isDefined } from '~/types/utils/type-guards'
import type { TelegramThemeParams, TelegramWebApp } from '~/types/telegram'

export default defineNuxtPlugin({
  name: 'telegram',
  async setup() {
    let telegram: any = null

    // Only run on client side
    if (import.meta.server) {
      return {
        provide: {
          telegram
        }
      }
    }

  try {
    // Check if running in Telegram Web App with proper null safety
    const telegramWebApp = window?.Telegram?.WebApp
    
    if (typeof window !== 'undefined' && isDefined(telegramWebApp)) {
      const tg = telegramWebApp
      
      // Initialize Telegram Web App
      tg.ready()
      
      console.log('Telegram Web App initialized successfully')
      
      // Expand viewport for better UX
      try {
        tg.expand()
        console.log('Viewport expanded')
      } catch (err) {
        console.log('Viewport expansion not supported')
      }

      // Apply Telegram theme colors with null safety
      if (isDefined(tg.themeParams)) {
        console.log('Applying Telegram theme colors')
        applyTelegramTheme(tg.themeParams)
      }

      // Initialize main button if available
      if (isDefined(tg.MainButton)) {
        console.log('Main button available')
      }

      // Initialize back button if available
      if (isDefined(tg.BackButton)) {
        console.log('Back button available')
      }

      // Initialize haptic feedback if available
      if (isDefined(tg.HapticFeedback)) {
        console.log('Haptic feedback available')
      }

      // Initialize cloud storage if available
      if (isDefined(tg.CloudStorage)) {
        console.log('Cloud storage available')
      }

      // Set header color with null safety
      if (typeof tg.setHeaderColor === 'function') {
        try {
          const headerColor = tg.themeParams?.bg_color ?? '#ffffff'
          tg.setHeaderColor(headerColor)
        } catch (err) {
          console.log('Header color setting not supported')
        }
      }

      // Set background color with null safety
      if (typeof tg.setBackgroundColor === 'function') {
        try {
          const backgroundColor = tg.themeParams?.bg_color ?? '#ffffff'
          tg.setBackgroundColor(backgroundColor)
        } catch (err) {
          console.log('Background color setting not supported')
        }
      }

      // Provide Telegram WebApp instance for use in components
      telegram = tg
      return {
        provide: {
          telegram
        }
      }
    } else {
      console.log('Not running in Telegram Web App environment')
      
      // Provide null telegram instance for non-Telegram environments
      return {
        provide: {
          telegram
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize Telegram Web App:', error)
    
    // Provide null telegram instance on error
    return {
      provide: {
        telegram
      }
    }
  }
  }
})

/**
 * Apply Telegram theme colors to CSS variables
 */
function applyTelegramTheme(themeParams: TelegramThemeParams) {
  if (!isDefined(themeParams)) return

  const root = document.documentElement

  // Map Telegram theme params to CSS variables
  const themeMapping: Record<string, string> = {
    bg_color: '--tg-bg-color',
    text_color: '--tg-text-color',
    hint_color: '--tg-hint-color',
    link_color: '--tg-link-color',
    button_color: '--tg-button-color',
    button_text_color: '--tg-button-text-color',
    secondary_bg_color: '--tg-secondary-bg-color'
  }

  // Apply theme colors with null safety
  Object.entries(themeMapping).forEach(([param, cssVar]) => {
    const value = themeParams[param as keyof TelegramThemeParams]
    if (isDefined(value)) {
      root.style.setProperty(cssVar, value)
    }
  })

  // Apply theme colors to main app colors (optional override) with null safety
  if (isDefined(themeParams.bg_color)) {
    root.style.setProperty('--bg-primary', themeParams.bg_color)
  }
  if (isDefined(themeParams.secondary_bg_color)) {
    root.style.setProperty('--bg-secondary', themeParams.secondary_bg_color)
  }
  if (isDefined(themeParams.text_color)) {
    root.style.setProperty('--text-primary', themeParams.text_color)
  }
  if (isDefined(themeParams.hint_color)) {
    root.style.setProperty('--text-secondary', themeParams.hint_color)
  }
  if (isDefined(themeParams.link_color)) {
    root.style.setProperty('--primary-color', themeParams.link_color)
  }
  if (isDefined(themeParams.button_color)) {
    root.style.setProperty('--button-bg', themeParams.button_color)
  }
  if (isDefined(themeParams.button_text_color)) {
    root.style.setProperty('--button-text', themeParams.button_text_color)
  }

  console.log('Telegram theme applied successfully')
}


