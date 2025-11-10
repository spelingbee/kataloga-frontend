import { defineStore } from 'pinia'
import { useMenuService } from '~/services/menu.service'
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
  favourites: MenuItem[]
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
    favourites: [],
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

      // Filter by search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        items = items.filter(
          item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        )
      }

      // Apply filters
      if (state.filters.priceRange) {
        const [min, max] = state.filters.priceRange
        items = items.filter(item => item.price >= min && item.price <= max)
      }

      if (state.filters.calories) {
        const [min, max] = state.filters.calories
        items = items.filter(item => item.calories && item.calories >= min && item.calories <= max)
      }

      if (state.filters.availability) {
        items = items.filter(item => item.isActive)
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
  },

  actions: {
    async fetchMenu() {
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        
        // Fetch categories and menu items
        const [categoriesResponse, menuItemsResponse] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems()
        ])

        if (categoriesResponse.success && categoriesResponse.data) {
          this.categories = categoriesResponse.data
          console.log('Categories loaded from API:', this.categories)
        } else {
          console.error('Failed to load categories:', categoriesResponse.message)
        }

        if (menuItemsResponse.success && menuItemsResponse.data) {
          this.menuItems = menuItemsResponse.data.items
          console.log('Menu items loaded from API:', this.menuItems.length, 'items')
        } else {
          console.error('Failed to load menu items:', menuItemsResponse.message)
        }

        // Initialize favourites after menu items are loaded
        this.initializeFavourites()
      } catch (error) {
        this.error = 'Failed to fetch menu data'
        console.error('Menu fetch error:', error)
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
      const item = this.menuItems.find(item => item.id === itemId)
      if (!item) return

      const favouriteIndex = this.favourites.findIndex(fav => fav.id === itemId)
      const isCurrentlyFavourite = favouriteIndex >= 0

      try {
        const menuService = useMenuService()
        
        if (isCurrentlyFavourite) {
          await menuService.removeFromFavorites(itemId)
          this.favourites.splice(favouriteIndex, 1)
        } else {
          await menuService.addToFavorites(itemId)
          this.favourites.push(item)
        }

        // Persist to localStorage with tenant context
        if (import.meta.client) {
          const tenantSlug = getTenantSlug()
          const storageKey = tenantSlug ? `favourites_${tenantSlug}` : 'favourites'
          localStorage.setItem(storageKey, JSON.stringify(this.favourites.map(item => item.id)))
        }
      } catch (error) {
        console.error('Failed to toggle favourite:', error)
        // Revert the change if API call failed
        // The UI should handle this gracefully
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

    // Initialize favourites from localStorage
    initializeFavourites() {
      if (import.meta.client) {
        // Get tenant context for tenant-specific storage
        const tenantSlug = getTenantSlug()
        
        // Use tenant-specific key if tenant is set
        const storageKey = tenantSlug ? `favourites_${tenantSlug}` : 'favourites'
        const savedFavourites = localStorage.getItem(storageKey)
        if (savedFavourites) {
          const favouriteIds = JSON.parse(savedFavourites)
          this.favourites = this.menuItems.filter(item => favouriteIds.includes(item.id))
        }
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
      this.loading = true
      this.error = null

      try {
        const menuService = useMenuService()
        const response = await menuService.getFavoriteItems()

        if (response.success && response.data) {
          this.favourites = response.data
          
          // Persist to localStorage with tenant context
          if (import.meta.client) {
            const tenantSlug = getTenantSlug()
            const storageKey = tenantSlug ? `favourites_${tenantSlug}` : 'favourites'
            localStorage.setItem(storageKey, JSON.stringify(this.favourites.map(item => item.id)))
          }
        }
      } catch (error) {
        this.error = 'Failed to fetch favourite items'
        console.error('Favourites fetch error:', error)
        // Fall back to localStorage
        this.initializeFavourites()
      } finally {
        this.loading = false
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
