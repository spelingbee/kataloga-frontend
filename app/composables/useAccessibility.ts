/**
 * Enhanced accessibility composable for WCAG 2.1 Level AA compliance
 * Manages keyboard navigation, focus management, ARIA attributes, and screen reader support
 */

import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | null
  returnFocus?: boolean
  escapeDeactivates?: boolean
}

export interface KeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: (event: KeyboardEvent) => void
  onHome?: () => void
  onEnd?: () => void
}

export interface AccessibilityAnnouncement {
  message: string
  priority: 'polite' | 'assertive'
  delay?: number
}

/**
 * Main accessibility composable with enhanced features
 */
export function useAccessibility() {
  const isKeyboardUser = ref(false)
  const announcements = ref<AccessibilityAnnouncement[]>([])

  // Detect keyboard usage for enhanced focus indicators
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      isKeyboardUser.value = true
      document.body.classList.add('keyboard-navigation-active')
    }
  }

  const handleMouseDown = () => {
    isKeyboardUser.value = false
    document.body.classList.remove('keyboard-navigation-active')
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('mousedown', handleMouseDown)
  })

  /**
   * Announce message to screen readers with enhanced options
   */
  const announceMessage = (
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    delay: number = 0
  ) => {
    const announcement: AccessibilityAnnouncement = { message, priority, delay }
    announcements.value.push(announcement)

    setTimeout(() => {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      liveRegion.textContent = message
      
      document.body.appendChild(liveRegion)
      
      // Remove after announcement
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion)
        }
      }, 1000)
    }, delay)
  }

  /**
   * Announce form validation errors
   */
  const announceFormError = (fieldName: string, error: string) => {
    announceMessage(`${fieldName}: ${error}`, 'assertive')
  }

  /**
   * Announce successful actions
   */
  const announceSuccess = (message: string) => {
    announceMessage(message, 'polite', 100)
  }

  /**
   * Announce loading states
   */
  const announceLoading = (message: string = 'Loading') => {
    announceMessage(message, 'polite')
  }

  return {
    isKeyboardUser: computed(() => isKeyboardUser.value),
    announceMessage,
    announceFormError,
    announceSuccess,
    announceLoading,
  }
}

