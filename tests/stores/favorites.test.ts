import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFavoritesStore } from '~/stores/favorites'

// Mock import.meta.client to be true in tests
Object.defineProperty(import.meta, 'client', {
  value: true,
  writable: true
})

// Mock the require function used in getTenantSlug
const mockRequire = vi.fn()
mockRequire.mockImplementation((path) => {
  if (path === './tenant') {
    return {
      useTenantStore: () => ({
        tenantSlug: null
      })
    }
  }
  if (path === './auth') {
    return {
      useAuthStore: () => ({
        isAuthenticated: false
      })
    }
  }
  return {}
})

// Mock the global require function
global.require = mockRequire

// Mock auth store
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: false
  })
}))

// Mock tenant store
vi.mock('~/stores/tenant', () => ({
  useTenantStore: () => ({
    tenantSlug: null
  })
}))

// Mock menu service
vi.mock('~/services/menu.service', () => ({
  useMenuService: () => ({
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    getFavoriteItems: vi.fn()
  })
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

describe('Favorites Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
    
    // Clear localStorage before each test
    localStorageMock.clear()
  })

  describe('Initialization', () => {
    it('should initialize with empty favorites', () => {
      const store = useFavoritesStore()
      
      expect(store.favoriteIds).toEqual([])
      expect(store.favoriteCount).toBe(0)
      expect(store.hasFavorites).toBe(false)
    })

    it('should load favorites from localStorage on initialization', () => {
      // Setup localStorage with some favorites
      localStorage.setItem('favorites', JSON.stringify(['item1', 'item2', 'item3']))
      
      const store = useFavoritesStore()
      store.initializeFavorites()
      
      expect(store.favoriteIds).toEqual(['item1', 'item2', 'item3'])
      expect(store.favoriteCount).toBe(3)
      expect(store.hasFavorites).toBe(true)
    })
  })

  describe('Adding Favorites', () => {
    it('should add item to favorites', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      
      expect(store.favoriteIds).toContain('item1')
      expect(store.favoriteCount).toBe(1)
      expect(store.isFavorite('item1')).toBe(true)
    })

    it('should not add duplicate items', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      await store.addToFavorites('item1')
      
      expect(store.favoriteIds).toEqual(['item1'])
      expect(store.favoriteCount).toBe(1)
    })

    it('should persist to localStorage when adding favorite', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
      expect(stored).toContain('item1')
    })
  })

  describe('Removing Favorites', () => {
    it('should remove item from favorites', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      await store.addToFavorites('item2')
      
      await store.removeFromFavorites('item1')
      
      expect(store.favoriteIds).not.toContain('item1')
      expect(store.favoriteIds).toContain('item2')
      expect(store.favoriteCount).toBe(1)
    })

    it('should handle removing non-existent item gracefully', async () => {
      const store = useFavoritesStore()
      
      await store.removeFromFavorites('nonexistent')
      
      expect(store.favoriteIds).toEqual([])
    })

    it('should persist to localStorage when removing favorite', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      await store.addToFavorites('item2')
      await store.removeFromFavorites('item1')
      
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
      expect(stored).not.toContain('item1')
      expect(stored).toContain('item2')
    })
  })

  describe('Toggle Favorite', () => {
    it('should add item if not in favorites', async () => {
      const store = useFavoritesStore()
      
      await store.toggleFavorite('item1')
      
      expect(store.isFavorite('item1')).toBe(true)
    })

    it('should remove item if already in favorites', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      await store.toggleFavorite('item1')
      
      expect(store.isFavorite('item1')).toBe(false)
    })
  })

  describe('Clear All Favorites', () => {
    it('should clear all favorites', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      await store.addToFavorites('item2')
      await store.addToFavorites('item3')
      
      await store.clearAllFavorites()
      
      expect(store.favoriteIds).toEqual([])
      expect(store.favoriteCount).toBe(0)
      expect(store.hasFavorites).toBe(false)
    })

    it('should clear localStorage when clearing all favorites', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      await store.clearAllFavorites()
      
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
      expect(stored).toEqual([])
    })
  })

  describe('Getters', () => {
    it('should correctly identify favorite items', async () => {
      const store = useFavoritesStore()
      
      await store.addToFavorites('item1')
      
      expect(store.isFavorite('item1')).toBe(true)
      expect(store.isFavorite('item2')).toBe(false)
    })

    it('should return correct favorite count', async () => {
      const store = useFavoritesStore()
      
      expect(store.favoriteCount).toBe(0)
      
      await store.addToFavorites('item1')
      expect(store.favoriteCount).toBe(1)
      
      await store.addToFavorites('item2')
      expect(store.favoriteCount).toBe(2)
    })

    it('should correctly report if has favorites', async () => {
      const store = useFavoritesStore()
      
      expect(store.hasFavorites).toBe(false)
      
      await store.addToFavorites('item1')
      expect(store.hasFavorites).toBe(true)
      
      await store.clearAllFavorites()
      expect(store.hasFavorites).toBe(false)
    })
  })
})
