/**
 * Virtual scrolling composable for rendering large lists efficiently
 * Only renders visible items plus a buffer to improve performance
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

interface VirtualScrollOptions {
  itemHeight: number
  bufferSize?: number
  containerHeight?: number
}

interface VirtualScrollResult<T> {
  visibleItems: Ref<T[]>
  containerStyle: Ref<{ height: string }>
  wrapperStyle: Ref<{ transform: string; paddingTop: string; paddingBottom: string }>
  scrollToIndex: (index: number) => void
}

export function useVirtualScroll<T>(
  items: Ref<T[]>,
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, bufferSize = 5, containerHeight = 600 } = options

  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement | null>(null)

  // Calculate visible range
  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = start + visibleCount

    return {
      start: Math.max(0, start - bufferSize),
      end: Math.min(items.value.length, end + bufferSize),
    }
  })

  // Get visible items
  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end)
  })

  // Container style
  const containerStyle = computed(() => ({
    height: `${containerHeight}px`,
  }))

  // Wrapper style with offset
  const wrapperStyle = computed(() => {
    const { start } = visibleRange.value
    const totalHeight = items.value.length * itemHeight
    const offsetY = start * itemHeight

    return {
      transform: `translateY(${offsetY}px)`,
      paddingTop: '0px',
      paddingBottom: `${Math.max(0, totalHeight - offsetY - visibleItems.value.length * itemHeight)}px`,
    }
  })

  // Handle scroll
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (containerRef.value) {
      containerRef.value.scrollTop = index * itemHeight
    }
  }

  // Setup scroll listener
  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    visibleItems,
    containerStyle,
    wrapperStyle,
    scrollToIndex,
  }
}

/**
 * Simplified virtual scroll for dynamic height items
 * Uses Intersection Observer for better performance
 */
export function useIntersectionVirtualScroll<T>(
  items: Ref<T[]>,
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const { threshold = 0.1, rootMargin = '50px' } = options

  const visibleItems = ref<Set<number>>(new Set())
  const observers = new Map<number, IntersectionObserver>()

  const isVisible = (index: number) => visibleItems.value.has(index)

  const observeItem = (element: HTMLElement, index: number) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleItems.value.add(index)
          } else {
            visibleItems.value.delete(index)
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    observers.set(index, observer)
  }

  const unobserveItem = (index: number) => {
    const observer = observers.get(index)
    if (observer) {
      observer.disconnect()
      observers.delete(index)
    }
  }

  onUnmounted(() => {
    observers.forEach((observer) => observer.disconnect())
    observers.clear()
  })

  return {
    isVisible,
    observeItem,
    unobserveItem,
  }
}
