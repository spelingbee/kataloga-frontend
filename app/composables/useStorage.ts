/**
 * SSR-compatible localStorage utilities
 * 
 * This module provides safe localStorage access that works in both SSR and client contexts,
 * preventing hydration mismatches and providing fallbacks for server-side rendering.
 */

import { ref, readonly, onMounted, type Ref } from 'vue'

/**
 * Storage handler interface for consistent API
 */
interface StorageHandler {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

/**
 * SSR-safe storage implementation that checks for client context
 * before accessing localStorage
 */
class SSRSafeStorage implements StorageHandler {
  private get isClient(): boolean {
    return import.meta.client && typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }
  
  getItem(key: string): string | null {
    if (!this.isClient) return null
    
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error)
      return null
    }
  }
  
  setItem(key: string, value: string): void {
    if (!this.isClient) return
    
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error)
    }
  }
  
  removeItem(key: string): void {
    if (!this.isClient) return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error)
    }
  }
  
  clear(): void {
    if (!this.isClient) return
    
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Failed to clear localStorage', error)
    }
  }
}

/**
 * Basic SSR-safe storage composable
 * 
 * @returns StorageHandler instance that safely handles localStorage operations
 */
export const useStorage = (): StorageHandler => {
  return new SSRSafeStorage()
}

/**
 * Hydration-safe storage composable for non-critical data
 * 
 * This composable prevents hydration mismatches by loading the value
 * only after the component is mounted on the client side.
 * 
 * Use this for data that doesn't affect the initial render.
 * 
 * @param key - localStorage key
 * @param defaultValue - default value to use before hydration
 * @returns object with reactive value and setter function
 */
export const useHydratedStorage = (key: string, defaultValue: string = '') => {
  const storage = useStorage()
  const value = ref(defaultValue)
  const isHydrated = ref(false)
  
  // Load value only after component is mounted to prevent hydration mismatch
  onMounted(() => {
    const stored = storage.getItem(key)
    if (stored !== null) {
      value.value = stored
    }
    isHydrated.value = true
  })
  
  const setValue = (newValue: string) => {
    value.value = newValue
    storage.setItem(key, newValue)
  }
  
  const removeValue = () => {
    value.value = defaultValue
    storage.removeItem(key)
  }
  
  return { 
    value: readonly(value), 
    setValue, 
    removeValue,
    isHydrated: readonly(isHydrated)
  }
}

/**
 * Critical storage composable using cookies for SSR compatibility
 * 
 * This composable uses Nuxt's useCookie for data that affects the initial render,
 * ensuring consistency between server and client. The data is also mirrored
 * to localStorage for faster client-side access.
 * 
 * Use this for data that affects the first render or is critical for the user experience.
 * 
 * @param key - storage key (used for both cookie and localStorage)
 * @param defaultValue - default value
 * @returns object with reactive value and setter function
 */
