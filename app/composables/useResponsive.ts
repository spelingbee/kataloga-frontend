/**
 * Composable for responsive design utilities
 * Provides reactive breakpoint detection and device information
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface Breakpoints {
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  isRetina: boolean
  prefersReducedMotion: boolean
}

const breakpoints: Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export const useResponsive = () => {
  const windowWidth = ref(0)
  const windowHeight = ref(0)

  // Breakpoint checks
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
  const isLargeDesktop = computed(() => windowWidth.value >= breakpoints.xl)
  const isXLDesktop = computed(() => windowWidth.value >= breakpoints['2xl'])

  // Device detection
  const isTouch = ref(false)
  const isRetina = ref(false)
  const prefersReducedMotion = ref(false)

  // Orientation
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)

  // Current breakpoint name
  const currentBreakpoint = computed(() => {
    if (windowWidth.value < breakpoints.sm) return 'xs'
    if (windowWidth.value < breakpoints.md) return 'sm'
    if (windowWidth.value < breakpoints.lg) return 'md'
    if (windowWidth.value < breakpoints.xl) return 'lg'
    if (windowWidth.value < breakpoints['2xl']) return 'xl'
    return '2xl'
  })

  // Check if current width is greater than or equal to breakpoint
  const isBreakpoint = (breakpoint: keyof Breakpoints) => {
    return windowWidth.value >= breakpoints[breakpoint]
  }

  // Check if current width is less than breakpoint
  const isBreakpointDown = (breakpoint: keyof Breakpoints) => {
    return windowWidth.value < breakpoints[breakpoint]
  }

  // Update window dimensions
  const updateDimensions = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }
  }

  // Detect device capabilities
  const detectDevice = () => {
    if (typeof window !== 'undefined') {
      // Touch detection
      isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Retina detection
      isRetina.value = window.devicePixelRatio > 1

      // Reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.value = mediaQuery.matches

      // Listen for changes in reduced motion preference
      mediaQuery.addEventListener('change', (e) => {
        prefersReducedMotion.value = e.matches
      })
    }
  }

  // Debounced resize handler
  let resizeTimeout: NodeJS.Timeout
  const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(updateDimensions, 150)
  }

  // Setup
  onMounted(() => {
    updateDimensions()
    detectDevice()
    window.addEventListener('resize', handleResize)
  })

  // Cleanup
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  })

  // Device info object
  const deviceInfo = computed<DeviceInfo>(() => ({
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: isDesktop.value,
    isTouch: isTouch.value,
    isRetina: isRetina.value,
    prefersReducedMotion: prefersReducedMotion.value,
  }))

  return {
    // Dimensions
    windowWidth,
    windowHeight,

    // Breakpoints
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isXLDesktop,
    currentBreakpoint,

    // Device capabilities
    isTouch,
    isRetina,
    prefersReducedMotion,

    // Orientation
    isPortrait,
    isLandscape,

    // Utilities
    isBreakpoint,
    isBreakpointDown,
    deviceInfo,

    // Constants
    breakpoints,
  }
}
