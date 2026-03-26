import type { CategoryAPI, MenuItemAPI, MenuFilters, PaginatedResult } from '~/types'
import { useApiClient } from '~/utils/api'

// Import store at the bottom to avoid circular dependency issues if any
import { useTenantStore } from '~/stores/tenant'

export class MenuService {
  private apiClient = useApiClient()

  private getApiClient() {
    return this.apiClient
  }

  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCachedData<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Get categories (returns API types for conversion)
   * Returns: CategoryAPI[] (to be converted to UI types by stores)
   * Requirements: 2.1
   */
  async getCategories(): Promise<CategoryAPI[]> {
    const cacheKey = 'categories'
    const cached = this.getCachedData<CategoryAPI[]>(cacheKey)
    if (cached) return cached

    // Get categories from public categories endpoint
    const tenantSlug = this.getTenantSlug()
    console.log('🏢 Menu Service - Tenant slug:', tenantSlug)

    if (!tenantSlug) {
      console.error('❌ Menu Service - No tenant slug configured')
      throw new Error('Tenant slug not configured')
    }

    try {
      const apiUrl = `/public/menu/${tenantSlug}/categories`
      console.log('🌐 Menu Service - Fetching categories from:', apiUrl)

      // Use unwrapped API client - returns clean data directly
      const response = await this.getApiClient().get<CategoryAPI[]>(apiUrl)
      console.log('📥 Menu Service - Categories response:', response)

      // Handle direct array response format
      let categories: any[] = []

      if (Array.isArray(response)) {
        categories = response
      } else {
        console.error('❌ Menu Service - Categories response not in expected format:', response)
        throw new Error('Invalid response format')
      }

      // Map backend categories to API format (not UI format)
      const mappedCategories: CategoryAPI[] = categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: cat.description || null, // Use null for API compatibility
        imageUrl: null, // Backend doesn't provide imageUrl yet
        icon: this.getCategoryIcon(cat.name),
        sortOrder: 0
      }))

      console.log('✅ Menu Service - Categories mapped:', mappedCategories.length, 'categories')

      this.setCachedData(cacheKey, mappedCategories, 600000) // 10 minutes
      return mappedCategories

    } catch (error) {
      console.error('❌ Menu Service - Categories fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Check for specific error types
      if (errorMessage.includes('fetch')) {
        console.error('🌐 Network Error - Check if backend is running on http://localhost:3001')
      }
      if (errorMessage.includes('CORS')) {
        console.error('🚫 CORS Error - Check backend CORS configuration')
      }
      if (errorMessage.includes('404')) {
        console.error('🔍 Not Found - Check if tenant exists:', tenantSlug)
      }

      throw new Error(`Failed to fetch categories: ${errorMessage}`)
    }
  }

  /**
   * Get single category (returns API type for conversion)
   * Returns: CategoryAPI | null
   * Requirements: 2.3
   */
  async getCategory(categoryId: string): Promise<CategoryAPI | null> {
    try {
      // Get category from cached categories
      const categories = await this.getCategories()
      const category = categories.find(cat => cat.id === categoryId)

      if (category) {
        return category
      }

      // Category not found - return null instead of throwing
      return null
    } catch (error) {
      console.error('❌ Menu Service - Category fetch error:', error)
      // Return null for not found cases
      return null
    }
  }

  /**
   * Get paginated menu items (returns API types for conversion)
   * Returns: PaginatedResult<MenuItemAPI> (to be converted to UI types by stores)
   * Requirements: 2.1, 2.2
   */
  async getMenuItems(params?: {
    categoryId?: string
    search?: string
    filters?: MenuFilters
    page?: number
    limit?: number
  }): Promise<PaginatedResult<MenuItemAPI>> {
    const tenantSlug = this.getTenantSlug()
    console.log('🏢 Menu Service - Getting menu items for tenant:', tenantSlug)

    if (!tenantSlug) {
      console.error('❌ Menu Service - No tenant slug configured')
      throw new Error('Tenant slug not configured')
    }

    try {
      const apiUrl = `/public/menu/${tenantSlug}`
      console.log('🌐 Menu Service - Fetching menu from:', apiUrl)
      console.log('📋 Menu Service - Params:', params)

      // Get full response to access pagination metadata
      const response = await this.getApiClient().getRaw<MenuItemAPI[]>(apiUrl)
      console.log('📥 Menu Service - Menu response:', response)

      // Handle direct array response format
      let menus: any[] = []

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          menus = response.data
        } else {
          console.error('❌ Menu Service - Menu response data not an array:', response.data)
          throw new Error('Invalid response format - expected array')
        }
      } else {
        console.error('❌ Menu Service - Menu response not successful:', response)
        throw new Error(response.error?.message || 'Failed to fetch menu items')
      }

      let items = this.extractMenuItemsFromMenus(menus)
      console.log('📦 Menu Service - Extracted items:', items.length)

      // Apply filters
      items = this.applyFiltersToItems(items, params)
      console.log('🔍 Menu Service - Filtered items:', items.length)

      // Apply pagination
      const page = params?.page || 1
      const limit = params?.limit || 20
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedItems = items.slice(startIndex, endIndex)

      console.log('✅ Menu Service - Returning', paginatedItems.length, 'items (page', page, 'of', Math.ceil(items.length / limit), ')')

      // Return PaginatedResult format with API types
      return {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          totalItems: items.length,
          totalPages: Math.ceil(items.length / limit)
        }
      }

    } catch (error) {
      console.error('❌ Menu Service - Menu items fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Check for specific error types
      if (errorMessage.includes('fetch')) {
        console.error('🌐 Network Error - Check if backend is running on http://localhost:3001')
      }
      if (errorMessage.includes('CORS')) {
        console.error('🚫 CORS Error - Check backend CORS configuration')
      }
      if (errorMessage.includes('404')) {
        console.error('🔍 Not Found - Check if tenant exists and has menus:', tenantSlug)
      }

      throw new Error(`Failed to fetch menu items: ${errorMessage}`)
    }
  }

  /**
   * Get single menu item (returns API type for conversion)
   * Returns: MenuItemAPI | null
   * Requirements: 2.3
   */
  async getMenuItem(itemId: string): Promise<MenuItemAPI | null> {
    try {
      // Get item from all menu items
      const menuItemsResult = await this.getMenuItems()
      const item = menuItemsResult.items.find(item => item.id === itemId)

      if (item) {
        return item
      }

      // Item not found - return null instead of throwing
      return null
    } catch (error) {
      console.error('❌ Menu Service - Menu item fetch error:', error)
      // Return null for not found cases
      return null
    }
  }

  /**
   * Get popular items (returns API types for conversion)
   * Returns: MenuItemAPI[]
   * Requirements: 2.1
   */
  async getPopularItems(limit: number = 10): Promise<MenuItemAPI[]> {
    const cacheKey = `popular_${limit}`
    const cached = this.getCachedData<MenuItemAPI[]>(cacheKey)
    if (cached) return cached

    try {
      // For now, get all items and return first N items as "popular"
      // In a real implementation, this would be based on order analytics
      const menuItemsResult = await this.getMenuItems({ limit })
      const popularItems = menuItemsResult.items

      this.setCachedData(cacheKey, popularItems, 300000) // 5 minutes
      return popularItems
    } catch (error) {
      console.error('❌ Menu Service - Popular items fetch error:', error)
      throw new Error('Failed to fetch popular items')
    }
  }

  /**
   * Search menu items (returns API types for conversion)
   * Returns: MenuItemAPI[]
   * Requirements: 2.1
   */
  async searchMenuItems(query: string, filters?: MenuFilters): Promise<MenuItemAPI[]> {
    try {
      const params = { search: query, filters }
      const result = await this.getMenuItems(params)

      return result.items
    } catch (error) {
      console.error('❌ Menu Service - Search error:', error)
      throw new Error('Search failed')
    }
  }

  /**
   * Get favorite items (returns API types for conversion)
   * Returns: MenuItemAPI[]
   * Requirements: 2.1
   */
  async getFavoriteItems(): Promise<MenuItemAPI[]> {
    // For now, use localStorage for favorites since there's no backend endpoint
    // In a real implementation, this would be a user-specific endpoint
    if (import.meta.client) {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        const allItemsResult = await this.getMenuItems()

        const favoriteItems = allItemsResult.items.filter(item =>
          favoriteIds.includes(item.id)
        )

        return favoriteItems
      } catch (error) {
        console.error('Failed to get favorites:', error)
        return []
      }
    }

    return []
  }

  /**
   * Add item to favorites (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async addToFavorites(itemId: string): Promise<void> {
    // For now, use localStorage for favorites
    // In a real implementation, this would be a POST to /users/favorites
    if (import.meta.client) {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        if (!favoriteIds.includes(itemId)) {
          favoriteIds.push(itemId)
          localStorage.setItem('favorites', JSON.stringify(favoriteIds))
        }
        return
      } catch (error) {
        throw new Error(`Failed to add to favorites: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    throw new Error('Client-side storage not available')
  }

  /**
   * Remove item from favorites (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async removeFromFavorites(itemId: string): Promise<void> {
    // For now, use localStorage for favorites
    // In a real implementation, this would be a DELETE to /users/favorites/{itemId}
    if (import.meta.client) {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        const updatedIds = favoriteIds.filter((id: string) => id !== itemId)
        localStorage.setItem('favorites', JSON.stringify(updatedIds))
        return
      } catch (error) {
        throw new Error(`Failed to remove from favorites: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    throw new Error('Client-side storage not available')
  }

  /**
   * Get menu item reviews (unwrapped data)
   * Returns: review data object
   * Requirements: 2.1, 2.2
   */
  async getMenuItemReviews(itemId: string, page: number = 1, limit: number = 10): Promise<{
    reviews: Array<{
      id: string
      rating: number
      comment: string
      userName: string
      createdAt: string
    }>
    total: number
    averageRating: number
  }> {
    return this.getApiClient().get<{
      reviews: Array<{
        id: string
        rating: number
        comment: string
        userName: string
        createdAt: string
      }>
      total: number
      averageRating: number
    }>(`/menu/items/${itemId}/reviews?page=${page}&limit=${limit}`)
  }

  /**
   * Add menu item review (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async addMenuItemReview(itemId: string, review: {
    rating: number
    comment: string
  }): Promise<void> {
    return this.getApiClient().post<void>(`/menu/items/${itemId}/reviews`, review)
  }

  // Helper methods
  private getTenantSlug(): string | null {
    const tenantStore = useTenantStore()
    const tenantSlug = tenantStore.tenantSlug

    if (tenantSlug) {
      console.log('🏢 Menu Service - Tenant slug from store:', tenantSlug)
      return tenantSlug
    }

    const nuxtApp = useNuxtApp()
    const runtimeConfig = nuxtApp.$config
    const configSlug = runtimeConfig?.public?.tenantSlug || null

    console.log('🏢 Menu Service - Runtime config:', runtimeConfig?.public)
    console.log('🏢 Menu Service - Tenant slug from config:', configSlug)

    return configSlug
  }

  private extractMenuItemsFromMenus(menus: any[]): MenuItemAPI[] {
    const items: MenuItemAPI[] = []

    menus.forEach(menu => {
      if (menu.items) {
        menu.items.forEach((item: any) => {
          items.push({
            id: item.id,
            name: item.name,
            description: item.description || null, // Use null for API compatibility
            price: item.price,
            imageUrl: item.imageUrl || null, // Use null for API compatibility
            categoryId: item.category?.id || null, // Use null for API compatibility
            menuId: item.menuId,
            isActive: item.isActive ?? true,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          })
        })
      }
    })

    return items
  }

  private applyFiltersToItems(items: MenuItemAPI[], params?: {
    categoryId?: string
    search?: string
    filters?: MenuFilters
  }): MenuItemAPI[] {
    let filteredItems = [...items]

    // Filter by category
    if (params?.categoryId) {
      filteredItems = filteredItems.filter(item => item.categoryId === params.categoryId)
    }

    // Filter by search query
    if (params?.search) {
      const query = params.search.toLowerCase()
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      )
    }

    // Apply filters
    if (params?.filters) {
      const filters = params.filters

      // Price range filter
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange
        filteredItems = filteredItems.filter(item =>
          item.price >= minPrice && item.price <= maxPrice
        )
      }

      // Availability filter
      if (filters.availability) {
        filteredItems = filteredItems.filter(item => item.isActive)
      }
    }

    return filteredItems
  }

  private getCategoryIcon(categoryName: string): string {
    const iconMap: Record<string, string> = {
      'beverages': '🥤',
      'coffee': '☕',
      'tea': '🍵',
      'pizza': '🍕',
      'pasta': '🍝',
      'salads': '🥗',
      'burgers': '🍔',
      'sandwiches': '🥪',
      'desserts': '🧁',
      'appetizers': '🥨',
      'soups': '🍲',
      'meat': '🥩',
      'seafood': '🐟',
      'vegetarian': '🥬',
      'vegan': '🌱',
      'breakfast': '🍳',
      'lunch': '🍽️',
      'dinner': '🍽️',
      'snacks': '🍿',
      'drinks': '🥤'
    }

    const key = categoryName.toLowerCase()
    return iconMap[key] || '🍽️'
  }
}

// Create singleton instance
let menuService: MenuService | null = null

export function useMenuService(): MenuService {
  if (!menuService) {
    menuService = new MenuService()
  }
  return menuService
}