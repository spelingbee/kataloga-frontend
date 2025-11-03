import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MenuService } from '~/services/menu.service'

// Mock useNuxtApp
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
    $config: {
      public: {
        tenantSlug: 'test-tenant',
      },
    },
  }),
}))

describe('MenuService', () => {
  let menuService: MenuService
  let mockApiClient: any

  beforeEach(() => {
    menuService = new MenuService()
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
    }
    
    // Mock the getApiClient method
    vi.spyOn(menuService as any, 'getApiClient').mockReturnValue(mockApiClient)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('getCategories', () => {
    it('should fetch and extract categories from menu data', async () => {
      const mockMenuData = [
        {
          id: 'menu-1',
          itemsByCategory: [
            {
              id: 'cat-1',
              name: 'Beverages',
              items: [{ id: 'item-1' }, { id: 'item-2' }],
            },
            {
              id: 'cat-2',
              name: 'Pizza',
              items: [{ id: 'item-3' }],
            },
          ],
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      const result = await menuService.getCategories()

      expect(mockApiClient.get).toHaveBeenCalledWith('/public/menu/test-tenant')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toMatchObject({
        id: 'cat-1',
        name: 'Beverages',
        count: 2,
      })
    })

    it('should return cached categories on subsequent calls', async () => {
      const mockMenuData = [
        {
          itemsByCategory: [
            { id: 'cat-1', name: 'Beverages', items: [] },
          ],
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      // First call
      await menuService.getCategories()
      // Second call
      await menuService.getCategories()

      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await menuService.getCategories()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to fetch categories')
      expect(result.errors).toContain('Network error')
    })
  })

  describe('getMenuItems', () => {
    it('should fetch and extract menu items', async () => {
      const mockMenuData = [
        {
          items: [
            {
              id: 'item-1',
              name: 'Pizza Margherita',
              description: 'Classic pizza',
              price: 12.99,
              isActive: true,
              category: { id: 'cat-1', name: 'Pizza' },
            },
            {
              id: 'item-2',
              name: 'Coca Cola',
              description: 'Refreshing drink',
              price: 2.99,
              isActive: true,
              category: { id: 'cat-2', name: 'Beverages' },
            },
          ],
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      const result = await menuService.getMenuItems()

      expect(result.success).toBe(true)
      expect(result.data?.items).toHaveLength(2)
      expect(result.data?.items[0]).toMatchObject({
        id: 'item-1',
        name: 'Pizza Margherita',
        price: 12.99,
      })
    })

    it('should filter items by category', async () => {
      const mockMenuData = [
        {
          items: [
            {
              id: 'item-1',
              name: 'Pizza',
              categoryId: 'cat-1',
              category: { id: 'cat-1' },
              price: 12.99,
              isActive: true,
            },
            {
              id: 'item-2',
              name: 'Burger',
              categoryId: 'cat-2',
              category: { id: 'cat-2' },
              price: 8.99,
              isActive: true,
            },
          ],
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      const result = await menuService.getMenuItems({ categoryId: 'cat-1' })

      expect(result.success).toBe(true)
      expect(result.data?.items).toHaveLength(1)
      expect(result.data?.items[0].id).toBe('item-1')
    })

    it('should filter items by search query', async () => {
      const mockMenuData = [
        {
          items: [
            {
              id: 'item-1',
              name: 'Pizza Margherita',
              description: 'Classic pizza',
              price: 12.99,
              isActive: true,
            },
            {
              id: 'item-2',
              name: 'Burger',
              description: 'Beef burger',
              price: 8.99,
              isActive: true,
            },
          ],
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      const result = await menuService.getMenuItems({ search: 'pizza' })

      expect(result.success).toBe(true)
      expect(result.data?.items).toHaveLength(1)
      expect(result.data?.items[0].name).toBe('Pizza Margherita')
    })

    it('should apply pagination', async () => {
      const mockMenuData = [
        {
          items: Array.from({ length: 25 }, (_, i) => ({
            id: `item-${i + 1}`,
            name: `Item ${i + 1}`,
            price: 10,
            isActive: true,
          })),
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      const result = await menuService.getMenuItems({ page: 2, limit: 10 })

      expect(result.success).toBe(true)
      expect(result.data?.items).toHaveLength(10)
      expect(result.data?.page).toBe(2)
      expect(result.data?.total).toBe(25)
      expect(result.data?.items[0].id).toBe('item-11')
    })
  })

  describe('searchMenuItems', () => {
    it('should search menu items by query', async () => {
      const mockMenuData = [
        {
          items: [
            {
              id: 'item-1',
              name: 'Pizza Margherita',
              description: 'Classic pizza',
              price: 12.99,
              isActive: true,
            },
          ],
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      const result = await menuService.searchMenuItems('pizza')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].name).toBe('Pizza Margherita')
    })
  })

  describe('favorites management', () => {
    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
        },
        writable: true,
      })
    })

    it('should add item to favorites', async () => {
      const mockLocalStorage = vi.mocked(localStorage)
      mockLocalStorage.getItem.mockReturnValue('[]')

      const result = await menuService.addToFavorites('item-1')

      expect(result.success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify(['item-1'])
      )
    })

    it('should not add duplicate items to favorites', async () => {
      const mockLocalStorage = vi.mocked(localStorage)
      mockLocalStorage.getItem.mockReturnValue('["item-1"]')

      const result = await menuService.addToFavorites('item-1')

      expect(result.success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify(['item-1'])
      )
    })

    it('should remove item from favorites', async () => {
      const mockLocalStorage = vi.mocked(localStorage)
      mockLocalStorage.getItem.mockReturnValue('["item-1", "item-2"]')

      const result = await menuService.removeFromFavorites('item-1')

      expect(result.success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify(['item-2'])
      )
    })

    it('should get favorite items', async () => {
      const mockLocalStorage = vi.mocked(localStorage)
      mockLocalStorage.getItem.mockReturnValue('["item-1"]')

      const mockMenuData = [
        {
          items: [
            {
              id: 'item-1',
              name: 'Pizza',
              price: 12.99,
              isActive: true,
            },
            {
              id: 'item-2',
              name: 'Burger',
              price: 8.99,
              isActive: true,
            },
          ],
        },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockMenuData,
      })

      const result = await menuService.getFavoriteItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].id).toBe('item-1')
    })
  })
})