/**
 * Enhanced focus trap composable with better accessibility
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>, options: FocusTrapOptions = {}) {
  const previouslyFocusedElement = ref<HTMLElement | null>(null)
  const isActive = ref(false)
  const sentinelStart = ref<HTMLElement | null>(null)
  const sentinelEnd = ref<HTMLElement | null>(null)

  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.value) return []
    
    const focusableSelectors = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]:not([tabindex="-1"])',
      'audio[controls]:not([tabindex="-1"])',
      'video[controls]:not([tabindex="-1"])',
      'iframe:not([tabindex="-1"])',
      'object:not([tabindex="-1"])',
      'embed:not([tabindex="-1"])',
    ].join(', ')
    
    return Array.from(containerRef.value.querySelectorAll(focusableSelectors))
      .filter((el) => {
        const element = el as HTMLElement
        return element.offsetWidth > 0 && element.offsetHeight > 0 && !element.hidden
      }) as HTMLElement[]
  }

  const createSentinels = () => {
    if (!containerRef.value) return

    // Create start sentinel
    sentinelStart.value = document.createElement('div')
    sentinelStart.value.setAttribute('tabindex', '0')
    sentinelStart.value.className = 'sr-only'
    sentinelStart.value.setAttribute('aria-hidden', 'true')
    
    // Create end sentinel
    sentinelEnd.value = document.createElement('div')
    sentinelEnd.value.setAttribute('tabindex', '0')
    sentinelEnd.value.className = 'sr-only'
    sentinelEnd.value.setAttribute('aria-hidden', 'true')

    // Insert sentinels
    containerRef.value.insertBefore(sentinelStart.value, containerRef.value.firstChild)
    containerRef.value.appendChild(sentinelEnd.value)

    // Handle sentinel focus
    sentinelStart.value.addEventListener('focus', () => {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus()
      }
    })

    sentinelEnd.value.addEventListener('focus', () => {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    })
  }

  const removeSentinels = () => {
    if (sentinelStart.value && sentinelStart.value.parentNode) {
      sentinelStart.value.parentNode.removeChild(sentinelStart.value)
    }
    if (sentinelEnd.value && sentinelEnd.value.parentNode) {
      sentinelEnd.value.parentNode.removeChild(sentinelEnd.value)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive.value) return

    if (event.key === 'Escape' && options.escapeDeactivates !== false) {
      event.preventDefault()
      deactivate()
    }
  }

  const activate = () => {
    if (isActive.value) return
    
    // Store currently focused element
    previouslyFocusedElement.value = document.activeElement as HTMLElement
    
    // Create focus sentinels
    createSentinels()
    
    // Focus initial element or first focusable element
    nextTick(() => {
      const focusableElements = getFocusableElements()
      if (options.initialFocus) {
        options.initialFocus.focus()
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus()
      } else if (containerRef.value) {
        // If no focusable elements, focus the container itself
        containerRef.value.setAttribute('tabindex', '-1')
        containerRef.value.focus()
      }
    })
    
    isActive.value = true
    document.addEventListener('keydown', handleKeyDown)
  }

  const deactivate = () => {
    if (!isActive.value) return
    
    isActive.value = false
    document.removeEventListener('keydown', handleKeyDown)
    
    // Remove sentinels
    removeSentinels()
    
    // Return focus to previously focused element
    if (options.returnFocus !== false && previouslyFocusedElement.value) {
      previouslyFocusedElement.value.focus()
    }
  }

  onUnmounted(() => {
    deactivate()
  })

  return {
    activate,
    deactivate,
    isActive: computed(() => isActive.value),
  }
}

/**
 * Enhanced keyboard navigation composable
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const handleKeydown = (event: KeyboardEvent) => {
    // Don't interfere with form inputs unless specifically handled
    const target = event.target as HTMLElement
    const isFormInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    
    switch (event.key) {
      case 'Escape':
        if (options.onEscape) {
          event.preventDefault()
          options.onEscape()
        }
        break
      case 'Enter':
        if (options.onEnter && (!isFormInput || target.tagName === 'BUTTON')) {
          event.preventDefault()
          options.onEnter()
        }
        break
      case 'ArrowUp':
        if (options.onArrowUp) {
          event.preventDefault()
          options.onArrowUp()
        }
        break
      case 'ArrowDown':
        if (options.onArrowDown) {
          event.preventDefault()
          options.onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (options.onArrowLeft && !isFormInput) {
          event.preventDefault()
          options.onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (options.onArrowRight && !isFormInput) {
          event.preventDefault()
          options.onArrowRight()
        }
        break
      case 'Home':
        if (options.onHome && !isFormInput) {
          event.preventDefault()
          options.onHome()
        }
        break
      case 'End':
        if (options.onEnd && !isFormInput) {
          event.preventDefault()
          options.onEnd()
        }
        break
      case 'Tab':
        if (options.onTab) {
          options.onTab(event)
        }
        break
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    handleKeydown,
  }
}

/**
 * Enhanced skip links composable
 */
export function useSkipLinks() {
  const skipToContent = () => {
    const mainContent = document.querySelector('main, [role="main"], #main-content')
    if (mainContent instanceof HTMLElement) {
      // Ensure element is focusable
      if (!mainContent.hasAttribute('tabindex')) {
        mainContent.setAttribute('tabindex', '-1')
      }
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      // Remove tabindex after focus to restore natural tab order
      setTimeout(() => {
        if (mainContent.getAttribute('tabindex') === '-1') {
          mainContent.removeAttribute('tabindex')
        }
      }, 100)
    }
  }

  const skipToNavigation = () => {
    const navigation = document.querySelector('nav, [role="navigation"], #navigation')
    if (navigation instanceof HTMLElement) {
      if (!navigation.hasAttribute('tabindex')) {
        navigation.setAttribute('tabindex', '-1')
      }
      navigation.focus()
      navigation.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      setTimeout(() => {
        if (navigation.getAttribute('tabindex') === '-1') {
          navigation.removeAttribute('tabindex')
        }
      }, 100)
    }
  }

  const skipToFooter = () => {
    const footer = document.querySelector('footer, [role="contentinfo"], #footer')
    if (footer instanceof HTMLElement) {
      if (!footer.hasAttribute('tabindex')) {
        footer.setAttribute('tabindex', '-1')
      }
      footer.focus()
      footer.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      setTimeout(() => {
        if (footer.getAttribute('tabindex') === '-1') {
          footer.removeAttribute('tabindex')
        }
      }, 100)
    }
  }

  return {
    skipToContent,
    skipToNavigation,
    skipToFooter,
  }
}

