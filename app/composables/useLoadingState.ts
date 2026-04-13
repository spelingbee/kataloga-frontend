export interface LoadingState {
  isLoading: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  error: Error | null
  isEmpty: boolean
}

export function useLoadingState(initialLoading = false) {
  const isLoading = ref(initialLoading)
  const isInitialLoading = ref(initialLoading)
  const isRefreshing = ref(false)
  const error = ref<Error | null>(null)
  const isEmpty = ref(false)

  const setLoading = (loading: boolean, type: 'initial' | 'refresh' | 'default' = 'default') => {
    switch (type) {
      case 'initial':
        isInitialLoading.value = loading
        isLoading.value = loading
        break
      case 'refresh':
        isRefreshing.value = loading
        isLoading.value = loading
        break
      default:
        isLoading.value = loading
        break
    }

    if (loading) {
      error.value = null
    }
  }

  const setError = (err: Error | null) => {
    error.value = err
    isLoading.value = false
    isInitialLoading.value = false
    isRefreshing.value = false
  }

  const setEmpty = (empty: boolean) => {
    isEmpty.value = empty
  }

  const reset = () => {
    isLoading.value = false
    isInitialLoading.value = false
    isRefreshing.value = false
    error.value = null
    isEmpty.value = false
  }

  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    type: 'initial' | 'refresh' | 'default' = 'default'
  ): Promise<T | null> => {
    setLoading(true, type)
    
    try {
      const result = await asyncFn()
      setLoading(false, type)
      return result
    } catch (err) {
      setError(err as Error)
      return null
    }
  }

  const state = computed<LoadingState>(() => ({
    isLoading: isLoading.value,
    isInitialLoading: isInitialLoading.value,
    isRefreshing: isRefreshing.value,
    error: error.value,
    isEmpty: isEmpty.value,
  }))

  return {
    // Reactive state
    isLoading: readonly(isLoading),
    isInitialLoading: readonly(isInitialLoading),
    isRefreshing: readonly(isRefreshing),
    error: readonly(error),
    isEmpty: readonly(isEmpty),
    state: readonly(state),

    // Actions
    setLoading,
    setError,
    setEmpty,
    reset,
    withLoading,
  }
}

// Specialized loading states for common scenarios
export function useMenuLoadingState() {
  const loadingState = useLoadingState(true)
  
  const loadMenu = async (menuFn: () => Promise<any[]>) => {
    const result = await loadingState.withLoading(menuFn, 'initial')
    
    if (result) {
      loadingState.setEmpty(result.length === 0)
    }
    
    return result
  }

  const refreshMenu = async (menuFn: () => Promise<any[]>) => {
    const result = await loadingState.withLoading(menuFn, 'refresh')
    
    if (result) {
      loadingState.setEmpty(result.length === 0)
    }
    
    return result
  }

  return {
    ...loadingState,
    loadMenu,
    refreshMenu,
  }
}

export function useCartLoadingState() {
  const loadingState = useLoadingState()
  
  const addToCart = async (addFn: () => Promise<void>) => {
    return loadingState.withLoading(addFn)
  }

  const updateCart = async (updateFn: () => Promise<void>) => {
    return loadingState.withLoading(updateFn)
  }

  const removeFromCart = async (removeFn: () => Promise<void>) => {
    return loadingState.withLoading(removeFn)
  }

  return {
    ...loadingState,
    addToCart,
    updateCart,
    removeFromCart,
  }
}

export function useOrderLoadingState() {
  const loadingState = useLoadingState()
  
  const createOrder = async (createFn: () => Promise<any>) => {
    return loadingState.withLoading(createFn)
  }

  const loadOrders = async (loadFn: () => Promise<any[]>) => {
    const result = await loadingState.withLoading(loadFn, 'initial')
    
    if (result) {
      loadingState.setEmpty(result.length === 0)
    }
    
    return result
  }

  const trackOrder = async (trackFn: () => Promise<any>) => {
    return loadingState.withLoading(trackFn)
  }

  return {
    ...loadingState,
    createOrder,
    loadOrders,
    trackOrder,
  }
}
