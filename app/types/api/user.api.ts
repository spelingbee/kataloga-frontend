/**
 * API response types for user-related endpoints
 * These types are readonly and match backend responses exactly
 */

export interface UserAPI {
  readonly id: string
  readonly telegramId: number
  readonly firstName: string
  readonly lastName: string | null
  readonly username: string | null
  readonly languageCode: string | null
  readonly isPremium: boolean
  readonly photoUrl: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface UserProfileAPI {
  readonly id: string
  readonly userId: string
  readonly phoneNumber: string | null
  readonly email: string | null
  readonly defaultAddress: string | null
  readonly preferences: Readonly<Record<string, any>> | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface UserAddressAPI {
  readonly id: string
  readonly userId: string
  readonly label: string
  readonly address: string
  readonly city: string
  readonly postalCode: string | null
  readonly coordinates: readonly [number, number] | null
  readonly isDefault: boolean
  readonly createdAt: string
  readonly updatedAt: string
}