/**
 * Enhanced ARIA live region composable
 */
export function useAriaLiveRegion() {
  const liveRegions = ref<Map<string, HTMLElement>>(new Map())

  const createLiveRegion = (id: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegions.value.has(id)) {
      return liveRegions.value.get(id)!
    }

    const region = document.createElement('div')
    region.setAttribute('id', `live-region-${id}`)
    region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
    region.setAttribute('aria-live', priority)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    document.body.appendChild(region)
    
    liveRegions.value.set(id, region)
    return region
  }

  const announce = (
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    regionId: string = 'default'
  ) => {
    const region = createLiveRegion(regionId, priority)
    
    // Clear previous message
    region.textContent = ''
    
    // Add new message with slight delay to ensure screen readers pick it up
    setTimeout(() => {
      region.textContent = message
    }, 10)

    // Clear after announcement
    setTimeout(() => {
      region.textContent = ''
    }, 1000)
  }

  const announceWithDelay = (
    message: string,
    delay: number,
    priority: 'polite' | 'assertive' = 'polite',
    regionId: string = 'default'
  ) => {
    setTimeout(() => {
      announce(message, priority, regionId)
    }, delay)
  }

  onUnmounted(() => {
    liveRegions.value.forEach((region) => {
      if (document.body.contains(region)) {
        document.body.removeChild(region)
      }
    })
    liveRegions.value.clear()
  })

  return {
    announce,
    announceWithDelay,
    createLiveRegion,
  }
}

/**
 * Enhanced focus management utilities
 */
export function useFocusManagement() {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector)
    if (element instanceof HTMLElement) {
      element.focus()
    }
  }

  const focusFirstError = () => {
    const firstError = document.querySelector('[aria-invalid="true"], .error input, .error select, .error textarea')
    if (firstError instanceof HTMLElement) {
      firstError.focus()
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const focusById = (id: string) => {
    const element = document.getElementById(id)
    if (element instanceof HTMLElement) {
      element.focus()
    }
  }

  const getAllFocusableElements = (): HTMLElement[] => {
    return Array.from(
      document.querySelectorAll(
        'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]
  }

  const moveFocusToNext = () => {
    const focusableElements = getAllFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    
    if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus()
    } else if (focusableElements.length > 0) {
      // Wrap to first element
      focusableElements[0].focus()
    }
  }

  const moveFocusToPrevious = () => {
    const focusableElements = getAllFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus()
    } else if (focusableElements.length > 0) {
      // Wrap to last element
      focusableElements[focusableElements.length - 1].focus()
    }
  }

  const moveFocusToFirst = () => {
    const focusableElements = getAllFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }

  const moveFocusToLast = () => {
    const focusableElements = getAllFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
    }
  }

  return {
    focusElement,
    focusFirstError,
    focusById,
    getAllFocusableElements,
    moveFocusToNext,
    moveFocusToPrevious,
    moveFocusToFirst,
    moveFocusToLast,
  }
}

/**
 * ARIA attributes management composable
 */
export function useAriaAttributes() {
  const generateId = (prefix: string = 'aria') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  const setAriaLabel = (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label)
  }

  const setAriaLabelledBy = (element: HTMLElement, labelId: string) => {
    element.setAttribute('aria-labelledby', labelId)
  }

  const setAriaDescribedBy = (element: HTMLElement, descriptionId: string) => {
    const existing = element.getAttribute('aria-describedby')
    if (existing) {
      element.setAttribute('aria-describedby', `${existing} ${descriptionId}`)
    } else {
      element.setAttribute('aria-describedby', descriptionId)
    }
  }

  const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  const setAriaSelected = (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString())
  }

  const setAriaChecked = (element: HTMLElement, checked: boolean | 'mixed') => {
    element.setAttribute('aria-checked', checked.toString())
  }

  const setAriaDisabled = (element: HTMLElement, disabled: boolean) => {
    element.setAttribute('aria-disabled', disabled.toString())
  }

  const setAriaInvalid = (element: HTMLElement, invalid: boolean) => {
    element.setAttribute('aria-invalid', invalid.toString())
  }

  const setAriaRequired = (element: HTMLElement, required: boolean) => {
    element.setAttribute('aria-required', required.toString())
  }

  return {
    generateId,
    setAriaLabel,
    setAriaLabelledBy,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaSelected,
    setAriaChecked,
    setAriaDisabled,
    setAriaInvalid,
    setAriaRequired,
  }
}
