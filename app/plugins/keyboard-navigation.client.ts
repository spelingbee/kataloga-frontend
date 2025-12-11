/**
 * Keyboard navigation plugin
 * Detects keyboard usage and adds appropriate classes for focus indicators
 */

export default defineNuxtPlugin(() => {
  if (process.client) {
    let isUsingKeyboard = false

    // Detect keyboard usage
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isUsingKeyboard = true
        document.body.classList.add('keyboard-navigation-active')
      }
    }

    // Detect mouse usage
    const handleMouseDown = () => {
      isUsingKeyboard = false
      document.body.classList.remove('keyboard-navigation-active')
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    // Cleanup on unmount
    return {
      provide: {
        isUsingKeyboard: () => isUsingKeyboard,
      },
    }
  }
})
