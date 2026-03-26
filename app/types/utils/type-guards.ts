/**
 * Type guard functions for runtime type checking
 * 
 * This module provides type guard functions that help with null/undefined safety
 * and runtime type validation. These functions narrow TypeScript types and enable
 * safe access to potentially undefined or null values.
 * 
 * @module types/utils/type-guards
 */

/**
 * Check if value is defined (not null or undefined)
 * 
 * @template T - The type of the value being checked
 * @param value - The value to check
 * @returns True if value is not null or undefined
 * 
 * @example
 * const value: string | null = getValue()
 * if (isDefined(value)) {
 *   // value is string here
 *   console.log(value.toUpperCase())
 * }
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if value is a non-empty string
 * 
 * @param value - The value to check
 * @returns True if value is a string with length > 0
 * 
 * @example
 * const input: unknown = getUserInput()
 * if (isNonEmptyString(input)) {
 *   // input is string here
 *   console.log(input.trim())
 * }
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Check if value is a valid number
 * 
 * Validates that the value is a number and not NaN or Infinity
 * 
 * @param value - The value to check
 * @returns True if value is a finite number
 * 
 * @example
 * const price: unknown = parsePrice(input)
 * if (isValidNumber(price)) {
 *   // price is number here
 *   console.log(price.toFixed(2))
 * }
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Check if array has elements
 * 
 * @template T - The type of array elements
 * @param array - The array to check
 * @returns True if array is defined and has at least one element
 * 
 * @example
 * const items: Item[] | null = getItems()
 * if (hasElements(items)) {
 *   // items is Item[] here
 *   console.log(items[0])
 * }
 */
export function hasElements<T>(array: T[] | null | undefined): array is T[] {
  return Array.isArray(array) && array.length > 0
}

/**
 * Check if object has property
 * 
 * @template K - The property key type
 * @param obj - The object to check
 * @param key - The property key to look for
 * @returns True if object is defined and has the specified property
 * 
 * @example
 * const data: unknown = parseJSON(input)
 * if (hasProperty(data, 'name')) {
 *   // data is Record<'name', unknown> here
 *   console.log(data.name)
 * }
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj
}

/**
 * Assert value is defined, throw error if not
 * 
 * @template T - The type of the value being asserted
 * @param value - The value to assert
 * @param message - Optional error message
 * @throws Error if value is null or undefined
 * 
 * @example
 * const user = getUser()
 * assertDefined(user, 'User must be logged in')
 * // user is non-null here
 * console.log(user.name)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value is null or undefined')
  }
}

/**
 * Get defined value or throw error
 * 
 * @template T - The type of the value being required
 * @param value - The value to require
 * @param message - Optional error message
 * @returns The value if defined
 * @throws Error if value is null or undefined
 * 
 * @example
 * const config = requireDefined(getConfig(), 'Config is required')
 * // config is non-null here
 * console.log(config.apiUrl)
 */
export function requireDefined<T>(
  value: T | null | undefined,
  message?: string
): T {
  assertDefined(value, message)
  return value
}

/**
 * Safely access array element with null/undefined array support
 * 
 * Returns undefined if array is null/undefined or index is out of bounds.
 * 
 * @template T - The type of array elements
 * @param array - The array to access (can be null/undefined)
 * @param index - The index to access
 * @returns The element at index or undefined if array is null/undefined or out of bounds
 * 
 * @example
 * const items: Item[] | null = getItems()
 * const firstItem = safeArrayAccess(items, 0)
 * if (isDefined(firstItem)) {
 *   console.log(firstItem.name)
 * }
 */
export function safeArrayAccess<T>(
  array: T[] | null | undefined,
  index: number
): T | undefined {
  if (!hasElements(array) || index < 0 || index >= array.length) {
    return undefined
  }
  return array[index]
}

/**
 * Safely access object property
 * 
 * Returns undefined if object is null/undefined instead of throwing an error.
 * 
 * @template T - The type of the object
 * @template K - The property key type
 * @param obj - The object to access
 * @param key - The property key to access
 * @returns The property value or undefined if object is null/undefined
 * 
 * @example
 * const user = getUser()
 * const name = safePropertyAccess(user, 'name')
 * if (isDefined(name)) {
 *   console.log(name)
 * }
 */
export function safePropertyAccess<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key]
}

/**
 * Safely access nested object property
 * 
 * Returns undefined if any part of the path is null/undefined.
 * 
 * @template T - The type of the root object
 * @template K1 - The first property key type
 * @template K2 - The second property key type
 * @param obj - The object to access
 * @param key1 - The first property key
 * @param key2 - The second property key
 * @returns The nested property value or undefined if any part is null/undefined
 * 
 * @example
 * const order = getOrder()
 * const customerName = safeNestedAccess(order, 'customer', 'name')
 * if (isDefined(customerName)) {
 *   console.log(customerName)
 * }
 */
export function safeNestedAccess<T, K1 extends keyof T, K2 extends keyof NonNullable<T[K1]>>(
  obj: T | null | undefined,
  key1: K1,
  key2: K2
): NonNullable<T[K1]>[K2] | undefined {
  return obj?.[key1]?.[key2]
}

/**
 * Get first defined value from array of candidates
 * 
 * Returns the first value that is not null or undefined.
 * 
 * @template T - The type of the values
 * @param candidates - Array of candidate values
 * @returns The first defined value or undefined if all are null/undefined
 * 
 * @example
 * const value = firstDefined([null, undefined, 'default', 'fallback'])
 * // value is 'default'
 */
export function firstDefined<T>(...candidates: (T | null | undefined)[]): T | undefined {
  for (const candidate of candidates) {
    if (isDefined(candidate)) {
      return candidate
    }
  }
  return undefined
}

/**
 * Filter out null and undefined values from array
 * 
 * @template T - The type of array elements
 * @param array - The array to filter
 * @returns Array with only defined values
 * 
 * @example
 * const items = [1, null, 2, undefined, 3]
 * const defined = filterDefined(items) // [1, 2, 3]
 */
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isDefined)
}

/**
 * Safely convert value to string
 * 
 * Returns empty string for null/undefined, string representation otherwise.
 * 
 * @param value - The value to convert
 * @returns String representation of the value
 * 
 * @example
 * const text = safeToString(null) // ''
 * const number = safeToString(42) // '42'
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

/**
 * Safely parse number from string
 * 
 * Returns undefined for invalid numbers instead of NaN.
 * 
 * @param value - The string to parse
 * @returns Parsed number or undefined if invalid
 * 
 * @example
 * const num = safeParseNumber('42') // 42
 * const invalid = safeParseNumber('abc') // undefined
 */
export function safeParseNumber(value: string | null | undefined): number | undefined {
  if (!isDefined(value) || value.trim() === '') {
    return undefined
  }
  const parsed = Number(value)
  return isValidNumber(parsed) ? parsed : undefined
}
