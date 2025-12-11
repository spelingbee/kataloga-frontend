import { defineStore } from 'pinia'
import { useMenuService } from '~/services/menu.service'
import type { MenuItem } from '~/types'

// Helper function to get tenant store (to avoid circular dependency)
function getTenantSlug(): string {
  try {
    const { useTenantStore } = require('./tenant')
    const tenantStore = useTenantStore()
    return tenantStore.tenantSlug || ''
  } catch {
    return ''
  }
}

// Helper function to get auth store
function getAuthStore() {
  try {
    const { useAuthStore } = require('./auth')
    return useAuthStore()
  } catch {
    return null
  }
}

interface FavoritesState {
  favoriteIds: string[]
  loading: boolean
  error: string | null
  lastSyncedAt: Date | null
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favoriteIds: [],
    loading: false,
    error: null,
    lastSyncedAt: null,
  }),

  getters: {
    isFavorite: (state) => (itemId: string) => {
      return state.favoriteIds.includes(itemId)
    },

    favoriteCount: (state) => state.favoriteIds.length,

    hasFavorites: (state) => state.favoriteIds.length > 0,
  },

  actions: {
    /**
     * Initialize favorites from localStorage
     * This is called on app startup
     */
    initializeFavorites() {
      if (!import.meta.client) return

      try {
        const tenantSlug = getTenantSlug()
        const storageKey = tenantSlug ? `favorites_${tenantSlug}` : 'favorites'
        const savedFavorites = localStorage.getItem(storageKey)
        
        if (savedFavorites) {
          this.favoriteIds = JSON.parse(savedFavorites)
          console.log('Favorites initialized from localStorage:', this.favoriteIds.length)
        }
      } catch (error) {
        console.error('Failed to initialize favorites:', error)
        this.favoriteIds = []
      }
    },

    /**
     * Add item to favorites
     * Syncs with server if user is authenticated
     */
    async addToFavorites(itemId: string) {
      if (this.favoriteIds.includes(itemId)) {
        return // Already in favorites
      }

      // Optimistically update UI
      this.favoriteIds.push(itemId)
      this.persistToLocalStorage()

      // Sync with server if authenticated
      const authStore = getAuthStore()
      if (authStore?.isAuthenticated) {
        try {
          const menuService = useMenuService()
          await menuService.addToFavorites(itemId)
          this.lastSyncedAt = new Date()
        } catch (error) {
          console.error('Failed to sync favorite to server:', error)
          // Keep local change even if server sync fails
        }
      }
    },

    /**
     * Remove item from favorites
     * Syncs with server if user is authenticated
     */
    async removeFromFavorites(itemId: string) {
      const index = this.favoriteIds.indexOf(itemId)
      if (index === -1) {
        return // Not in favorites
      }

      // Optimistically update UI
      this.favoriteIds.splice(index, 1)
      this.persistToLocalStorage()

      // Sync with server if authenticated
      const authStore = getAuthStore()
      if (authStore?.isAuthenticated) {
        try {
          const menuService = useMenuService()
          await menuService.removeFromFavorites(itemId)
          this.lastSyncedAt = new Date()
        } catch (error) {
          console.error('Failed to sync favorite removal to server:', error)
          // Keep local change even if server sync fails
        }
      }
    },

    /**
     * Toggle favorite status for an item
     */
    async toggleFavorite(itemId: string) {
      if (this.isFavorite(itemId)) {
        await this.removeFromFavorites(itemId)
      } else {
        await this.addToFavorites(itemId)
      }
    },

    /**
     * Clear all favorites
     */
    async clearAllFavorites() {
      this.favoriteIds = []
      this.persistToLocalStorage()

      // Sync with server if authenticated
      const authStore = getAuthStore()
      if (authStore?.isAuthenticated) {
        try {
          // Clear all favorites on server
          // Note: This would need a backend endpoint
          console.log('Clear all favorites on server not implemented yet')
        } catch (error) {
          console.error('Failed to clear favorites on server:', error)
        }
      }
    },

    /**
     * Fetch favorites from server for authenticated users
     * This syncs server favorites to local storage
     */
    async fetchFavoritesFromServer() {
      const authStore = getAuthStore()
      if (!authStore?.isAuthenticated) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const response = await menuService.getFavoriteItems()

        if (response.success && response.data) {
          // Extract IDs from favorite items
          this.favoriteIds = response.data.map((item: MenuItem) => item.id)
          this.persistToLocalStorage()
          this.lastSyncedAt = new Date()
          console.log('Favorites synced from server:', this.favoriteIds.length)
        }
      } catch (error) {
        this.error = 'Failed to fetch favorites from server'
        console.error('Favorites fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Sync local favorites to server when user logs in
     */
    async syncFavoritesToServer() {
      const authStore = getAuthStore()
      if (!authStore?.isAuthenticated || this.favoriteIds.length === 0) {
        return
      }

      try {
        const menuService = useMenuService()
        
        // Add all local favorites to server
        for (const itemId of this.favoriteIds) {
          await menuService.addToFavorites(itemId)
        }
        
        this.lastSyncedAt = new Date()
        console.log('Local favorites synced to server')
      } catch (error) {
        console.error('Failed to sync favorites to server:', error)
      }
    },

    /**
     * Persist favorites to localStorage with tenant context
     */
    persistToLocalStorage() {
      if (!import.meta.client) return

      try {
        const tenantSlug = getTenantSlug()
        const storageKey = tenantSlug ? `favorites_${tenantSlug}` : 'favorites'
        localStorage.setItem(storageKey, JSON.stringify(this.favoriteIds))
      } catch (error) {
        console.error('Failed to persist favorites to localStorage:', error)
      }
    },

    /**
     * Get favorite menu items
     * This requires the menu store to be loaded
     */
    getFavoriteItems(): MenuItem[] {
      try {
        const { useMenuStore } = require('./menu')
        const menuStore = useMenuStore()
        
        return menuStore.menuItems.filter((item: MenuItem) => 
          this.favoriteIds.includes(item.id)
        )
      } catch (error) {
        console.error('Failed to get favorite items:', error)
        return []
      }
    },
  },
})
