/**
 * Debounced search composable for optimizing search performance
 * Delays search execution until user stops typing
 */

import { ref, watch, type Ref } from 'vue'

interface DebouncedSearchOptions {
  delay?: number
  minLength?: number
  onSearch: (query: string) => void | Promise<void>
}

export function useDebouncedSearch(options: DebouncedSearchOptions) {
  const { delay = 300, minLength = 2, onSearch } = options

  const searchQuery = ref('')
  const isSearching = ref(false)
  const debouncedQuery = ref('')
  let timeoutId: NodeJS.Timeout | null = null

  // Watch for search query changes
  watch(searchQuery, (newQuery) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // If query is too short, clear results
    if (newQuery.length < minLength && newQuery.length > 0) {
      debouncedQuery.value = ''
      return
    }

    // If query is empty, search immediately
    if (newQuery.length === 0) {
      debouncedQuery.value = ''
      isSearching.value = true
      Promise.resolve(onSearch('')).finally(() => {
        isSearching.value = false
      })
      return
    }

    // Debounce the search
    isSearching.value = true
    timeoutId = setTimeout(() => {
      debouncedQuery.value = newQuery
      Promise.resolve(onSearch(newQuery)).finally(() => {
        isSearching.value = false
      })
    }, delay)
  })

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
    debouncedQuery.value = ''
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  return {
    searchQuery,
    debouncedQuery,
    isSearching,
    clearSearch,
  }
}

/**
 * Throttled scroll handler for performance
 */
export function useThrottledScroll(
  callback: (event: Event) => void,
  delay: number = 100
) {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  const throttledCallback = (event: Event) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      callback(event)
    } else {
      // Schedule a call at the end of the throttle period
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        callback(event)
      }, delay - (now - lastCall))
    }
  }

  return throttledCallback
}

/**
 * Debounced input handler
 */
export function useDebouncedInput(
  callback: (value: string) => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null

  const debouncedCallback = (value: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      callback(value)
    }, delay)
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  return {
    debouncedCallback,
    cancel,
  }
}
