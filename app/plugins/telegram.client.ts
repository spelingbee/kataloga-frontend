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

      // Set up theme
      if (tg.themeParams) {
        console.log('Theme params available')
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
    } else {
      console.log('Not running in Telegram Web App environment')
    }
  } catch (error) {
    console.error('Failed to initialize Telegram Web App:', error)
  }
})
