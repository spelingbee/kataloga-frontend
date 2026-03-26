/**
 * Minimal types for mock data in tests
 * These types have optional fields that are required in API types
 * Uses undefined for nullable fields to match UI standard for better compatibility
 */

export interface MenuItemMock {
  id: string
  name: string
  description?: string | undefined  // Match UI standard (undefined) for better compatibility
  price: number
  imageUrl?: string | undefined     // Match UI standard (undefined) for better compatibility
  categoryId?: string | undefined   // Match UI standard (undefined) for better compatibility
  menuId?: string                   // Optional for mocks
  isActive?: boolean
  createdAt?: string                // Optional for mocks
  updatedAt?: string                // Optional for mocks
  // Additional UI-compatible fields for testing
  stockQuantity?: number
  calories?: number | null
  preparationTime?: number | null
  cookingTime?: number | null
  ingredients?: string[]
  allergens?: string[]
  dietary?: string[]
  isNew?: boolean
  isPopular?: boolean
}

export interface CategoryMock {
  id: string
  name: string
  slug?: string
  description?: string | undefined  // Match UI standard (undefined) for better compatibility
  imageUrl?: string | undefined     // Match UI standard (undefined) for better compatibility
  sortOrder?: number
  icon?: string | undefined         // Match UI standard (undefined) for better compatibility
  count?: number                    // UI-specific field for testing
}
