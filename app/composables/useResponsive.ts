import { ref, computed, onMounted, onUnmounted } from 'vue'

export const useResponsive = () => {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
  const isTouch = ref(false)
  const prefersReducedMotion = ref(false)

  const updateDimensions = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  const updateTouch = () => {
    isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  const updateMotionPreference = () => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  onMounted(() => {
    updateDimensions()
    updateTouch()
    updateMotionPreference()

    window.addEventListener('resize', updateDimensions)
    
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', updateMotionPreference)
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateDimensions)
    }
  })

  const deviceInfo = computed(() => ({
    width: width.value,
    height: height.value,
    isMobile: width.value < 640,
    isTablet: width.value >= 640 && width.value < 1024,
    isDesktop: width.value >= 1024,
    isTouch: isTouch.value,
    prefersReducedMotion: prefersReducedMotion.value
  }))

  return {
    width,
    height,
    isMobile: computed(() => deviceInfo.value.isMobile),
    isTablet: computed(() => deviceInfo.value.isTablet),
    isDesktop: computed(() => deviceInfo.value.isDesktop),
    isTouch,
    prefersReducedMotion,
    deviceInfo
  }
}
