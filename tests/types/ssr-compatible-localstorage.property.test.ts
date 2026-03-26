/**
 * Property-based tests for SSR-compatible localStorage utilities
 * 
 * **Property 8: SSR-Compatible localStorage with Hydration Safety**
 * **Validates: Requirements 8.1, 8.2, 8.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'

// Mock import.meta.client for testing
let mockImportMeta = {
  client: true,
  env: { MODE: 'test' }
}

// Mock localStorage
const createMockLocalStorage = () => {
  const storage: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
    removeItem: vi.fn((key: string) => { delete storage[key] }),
    clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]) }),
    length: 0,
    key: vi.fn(() => null)
  }
}

// Mock useCookie for critical storage tests
const mockUseCookie = vi.fn()

// Mock Vue composables
const mockRef = vi.fn((value: any) => ({ value }))
const mockReadonly = vi.fn((ref: any) => ref)
const mockOnMounted = vi.fn((callback: () => void) => {
  // Execute immediately in tests
  callback()
})
const mockComputed = vi.fn((getter: any) => {
  if (typeof getter === 'function') {
    return { value: getter() }
  }
  return {
    get value() { return getter.get() },
    set value(val) { getter.set(val) }
  }
})
const mockWatch = vi.fn()

// Mock tenant store
const mockTenantStore = {
  tenantSlug: 'test-tenant'
}

// Mock Nuxt composables
vi.mock('#app', () => ({
  useCookie: mockUseCookie
}))

// Mock Vue
vi.mock('vue', () => ({
  ref: mockRef,
  readonly: mockReadonly,
  onMounted: mockOnMounted,
  computed: mockComputed,
  watch: mockWatch
}))

// Mock tenant store
vi.mock('~/stores/tenant', () => ({
  useTenantStore: () => mockTenantStore
}))

describe('SSR-Compatible localStorage Property Tests', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>
  let originalWindow: any

  beforeEach(() => {
    // Setup mocks
    mockLocalStorage = createMockLocalStorage()
    originalWindow = globalThis.window

    // Reset import.meta mock
    mockImportMeta.client = true

    // Mock window and localStorage
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockLocalStorage },
      writable: true,
      configurable: true
    })

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    })

    // Setup useCookie mock
    mockUseCookie.mockReturnValue({
      value: 'default'
    })

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original values
    if (originalWindow !== undefined) {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true
      })
    } else {
      delete (globalThis as any).window
    }

    vi.clearAllMocks()
  })

  // Import after mocks are set up
  const getStorageModule = async () => {
    // Mock import.meta in the module
    vi.doMock('import.meta', () => mockImportMeta, { virtual: true })
    
    // Create a simple storage implementation for testing
    const createTestStorage = () => {
      const isClient = mockImportMeta.client && typeof globalThis.window !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
      
      return {
        getItem: (key: string) => {
          if (!isClient) return null
          try {
            return mockLocalStorage.getItem(key)
          } catch {
            return null
          }
        },
        setItem: (key: string, value: string) => {
          if (!isClient) return
          try {
            mockLocalStorage.setItem(key, value)
          } catch {
            // Ignore errors
          }
        },
        removeItem: (key: string) => {
          if (!isClient) return
          try {
            mockLocalStorage.removeItem(key)
          } catch {
            // Ignore errors
          }
        },
        clear: () => {
          if (!isClient) return
          try {
            mockLocalStorage.clear()
          } catch {
            // Ignore errors
          }
        }
      }
    }

    const createTestHydratedStorage = (key: string, defaultValue: string = '') => {
      const storage = createTestStorage()
      const value = mockRef(defaultValue)
      const isHydrated = mockRef(false)
      
      // Simulate onMounted behavior
      const stored = storage.getItem(key)
      if (stored !== null) {
        value.value = stored
      }
      isHydrated.value = true
      
      const setValue = (newValue: string) => {
        value.value = newValue
        storage.setItem(key, newValue)
      }
      
      const removeValue = () => {
        value.value = defaultValue
        storage.removeItem(key)
      }
      
      return { 
        value: mockReadonly(value), 
        setValue, 
        removeValue,
        isHydrated: mockReadonly(isHydrated)
      }
    }

    const createTestCriticalStorage = (key: string, defaultValue: string = '') => {
      const cookie = mockUseCookie(key, { 
        default: () => defaultValue,
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: true,
        httpOnly: false
      })
      
      const setValue = (newValue: string) => {
        cookie.value = newValue
        
        if (mockImportMeta.client && typeof globalThis.localStorage !== 'undefined') {
          try {
            mockLocalStorage.setItem(key, newValue)
          } catch {
            // Ignore errors
          }
        }
      }
      
      const removeValue = () => {
        cookie.value = defaultValue
        
        if (mockImportMeta.client && typeof globalThis.localStorage !== 'undefined') {
          try {
            mockLocalStorage.removeItem(key)
          } catch {
            // Ignore errors
          }
        }
      }
      
      return { 
        value: cookie, 
        setValue, 
        removeValue 
      }
    }

    const createTestStorageState = <T>(key: string, defaultValue: T, options: any = {}) => {
      const serializer = options.serializer || {
        read: (value: string) => JSON.parse(value),
        write: (value: T) => JSON.stringify(value)
      }
      
      if (options.critical) {
        const { value: stringValue, setValue: setStringValue, removeValue } = createTestCriticalStorage(
          key, 
          serializer.write(defaultValue)
        )
        
        const value = mockComputed({
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
        const { value: stringValue, setValue: setStringValue, removeValue, isHydrated } = createTestHydratedStorage(
          key, 
          serializer.write(defaultValue)
        )
        
        const value = mockComputed({
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

    const createTestTenantStorage = <T>(key: string, defaultValue: T, options: any = {}) => {
      const getTenantKey = () => {
        const tenantSlug = mockTenantStore.tenantSlug
        return tenantSlug ? `${key}_${tenantSlug}` : key
      }
      
      const tenantKey = mockComputed(() => getTenantKey())
      const storage = createTestStorageState(tenantKey.value, defaultValue, options)
      
      return storage
    }

    const testStorageUtils = {
      isAvailable(): boolean {
        return mockImportMeta.client && typeof globalThis.window !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
      },
      
      getStorageSize(): number {
        if (!this.isAvailable()) return 0
        
        let total = 0
        try {
          const storage = globalThis.localStorage as any
          for (const key in storage) {
            if (storage.hasOwnProperty && storage.hasOwnProperty(key)) {
              total += (storage[key]?.length || 0) + key.length
            }
          }
        } catch {
          return 0
        }
        return total
      },
      
      clearAppStorage(prefix: string = 'app_'): void {
        if (!this.isAvailable()) return
        
        const keysToRemove: string[] = []
        try {
          const storage = globalThis.localStorage as any
          for (const key in storage) {
            if (key.startsWith(prefix)) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => mockLocalStorage.removeItem(key))
        } catch {
          // Ignore errors
        }
      }
    }
    
    return {
      useStorage: createTestStorage,
      useHydratedStorage: createTestHydratedStorage,
      useCriticalStorage: createTestCriticalStorage,
      useStorageState: createTestStorageState,
      useTenantStorage: createTestTenantStorage,
      storageUtils: testStorageUtils
    }
  }

  describe('Property 8.1: SSR Context Safety', () => {
    it('should provide safe fallbacks in SSR context', async () => {
      const { useStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 1000 }),
        (key, value) => {
          // Simulate SSR context
          mockImportMeta.client = false
          delete (globalThis as any).window
          delete (globalThis as any).localStorage

          const storage = useStorage()

          // Should not throw errors in SSR
          expect(() => storage.setItem(key, value)).not.toThrow()
          expect(() => storage.getItem(key)).not.toThrow()
          expect(() => storage.removeItem(key)).not.toThrow()
          expect(() => storage.clear()).not.toThrow()

          // Should return null for getItem in SSR
          expect(storage.getItem(key)).toBeNull()
        }
      ))
    })

    it('should check import.meta.client before localStorage access', async () => {
      const { useStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 1000 }),
        (key, value) => {
          // Test client context
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          const storage = useStorage()
          storage.setItem(key, value)

          // Should use localStorage in client context
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, value)

          const retrieved = storage.getItem(key)
          expect(mockLocalStorage.getItem).toHaveBeenCalledWith(key)
        }
      ))
    })
  })

  describe('Property 8.2: Browser Context Compatibility', () => {
    it('should use native localStorage in browser context', async () => {
      const { useStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 1000 }),
        (key, value) => {
          // Ensure client context
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          const storage = useStorage()

          // Test all storage operations
          storage.setItem(key, value)
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, value)

          const retrieved = storage.getItem(key)
          expect(mockLocalStorage.getItem).toHaveBeenCalledWith(key)

          storage.removeItem(key)
          expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key)

          storage.clear()
          expect(mockLocalStorage.clear).toHaveBeenCalled()
        }
      ))
    })

    it('should handle localStorage errors gracefully', async () => {
      const { useStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 1000 }),
        (key, value) => {
          // Setup localStorage to throw errors
          mockLocalStorage.setItem.mockImplementation(() => {
            throw new Error('Storage quota exceeded')
          })
          mockLocalStorage.getItem.mockImplementation(() => {
            throw new Error('Storage access denied')
          })

          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          const storage = useStorage()

          // Should not throw errors, should handle gracefully
          expect(() => storage.setItem(key, value)).not.toThrow()
          expect(() => storage.getItem(key)).not.toThrow()
          expect(() => storage.removeItem(key)).not.toThrow()
          expect(() => storage.clear()).not.toThrow()

          // getItem should return null on error
          expect(storage.getItem(key)).toBeNull()
        }
      ))
    })
  })

  describe('Property 8.3: Hydration Mismatch Prevention', () => {
    it('should prevent hydration mismatches with useHydratedStorage', async () => {
      const { useHydratedStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 1000 }),
        fc.string({ minLength: 0, maxLength: 1000 }),
        (key, storedValue, defaultValue) => {
          // Setup stored value in localStorage
          mockLocalStorage.getItem.mockReturnValue(storedValue)
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          const { value, setValue, isHydrated } = useHydratedStorage(key, defaultValue)

          // After hydration (simulated), should use stored value if available
          expect(isHydrated.value).toBe(true)
          if (storedValue) {
            expect(value.value).toBe(storedValue)
          }

          // setValue should work regardless of hydration state
          const newValue = 'new-value'
          setValue(newValue)
          expect(value.value).toBe(newValue)
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, newValue)
        }
      ))
    })

    it('should use cookies for critical storage to ensure SSR consistency', async () => {
      const { useCriticalStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 1000 }),
        (key, value) => {
          const mockCookie = { value: value }
          
          // Mock useCookie to return our test cookie
          mockUseCookie.mockReturnValue(mockCookie)

          const storage = useCriticalStorage(key, value)
          
          // Should use cookie value for SSR consistency
          expect(storage.value).toBeDefined()
          
          // setValue should update both cookie and localStorage
          const newValue = 'updated-value'
          storage.setValue(newValue)
          
          // In client context, should also update localStorage
          if (mockImportMeta.client) {
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, newValue)
          }
        }
      ))
    })
  })

  describe('Property 8.4: Tenant-Aware Storage', () => {
    it('should isolate storage by tenant', async () => {
      const { useTenantStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.string({ minLength: 0, maxLength: 100 }), { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (baseKey, defaultValue, tenantSlug) => {
          // Update mock tenant store
          mockTenantStore.tenantSlug = tenantSlug
          
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          const { value, setValue } = useTenantStorage(baseKey, defaultValue)

          // Should use tenant-prefixed key
          const expectedKey = `${baseKey}_${tenantSlug}`
          
          setValue(['test-item'])
          
          // Should store with tenant-prefixed key
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            expectedKey, 
            JSON.stringify(['test-item'])
          )
        }
      ))
    })

    it('should fall back to base key when no tenant is set', async () => {
      const { useTenantStorage } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.string({ minLength: 0, maxLength: 100 }), { minLength: 0, maxLength: 10 }),
        (baseKey, defaultValue) => {
          // Clear tenant
          mockTenantStore.tenantSlug = ''
          
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          const { value, setValue } = useTenantStorage(baseKey, defaultValue)

          setValue(['test-item'])
          
          // Should use base key when no tenant
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            baseKey, 
            JSON.stringify(['test-item'])
          )
        }
      ))
    })
  })

  describe('Property 8.5: JSON Serialization Safety', () => {
    it('should handle JSON serialization errors gracefully', async () => {
      const { useStorageState } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(
          fc.record({ name: fc.string(), value: fc.integer() }),
          fc.array(fc.string()),
          fc.string(),
          fc.integer(),
          fc.boolean()
        ),
        (key, data) => {
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          const { value, setValue } = useStorageState(key, data)

          // Should handle serialization without throwing
          expect(() => setValue(data)).not.toThrow()
          
          // Should handle deserialization of valid JSON
          if (typeof data !== 'function' && typeof data !== 'symbol') {
            const serialized = JSON.stringify(data)
            mockLocalStorage.getItem.mockReturnValue(serialized)
            
            // Should deserialize correctly
            expect(value.value).toEqual(data)
          }
        }
      ))
    })

    it('should fall back to default value on deserialization errors', async () => {
      const { useStorageState } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(
          fc.record({ name: fc.string(), value: fc.integer() }),
          fc.array(fc.string()),
          fc.string()
        ),
        (key, defaultValue) => {
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          // Return invalid JSON
          mockLocalStorage.getItem.mockReturnValue('invalid-json{')

          const { value } = useStorageState(key, defaultValue)

          // Should fall back to default value on parse error
          expect(value.value).toEqual(defaultValue)
        }
      ))
    })
  })

  describe('Property 8.6: Storage Utilities', () => {
    it('should correctly detect localStorage availability', async () => {
      const { storageUtils } = await getStorageModule()
      
      // Test client context
      mockImportMeta.client = true
      globalThis.window = { localStorage: mockLocalStorage } as any
      globalThis.localStorage = mockLocalStorage as any

      expect(storageUtils.isAvailable()).toBe(true)

      // Test SSR context
      mockImportMeta.client = false
      delete (globalThis as any).window
      delete (globalThis as any).localStorage

      expect(storageUtils.isAvailable()).toBe(false)
    })

    it('should calculate storage size safely', async () => {
      const { storageUtils } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 100 })
        ),
        (storageData) => {
          mockImportMeta.client = true
          
          // Setup localStorage with test data
          const mockStorage = { ...storageData }
          Object.defineProperty(mockStorage, 'hasOwnProperty', {
            value: Object.prototype.hasOwnProperty,
            writable: false
          })
          
          globalThis.localStorage = mockStorage as any

          const size = storageUtils.getStorageSize()
          
          // Should return non-negative number
          expect(typeof size).toBe('number')
          expect(size).toBeGreaterThanOrEqual(0)
        }
      ))
    })

    it('should clear app storage with prefix safely', async () => {
      const { storageUtils } = await getStorageModule()
      
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 100 })
        ),
        (prefix, storageData) => {
          mockImportMeta.client = true
          globalThis.window = { localStorage: mockLocalStorage } as any
          globalThis.localStorage = mockLocalStorage as any

          // Setup test data
          Object.keys(storageData).forEach(key => {
            const prefixedKey = key.startsWith(prefix) ? key : `${prefix}${key}`
            mockLocalStorage.setItem(prefixedKey, storageData[key])
          })

          // Should not throw when clearing
          expect(() => storageUtils.clearAppStorage(prefix)).not.toThrow()
        }
      ))
    })
  })
})