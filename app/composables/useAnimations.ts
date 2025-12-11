/**
 * Composable for managing animations
 * Provides utilities for triggering and controlling animations
 */

import { ref, computed } from 'vue'
import { useResponsive } from './useResponsive'

export type AnimationType =
  | 'fade-in'
  | 'fade-out'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'scale-in'
  | 'scale-out'
  | 'bounce'
  | 'pulse'
  | 'shake'

export type AnimationDuration = 'fast' | 'base' | 'slow'

export interface AnimationOptions {
  type: AnimationType
  duration?: AnimationDuration
  delay?: number
  disabled?: boolean
}

export const useAnimations = () => {
  const { prefersReducedMotion } = useResponsive()

  // Check if animations should be enabled
  const animationsEnabled = computed(() => !prefersReducedMotion.value)

  /**
   * Get animation class names based on options
   */
  const getAnimationClasses = (options: AnimationOptions): string[] => {
    if (options.disabled || !animationsEnabled.value) {
      return []
    }

    const classes: string[] = [options.type]

    if (options.duration) {
      classes.push(`duration-${options.duration}`)
    }

    if (options.delay) {
      classes.push(`delay-${options.delay}`)
    }

    return classes
  }

  /**
   * Trigger an animation on an element
   */
  const triggerAnimation = (
    element: HTMLElement | null,
    type: AnimationType,
    duration: AnimationDuration = 'base'
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!element || !animationsEnabled.value) {
        resolve()
        return
      }

      const classes = [type, `duration-${duration}`]
      element.classList.add(...classes)

      const handleAnimationEnd = () => {
        element.classList.remove(...classes)
        element.removeEventListener('animationend', handleAnimationEnd)
        resolve()
      }

      element.addEventListener('animationend', handleAnimationEnd)
    })
  }

  /**
   * Stagger animations for a list of elements
   */
  const staggerAnimation = (
    elements: HTMLElement[],
    type: AnimationType,
    delayBetween: number = 50,
    duration: AnimationDuration = 'base'
  ): Promise<void[]> => {
    if (!animationsEnabled.value) {
      return Promise.resolve([])
    }

    const promises = elements.map((element, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          triggerAnimation(element, type, duration).then(resolve)
        }, index * delayBetween)
      })
    })

    return Promise.all(promises)
  }

  /**
   * Add loading animation to an element
   */
  const addLoadingAnimation = (element: HTMLElement | null) => {
    if (!element) return

    element.classList.add('loading-overlay')
  }

  /**
   * Remove loading animation from an element
   */
  const removeLoadingAnimation = (element: HTMLElement | null) => {
    if (!element) return

    element.classList.remove('loading-overlay')
  }

  /**
   * Add skeleton loading to an element
   */
  const addSkeletonLoading = (element: HTMLElement | null) => {
    if (!element) return

    element.classList.add('skeleton')
  }

  /**
   * Remove skeleton loading from an element
   */
  const removeSkeletonLoading = (element: HTMLElement | null) => {
    if (!element) return

    element.classList.remove('skeleton')
  }

  /**
   * Shake element (for error feedback)
   */
  const shakeElement = (element: HTMLElement | null): Promise<void> => {
    return triggerAnimation(element, 'shake', 'fast')
  }

  /**
   * Pulse element (for attention)
   */
  const pulseElement = (element: HTMLElement | null): Promise<void> => {
    return triggerAnimation(element, 'pulse', 'base')
  }

  /**
   * Bounce element (for success feedback)
   */
  const bounceElement = (element: HTMLElement | null): Promise<void> => {
    return triggerAnimation(element, 'bounce', 'base')
  }

  /**
   * Get transition classes for Vue transitions
   */
  const getTransitionClasses = (name: string) => {
    return {
      enterActiveClass: `${name}-enter-active`,
      leaveActiveClass: `${name}-leave-active`,
      enterFromClass: `${name}-enter-from`,
      leaveToClass: `${name}-leave-to`,
    }
  }

  /**
   * Page transition classes
   */
  const pageTransition = computed(() => ({
    name: 'page',
    mode: 'out-in' as const,
    ...getTransitionClasses('page'),
  }))

  /**
   * Modal transition classes
   */
  const modalTransition = computed(() => ({
    name: 'modal',
    ...getTransitionClasses('modal'),
  }))

  /**
   * Drawer transition classes
   */
  const drawerTransition = computed(() => ({
    name: 'drawer',
    ...getTransitionClasses('drawer'),
  }))

  /**
   * Toast transition classes
   */
  const toastTransition = computed(() => ({
    name: 'toast',
    ...getTransitionClasses('toast'),
  }))

  /**
   * Dropdown transition classes
   */
  const dropdownTransition = computed(() => ({
    name: 'dropdown',
    ...getTransitionClasses('dropdown'),
  }))

  /**
   * Create a ripple effect on click
   */
  const createRipple = (event: MouseEvent, element: HTMLElement) => {
    if (!animationsEnabled.value) return

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `

    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  }

  /**
   * Animate element entrance with stagger
   */
  const animateListEntrance = (
    container: HTMLElement,
    itemSelector: string = '.list-item',
    delay: number = 100
  ) => {
    if (!animationsEnabled.value) return

    const items = container.querySelectorAll(itemSelector) as NodeListOf<HTMLElement>
    
    items.forEach((item, index) => {
      item.style.opacity = '0'
      item.style.transform = 'translateY(20px)'
      
      setTimeout(() => {
        item.style.transition = `opacity ${$transition-base} ease-out, transform ${$transition-base} ease-out`
        item.style.opacity = '1'
        item.style.transform = 'translateY(0)'
      }, index * delay)
    })
  }

  /**
   * Animate number counting
   */
  const animateNumber = (
    element: HTMLElement,
    from: number,
    to: number,
    duration: number = 1000,
    formatter?: (value: number) => string
  ) => {
    if (!animationsEnabled.value) {
      element.textContent = formatter ? formatter(to) : to.toString()
      return
    }

    const startTime = performance.now()
    const difference = to - from

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = from + (difference * easeOut)
      
      element.textContent = formatter ? formatter(Math.round(current)) : Math.round(current).toString()
      
      if (progress < 1) {
        requestAnimationFrame(updateNumber)
      }
    }

    requestAnimationFrame(updateNumber)
  }

  /**
   * Animate progress bar
   */
  const animateProgress = (
    element: HTMLElement,
    percentage: number,
    duration: number = 800
  ) => {
    if (!animationsEnabled.value) {
      element.style.width = `${percentage}%`
      return
    }

    element.style.transition = `width ${duration}ms ease-out`
    element.style.width = `${percentage}%`
  }

  /**
   * Wiggle animation for attention
   */
  const wiggleElement = (element: HTMLElement | null): Promise<void> => {
    return triggerAnimation(element, 'wiggle', 'fast')
  }

  /**
   * Heartbeat animation for favorites
   */
  const heartbeatElement = (element: HTMLElement | null): Promise<void> => {
    return triggerAnimation(element, 'heartbeat', 'base')
  }

  return {
    // State
    animationsEnabled,

    // Utilities
    getAnimationClasses,
    triggerAnimation,
    staggerAnimation,

    // Loading states
    addLoadingAnimation,
    removeLoadingAnimation,
    addSkeletonLoading,
    removeSkeletonLoading,

    // Feedback animations
    shakeElement,
    pulseElement,
    bounceElement,
    wiggleElement,
    heartbeatElement,

    // Interactive effects
    createRipple,
    animateListEntrance,
    animateNumber,
    animateProgress,

    // Transition configs
    pageTransition,
    modalTransition,
    drawerTransition,
    toastTransition,
    dropdownTransition,
    getTransitionClasses,
  }
}
