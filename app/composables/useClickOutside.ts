import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Composable for detecting clicks outside of an element
 */
export function useClickOutside(
  elementRef: Ref<HTMLElement | null> | Ref<boolean>,
  callback: () => void
) {
  const handleClickOutside = (event: MouseEvent) => {
    // If elementRef is a boolean ref (like showDropdown)
    if (typeof elementRef.value === 'boolean') {
      if (elementRef.value) {
        callback()
      }
      return
    }

    // If elementRef is an element ref
    const element = elementRef.value as HTMLElement | null
    if (element && !element.contains(event.target as Node)) {
      callback()
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return {
    handleClickOutside
  }
}

// Global function for template usage
export const onClickOutside = useClickOutside
