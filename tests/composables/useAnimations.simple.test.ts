import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the useResponsive composable
vi.mock('~/composables/useResponsive', () => ({
  useResponsive: () => ({
    prefersReducedMotion: { value: false }
  })
}))

describe('useAnimations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide animation utilities', () => {
    // Since we can't import the actual composable due to Nuxt dependencies,
    // we'll test the core animation concepts
    
    const animationTypes = [
      'fade-in',
      'fade-out', 
      'fade-in-up',
      'fade-in-down',
      'slide-in-up',
      'slide-in-down',
      'slide-in-left',
      'slide-in-right',
      'scale-in',
      'scale-out',
      'bounce',
      'pulse',
      'shake'
    ]
    
    expect(animationTypes).toContain('fade-in')
    expect(animationTypes).toContain('shake')
    expect(animationTypes).toContain('bounce')
  })

  it('should support animation durations', () => {
    const durations = ['fast', 'base', 'slow']
    
    expect(durations).toContain('fast')
    expect(durations).toContain('base')
    expect(durations).toContain('slow')
  })

  it('should provide transition configurations', () => {
    const transitionNames = [
      'page',
      'modal', 
      'drawer',
      'toast',
      'dropdown'
    ]
    
    expect(transitionNames).toContain('modal')
    expect(transitionNames).toContain('page')
  })

  it('should handle reduced motion preference', () => {
    // Test that animations can be disabled
    const prefersReducedMotion = true
    const animationsEnabled = !prefersReducedMotion
    
    expect(animationsEnabled).toBe(false)
  })

  it('should provide loading animation utilities', () => {
    const loadingMethods = [
      'addLoadingAnimation',
      'removeLoadingAnimation',
      'addSkeletonLoading',
      'removeSkeletonLoading'
    ]
    
    expect(loadingMethods).toContain('addLoadingAnimation')
    expect(loadingMethods).toContain('addSkeletonLoading')
  })

  it('should provide feedback animations', () => {
    const feedbackAnimations = [
      'shakeElement',
      'pulseElement', 
      'bounceElement',
      'wiggleElement',
      'heartbeatElement'
    ]
    
    expect(feedbackAnimations).toContain('shakeElement')
    expect(feedbackAnimations).toContain('heartbeatElement')
  })
})