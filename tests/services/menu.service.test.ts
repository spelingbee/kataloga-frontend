import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MenuService } from '~/services/menu.service'
import type { Category, MenuItem } from '~/types'

describe('MenuService', () => {
  let menuService: MenuService
  let mockApiClient: any

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      getRaw: vi.fn(),
      post: vi.fn(),
      getCurrentTenant: vi.fn().mockReturnValue('test-tenant'),
    }
    menuService = new MenuService(mockApiClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCategories', () => {
    it('should fetch and extract categories from menu data', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Beverages', itemCount: 2 },
        { id: 'cat-2', name: 'Pizza', itemCount: 1 },
      ]

      mockApiClient.get.mockResolvedValue(mockCategories)

      const result = await menuService.getCategories()

      expect(mockApiClient.get).toHaveBeenCalledWith('/public/menu/test-tenant/categories')
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 'cat-1',
        name: 'Beverages',
        count: 2,
      })
    })

    it('should return cached categories on subsequent calls', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Beverages', itemCount: 0 },
      ]

      mockApiClient.get.mockResolvedValue(mockCategories)

      // First call
      await menuService.getCategories()
      // Second call
      await menuService.getCategories()

      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      await expect(menuService.getCategories()).rejects.toThrow(
        'Failed to fetch categories: Network error'
      )
    })
  })

  describe('getMenuItems', () => {
    it('should fetch and extract menu items', async () => {
      const mockMenuData = [
        {
          id: 'menu-1',
          items: [
            {
              id: 'item-1',
              name: 'Pizza Margherita',
              price: 12.99,
              isActive: true,
              category: { id: 'cat-1', name: 'Pizza' },
            },
            {
              id: 'item-2',
              name: 'Coke',
              price: 1.99,
              isActive: true,
              category: { id: 'cat-2', name: 'Beverages' },
            },
          ]
        }
      ]

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: mockMenuData,
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            totalItems: 2,
            totalPages: 1,
          }
        }
      })

      const result = await menuService.getMenuItems()

      expect(mockApiClient.getRaw).toHaveBeenCalledWith('/public/menu/test-tenant')
      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toMatchObject({
        id: 'item-1',
        name: 'Pizza Margherita',
        price: 12.99,
      })
    })

    it('should filter items by category', async () => {
      const mockMenuData = [
        {
          id: 'menu-1',
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
          ]
        }
      ]

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: mockMenuData,
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            totalItems: 2,
            totalPages: 1,
          }
        }
      })

      const result = await menuService.getMenuItems({ categoryId: 'cat-1' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('item-1')
    })

    it('should filter items by search query', async () => {
      const mockMenuData = [
        {
          id: 'menu-1',
          items: [
            {
              id: 'item-1',
              name: 'Pizza Margherita',
              price: 12.99,
              isActive: true,
            },
            {
              id: 'item-2',
              name: 'Coke',
              price: 1.99,
              isActive: true,
            },
          ]
        }
      ]

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: mockMenuData,
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            totalItems: 2,
            totalPages: 1,
          }
        }
      })

      const result = await menuService.getMenuItems({ search: 'pizza' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Pizza Margherita')
    })
  })

  describe('searchMenuItems', () => {
    it('should search menu items by query', async () => {
      const mockMenuData = [
        {
          id: 'menu-1',
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
              name: 'Coke',
              price: 1.99,
              isActive: true,
            },
          ]
        }
      ]

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: mockMenuData,
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            totalItems: 2,
            totalPages: 1,
          }
        }
      })

      const result = await menuService.searchMenuItems('pizza')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Pizza Margherita')
    })
  })

  describe('favorites management', () => {
    let mockLocalStorage: any

    beforeEach(() => {
      mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
      vi.stubGlobal('localStorage', mockLocalStorage)
    })

    it('should add item to favorites', async () => {
      mockLocalStorage.getItem.mockReturnValue('[]')

      await menuService.addToFavorites('item-1')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify(['item-1'])
      )
    })

    it('should not add duplicate items to favorites', async () => {
      mockLocalStorage.getItem.mockReturnValue('["item-1"]')

      await menuService.addToFavorites('item-1')

      // setItem shouldn't be called if it's duplicate
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('should remove item from favorites', async () => {
      mockLocalStorage.getItem.mockReturnValue('["item-1", "item-2"]')

      await menuService.removeFromFavorites('item-1')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify(['item-2'])
      )
    })

    it('should get favorite items', async () => {
      mockLocalStorage.getItem.mockReturnValue('["item-1"]')

      const mockMenuData = [
        {
          id: 'menu-1',
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
          ]
        }
      ]

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: mockMenuData,
        meta: {
          pagination: {
            page: 1,
            limit: 100,
            totalItems: 2,
            totalPages: 1,
          }
        }
      })

      const result = await menuService.getFavoriteItems()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('item-1')
    })
  })
})