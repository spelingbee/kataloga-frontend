export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (import.meta.server) return

  try {
    // Check if running in Telegram Web App with actual context
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      
      // Determine if we are actually INSIDE Telegram (initData is present)
      // or if the script is just loaded in a regular browser.
      const isActuallyTelegram = !!tg.initData
      
      if (!isActuallyTelegram) {
        console.log('Telegram script detected, but running in standard browser environment')
        return
      }

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

      // Set header color (supported in v6.1+)
      if (tg.setHeaderColor && tg.isVersionAtLeast('6.1')) {
        try {
          tg.setHeaderColor(tg.themeParams?.bg_color || '#ffffff')
        } catch (err) {
          console.log('Header color setting failed:', err)
        }
      }

      // Set background color (supported in v6.1+)
      if (tg.setBackgroundColor && tg.isVersionAtLeast('6.1')) {
        try {
          tg.setBackgroundColor(tg.themeParams?.bg_color || '#ffffff')
        } catch (err) {
          console.log('Background color setting failed:', err)
        }
      }

      // Automatically authenticate with Telegram if not already logged in
      try {
        const { useUserStore } = await import('~/stores/user')
        const authStore = useUserStore()
        
        if (!authStore.isLoggedIn) {
          console.log('User not logged in, attempting Telegram authentication...')
          const { useTelegramAuth } = await import('~/composables/useTelegramAuth')
          const { loginWithTelegram } = useTelegramAuth()
          
          const success = await loginWithTelegram()
          if (success) {
            console.log('Telegram authentication successful')
          } else {
            console.warn('Telegram authentication failed or was skipped')
          }
        } else {
          console.log('User already logged in')
        }
      } catch (authErr) {
        console.error('Error during automatic Telegram authentication:', authErr)
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

  // Apply theme colors to internal Telegram variables
  Object.entries(themeMapping).forEach(([param, cssVar]) => {
    const value = themeParams[param]
    if (value) {
      root.style.setProperty(cssVar, value)
    }
  })

  /**
   * NOTE: We previously overwrote main app variables (--bg-primary, --primary-color, etc.)
   * directly with Telegram colors. This was causing conflict with custom tenant branding.
   * 
   * We now ONLY set the --tg- variables. The application can choose to use them 
   * via CSS fallbacks if needed, but the main site branding remains authoritative.
   */

  console.log('Telegram theme variables set successfully')
}
