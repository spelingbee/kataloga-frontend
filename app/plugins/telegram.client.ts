export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (import.meta.server) return

  try {
    // Check if running in Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      
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

      // Apply Telegram theme colors
      if (tg.themeParams) {
        console.log('Applying Telegram theme colors')
        applyTelegramTheme(tg.themeParams)
      }

      // Initialize main button if available
      if (tg.MainButton) {
        console.log('Main button available')
      }

      // Initialize back button if available
      if (tg.BackButton) {
        console.log('Back button available')
      }

      // Initialize haptic feedback if available
      if (tg.HapticFeedback) {
        console.log('Haptic feedback available')
      }

      // Initialize cloud storage if available
      if (tg.CloudStorage) {
        console.log('Cloud storage available')
      }

      // Set header color
      if (tg.setHeaderColor) {
        try {
          tg.setHeaderColor(tg.themeParams?.bg_color || '#ffffff')
        } catch (err) {
          console.log('Header color setting not supported')
        }
      }

      // Set background color
      if (tg.setBackgroundColor) {
        try {
          tg.setBackgroundColor(tg.themeParams?.bg_color || '#ffffff')
        } catch (err) {
          console.log('Background color setting not supported')
        }
      }
    } else {
      console.log('Not running in Telegram Web App environment')
    }
  } catch (error) {
    console.error('Failed to initialize Telegram Web App:', error)
  }
})

/**
 * Apply Telegram theme colors to CSS variables
 */
function applyTelegramTheme(themeParams: any) {
  if (!themeParams) return

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

  // Apply theme colors
  Object.entries(themeMapping).forEach(([param, cssVar]) => {
    const value = themeParams[param]
    if (value) {
      root.style.setProperty(cssVar, value)
    }
  })

  // Apply theme colors to main app colors (optional override)
  if (themeParams.bg_color) {
    root.style.setProperty('--bg-primary', themeParams.bg_color)
  }
  if (themeParams.secondary_bg_color) {
    root.style.setProperty('--bg-secondary', themeParams.secondary_bg_color)
  }
  if (themeParams.text_color) {
    root.style.setProperty('--text-primary', themeParams.text_color)
  }
  if (themeParams.hint_color) {
    root.style.setProperty('--text-secondary', themeParams.hint_color)
  }
  if (themeParams.link_color) {
    root.style.setProperty('--primary-color', themeParams.link_color)
  }
  if (themeParams.button_color) {
    root.style.setProperty('--button-bg', themeParams.button_color)
  }
  if (themeParams.button_text_color) {
    root.style.setProperty('--button-text', themeParams.button_text_color)
  }

  console.log('Telegram theme applied successfully')
}
