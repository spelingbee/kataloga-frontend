/**
 * useColorMode composable
 * Lightweight color mode management without @nuxtjs/color-mode dependency.
 * Stores preference in localStorage and applies 'dark' class to <html>.
 */
export function useColorMode() {
  const preference = useState<string>('color-mode-preference', () => 'system')
  const value = useState<string>('color-mode-value', () => 'light')

  const applyColorMode = (mode: string) => {
    if (!import.meta.client) return

    const resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode

    value.value = resolved

    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Initialize on client
  if (import.meta.client) {
    const stored = localStorage.getItem('color-mode')
    if (stored) {
      preference.value = stored
    }
    applyColorMode(preference.value)

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (preference.value === 'system') {
        applyColorMode('system')
      }
    })
  }

  // Watch for preference changes
  watch(preference, (newMode) => {
    if (import.meta.client) {
      localStorage.setItem('color-mode', newMode)
      applyColorMode(newMode)
    }
  })

  return reactive({
    get preference() { return preference.value },
    set preference(val: string) { preference.value = val },
    get value() { return value.value },
  })
}
