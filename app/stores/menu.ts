import { defineStore } from 'pinia'
import { useMenuService } from '~/services/menu.service'
import { useOfflineCart } from '~/composables/useOfflineCart'
import type { Category, MenuItem, MenuFilters } from '~/types'

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
  categories: Category[]
  menuItems: MenuItem[]
  currentCategory: string | null
  searchQuery: string
  filters: MenuFilters
  loading: boolean
  error: string | null
  selectedDish: MenuItem | null
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    categories: [],
    menuItems: [],
    currentCategory: null,
    searchQuery: '',
    filters: {},
    loading: false,
    error: null,
    selectedDish: null,
  }),

  getters: {
    filteredMenuItems: state => {
      let items = state.menuItems

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
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const { saveOfflineData, loadOfflineData } = useOfflineCart()
        
        // Try to load from cache first for faster initial render
        const cachedCategories = await loadOfflineData('categories')
        const cachedMenuItems = await loadOfflineData('menuItems')
        
        if (cachedCategories && cachedMenuItems) {
          this.categories = cachedCategories
          this.menuItems = cachedMenuItems
          console.log('Menu loaded from cache:', this.menuItems.length, 'items')
        }
        
        // Fetch fresh data from API
        const [categoriesResponse, menuItemsResponse] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems()
        ])

        if (categoriesResponse.success && categoriesResponse.data) {
          this.categories = categoriesResponse.data
          // Cache categories for offline use
          await saveOfflineData('categories', this.categories)
          console.log('Categories loaded from API:', this.categories)
        } else {
          console.error('Failed to load categories:', categoriesResponse.message)
          // If API fails and we have no cache, throw error
          if (!cachedCategories) {
            throw new Error('No categories available')
          }
        }

        if (menuItemsResponse.success && menuItemsResponse.data) {
          this.menuItems = menuItemsResponse.data.items
          // Cache menu items for offline use
          await saveOfflineData('menuItems', this.menuItems)
          console.log('Menu items loaded from API:', this.menuItems.length, 'items')
        } else {
          console.error('Failed to load menu items:', menuItemsResponse.message)
          // If API fails and we have no cache, throw error
          if (!cachedMenuItems) {
            throw new Error('No menu items available')
          }
        }

      } catch (error) {
        // If we have cached data, use it and don't show error
        if (this.categories.length > 0 && this.menuItems.length > 0) {
          console.log('Using cached menu data due to network error')
          this.error = null
        } else {
          this.error = 'Failed to fetch menu data'
          console.error('Menu fetch error:', error)
        }
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
        const response = await menuService.getMenuItems({ categoryId })

        if (response.success && response.data) {
          // Update menu items for this category
          const categoryItems = response.data.items
          // Replace items for this category while keeping others
          this.menuItems = [
            ...this.menuItems.filter(item => item.categoryId !== categoryId),
            ...categoryItems
          ]
        }
      } catch (error) {
        this.error = 'Failed to fetch category data'
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
        const response = await menuService.searchMenuItems(query, this.filters)

        if (response.success && response.data) {
          // Update search results
          this.menuItems = response.data
        }

        return this.filteredMenuItems
      } catch (error) {
        this.error = 'Failed to search menu items'
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
        const response = await menuService.getPopularItems(8)

        if (response.success && response.data) {
          // Update popular items in the menu items array
          const popularItems = response.data
          // Merge with existing items, avoiding duplicates
          const existingIds = new Set(this.menuItems.map(item => item.id))
          const newItems = popularItems.filter(item => !existingIds.has(item.id))
          this.menuItems = [...this.menuItems, ...newItems]
        }
      } catch (error) {
        this.error = 'Failed to fetch popular items'
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
        const response = await menuService.getMenuItem(itemId)

        if (response.success && response.data) {
          const item = response.data
          this.selectedDish = item
          
          // Update the item in the menu items array if it exists
          const existingIndex = this.menuItems.findIndex(menuItem => menuItem.id === itemId)
          if (existingIndex >= 0) {
            this.menuItems[existingIndex] = item
          } else {
            this.menuItems.push(item)
          }
          
          return item
        }
      } catch (error) {
        this.error = 'Failed to fetch menu item'
        console.error('Menu item fetch error:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
