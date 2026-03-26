import { defineStore } from 'pinia'
import { useMenuService } from '~/services/menu.service'
import { useOfflineCart } from '~/composables/useOfflineCart'
import {
  menuItemAPIToUI,
  categoryAPIToUI,
  convertArrayAPIToUI
} from '~/types/utils/converters'
import { isValidCategoryUIArray, isValidMenuItemUIArray } from '~/utils/validation'
import type { CategoryUI, MenuItemUI, MenuFilters, PaginationMeta, ApiError } from '~/types'



interface MenuState {
  // Clean business data only (no ApiResponse wrappers)
  categories: CategoryUI[]
  menuItems: MenuItemUI[]
  pagination: PaginationMeta | null
  currentCategory: string | null
  searchQuery: string
  filters: MenuFilters
  selectedDish: MenuItemUI | null

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
      let items = [...state.menuItems] // Create mutable copy
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
            (item.description && item.description.toLowerCase().includes(query))
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
          return state.filters.dietary?.some(diet => item.dietary.includes(diet)) ?? false
        })
      }

      // Apply availability filter
      if (state.filters.availability) {
        items = items.filter(item => item.isActive)
      }

      // Apply cooking time filter
      if (state.filters.cookingTime) {
        items = items.filter(item =>
          item.cookingTime && state.filters.cookingTime !== undefined && item.cookingTime <= state.filters.cookingTime
        )
      }

      return items
    },

    popularItems: state => {
      // This would typically come from backend analytics
      return [...state.menuItems.slice(0, 8)] // Create mutable copy
    },

    itemsByCategory: state => {
      return state.categories.reduce(
        (acc, category) => {
          acc[category.id] = [...state.menuItems.filter(item => item.categoryId === category.id)] // Create mutable copy
          return acc
        },
        {} as Record<string, MenuItemUI[]>
      )
    },

    filteredItems() {
      return this.filteredMenuItems
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

          const areCategoriesValid = isValidCategoryUIArray(cachedCategories)
          const areMenuItemsValid = isValidMenuItemUIArray(cachedMenuItems)

          if (areCategoriesValid && areMenuItemsValid) {
            this.categories = cachedCategories
            this.menuItems = cachedMenuItems
            console.log('✅ Menu Store - Loaded from cache:', this.menuItems.length, 'items')
          } else {
            console.log('ℹ️ Menu Store - Invalid or missing cache')
            if (!areCategoriesValid && cachedCategories) console.warn('Invalid cached categories')
            if (!areMenuItemsValid && cachedMenuItems) console.warn('Invalid cached menu items')
          }
        } catch (cacheError) {
          console.warn('⚠️ Menu Store - Cache loading failed (non-critical):', cacheError)
        }

        // Fetch fresh data from API (returns API types)
        console.log('🌐 Menu Store - Fetching fresh data from API')
        const [categoriesAPI, menuItemsResult] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems()
        ])

        console.log('📥 Menu Store - API responses received')
        console.log('  Categories:', categoriesAPI.length, 'categories')
        console.log('  Menu Items:', menuItemsResult.items.length, 'items')

        // Convert API data to UI types using converters
        const categoriesUI = convertArrayAPIToUI(categoriesAPI, (cat) =>
          categoryAPIToUI(cat, 0) // itemCount will be calculated below
        )
        const menuItemsUI = convertArrayAPIToUI(menuItemsResult.items, menuItemAPIToUI)

        // Update category counts based on converted menu items
        categoriesUI.forEach(category => {
          category.count = menuItemsUI.filter(item => item.categoryId === category.id).length
        })

        // Store converted UI data
        this.categories = categoriesUI
        this.menuItems = menuItemsUI
        this.pagination = menuItemsResult.pagination

        console.log('✅ Menu Store - Data converted and stored successfully')

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

        // Convert API data to UI types using converters
        const menuItemsUI = convertArrayAPIToUI(result.items, menuItemAPIToUI)

        // Store converted UI data
        this.menuItems = menuItemsUI
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

        // Convert API data to UI types using converters
        const categoryItemsUI = convertArrayAPIToUI(result.items, menuItemAPIToUI)

        // Replace items for this category while keeping others
        this.menuItems = [
          ...this.menuItems.filter(item => item.categoryId !== categoryId),
          ...categoryItemsUI
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
        const itemsAPI = await menuService.searchMenuItems(query, this.filters)

        // Convert API data to UI types using converters
        const itemsUI = convertArrayAPIToUI(itemsAPI, menuItemAPIToUI)

        // Store converted UI data
        this.menuItems = itemsUI
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

    setSelectedDish(dish: MenuItemUI) {
      this.selectedDish = dish
    },

    clearSelectedDish() {
      this.selectedDish = null
    },

    getMenuItemById(itemId: string): MenuItemUI | undefined {
      return this.menuItems.find(item => item.id === itemId)
    },

    getItemsByCategory(categoryId: string): MenuItemUI[] {
      return [...this.menuItems.filter(item => item.categoryId === categoryId)] // Create mutable copy
    },

    clearSearch() {
      this.searchQuery = ''
    },

    async fetchPopularItems() {
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const popularItemsAPI = await menuService.getPopularItems(8)

        // Convert API data to UI types using converters
        const popularItemsUI = convertArrayAPIToUI(popularItemsAPI, menuItemAPIToUI)

        // Merge with existing items, avoiding duplicates
        const existingIds = new Set(this.menuItems.map(item => item.id))
        const newItems = popularItemsUI.filter(item => !existingIds.has(item.id))
        this.menuItems = [...this.menuItems, ...newItems]

      } catch (error) {
        this.error = error as ApiError
        console.error('Popular items fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchMenuItem(itemId: string) {
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const itemAPI = await menuService.getMenuItem(itemId)

        if (itemAPI) {
          // Convert API data to UI type using converter
          const itemUI = menuItemAPIToUI(itemAPI)

          // Store converted UI data
          this.selectedDish = itemUI

          // Update the item in the menu items array if it exists
          const existingIndex = this.menuItems.findIndex(menuItem => menuItem.id === itemId)
          if (existingIndex >= 0) {
            this.menuItems[existingIndex] = itemUI
          } else {
            this.menuItems.push(itemUI)
          }

          return itemUI
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
