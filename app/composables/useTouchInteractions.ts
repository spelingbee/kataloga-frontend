/**
 * Composable for touch-friendly interactions
 * Provides utilities for handling touch gestures and interactions
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { isDefined, safeArrayAccess } from '~/types/utils/type-guards'

export interface SwipeDirection {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

export interface TouchPosition {
  x: number
  y: number
}

export interface SwipeOptions {
  threshold?: number // Minimum distance for swipe (default: 50px)
  timeout?: number // Maximum time for swipe (default: 300ms)
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export const useTouchInteractions = () => {
  /**
   * Setup swipe gesture detection on an element
   */
  const useSwipe = (element: HTMLElement | null, options: SwipeOptions = {}) => {
    const {
      threshold = 50,
      timeout = 300,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
    } = options

    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const touch = e.touches.item(0)
      if (!touch) return

      touchStartX = touch.clientX
      touchStartY = touch.clientY
      touchStartTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return
      const touch = e.changedTouches.item(0)
      if (!touch) return

      const touchEndX = touch.clientX
      const touchEndY = touch.clientY
      const touchEndTime = Date.now()

      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY
      const deltaTime = touchEndTime - touchStartTime

      // Check if swipe is within timeout
      if (deltaTime > timeout) return

      // Check horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
        }
      }
      // Check vertical swipe
      else {
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.()
          } else {
            onSwipeUp?.()
          }
        }
      }
    }

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    const cleanup = () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    }

    return { cleanup }
  }

  /**
   * Setup long press detection on an element
   */
  const useLongPress = (
    element: HTMLElement | null,
    callback: () => void,
    duration: number = 500
  ) => {
    let pressTimer: NodeJS.Timeout | null = null

    const handleStart = () => {
      pressTimer = setTimeout(() => {
        callback()
      }, duration)
    }

    const handleEnd = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    if (element) {
      element.addEventListener('touchstart', handleStart, { passive: true })
      element.addEventListener('touchend', handleEnd, { passive: true })
      element.addEventListener('touchcancel', handleEnd, { passive: true })
      element.addEventListener('mousedown', handleStart)
      element.addEventListener('mouseup', handleEnd)
      element.addEventListener('mouseleave', handleEnd)
    }

    const cleanup = () => {
      if (element) {
        element.removeEventListener('touchstart', handleStart)
        element.removeEventListener('touchend', handleEnd)
        element.removeEventListener('touchcancel', handleEnd)
        element.removeEventListener('mousedown', handleStart)
        element.removeEventListener('mouseup', handleEnd)
        element.removeEventListener('mouseleave', handleEnd)
      }
      if (pressTimer) {
        clearTimeout(pressTimer)
      }
    }

    return { cleanup }
  }

  /**
   * Setup pull-to-refresh gesture
   */
  const usePullToRefresh = (
    element: HTMLElement | null,
    onRefresh: () => void | Promise<void>,
    threshold: number = 80
  ) => {
    let startY = 0
    let currentY = 0
    let isPulling = false
    const refreshing = ref(false)

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if scrolled to top
      if (element && element.scrollTop === 0) {
        if (e.touches.length === 0) return
        const touch = e.touches.item(0)
        if (touch) {
          startY = touch.clientY
          isPulling = true
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || refreshing.value) return

      if (e.touches.length === 0) return
      const touch = e.touches.item(0)
      if (!touch) return

      currentY = touch.clientY
      const pullDistance = currentY - startY

      if (pullDistance > 0 && element) {
        // Add visual feedback here if needed
        element.style.transform = `translateY(${Math.min(pullDistance / 2, threshold)}px)`
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling || refreshing.value) return

      const pullDistance = currentY - startY

      if (pullDistance > threshold) {
        refreshing.value = true
        try {
          await onRefresh()
        } finally {
          refreshing.value = false
        }
      }

      // Reset
      if (element) {
        element.style.transform = ''
      }
      isPulling = false
      startY = 0
      currentY = 0
    }

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true })
      element.addEventListener('touchmove', handleTouchMove, { passive: true })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    const cleanup = () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    }

    return { refreshing, cleanup }
  }

  /**
   * Prevent default touch behavior (like pull-to-refresh)
   */
  const preventTouchDefault = (element: HTMLElement | null) => {
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }

    if (element) {
      element.addEventListener('touchmove', handleTouchMove, { passive: false })
    }

    const cleanup = () => {
      if (element) {
        element.removeEventListener('touchmove', handleTouchMove)
      }
    }

    return { cleanup }
  }

  /**
   * Add haptic feedback (vibration) for touch interactions
   */
  const hapticFeedback = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  /**
   * Light haptic feedback for button taps
   */
  const lightHaptic = () => hapticFeedback(10)

  /**
   * Medium haptic feedback for selections
   */
  const mediumHaptic = () => hapticFeedback(20)

  /**
   * Heavy haptic feedback for important actions
   */
  const heavyHaptic = () => hapticFeedback(30)

  /**
   * Success haptic pattern
   */
  const successHaptic = () => hapticFeedback([10, 50, 10])

  /**
   * Error haptic pattern
   */
  const errorHaptic = () => hapticFeedback([20, 100, 20, 100, 20])

  return {
    // Gesture detection
    useSwipe,
    useLongPress,
    usePullToRefresh,
    preventTouchDefault,

    // Haptic feedback
    hapticFeedback,
    lightHaptic,
    mediumHaptic,
    heavyHaptic,
    successHaptic,
    errorHaptic,
  }
}
