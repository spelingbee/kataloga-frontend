import type { CartItem, MenuItem, ApiResponse } from '~/types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  removedItems: CartItem[]
  priceChanges: Array<{
    item: CartItem
    oldPrice: number
    newPrice: number
  }>
  stopListItems: CartItem[]
}

export interface ValidationOptions {
  checkStopList?: boolean
  checkPrices?: boolean
  checkAvailability?: boolean
}

export class CartValidationService {
  private getApiClient(): any {
    const nuxtApp = useNuxtApp()
    return (nuxtApp as any).$apiClient
  }

  private getTenantSlug(): string | null {
    const nuxtApp = useNuxtApp()
    const runtimeConfig = nuxtApp.$config
    return runtimeConfig?.public?.tenantSlug || null
  }

  /**
   * Validate cart items against current menu data
   * Checks for:
   * - Items in stop list (unavailable)
   * - Price changes
   * - Item availability
   */
  async validateCart(
    cartItems: CartItem[],
    options: ValidationOptions = {
      checkStopList: true,
      checkPrices: true,
      checkAvailability: true,
    }
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      removedItems: [],
      priceChanges: [],
      stopListItems: [],
    }

    if (cartItems.length === 0) {
      return result
    }

    try {
      // Fetch current menu data
      const currentMenuItems = await this.fetchCurrentMenuData()
      if (!currentMenuItems) {
        result.errors.push('Unable to validate cart. Please try again.')
        result.isValid = false
        return result
      }

      // Create a map for quick lookup
      const menuItemsMap = new Map<string, MenuItem>(
        currentMenuItems.map(item => [item.id, item])
      )

      // Validate each cart item
      for (const cartItem of cartItems) {
        const currentMenuItem = menuItemsMap.get(cartItem.menuItem.id)

        // Check if item exists
        if (!currentMenuItem) {
          result.removedItems.push(cartItem)
          result.errors.push(`${cartItem.menuItem.name} is no longer available`)
          result.isValid = false
          continue
        }

        // Check availability (isActive)
        if (options.checkAvailability && !currentMenuItem.isActive) {
          result.removedItems.push(cartItem)
          result.errors.push(`${cartItem.menuItem.name} is no longer available`)
          result.isValid = false
          continue
        }

        // Check stop list (using isAvailable field if it exists)
        if (options.checkStopList) {
          const isAvailable = this.checkItemAvailability(currentMenuItem)
          if (!isAvailable) {
            result.stopListItems.push(cartItem)
            result.removedItems.push(cartItem)
            result.warnings.push(
              `${cartItem.menuItem.name} is temporarily unavailable and has been removed from your cart`
            )
            result.isValid = false
            continue
          }
        }

        // Check for price changes
        if (options.checkPrices) {
          const oldPrice = cartItem.menuItem.price
          const newPrice = currentMenuItem.price

          if (oldPrice !== newPrice) {
            // Update the cart item with new price
            const updatedCartItem = {
              ...cartItem,
              menuItem: currentMenuItem,
            }

            // Recalculate subtotal with new price
            const modifierPrice = cartItem.selectedModifiers.reduce(
              (sum, mod) => sum + (mod.priceAdjustment || 0),
              0
            )
            updatedCartItem.subtotal = cartItem.quantity * (newPrice + modifierPrice)

            result.priceChanges.push({
              item: updatedCartItem,
              oldPrice,
              newPrice,
            })

            const priceDiff = newPrice - oldPrice
            const diffText = priceDiff > 0 ? `increased by ${Math.abs(priceDiff)}` : `decreased by ${Math.abs(priceDiff)}`
            result.warnings.push(
              `Price for ${cartItem.menuItem.name} has ${diffText}`
            )
          }
        }
      }

      // Set overall validity
      result.isValid = result.errors.length === 0

      return result
    } catch (error) {
      console.error('Cart validation failed:', error)
      result.errors.push('Unable to validate cart. Please try again.')
      result.isValid = false
      return result
    }
  }

  /**
   * Validate cart before checkout
   * This is a comprehensive validation that checks everything
   */
  async validateBeforeCheckout(cartItems: CartItem[]): Promise<ValidationResult> {
    return this.validateCart(cartItems, {
      checkStopList: true,
      checkPrices: true,
      checkAvailability: true,
    })
  }

  /**
   * Validate cart on reconnection (after being offline)
   * This checks if items are still available and prices haven't changed
   */
  async validateOnReconnection(cartItems: CartItem[]): Promise<ValidationResult> {
    return this.validateCart(cartItems, {
      checkStopList: true,
      checkPrices: true,
      checkAvailability: true,
    })
  }

  /**
   * Quick validation for stop list only
   * Used for real-time updates when stop list changes
   */
  async validateStopList(cartItems: CartItem[]): Promise<ValidationResult> {
    return this.validateCart(cartItems, {
      checkStopList: true,
      checkPrices: false,
      checkAvailability: true,
    })
  }

  /**
   * Fetch current menu data from API
   */
  private async fetchCurrentMenuData(): Promise<MenuItem[] | null> {
    try {
      const tenantSlug = this.getTenantSlug()
      if (!tenantSlug) {
        console.error('Tenant slug not configured')
        return null
      }

      const response = await this.getApiClient().get(`/public/menu/${tenantSlug}`)

      if (response.success && response.data) {
        // Extract menu items from menus
        const items: MenuItem[] = []

        response.data.forEach((menu: any) => {
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
                dietary: item.dietary || [],
                // Check for stop list status
                // This might come from different fields depending on backend implementation
                isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
                stockQuantity: item.stockQuantity,
              } as MenuItem)
            })
          }
        })

        return items
      }

      return null
    } catch (error) {
      console.error('Failed to fetch menu data:', error)
      return null
    }
  }

  /**
   * Check if an item is available (not in stop list)
   * This checks multiple possible fields that might indicate stop list status
   */
  private checkItemAvailability(menuItem: MenuItem): boolean {
    // Check isAvailable field if it exists
    if ('isAvailable' in menuItem && menuItem.isAvailable === false) {
      return false
    }

    // Check stockQuantity if it exists
    if ('stockQuantity' in menuItem && typeof menuItem.stockQuantity === 'number') {
      if (menuItem.stockQuantity <= 0) {
        return false
      }
    }

    // Check isActive as a fallback
    if (!menuItem.isActive) {
      return false
    }

    return true
  }

  /**
   * Format validation result for user display
   */
  formatValidationMessage(result: ValidationResult): {
    title: string
    message: string
    type: 'error' | 'warning' | 'info'
  } {
    if (!result.isValid) {
      if (result.removedItems.length > 0) {
        return {
          title: 'Cart Updated',
          message: `${result.removedItems.length} item(s) were removed because they are no longer available.`,
          type: 'error',
        }
      }
      if (result.errors.length > 0) {
        return {
          title: 'Validation Error',
          message: result.errors[0],
          type: 'error',
        }
      }
    }

    if (result.warnings.length > 0) {
      if (result.priceChanges.length > 0) {
        return {
          title: 'Price Changes',
          message: `Prices have changed for ${result.priceChanges.length} item(s) in your cart.`,
          type: 'warning',
        }
      }
      return {
        title: 'Cart Updated',
        message: result.warnings[0],
        type: 'warning',
      }
    }

    return {
      title: 'Cart Validated',
      message: 'Your cart is up to date.',
      type: 'info',
    }
  }
}

// Create singleton instance
let cartValidationService: CartValidationService | null = null

export function useCartValidationService(): CartValidationService {
  if (!cartValidationService) {
    cartValidationService = new CartValidationService()
  }
  return cartValidationService
}
