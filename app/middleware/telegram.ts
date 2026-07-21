export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) return

  const { isTelegram, user, expandViewport } = useTelegram()

  // If running in Telegram, apply Telegram-specific logic
  if (isTelegram.value) {
    // Expand viewport for better UX
    expandViewport()

    // Set up theme based on Telegram theme
    const { theme } = useTelegram()
    if (theme.value) {
      // Apply Telegram theme to CSS variables
      const root = document.documentElement
      root.style.setProperty('--tg-bg-color', theme.value.bgColor)
      root.style.setProperty('--tg-text-color', theme.value.textColor)
      root.style.setProperty('--tg-hint-color', theme.value.hintColor)
      root.style.setProperty('--tg-link-color', theme.value.linkColor)
      root.style.setProperty('--tg-button-color', theme.value.buttonColor)
      root.style.setProperty('--tg-button-text-color', theme.value.buttonTextColor)
      root.style.setProperty('--tg-secondary-bg-color', theme.value.secondaryBgColor)
    }

    // Initialize user data if available
    // Note: userStore.initializeFromTelegram() was referenced here but does not exist.
    // Telegram user bootstrap/auth is handled elsewhere (e.g. plugins/telegram.client.ts + user store).

    // Handle specific routes in Telegram context
    if (to.path === '/') {
      // On main page, ensure proper Telegram setup
      console.log('Telegram user on main page:', user.value)
    }

  }
})
