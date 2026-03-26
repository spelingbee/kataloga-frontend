import { defineStore } from 'pinia'
import { useMenuService } from '~/services/menu.service'
import { useAuthStore } from './auth'
import { useTenantStorage } from '~/composables/useStorage'
import { 
  menuItemAPIToUI, 
  convertArrayAPIToUI 
} from '~/types/utils/converters'
import type { MenuItemUI, ApiError } from '~/types'

interface FavoritesState {
  favoriteIds: string[]
  loading: boolean
  error: ApiError | null
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
     * Get storage instance for favorites
     */
    _getStorage() {
      return useTenantStorage('favorites', [] as string[])
    },

    /**
     * Initialize favorites from storage
     * This is called on app startup
     */
    initializeFavorites() {
      const { value: storedFavorites } = this._getStorage()
      
      try {
        this.favoriteIds = storedFavorites.value
        console.log('Favorites initialized from storage:', this.favoriteIds.length)
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
      this._persistToStorage()

      // Sync with server if authenticated
      const authStore = useAuthStore()
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
      this._persistToStorage()

      // Sync with server if authenticated
      const authStore = useAuthStore()
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
      this._persistToStorage()

      // Sync with server if authenticated
      const authStore = useAuthStore()
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
      const authStore = useAuthStore()
      if (!authStore?.isAuthenticated) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        // Service now returns API types, convert to UI types
        const favoriteItemsAPI = await menuService.getFavoriteItems()
        const favoriteItemsUI = convertArrayAPIToUI(favoriteItemsAPI, menuItemAPIToUI)

        // Extract IDs from favorite items
        this.favoriteIds = favoriteItemsUI.map((item: MenuItemUI) => item.id)
        this._persistToStorage()
        this.lastSyncedAt = new Date()
        console.log('Favorites synced from server:', this.favoriteIds.length)
      } catch (error) {
        this.error = error as ApiError
        console.error('Favorites fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Sync local favorites to server when user logs in
     */
    async syncFavoritesToServer() {
      const authStore = useAuthStore()
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
     * Persist favorites to storage with tenant context
     */
    _persistToStorage() {
      const { setValue } = this._getStorage()
      
      try {
        setValue(this.favoriteIds)
      } catch (error) {
        console.error('Failed to persist favorites to storage:', error)
      }
    },
  },
})
