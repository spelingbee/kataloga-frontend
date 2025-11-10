import type { ApiResponse, Category, MenuItem, MenuFilters } from '~/types'

export class MenuService {
  private getApiClient(): any {
    const nuxtApp = useNuxtApp()
    return (nuxtApp as any).$apiClient
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

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const cacheKey = 'categories'
    const cached = this.getCachedData<ApiResponse<Category[]>>(cacheKey)
    if (cached) return cached

    // Get categories from public categories endpoint
    const tenantSlug = this.getTenantSlug()
    if (!tenantSlug) {
      return {
        success: false,
        message: 'Tenant slug not configured',
        errors: ['TENANT_NOT_CONFIGURED']
      }
    }

    try {
      const response = await this.getApiClient().get(`/public/menu/${tenantSlug}/categories`)
      if (response.success && response.data) {
        // Map backend categories to frontend format
        const categories = response.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: `${cat.itemCount} items available`,
          icon: this.getCategoryIcon(cat.name),
          count: cat.itemCount,
          sortOrder: 0
        }))
        
        const categoriesResponse = {
          success: true,
          data: categories,
          message: 'Categories retrieved successfully'
        }
        this.setCachedData(cacheKey, categoriesResponse, 600000) // 10 minutes
        return categoriesResponse
      }
      return response
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch categories',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async getCategory(categoryId: string): Promise<ApiResponse<Category>> {
    // Get category from cached categories
    const categoriesResponse = await this.getCategories()
    if (categoriesResponse.success && categoriesResponse.data) {
      const category = categoriesResponse.data.find(cat => cat.id === categoryId)
      if (category) {
        return {
          success: true,
          data: category,
          message: 'Category retrieved successfully'
        }
      }
    }
    
    return {
      success: false,
      message: 'Category not found',
      errors: ['CATEGORY_NOT_FOUND']
    }
  }

  async getMenuItems(params?: {
    categoryId?: string
    search?: string
    filters?: MenuFilters
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ items: MenuItem[]; total: number; page: number; limit: number }>> {
    const tenantSlug = this.getTenantSlug()
    if (!tenantSlug) {
      return {
        success: false,
        message: 'Tenant slug not configured',
        errors: ['TENANT_NOT_CONFIGURED']
      }
    }

    try {
      const response = await this.getApiClient().get(`/public/menu/${tenantSlug}`)
      if (response.success && response.data) {
        let items = this.extractMenuItemsFromMenus(response.data)
        
        // Apply filters
        items = this.applyFiltersToItems(items, params)
        
        // Apply pagination
        const page = params?.page || 1
        const limit = params?.limit || 20
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedItems = items.slice(startIndex, endIndex)
        
        return {
          success: true,
          data: {
            items: paginatedItems,
            total: items.length,
            page,
            limit
          },
          message: 'Menu items retrieved successfully'
        }
      }
      return response
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch menu items',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async getMenuItem(itemId: string): Promise<ApiResponse<MenuItem>> {
    // Get item from all menu items
    const menuItemsResponse = await this.getMenuItems()
    if (menuItemsResponse.success && menuItemsResponse.data) {
      const item = menuItemsResponse.data.items.find(item => item.id === itemId)
      if (item) {
        return {
          success: true,
          data: item,
          message: 'Menu item retrieved successfully'
        }
      }
    }
    
    return {
      success: false,
      message: 'Menu item not found',
      errors: ['MENU_ITEM_NOT_FOUND']
    }
  }

  async getPopularItems(limit: number = 10): Promise<ApiResponse<MenuItem[]>> {
    const cacheKey = `popular_${limit}`
    const cached = this.getCachedData<ApiResponse<MenuItem[]>>(cacheKey)
    if (cached) return cached

    // For now, get all items and return first N items as "popular"
    // In a real implementation, this would be based on order analytics
    const menuItemsResponse = await this.getMenuItems({ limit })
    if (menuItemsResponse.success && menuItemsResponse.data) {
      const popularResponse = {
        success: true,
        data: menuItemsResponse.data.items,
        message: 'Popular items retrieved successfully'
      }
      this.setCachedData(cacheKey, popularResponse, 300000) // 5 minutes
      return popularResponse
    }
    
    return {
      success: false,
      message: 'Failed to fetch popular items',
      errors: ['POPULAR_ITEMS_FETCH_FAILED']
    }
  }

  async searchMenuItems(query: string, filters?: MenuFilters): Promise<ApiResponse<MenuItem[]>> {
    const params = { search: query, filters }
    const response = await this.getMenuItems(params)
    
    if (response.success && response.data) {
      return {
        success: response.success,
        data: response.data.items,
        message: response.message,
        errors: response.errors,
      }
    }
    
    return {
      success: false,
      message: response.message || 'Search failed',
      errors: response.errors,
    }
  }

  async getFavoriteItems(): Promise<ApiResponse<MenuItem[]>> {
    // For now, use localStorage for favorites since there's no backend endpoint
    // In a real implementation, this would be a user-specific endpoint
    if (import.meta.client) {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        const allItemsResponse = await this.getMenuItems()
        
        if (allItemsResponse.success && allItemsResponse.data) {
          const favoriteItems = allItemsResponse.data.items.filter(item => 
            favoriteIds.includes(item.id)
          )
          
          return {
            success: true,
            data: favoriteItems,
            message: 'Favorite items retrieved successfully'
          }
        }
      } catch (error) {
        console.error('Failed to get favorites:', error)
      }
    }
    
    return {
      success: true,
      data: [],
      message: 'No favorite items found'
    }
  }

  async addToFavorites(itemId: string): Promise<ApiResponse<void>> {
    // For now, use localStorage for favorites
    // In a real implementation, this would be a POST to /users/favorites
    if (import.meta.client) {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        if (!favoriteIds.includes(itemId)) {
          favoriteIds.push(itemId)
          localStorage.setItem('favorites', JSON.stringify(favoriteIds))
        }
        
        return {
          success: true,
          message: 'Item added to favorites'
        }
      } catch (error) {
        return {
          success: false,
          message: 'Failed to add to favorites',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      }
    }
    
    return {
      success: false,
      message: 'Client-side storage not available',
      errors: ['CLIENT_STORAGE_UNAVAILABLE']
    }
  }

  async removeFromFavorites(itemId: string): Promise<ApiResponse<void>> {
    // For now, use localStorage for favorites
    // In a real implementation, this would be a DELETE to /users/favorites/{itemId}
    if (import.meta.client) {
      try {
        const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]')
        const updatedIds = favoriteIds.filter((id: string) => id !== itemId)
        localStorage.setItem('favorites', JSON.stringify(updatedIds))
        
        return {
          success: true,
          message: 'Item removed from favorites'
        }
      } catch (error) {
        return {
          success: false,
          message: 'Failed to remove from favorites',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      }
    }
    
    return {
      success: false,
      message: 'Client-side storage not available',
      errors: ['CLIENT_STORAGE_UNAVAILABLE']
    }
  }

  async getMenuItemReviews(itemId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<{
    reviews: Array<{
      id: string
      rating: number
      comment: string
      userName: string
      createdAt: string
    }>
    total: number
    averageRating: number
  }>> {
    return this.getApiClient().get(`/menu/items/${itemId}/reviews?page=${page}&limit=${limit}`)
  }

  async addMenuItemReview(itemId: string, review: {
    rating: number
    comment: string
  }): Promise<ApiResponse<void>> {
    return this.getApiClient().post(`/menu/items/${itemId}/reviews`, review)
  }

  // Helper methods
  private getTenantSlug(): string | null {
    const nuxtApp = useNuxtApp()
    const runtimeConfig = nuxtApp.$config
    return runtimeConfig?.public?.tenantSlug || null
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
              sortOrder: 0
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
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            isActive: item.isActive,
            categoryId: item.category?.id,
            category: item.category,
            calories: item.calories,
            nutritionInfo: item.nutritionInfo,
            cookingTime: item.cookingTime,
            dietary: item.dietary || []
          })
        })
      }
    })
    
    return items
  }

  private applyFiltersToItems(items: MenuItem[], params?: {
    categoryId?: string
    search?: string
    filters?: MenuFilters
  }): MenuItem[] {
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
        item.description.toLowerCase().includes(query)
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
      
      // Calories filter
      if (filters.calories && filters.calories.length === 2) {
        const [minCalories, maxCalories] = filters.calories
        filteredItems = filteredItems.filter(item => 
          item.calories && item.calories >= minCalories && item.calories <= maxCalories
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
        filteredItems = filteredItems.filter(item =>
          item.cookingTime && item.cookingTime <= filters.cookingTime!
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