import { defineStore } from 'pinia'
import type { MenuItem, ApiError } from '~/types'
import { useTenantStore } from '~/stores/tenant'
import { useUserStore } from '~/stores/user'
import { useMenuStore } from '~/stores/menu'

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
    initializeFavorites() {
      if (!import.meta.client) return
      try {
        const tenantStore = useTenantStore()
        const storageKey = tenantStore.tenantSlug ? `favorites_${tenantStore.tenantSlug}` : 'favorites'
        const savedFavorites = localStorage.getItem(storageKey)
        if (savedFavorites) {
          this.favoriteIds = JSON.parse(savedFavorites)
        }
      } catch (error) {
        this.favoriteIds = []
      }
    },

    async addToFavorites(itemId: string) {
      if (this.favoriteIds.includes(itemId)) return
      this.favoriteIds.push(itemId)
      this.persistToLocalStorage()

      const authStore = useUserStore()
      if (authStore.isAuthenticated) {
        try {
          await (this as any).$services.menu.addToFavorites(itemId)
          this.lastSyncedAt = new Date()
        } catch (error) {}
      }
    },

    async removeFromFavorites(itemId: string) {
      const index = this.favoriteIds.indexOf(itemId)
      if (index === -1) return
      this.favoriteIds.splice(index, 1)
      this.persistToLocalStorage()

      const authStore = useUserStore()
      if (authStore.isAuthenticated) {
        try {
          await (this as any).$services.menu.removeFromFavorites(itemId)
          this.lastSyncedAt = new Date()
        } catch (error) {}
      }
    },

    async toggleFavorite(itemId: string) {
      if (this.isFavorite(itemId)) {
        await this.removeFromFavorites(itemId)
      } else {
        await this.addToFavorites(itemId)
      }
    },

    async clearAllFavorites() {
      this.favoriteIds = []
      this.persistToLocalStorage()
    },

    async fetchFavoritesFromServer() {
      const authStore = useUserStore()
      if (!authStore.isAuthenticated) return

      this.loading = true
      this.error = null

      try {
        const favoriteItems = await (this as any).$services.menu.getFavoriteItems()
        this.favoriteIds = favoriteItems.map((item: MenuItem) => item.id)
        this.persistToLocalStorage()
        this.lastSyncedAt = new Date()
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async syncFavoritesToServer() {
      const authStore = useUserStore()
      if (!authStore.isAuthenticated || this.favoriteIds.length === 0) return

      try {
        for (const itemId of this.favoriteIds) {
          await (this as any).$services.menu.addToFavorites(itemId)
        }
        this.lastSyncedAt = new Date()
      } catch (error) {}
    },

    persistToLocalStorage() {
      if (!import.meta.client) return
      try {
        const tenantStore = useTenantStore()
        const storageKey = tenantStore.tenantSlug ? `favorites_${tenantStore.tenantSlug}` : 'favorites'
        localStorage.setItem(storageKey, JSON.stringify(this.favoriteIds))
      } catch (error) {}
    },

    getFavoriteItems(): MenuItem[] {
      try {
        const menuStore = useMenuStore()
        return menuStore.menuItems.filter((item: MenuItem) => this.favoriteIds.includes(item.id))
      } catch (error) {
        return []
      }
    },
  },
})
