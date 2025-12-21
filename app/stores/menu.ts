import { defineStore } from 'pinia'
import { useMenuService } from '~/services/menu.service'
import { useOfflineCart } from '~/composables/useOfflineCart'
import type { Category, MenuItem, MenuFilters, PaginationMeta, ApiError } from '~/types'

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

interface MenuState {
  // Clean business data only (no ApiResponse wrappers)
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
      console.log(items)
      // Filter by category
      if (state.currentCategory) {
        items = items.filter(item => item.categoryId === state.currentCategory)
      }

      // Filter by search query (case-insensitive, searches name and description)
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

      // Apply dietary filters (vegetarian, vegan, gluten-free, etc.)
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
      // This would typically come from backend analytics
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

    filteredItems() {
      return this.filteredMenuItems
    },

    // Favorites getter - delegates to favorites store
    favourites(): MenuItem[] {
      try {
        const { useFavoritesStore } = require('./favorites')
        const favoritesStore = useFavoritesStore()
        return favoritesStore.getFavoriteItems()
      } catch {
        return []
      }
    },
  },

  actions: {
    async fetchMenu() {
      console.log('🍽️ Menu Store - Starting fetchMenu')
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        console.log('✅ Menu Store - Menu service initialized')
        
        // Try to load from cache first for faster initial render (non-blocking)
        try {
          const { loadOfflineData } = useOfflineCart()
          console.log('📦 Menu Store - Attempting to load from cache...')
          
          const cachedCategories = await loadOfflineData('categories')
          const cachedMenuItems = await loadOfflineData('menuItems')
          
          if (cachedCategories && cachedMenuItems) {
            this.categories = cachedCategories
            this.menuItems = cachedMenuItems
            console.log('✅ Menu Store - Loaded from cache:', this.menuItems.length, 'items')
          } else {
            console.log('ℹ️ Menu Store - No cache found')
          }
        } catch (cacheError) {
          console.warn('⚠️ Menu Store - Cache loading failed (non-critical):', cacheError)
        }
        
        // Fetch fresh data from API (now returns unwrapped data)
        console.log('🌐 Menu Store - Fetching fresh data from API')
        const [categories, menuItemsResult] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems()
        ])

        console.log('📥 Menu Store - API responses received')
        console.log('  Categories:', categories.length, 'categories')
        console.log('  Menu Items:', menuItemsResult.items.length, 'items')

        // Store clean data directly
        this.categories = categories
        this.menuItems = menuItemsResult.items
        this.pagination = menuItemsResult.pagination
        
        console.log('✅ Menu Store - Data stored successfully')
        
        // Cache data for offline use (non-blocking)
        try {
          const { saveOfflineData } = useOfflineCart()
          await Promise.all([
            saveOfflineData('categories', this.categories),
            saveOfflineData('menuItems', this.menuItems)
          ])
          console.log('💾 Menu Store - Data cached successfully')
        } catch (cacheError) {
          console.warn('⚠️ Menu Store - Data caching failed (non-critical):', cacheError)
        }

      } catch (error) {
        console.error('❌ Menu Store - Fetch error:', error)
        
        // Store typed error
        this.error = error as ApiError
        
        // If we have cached data, use it and clear error
        if (this.categories.length > 0 && this.menuItems.length > 0) {
          console.log('📦 Menu Store - Using cached data due to error')
          this.error = null
        } else {
          console.error('💥 Menu Store - Final error:', this.error)
        }
      } finally {
        this.loading = false
        console.log('🏁 Menu Store - fetchMenu completed')
      }
    },

    async fetchMenuItems(params?: { page?: number; categoryId?: string; limit?: number }) {
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const result = await menuService.getMenuItems(params)

        // Store clean data directly
        this.menuItems = result.items
        this.pagination = result.pagination
        
      } catch (error) {
        this.error = error as ApiError
        console.error('Menu items fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchCategory(categoryId: string) {
      this.loading = true
      this.error = null
      this.currentCategory = categoryId

      try {
        const menuService = useMenuService()
        const result = await menuService.getMenuItems({ categoryId })

        // Store clean data directly
        const categoryItems = result.items
        // Replace items for this category while keeping others
        this.menuItems = [
          ...this.menuItems.filter(item => item.categoryId !== categoryId),
          ...categoryItems
        ]
        // Update pagination metadata
        this.pagination = result.pagination
        
      } catch (error) {
        this.error = error as ApiError
        console.error('Category fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async searchItems(query: string) {
      this.searchQuery = query
      
      if (!query.trim()) {
        return this.filteredMenuItems
      }

      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const items = await menuService.searchMenuItems(query, this.filters)

        // Store clean data directly
        this.menuItems = items
        // Clear pagination for search results
        this.pagination = null

        return this.filteredMenuItems
      } catch (error) {
        this.error = error as ApiError
        console.error('Search error:', error)
        return this.filteredMenuItems
      } finally {
        this.loading = false
      }
    },

    async toggleFavourite(itemId: string) {
      try {
        const { useFavoritesStore } = require('./favorites')
        const favoritesStore = useFavoritesStore()
        await favoritesStore.toggleFavorite(itemId)
      } catch (error) {
        console.error('Failed to toggle favourite:', error)
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

    // Initialize favourites from localStorage - delegates to favorites store
    initializeFavourites() {
      try {
        const { useFavoritesStore } = require('./favorites')
        const favoritesStore = useFavoritesStore()
        favoritesStore.initializeFavorites()
      } catch (error) {
        console.error('Failed to initialize favourites:', error)
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
        const menuService = useMenuService()
        const popularItems = await menuService.getPopularItems(8)

        // Store clean data directly
        // Merge with existing items, avoiding duplicates
        const existingIds = new Set(this.menuItems.map(item => item.id))
        const newItems = popularItems.filter(item => !existingIds.has(item.id))
        this.menuItems = [...this.menuItems, ...newItems]
        
      } catch (error) {
        this.error = error as ApiError
        console.error('Popular items fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchFavourites() {
      try {
        const { useFavoritesStore } = require('./favorites')
        const favoritesStore = useFavoritesStore()
        await favoritesStore.fetchFavoritesFromServer()
      } catch (error) {
        console.error('Failed to fetch favourite items:', error)
      }
    },

    async fetchMenuItem(itemId: string) {
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const item = await menuService.getMenuItem(itemId)

        if (item) {
          // Store clean data directly
          this.selectedDish = item
          
          // Update the item in the menu items array if it exists
          const existingIndex = this.menuItems.findIndex(menuItem => menuItem.id === itemId)
          if (existingIndex >= 0) {
            this.menuItems[existingIndex] = item
          } else {
            this.menuItems.push(item)
          }
          
          return item
        } else {
          // Item not found
          this.error = {
            code: 'NOT_FOUND',
            message: 'Menu item not found'
          } as ApiError
          return null
        }
      } catch (error) {
        this.error = error as ApiError
        console.error('Menu item fetch error:', error)
        return null
      } finally {
        this.loading = false
      }
    },
  },
})
