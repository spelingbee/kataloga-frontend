import { defineStore } from 'pinia'
import type { Category, MenuItem, MenuFilters, PaginationMeta, ApiError } from '~/types'
import { useFavoritesStore } from './favorites'

interface MenuState {
  // Clean business data only
  categories: Category[]
  menuItems: MenuItem[]
  pagination: PaginationMeta | null
  currentCategory: string | null
  searchQuery: string
  filters: MenuFilters
  selectedDish: MenuItem | null

  // State management
  loading: boolean
  error: ApiError | null
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    // Clean business data only
    categories: [],
    menuItems: [],
    pagination: null,
    currentCategory: null,
    searchQuery: '',
    filters: {},
    selectedDish: null,

    // State management
    loading: false,
    error: null,
  }),

  getters: {
    filteredMenuItems: state => {
      let items = state.menuItems
      // Filter by category
      if (state.currentCategory) {
        items = items.filter(item => item.categoryId === state.currentCategory)
      }

      // Filter by search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase().trim()
        items = items.filter(
          item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        )
      }

      // Apply price range filter
      if (state.filters.priceRange) {
        const [min, max] = state.filters.priceRange
        items = items.filter(item => item.price >= min && item.price <= max)
      }

      // Apply calorie range filter
      if (state.filters.calories) {
        const [min, max] = state.filters.calories
        items = items.filter(item => item.calories && item.calories >= min && item.calories <= max)
      }

      // Apply dietary filters
      if (state.filters.dietary && state.filters.dietary.length > 0) {
        items = items.filter(item => {
          if (!item.dietary) return false
          return state.filters.dietary!.some(diet => item.dietary!.includes(diet))
        })
      }

      // Apply availability filter
      if (state.filters.availability) {
        items = items.filter(item => item.isActive)
      }

      // Apply cooking time filter
      if (state.filters.cookingTime) {
        items = items.filter(item =>
          item.cookingTime && item.cookingTime <= state.filters.cookingTime!
        )
      }

      return items
    },

    popularItems: state => {
      return state.menuItems.slice(0, 8)
    },

    itemsByCategory: state => {
      return state.categories.reduce(
        (acc, category) => {
          acc[category.id] = state.menuItems.filter(item => item.categoryId === category.id)
          return acc
        },
        {} as Record<string, MenuItem[]>
      )
    },

    favourites(): MenuItem[] {
      try {
        const favoritesStore = useFavoritesStore()
        return favoritesStore.getFavoriteItems()
      } catch {
        return []
      }
    },

    getMenuItemById: state => (id: string): MenuItem | null => {
      return state.menuItems.find(item => item.id === id) || null
    },
  },

  actions: {
    async fetchMenu() {
      this.loading = true
      this.error = null

      try {
        const menuService = (this as any).$services.menu

        const [categories, menuItemsResult] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems()
        ])

        this.categories = categories
        this.menuItems = menuItemsResult.items
        this.pagination = menuItemsResult.pagination
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async fetchMenuItems(params?: { page?: number; categoryId?: string; limit?: number }) {
      this.loading = true
      this.error = null

      try {
        const result = await (this as any).$services.menu.getMenuItems(params)
        this.menuItems = result.items
        this.pagination = result.pagination
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async fetchCategory(categoryId: string) {
      this.loading = true
      this.error = null
      this.currentCategory = categoryId

      try {
        const result = await (this as any).$services.menu.getMenuItems({ categoryId })
        const categoryItems = result.items
        this.menuItems = [
          ...this.menuItems.filter(item => item.categoryId !== categoryId),
          ...categoryItems
        ]
        this.pagination = result.pagination
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async searchItems(query: string) {
      this.searchQuery = query
      if (!query.trim()) return this.filteredMenuItems

      this.loading = true
      this.error = null

      try {
        const items = await (this as any).$services.menu.searchMenuItems(query, this.filters)
        this.menuItems = items
        this.pagination = null
        return this.filteredMenuItems
      } catch (error) {
        this.error = error as ApiError
        return this.filteredMenuItems
      } finally {
        this.loading = false
      }
    },

    async toggleFavourite(itemId: string) {
      try {
        const favoritesStore = useFavoritesStore()
        await favoritesStore.toggleFavorite(itemId)
      } catch (error) {
      }
    },

    applyFilters(filters: MenuFilters) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {}
      this.searchQuery = ''
    },

    setCurrentCategory(categoryId: string | null) {
      this.currentCategory = categoryId
    },

    initializeFavourites() {
      try {
        const favoritesStore = useFavoritesStore()
        favoritesStore.initializeFavorites()
      } catch (error) {
      }
    },

    setSelectedDish(dish: MenuItem) {
      this.selectedDish = dish
    },

    clearSelectedDish() {
      this.selectedDish = null
    },

    clearSearch() {
      this.searchQuery = ''
    },

    async fetchPopularItems() {
      this.loading = true
      this.error = null

      try {
        const popularItems = await (this as any).$services.menu.getPopularItems(8)
        const existingIds = new Set(this.menuItems.map(item => item.id))
        const newItems = popularItems.filter((item: MenuItem) => !existingIds.has(item.id))
        this.menuItems = [...this.menuItems, ...newItems]
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async fetchFavourites() {
      try {
        const favoritesStore = useFavoritesStore()
        await favoritesStore.fetchFavoritesFromServer()
      } catch (error) {
      }
    },

    async fetchMenuItem(itemId: string) {
      this.loading = true
      this.error = null

      try {
        const item = await (this as any).$services.menu.getMenuItem(itemId)

        if (item) {
          this.selectedDish = item
          const existingIndex = this.menuItems.findIndex(menuItem => menuItem.id === itemId)
          if (existingIndex >= 0) {
            this.menuItems[existingIndex] = item
          } else {
            this.menuItems.push(item)
          }
          return item
        } else {
          this.error = {
            code: 'NOT_FOUND',
            message: 'Menu item not found'
          } as ApiError
          return null
        }
      } catch (error) {
        this.error = error as ApiError
        return null
      } finally {
        this.loading = false
      }
    },
  },
})
