import type { Category, MenuItem, MenuFilters, PaginatedResult, ApiResponse } from '~/types'
import { useApiClient } from '~/utils/api'
import { useTenantStore } from '~/stores/tenant'

export class MenuService {
  constructor(private apiClient: any) {}

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
   * Get categories (unwrapped data)
   * Returns: Category[] (not ApiResponse<Category[]>)
   * Requirements: 2.1
   */
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories'
    const cached = this.getCachedData<Category[]>(cacheKey)
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
      const response = await this.getApiClient().get<Category[]>(apiUrl)
      console.log('📥 Menu Service - Categories response:', response)

      // Handle direct array response format
      let categories: any[] = []

      if (Array.isArray(response)) {
        categories = response
      } else {
        console.error('❌ Menu Service - Categories response not in expected format:', response)
        throw new Error('Invalid response format')
      }

      // Map backend categories to frontend format
      const mappedCategories = categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: `${cat.itemCount || 0} items available`,
        icon: this.getCategoryIcon(cat.name),
        count: cat.itemCount || 0,
        sortOrder: 0,
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
   * Get single category (unwrapped data)
   * Returns: Category | null
   * Requirements: 2.3
   */
  async getCategory(categoryId: string): Promise<Category | null> {
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
   * Get paginated menu items (unwrapped data)
   * Returns: PaginatedResult<MenuItem> (not ApiResponse)
   * Requirements: 2.1, 2.2
   */
  async getMenuItems(params?: {
    categoryId?: string
    search?: string
    filters?: MenuFilters
    page?: number
    limit?: number
  }): Promise<PaginatedResult<MenuItem>> {
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
      const response = await this.getApiClient().getRaw<MenuItem[]>(apiUrl)
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

      console.log(
        '✅ Menu Service - Returning',
        paginatedItems.length,
        'items (page',
        page,
        'of',
        Math.ceil(items.length / limit),
        ')'
      )

      // Return PaginatedResult format
      return {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          totalItems: items.length,
          totalPages: Math.ceil(items.length / limit),
        },
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
   * Get single menu item (unwrapped data)
   * Returns: MenuItem | null
   * Requirements: 2.3
   */
  async getMenuItem(itemId: string): Promise<MenuItem | null> {
    const tenantSlug = this.getTenantSlug()
    console.log('🏢 Menu Service - Getting menu item:', itemId, 'for tenant:', tenantSlug)

    if (!tenantSlug) {
      console.error('❌ Menu Service - No tenant slug configured')
      throw new Error('Tenant slug not configured')
    }

    try {
      const apiUrl = `/public/menu/${tenantSlug}/items/${itemId}`
      console.log('🌐 Menu Service - Fetching menu item from:', apiUrl)

      const item = await this.getApiClient().get<any>(apiUrl)
      console.log('📥 Menu Service - Menu item response:', item)

      if (!item) {
        return null
      }

      // Map backend menu item to frontend MenuItem format
      const mappedItem: MenuItem = {
        id: item.id,
        productId: item.productId,
        menuId: item.menuId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl || this.getImageUrl(item, item.category?.name),
        isActive: item.isActive,
        categoryId: item.category?.id,
        category: item.category,
        calories: item.calories,
        nutritionInfo: item.nutritionInfo,
        cookingTime: item.cookingTime,
        dietary: item.dietary || [],
        ingredients: item.ingredients || [],
        allergens: item.allergens || [],
        preparationTime: item.preparationTime,
      }

      return mappedItem
    } catch (error) {
      console.error('❌ Menu Service - Menu item fetch error:', error)
      return null
    }
  }

  /**
   * Get popular items (unwrapped data)
   * Returns: MenuItem[]
   * Requirements: 2.1
   */
  async getPopularItems(limit: number = 10): Promise<MenuItem[]> {
    const cacheKey = `popular_${limit}`
    const cached = this.getCachedData<MenuItem[]>(cacheKey)
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
   * Search menu items (unwrapped data)
   * Returns: MenuItem[]
   * Requirements: 2.1
   */
  async searchMenuItems(query: string, filters?: MenuFilters): Promise<MenuItem[]> {
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
   * Get favorite items (unwrapped data)
   * Returns: MenuItem[]
   * Requirements: 2.1
   */
  async getFavoriteItems(): Promise<MenuItem[]> {
    // For now, use localStorage for favorites since there's no backend endpoint
    // In a real implementation, this would be a user-specific endpoint
    if (import.meta.client || process.env.NODE_ENV === 'test') {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        const allItemsResult = await this.getMenuItems()

        const favoriteItems = allItemsResult.items.filter(item => favoriteIds.includes(item.id))

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
    if (import.meta.client || process.env.NODE_ENV === 'test') {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        if (!favoriteIds.includes(itemId)) {
          favoriteIds.push(itemId)
          localStorage.setItem('favorites', JSON.stringify(favoriteIds))
        }
        return
      } catch (error) {
        throw new Error(
          `Failed to add to favorites: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
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
    if (import.meta.client || process.env.NODE_ENV === 'test') {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        const updatedIds = favoriteIds.filter((id: string) => id !== itemId)
        localStorage.setItem('favorites', JSON.stringify(updatedIds))
        return
      } catch (error) {
        throw new Error(
          `Failed to remove from favorites: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    throw new Error('Client-side storage not available')
  }

  /**
   * Get menu item reviews (unwrapped data)
   * Returns: review data object
   * Requirements: 2.1, 2.2
   */
  async getMenuItemReviews(
    itemId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
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
  async addMenuItemReview(
    itemId: string,
    review: {
      rating: number
      comment: string
    }
  ): Promise<void> {
    return this.getApiClient().post<void>(`/menu/items/${itemId}/reviews`, review)
  }

  // Helper methods
  private getTenantSlug(): string | null {
    // 1. Try to get from API client (it has the most robust logic including URL priority)
    const currentTenant = this.apiClient.getCurrentTenant()
    if (currentTenant) {
      return currentTenant
    }

    // 2. Fall back to tenant store
    const tenantStore = useTenantStore()
    if (tenantStore.tenantSlug) {
      return tenantStore.tenantSlug
    }

    // 3. Last fallback: runtime config
    const nuxtApp = useNuxtApp()
    const runtimeConfig = nuxtApp.$config
    return runtimeConfig?.public?.tenantSlug || null
  }

  private getTenantId(): string | null {
    const tenantStore = useTenantStore()
    return tenantStore.tenantId || null
  }

  private extractCategoriesFromMenus(menus: any[]): Category[] {
    const categoryMap = new Map<string, Category>()

    menus.forEach(menu => {
      if (menu.itemsByCategory) {
        menu.itemsByCategory.forEach((categoryGroup: any) => {
          if (!categoryMap.has(categoryGroup.id)) {
            categoryMap.set(categoryGroup.id, {
              id: categoryGroup.id,
              name: categoryGroup.name,
              description: `${categoryGroup.items?.length || 0} items available`,
              icon: this.getCategoryIcon(categoryGroup.name),
              count: categoryGroup.items?.length || 0,
              sortOrder: 0,
            })
          }
        })
      }
    })

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  private extractMenuItemsFromMenus(menus: any[]): MenuItem[] {
    const items: MenuItem[] = []

    menus.forEach(menu => {
      if (menu.items) {
        menu.items.forEach((item: any) => {
          items.push({
            id: item.id,
            productId: item.productId,
            menuId: item.menuId,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl || this.getImageUrl(item, item.category?.name),
            isActive: item.isActive,
            categoryId: item.category?.id,
            category: item.category,
            calories: item.calories,
            nutritionInfo: item.nutritionInfo,
            cookingTime: item.cookingTime,
            dietary: item.dietary || [],
          })
        })
      }
    })

    return items
  }

  private applyFiltersToItems(
    items: MenuItem[],
    params?: {
      categoryId?: string
      search?: string
      filters?: MenuFilters
    }
  ): MenuItem[] {
    let filteredItems = [...items]

    // Filter by category
    if (params?.categoryId) {
      filteredItems = filteredItems.filter(item => item.categoryId === params.categoryId)
    }

    // Filter by search query
    if (params?.search) {
      const query = params.search.toLowerCase()
      filteredItems = filteredItems.filter(
        item =>
          item.name.toLowerCase().includes(query) || (item.description || '').toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (params?.filters) {
      const filters = params.filters

      // Price range filter
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange
        filteredItems = filteredItems.filter(
          item => item.price >= minPrice && item.price <= maxPrice
        )
      }

      // Calories filter
      if (filters.calories && filters.calories.length === 2) {
        const [minCalories, maxCalories] = filters.calories
        filteredItems = filteredItems.filter(
          item => item.calories && item.calories >= minCalories && item.calories <= maxCalories
        )
      }

      // Dietary restrictions filter
      if (filters.dietary && filters.dietary.length > 0) {
        filteredItems = filteredItems.filter(item =>
          filters.dietary!.some(diet => item.dietary?.includes(diet))
        )
      }

      // Cooking time filter
      if (filters.cookingTime) {
        filteredItems = filteredItems.filter(
          item => item.cookingTime && item.cookingTime <= filters.cookingTime!
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
      beverages: '🥤',
      coffee: '☕',
      tea: '🍵',
      pizza: '🍕',
      pasta: '🍝',
      salads: '🥗',
      burgers: '🍔',
      sandwiches: '🥪',
      desserts: '🧁',
      appetizers: '🥨',
      soups: '🍲',
      meat: '🥩',
      seafood: '🐟',
      vegetarian: '🥬',
      vegan: '🌱',
      breakfast: '🍳',
      lunch: '🍽️',
      dinner: '🍽️',
      snacks: '🍿',
      drinks: '🥤',
    }

    const key = categoryName.toLowerCase()
    return iconMap[key] || '🍽️'
  }

  private getImageUrl(item: any, categoryName: string): string {
    if (item?.imageUrl) return item.imageUrl

    // Use B2B placeholders based on category
    const cat = (categoryName || '').toLowerCase()
    if (cat.includes('flower') || cat.includes('цвет') || cat.includes('букет'))
      return '/images/placeholders/flowers.png'
    if (
      cat.includes('dessert') ||
      cat.includes('десерт') ||
      cat.includes('слад') ||
      cat.includes('cake')
    )
      return '/images/placeholders/dessert.png'
    if (cat.includes('drink') || cat.includes('напит') || cat.includes('соки'))
      return '/images/placeholders/drink.png'
    return '/images/placeholders/pizza.png'
  }
}