export const useCriticalStorage = (key: string, defaultValue: string = '') => {
  // Use cookie for SSR compatibility
  const cookie = useCookie(key, { 
    default: () => defaultValue,
    // Set reasonable cookie options
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    secure: true,
    httpOnly: false // Allow client-side access
  })
  
  const setValue = (newValue: string) => {
    cookie.value = newValue
    
    // Mirror to localStorage for faster client-side access
    if (import.meta.client && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, newValue)
      } catch (error) {
        console.warn(`Failed to mirror value to localStorage: ${key}`, error)
      }
    }
  }
  
  const removeValue = () => {
    cookie.value = defaultValue
    
    // Also remove from localStorage
    if (import.meta.client && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove value from localStorage: ${key}`, error)
      }
    }
  }
  
  return { 
    value: cookie, 
    setValue, 
    removeValue 
  }
}

/**
 * Reactive storage composable with JSON serialization
 * 
 * This composable handles JSON serialization/deserialization automatically
 * and provides a reactive interface for complex data types.
 * 
 * @param key - localStorage key
 * @param defaultValue - default value (will be JSON serialized)
 * @param options - configuration options
 * @returns object with reactive value and methods
 */
export const useStorageState = <T>(
  key: string, 
  defaultValue: T,
  options: {
    /** Use critical storage (cookies) for SSR compatibility */
    critical?: boolean
    /** Custom serializer (defaults to JSON) */
    serializer?: {
      read: (value: string) => T
      write: (value: T) => string
    }
  } = {}
) => {
  const serializer = options.serializer || {
    read: (value: string) => JSON.parse(value),
    write: (value: T) => JSON.stringify(value)
  }
  
  if (options.critical) {
    // Use critical storage for SSR-critical data
    const { value: stringValue, setValue: setStringValue, removeValue } = useCriticalStorage(
      key, 
      serializer.write(defaultValue)
    )
    
    const value = computed({
      get: () => {
        try {
          return serializer.read(stringValue.value)
        } catch {
          return defaultValue
        }
      },
      set: (newValue: T) => {
        setStringValue(serializer.write(newValue))
      }
    })
    
    const setValue = (newValue: T) => {
      value.value = newValue
    }
    
    return { value, setValue, removeValue }
  } else {
    // Use hydrated storage for non-critical data
    const { value: stringValue, setValue: setStringValue, removeValue, isHydrated } = useHydratedStorage(
      key, 
      serializer.write(defaultValue)
    )
    
    const value = computed({
      get: () => {
        try {
          return serializer.read(stringValue.value)
        } catch {
          return defaultValue
        }
      },
      set: (newValue: T) => {
        setStringValue(serializer.write(newValue))
      }
    })
    
    const setValue = (newValue: T) => {
      value.value = newValue
    }
    
    return { value, setValue, removeValue, isHydrated }
  }
}

/**
 * Tenant-aware storage composable
 * 
 * This composable automatically prefixes storage keys with tenant information
 * to provide tenant-specific storage isolation.
 * 
 * @param key - base storage key
 * @param defaultValue - default value
 * @param options - configuration options
 * @returns storage composable with tenant-aware keys
 */
export const useTenantStorage = <T>(
  key: string,
  defaultValue: T,
  options: {
    critical?: boolean
    serializer?: {
      read: (value: string) => T
      write: (value: T) => string
    }
  } = {}
) => {
  // Get tenant context
  const getTenantKey = () => {
    try {
      // Dynamically import to avoid circular dependencies
      const { useTenantStore } = require('~/stores/tenant')
      const tenantStore = useTenantStore()
      const tenantSlug = tenantStore.tenantSlug
      return tenantSlug ? `${key}_${tenantSlug}` : key
    } catch {
      return key
    }
  }
  
  // Use computed key that updates when tenant changes
  const tenantKey = computed(() => getTenantKey())
  
  // Watch for tenant key changes and migrate data if needed
  const storage = useStorageState(tenantKey.value, defaultValue, options)
  
  // Watch for tenant changes and update storage key
  watch(tenantKey, (newKey, oldKey) => {
    if (newKey !== oldKey && oldKey) {
      // Tenant changed - could implement data migration here if needed
      console.log(`Tenant storage key changed from ${oldKey} to ${newKey}`)
    }
  })
  
  return storage
}

/**
 * Storage utilities for common patterns
 */
export const storageUtils = {
  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    return import.meta.client && typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  },
  
  /**
   * Get storage size in bytes (approximate)
   */
  getStorageSize(): number {
    if (!this.isAvailable()) return 0
    
    let total = 0
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }
    } catch {
      return 0
    }
    return total
  },
  
  /**
   * Clear all app-specific storage (preserves other apps' data)
   */
  clearAppStorage(prefix: string = 'app_'): void {
    if (!this.isAvailable()) return
    
    const keysToRemove: string[] = []
    try {
      for (const key in localStorage) {
        if (key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear app storage', error)
    }
  }
}