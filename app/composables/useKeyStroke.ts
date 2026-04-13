import { onMounted, onUnmounted } from 'vue'

/**
 * Composable for handling keyboard events
 */
export function useKeyStroke(key: string, callback: (event: KeyboardEvent) => void) {
  const handleKeyStroke = (event: KeyboardEvent) => {
    if (event.key === key || event.code === key) {
      callback(event)
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyStroke)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyStroke)
  })

  return {
    handleKeyStroke
  }
}

// Global function for template usage
export const onKeyStroke = useKeyStroke
