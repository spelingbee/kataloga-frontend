/**
 * Unit tests for type converter functions
 * 
 * These tests verify that converter functions correctly transform data
 * between API, UI, and Mock type variants while maintaining type safety.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  menuItemAPIToUI, 
  categoryAPIToUI,
  menuItemUIToAPI,
  categoryUIToAPI,
  modifierAPIToUI,
  modifierUIToAPI,
  modifierGroupAPIToUI,
  modifierGroupUIToAPI,
  orderAPIToUI, 
  orderItemAPIToUI, 
  menuItemMockToAPI,
  categoryMockToAPI,
  orderMockToAPI,
  orderItemMockToAPI,
  convertArrayAPIToUI,
  convertArrayUIToAPI,
  convertArrayMockToAPI,
  nullToUndefined,
  undefinedToNull,
  convertNullsToUndefined,
  convertUndefinedsToNulls,
  calculateMenuItemBadges,
  calculateOrderTotals
} from '~/types/utils/converters'
import type { MenuItemAPI, CategoryAPI, ModifierAPI, ModifierGroupAPI } from '~/types/api/menu.api'
import type { OrderAPI, OrderItemAPI, OrderStatus } from '~/types/api/order.api'
import type { MenuItemMock, CategoryMock } from '~/types/mocks/menu.mock'
import type { OrderMock, OrderItemMock } from '~/types/mocks/order.mock'
import type { CustomerInfo } from '~/types/ui/order.ui'

// Skip setup file for this test
beforeEach(() => {
  // No setup needed for pure converter tests
})

describe('Type Converters', () => {
  describe('menuItemAPIToUI', () => {
    it('should convert API MenuItem to UI MenuItem with all fields preserved', () => {
      const apiItem: MenuItemAPI = {
        id: '123',
        name: 'Test Item',
        description: 'A test item',
        price: 10.99,
        imageUrl: 'https://example.com/image.jpg',
        categoryId: 'cat-1',
        menuId: 'menu-1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }

      const uiItem = menuItemAPIToUI(apiItem)

      // Verify all API fields are preserved
      expect(uiItem.id).toBe(apiItem.id)
      expect(uiItem.name).toBe(apiItem.name)
      expect(uiItem.description).toBe(apiItem.description)
      expect(uiItem.price).toBe(apiItem.price)
      expect(uiItem.imageUrl).toBe(apiItem.imageUrl)
      expect(uiItem.categoryId).toBe(apiItem.categoryId)
      expect(uiItem.menuId).toBe(apiItem.menuId)
      expect(uiItem.isActive).toBe(apiItem.isActive)

      // Verify UI-specific fields are added
      expect(uiItem.isAvailable).toBe(true)
      expect(uiItem.stockQuantity).toBe(100)
      expect(uiItem.calories).toBeNull()
      expect(uiItem.preparationTime).toBeNull()
      expect(uiItem.cookingTime).toBeNull()
      expect(uiItem.ingredients).toEqual([])
      expect(uiItem.allergens).toEqual([])
      expect(uiItem.nutritionInfo).toBeNull()
      expect(uiItem.dietary).toEqual([])
      expect(uiItem.badges).toEqual([])
      expect(uiItem.modifierGroups).toEqual([])
      expect(uiItem.isNew).toBe(false)
      expect(uiItem.isPopular).toBe(false)
      expect(uiItem.category).toBeNull()
    })

    it('should handle null values correctly and convert to undefined for Vue compatibility', () => {
      const apiItem: MenuItemAPI = {
        id: '456',
        name: 'Another Item',
        description: null,
        price: 5.99,
        imageUrl: null,
        categoryId: null,
        menuId: 'menu-2',
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }

      const uiItem = menuItemAPIToUI(apiItem)

      // Verify null values are converted to undefined for Vue compatibility
      expect(uiItem.description).toBeUndefined()
      expect(uiItem.imageUrl).toBeUndefined()
      expect(uiItem.categoryId).toBeUndefined()
      expect(uiItem.isAvailable).toBe(false)
    })
  })

  describe('categoryAPIToUI', () => {
    it('should convert API Category to UI Category with null to undefined conversion', () => {
      const apiCategory: CategoryAPI = {
        id: 'cat-1',
        name: 'Test Category',
        description: 'A test category',
        imageUrl: 'https://example.com/category.jpg',
        sortOrder: 1,
        icon: 'pizza'
      }

      const uiCategory = categoryAPIToUI(apiCategory, 5)

      // Verify all API fields are preserved
      expect(uiCategory.id).toBe(apiCategory.id)
      expect(uiCategory.name).toBe(apiCategory.name)
      expect(uiCategory.description).toBe(apiCategory.description)
      expect(uiCategory.imageUrl).toBe(apiCategory.imageUrl)
      expect(uiCategory.sortOrder).toBe(apiCategory.sortOrder)
      expect(uiCategory.icon).toBe(apiCategory.icon)

      // Verify UI-specific fields are added
      expect(uiCategory.count).toBe(5)
    })

    it('should convert null values to undefined for Vue compatibility', () => {
      const apiCategory: CategoryAPI = {
        id: 'cat-2',
        name: 'Empty Category',
        description: null,
        imageUrl: null,
        sortOrder: 2,
        icon: null
      }

      const uiCategory = categoryAPIToUI(apiCategory)

      // Verify null values are converted to undefined
      expect(uiCategory.description).toBeUndefined()
      expect(uiCategory.imageUrl).toBeUndefined()
      expect(uiCategory.icon).toBeUndefined()
      expect(uiCategory.count).toBe(0) // default value
    })
  })

  describe('menuItemUIToAPI', () => {
    it('should convert UI MenuItem back to API format with undefined to null conversion', () => {
      const uiItem = {
        id: '123',
        name: 'Test Item',
        description: undefined,
        price: 10.99,
        imageUrl: undefined,
        categoryId: undefined,
        menuId: 'menu-1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        // UI-specific fields (should be ignored)
        isAvailable: true,
        stockQuantity: 100,
        calories: null,
        preparationTime: null,
        cookingTime: null,
        ingredients: [],
        allergens: [],
        nutritionInfo: null,
        dietary: [],
        badges: [],
        modifierGroups: [],
        isNew: false,
        isPopular: false,
        category: null
      }

      const apiData = menuItemUIToAPI(uiItem)

      // Verify core fields are preserved
      expect(apiData.id).toBe(uiItem.id)
      expect(apiData.name).toBe(uiItem.name)
      expect(apiData.price).toBe(uiItem.price)
      expect(apiData.menuId).toBe(uiItem.menuId)
      expect(apiData.isActive).toBe(uiItem.isActive)

      // Verify undefined values are converted to null
      expect(apiData.description).toBeNull()
      expect(apiData.imageUrl).toBeNull()
      expect(apiData.categoryId).toBeNull()

      // Verify readonly fields are excluded
      expect('createdAt' in apiData).toBe(false)
      expect('updatedAt' in apiData).toBe(false)
    })
  })

  describe('categoryUIToAPI', () => {
    it('should convert UI Category back to API format with undefined to null conversion', () => {
      const uiCategory = {
        id: 'cat-1',
        name: 'Test Category',
        description: undefined,
        imageUrl: undefined,
        sortOrder: 1,
        icon: undefined,
        count: 5 // UI-specific field (should be ignored)
      }

      const apiData = categoryUIToAPI(uiCategory)

      // Verify core fields are preserved
      expect(apiData.name).toBe(uiCategory.name)
      expect(apiData.sortOrder).toBe(uiCategory.sortOrder)

      // Verify undefined values are converted to null
      expect(apiData.description).toBeNull()
      expect(apiData.imageUrl).toBeNull()
      expect(apiData.icon).toBeNull()

      // Verify id is excluded (for creation)
      expect('id' in apiData).toBe(false)
      // Verify UI-specific fields are excluded
      expect('count' in apiData).toBe(false)
    })
  })

  describe('orderAPIToUI', () => {
    it('should convert API Order to UI Order with computed fields', () => {
      const orderItems: readonly OrderItemAPI[] = [
        {
          id: 'item-1',
          menuItemId: 'menu-1',
          quantity: 2,
          price: 10.00,
          subtotal: 20.00,
          customizations: null
        },
        {
          id: 'item-2',
          menuItemId: 'menu-2',
          quantity: 1,
          price: 15.00,
          subtotal: 15.00,
          customizations: null
        }
      ]

      const apiOrder: OrderAPI = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'PENDING' as OrderStatus,
        total: 40.50,
        items: orderItems,
        customerId: 'customer-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        estimatedTime: 30,
        deliveryAddress: '123 Main St',
        orderType: 'delivery'
      }

      const customerInfo: CustomerInfo = {
        name: 'John Doe',
        phone: '123-456-7890'
      }

      const uiOrder = orderAPIToUI(apiOrder, customerInfo)

      // Verify all API fields are preserved
      expect(uiOrder.id).toBe(apiOrder.id)
      expect(uiOrder.orderNumber).toBe(apiOrder.orderNumber)
      expect(uiOrder.status).toBe(apiOrder.status)
      expect(uiOrder.total).toBe(apiOrder.total)
      expect(uiOrder.customerId).toBe(apiOrder.customerId)

      // Verify computed fields are calculated
      expect(uiOrder.subtotal).toBe(35.00) // 20 + 15
      expect(uiOrder.deliveryFee).toBe(5.00) // delivery order
      expect(uiOrder.discount).toBe(0)
      expect(uiOrder.tax).toBe(3.50) // 10% of subtotal

      // Verify customer info is added
      expect(uiOrder.customerInfo).toEqual(customerInfo)

      // Verify delivery details are added
      expect(uiOrder.deliveryDetails).toBeDefined()
      expect(uiOrder.deliveryDetails?.address).toBe('123 Main St')
      expect(uiOrder.deliveryDetails?.estimatedTime).toBe(30)
    })

    it('should calculate zero delivery fee for pickup orders', () => {
      const apiOrder: OrderAPI = {
        id: 'order-2',
        orderNumber: 'ORD-002',
        status: 'PENDING' as OrderStatus,
        total: 20.00,
        items: [],
        customerId: 'customer-2',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        estimatedTime: 15,
        deliveryAddress: null,
        orderType: 'pickup'
      }

      const customerInfo: CustomerInfo = {
        name: 'Jane Doe',
        phone: '987-654-3210'
      }

      const uiOrder = orderAPIToUI(apiOrder, customerInfo)

      expect(uiOrder.deliveryFee).toBe(0)
      expect(uiOrder.deliveryDetails).toBeUndefined()
    })
  })

  describe('orderItemAPIToUI', () => {
    it('should convert API OrderItem to UI OrderItem', () => {
      const apiOrderItem: OrderItemAPI = {
        id: 'item-1',
        menuItemId: 'menu-1',
        quantity: 3,
        price: 12.50,
        subtotal: 37.50,
        customizations: { size: 'large', extras: ['cheese'] }
      }

      const uiOrderItem = orderItemAPIToUI(apiOrderItem)

      // Verify all API fields are preserved
      expect(uiOrderItem.id).toBe(apiOrderItem.id)
      expect(uiOrderItem.menuItemId).toBe(apiOrderItem.menuItemId)
      expect(uiOrderItem.quantity).toBe(apiOrderItem.quantity)
      expect(uiOrderItem.price).toBe(apiOrderItem.price)
      expect(uiOrderItem.subtotal).toBe(apiOrderItem.subtotal)
      expect(uiOrderItem.customizations).toEqual(apiOrderItem.customizations)

      // Verify UI-specific fields are added
      expect(uiOrderItem.selectedModifiers).toEqual([])
      expect(uiOrderItem.notes).toBeUndefined()
    })
  })

  describe('menuItemMockToAPI', () => {
    it('should convert minimal mock data to complete API type', () => {
      const mockItem: MenuItemMock = {
        id: '789',
        name: 'Mock Item',
        price: 7.99
      }

      const apiItem = menuItemMockToAPI(mockItem)

      // Verify required fields are present
      expect(apiItem.id).toBe(mockItem.id)
      expect(apiItem.name).toBe(mockItem.name)
      expect(apiItem.price).toBe(mockItem.price)

      // Verify defaults are filled in
      expect(apiItem.description).toBeNull()
      expect(apiItem.imageUrl).toBeNull()
      expect(apiItem.categoryId).toBeNull()
      expect(apiItem.menuId).toBe('default-menu')
      expect(apiItem.isActive).toBe(true)
      expect(apiItem.createdAt).toBeDefined()
      expect(apiItem.updatedAt).toBeDefined()
    })

    it('should preserve provided optional fields', () => {
      const mockItem: MenuItemMock = {
        id: '999',
        name: 'Complete Mock',
        description: 'A complete mock item',
        price: 15.99,
        imageUrl: 'https://example.com/mock.jpg',
        categoryId: 'cat-mock',
        menuId: 'menu-mock',
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }

      const apiItem = menuItemMockToAPI(mockItem)

      // Verify all provided fields are preserved
      expect(apiItem.description).toBe(mockItem.description)
      expect(apiItem.imageUrl).toBe(mockItem.imageUrl)
      expect(apiItem.categoryId).toBe(mockItem.categoryId)
      expect(apiItem.menuId).toBe(mockItem.menuId)
      expect(apiItem.isActive).toBe(mockItem.isActive)
      expect(apiItem.createdAt).toBe(mockItem.createdAt)
      expect(apiItem.updatedAt).toBe(mockItem.updatedAt)
    })
  })

  describe('modifierAPIToUI', () => {
    it('should convert API Modifier to UI Modifier', () => {
      const apiModifier: ModifierAPI = {
        id: 'mod-1',
        name: 'Extra Cheese',
        priceAdjustment: 2.50,
        isDefault: false
      }

      const uiModifier = modifierAPIToUI(apiModifier)

      expect(uiModifier.id).toBe(apiModifier.id)
      expect(uiModifier.name).toBe(apiModifier.name)
      expect(uiModifier.priceAdjustment).toBe(apiModifier.priceAdjustment)
      expect(uiModifier.isDefault).toBe(apiModifier.isDefault)
    })
  })

  describe('modifierUIToAPI', () => {
    it('should convert UI Modifier back to API format', () => {
      const uiModifier = {
        id: 'mod-1',
        name: 'Extra Cheese',
        priceAdjustment: 2.50,
        isDefault: false
      }

      const apiModifier = modifierUIToAPI(uiModifier)

      expect(apiModifier.id).toBe(uiModifier.id)
      expect(apiModifier.name).toBe(uiModifier.name)
      expect(apiModifier.priceAdjustment).toBe(uiModifier.priceAdjustment)
      expect(apiModifier.isDefault).toBe(uiModifier.isDefault)
    })
  })

  describe('modifierGroupAPIToUI', () => {
    it('should convert API ModifierGroup to UI ModifierGroup with nested modifiers', () => {
      const apiModifiers: readonly ModifierAPI[] = [
        { id: 'mod-1', name: 'Small', priceAdjustment: 0, isDefault: true },
        { id: 'mod-2', name: 'Large', priceAdjustment: 3.00, isDefault: false }
      ]

      const apiGroup: ModifierGroupAPI = {
        id: 'group-1',
        name: 'Size',
        required: true,
        minSelection: 1,
        maxSelection: 1,
        modifiers: apiModifiers
      }

      const uiGroup = modifierGroupAPIToUI(apiGroup)

      expect(uiGroup.id).toBe(apiGroup.id)
      expect(uiGroup.name).toBe(apiGroup.name)
      expect(uiGroup.required).toBe(apiGroup.required)
      expect(uiGroup.minSelection).toBe(apiGroup.minSelection)
      expect(uiGroup.maxSelection).toBe(apiGroup.maxSelection)
      expect(uiGroup.modifiers).toHaveLength(2)
      expect(uiGroup.modifiers[0].name).toBe('Small')
      expect(uiGroup.modifiers[1].name).toBe('Large')
    })
  })

  describe('categoryMockToAPI', () => {
    it('should convert minimal mock Category to complete API Category', () => {
      const mockCategory: CategoryMock = {
        id: 'cat-1',
        name: 'Test Category'
      }

      const apiCategory = categoryMockToAPI(mockCategory)

      expect(apiCategory.id).toBe(mockCategory.id)
      expect(apiCategory.name).toBe(mockCategory.name)
      expect(apiCategory.description).toBeNull()
      expect(apiCategory.imageUrl).toBeNull()
      expect(apiCategory.sortOrder).toBe(0)
      expect(apiCategory.icon).toBeNull()
    })

    it('should preserve provided optional fields', () => {
      const mockCategory: CategoryMock = {
        id: 'cat-2',
        name: 'Complete Category',
        description: 'A complete category',
        imageUrl: 'https://example.com/cat.jpg',
        sortOrder: 5,
        icon: 'pizza'
      }

      const apiCategory = categoryMockToAPI(mockCategory)

      expect(apiCategory.description).toBe(mockCategory.description)
      expect(apiCategory.imageUrl).toBe(mockCategory.imageUrl)
      expect(apiCategory.sortOrder).toBe(mockCategory.sortOrder)
      expect(apiCategory.icon).toBe(mockCategory.icon)
    })
  })

  describe('orderMockToAPI', () => {
    it('should convert minimal mock Order to complete API Order', () => {
      const mockOrder: OrderMock = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'PENDING' as OrderStatus,
        total: 25.99,
        items: [],
        customerId: 'customer-1',
        orderType: 'delivery'
      }

      const apiOrder = orderMockToAPI(mockOrder)

      expect(apiOrder.id).toBe(mockOrder.id)
      expect(apiOrder.orderNumber).toBe(mockOrder.orderNumber)
      expect(apiOrder.status).toBe(mockOrder.status)
      expect(apiOrder.total).toBe(mockOrder.total)
      expect(apiOrder.customerId).toBe(mockOrder.customerId)
      expect(apiOrder.orderType).toBe(mockOrder.orderType)
      expect(apiOrder.createdAt).toBeDefined()
      expect(apiOrder.updatedAt).toBeDefined()
      expect(apiOrder.estimatedTime).toBeNull()
      expect(apiOrder.deliveryAddress).toBeNull()
    })
  })

  describe('Mass Conversion Utilities', () => {
    describe('convertArrayAPIToUI', () => {
      it('should convert array of API items to UI items', () => {
        const apiItems: MenuItemAPI[] = [
          {
            id: '1',
            name: 'Item 1',
            description: 'First item',
            price: 10.99,
            imageUrl: null,
            categoryId: null,
            menuId: 'menu-1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Item 2',
            description: null,
            price: 15.99,
            imageUrl: null,
            categoryId: null,
            menuId: 'menu-1',
            isActive: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]

        const uiItems = convertArrayAPIToUI(apiItems, menuItemAPIToUI)

        expect(uiItems).toHaveLength(2)
        expect(uiItems[0].id).toBe('1')
        expect(uiItems[0].description).toBe('First item')
        expect(uiItems[1].id).toBe('2')
        expect(uiItems[1].description).toBeUndefined()
      })
    })

    describe('convertArrayMockToAPI', () => {
      it('should convert array of mock items to API items', () => {
        const mockItems: MenuItemMock[] = [
          { id: '1', name: 'Mock Item 1', price: 10.99 },
          { id: '2', name: 'Mock Item 2', price: 15.99, description: 'Second item' }
        ]

        const apiItems = convertArrayMockToAPI(mockItems, menuItemMockToAPI)

        expect(apiItems).toHaveLength(2)
        expect(apiItems[0].id).toBe('1')
        expect(apiItems[0].description).toBeNull()
        expect(apiItems[1].id).toBe('2')
        expect(apiItems[1].description).toBe('Second item')
      })
    })
  })

  describe('Null/Undefined Conversion Utilities', () => {
    describe('nullToUndefined', () => {
      it('should convert null to undefined', () => {
        expect(nullToUndefined(null)).toBeUndefined()
        expect(nullToUndefined('test')).toBe('test')
        expect(nullToUndefined(0)).toBe(0)
        expect(nullToUndefined('')).toBe('')
        expect(nullToUndefined(false)).toBe(false)
      })
    })

    describe('undefinedToNull', () => {
      it('should convert undefined to null', () => {
        expect(undefinedToNull(undefined)).toBeNull()
        expect(undefinedToNull('test')).toBe('test')
        expect(undefinedToNull(0)).toBe(0)
        expect(undefinedToNull('')).toBe('')
        expect(undefinedToNull(false)).toBe(false)
      })
    })

    describe('convertNullsToUndefined', () => {
      it('should convert all null values in object to undefined', () => {
        const objWithNulls = {
          name: 'Test',
          description: null,
          price: 10.99,
          imageUrl: null,
          isActive: true
        }

        const objWithUndefined = convertNullsToUndefined(objWithNulls)

        expect(objWithUndefined.name).toBe('Test')
        expect(objWithUndefined.description).toBeUndefined()
        expect(objWithUndefined.price).toBe(10.99)
        expect(objWithUndefined.imageUrl).toBeUndefined()
        expect(objWithUndefined.isActive).toBe(true)
      })
    })

    describe('convertUndefinedsToNulls', () => {
      it('should convert all undefined values in object to null', () => {
        const objWithUndefined = {
          name: 'Test',
          description: undefined,
          price: 10.99,
          imageUrl: undefined,
          isActive: true
        }

        const objWithNulls = convertUndefinedsToNulls(objWithUndefined)

        expect(objWithNulls.name).toBe('Test')
        expect(objWithNulls.description).toBeNull()
        expect(objWithNulls.price).toBe(10.99)
        expect(objWithNulls.imageUrl).toBeNull()
        expect(objWithNulls.isActive).toBe(true)
      })
    })
  })

  describe('Helper Functions', () => {
    describe('calculateMenuItemBadges', () => {
      it('should calculate badges for new items', () => {
        const newItem: MenuItemAPI = {
          id: '1',
          name: 'New Item',
          description: null,
          price: 10.99,
          imageUrl: null,
          categoryId: null,
          menuId: 'menu-1',
          isActive: true,
          createdAt: new Date().toISOString(), // Created now (new)
          updatedAt: new Date().toISOString()
        }

        const badges = calculateMenuItemBadges(newItem)
        expect(badges).toContainEqual({ type: 'new' })
      })

      it('should not add new badge for old items', () => {
        const oldItem: MenuItemAPI = {
          id: '1',
          name: 'Old Item',
          description: null,
          price: 10.99,
          imageUrl: null,
          categoryId: null,
          menuId: 'menu-1',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z', // Created long ago
          updatedAt: '2023-01-01T00:00:00Z'
        }

        const badges = calculateMenuItemBadges(oldItem)
        expect(badges).not.toContainEqual({ type: 'new' })
      })
    })

    describe('calculateOrderTotals', () => {
      it('should calculate totals for delivery order', () => {
        const items: OrderItemAPI[] = [
          { id: '1', menuItemId: 'menu-1', quantity: 2, price: 10.00, subtotal: 20.00, customizations: null },
          { id: '2', menuItemId: 'menu-2', quantity: 1, price: 15.00, subtotal: 15.00, customizations: null }
        ]

        const totals = calculateOrderTotals(items, 'delivery')

        expect(totals.subtotal).toBe(35.00)
        expect(totals.deliveryFee).toBe(5.00)
        expect(totals.tax).toBe(3.50) // 10% of subtotal
        expect(totals.total).toBe(43.50)
      })

      it('should calculate totals for pickup order with no delivery fee', () => {
        const items: OrderItemAPI[] = [
          { id: '1', menuItemId: 'menu-1', quantity: 1, price: 20.00, subtotal: 20.00, customizations: null }
        ]

        const totals = calculateOrderTotals(items, 'pickup')

        expect(totals.subtotal).toBe(20.00)
        expect(totals.deliveryFee).toBe(0)
        expect(totals.tax).toBe(2.00)
        expect(totals.total).toBe(22.00)
      })

      it('should use custom tax rate', () => {
        const items: OrderItemAPI[] = [
          { id: '1', menuItemId: 'menu-1', quantity: 1, price: 100.00, subtotal: 100.00, customizations: null }
        ]

        const totals = calculateOrderTotals(items, 'pickup', 0.15) // 15% tax

        expect(totals.tax).toBe(15.00)
        expect(totals.total).toBe(115.00)
      })
    })
  })
})
