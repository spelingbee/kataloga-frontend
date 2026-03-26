/**
 * Property-based tests for null safety enforcement
 * 
 * These tests validate that the system correctly handles null/undefined values
 * and provides safe accessor methods for nullable objects.
 * 
 * **Property 7: Null Safety Enforcement**
 * **Validates: Requirements 7.1, 7.2**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  isDefined,
  hasElements,
  safeArrayAccess,
  safePropertyAccess,
  safeNestedAccess,
  firstDefined,
  filterDefined,
  safeToString,
  safeParseNumber,
  assertDefined,
  requireDefined,
  isNonEmptyString,
  isValidNumber,
  hasProperty
} from '~/types/utils/type-guards'

describe('Property 7: Null Safety Enforcement', () => {
  describe('isDefined type guard', () => {
    it('should correctly identify defined values', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.object(),
          fc.array(fc.anything())
        ),
        (value) => {
          expect(isDefined(value)).toBe(true)
        }
      ))
    })

    it('should correctly identify null and undefined values', () => {
      expect(isDefined(null)).toBe(false)
      expect(isDefined(undefined)).toBe(false)
    })

    it('should handle edge cases correctly', () => {
      expect(isDefined(0)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined([])).toBe(true)
      expect(isDefined({})).toBe(true)
    })
  })

  describe('hasElements array guard', () => {
    it('should return true for non-empty arrays', () => {
      fc.assert(fc.property(
        fc.array(fc.anything(), { minLength: 1 }),
        (array) => {
          expect(hasElements(array)).toBe(true)
        }
      ))
    })

    it('should return false for empty, null, or undefined arrays', () => {
      expect(hasElements([])).toBe(false)
      expect(hasElements(null)).toBe(false)
      expect(hasElements(undefined)).toBe(false)
    })

    it('should handle non-array values safely', () => {
      expect(hasElements('not an array' as any)).toBe(false)
      expect(hasElements(123 as any)).toBe(false)
      expect(hasElements({} as any)).toBe(false)
    })
  })

  describe('safeArrayAccess', () => {
    it('should return correct element for valid indices', () => {
      fc.assert(fc.property(
        fc.array(fc.string(), { minLength: 1 }),
        (array) => {
          const validIndex = Math.floor(Math.random() * array.length)
          expect(safeArrayAccess(array, validIndex)).toBe(array[validIndex])
        }
      ))
    })

    it('should return undefined for invalid indices', () => {
      fc.assert(fc.property(
        fc.array(fc.string()),
        fc.integer({ min: -100, max: -1 }),
        (array, negativeIndex) => {
          expect(safeArrayAccess(array, negativeIndex)).toBeUndefined()
        }
      ))

      fc.assert(fc.property(
        fc.array(fc.string()),
        (array) => {
          const outOfBoundsIndex = array.length + Math.floor(Math.random() * 10) + 1
          expect(safeArrayAccess(array, outOfBoundsIndex)).toBeUndefined()
        }
      ))
    })

    it('should handle null and undefined arrays safely', () => {
      fc.assert(fc.property(
        fc.integer(),
        (index) => {
          expect(safeArrayAccess(null, index)).toBeUndefined()
          expect(safeArrayAccess(undefined, index)).toBeUndefined()
        }
      ))
    })
  })

  describe('safePropertyAccess', () => {
    it('should return property value for valid objects', () => {
      fc.assert(fc.property(
        fc.record({
          name: fc.string(),
          age: fc.integer(),
          active: fc.boolean()
        }),
        (obj) => {
          expect(safePropertyAccess(obj, 'name')).toBe(obj.name)
          expect(safePropertyAccess(obj, 'age')).toBe(obj.age)
          expect(safePropertyAccess(obj, 'active')).toBe(obj.active)
        }
      ))
    })

    it('should return undefined for null and undefined objects', () => {
      fc.assert(fc.property(
        fc.string(),
        (key) => {
          expect(safePropertyAccess(null, key as any)).toBeUndefined()
          expect(safePropertyAccess(undefined, key as any)).toBeUndefined()
        }
      ))
    })

    it('should handle missing properties safely', () => {
      const obj = { name: 'test' }
      expect(safePropertyAccess(obj, 'nonexistent' as any)).toBeUndefined()
    })
  })

  describe('safeNestedAccess', () => {
    it('should return nested property value for valid objects', () => {
      const obj = {
        user: {
          profile: {
            name: 'John Doe'
          }
        }
      }
      
      expect(safeNestedAccess(obj, 'user', 'profile')).toBe(obj.user.profile)
    })

    it('should return undefined for null/undefined at any level', () => {
      const obj1 = null
      const obj2 = { user: null }
      const obj3 = { user: { profile: undefined } } // Changed from null to undefined
      
      expect(safeNestedAccess(obj1, 'user' as any, 'profile' as any)).toBeUndefined()
      expect(safeNestedAccess(obj2, 'user', 'profile' as any)).toBeUndefined()
      expect(safeNestedAccess(obj3, 'user', 'profile')).toBeUndefined()
    })

    it('should return null when property exists but is null', () => {
      const obj = { user: { profile: null } }
      expect(safeNestedAccess(obj, 'user', 'profile')).toBeNull()
    })
  })

  describe('firstDefined', () => {
    it('should return first defined value', () => {
      fc.assert(fc.property(
        fc.string(),
        fc.string(),
        (value1, value2) => {
          expect(firstDefined(null, undefined, value1, value2)).toBe(value1)
          expect(firstDefined(undefined, value1, null, value2)).toBe(value1)
        }
      ))
    })

    it('should return undefined if all values are null/undefined', () => {
      expect(firstDefined(null, undefined, null)).toBeUndefined()
      expect(firstDefined()).toBeUndefined()
    })

    it('should handle mixed types correctly', () => {
      expect(firstDefined(null, 0, 'test')).toBe(0)
      expect(firstDefined(undefined, false, true)).toBe(false)
      expect(firstDefined(null, '', 'test')).toBe('')
    })
  })

  describe('filterDefined', () => {
    it('should remove all null and undefined values', () => {
      fc.assert(fc.property(
        fc.array(fc.oneof(
          fc.string(),
          fc.constant(null),
          fc.constant(undefined)
        )),
        (array) => {
          const filtered = filterDefined(array)
          expect(filtered.every(item => item !== null && item !== undefined)).toBe(true)
        }
      ))
    })

    it('should preserve all defined values', () => {
      const input = [1, null, 'test', undefined, false, 0, '']
      const result = filterDefined(input)
      expect(result).toEqual([1, 'test', false, 0, ''])
    })
  })

  describe('safeToString', () => {
    it('should convert values to strings safely', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (value) => {
          const result = safeToString(value)
          expect(typeof result).toBe('string')
          
          if (value === null || value === undefined) {
            expect(result).toBe('')
          } else {
            expect(result).toBe(String(value))
          }
        }
      ))
    })
  })

  describe('safeParseNumber', () => {
    it('should parse valid number strings', () => {
      fc.assert(fc.property(
        fc.float().filter(n => isFinite(n) && n !== 0), // Exclude 0 to avoid -0/+0 issues
        (num) => {
          const str = num.toString()
          const result = safeParseNumber(str)
          expect(result).toBe(num)
        }
      ))
      
      // Test specific cases including zero
      expect(safeParseNumber('0')).toBe(0)
      expect(safeParseNumber('-0')).toBe(-0)
      expect(safeParseNumber('42')).toBe(42)
      expect(safeParseNumber('-42')).toBe(-42)
      expect(safeParseNumber('3.14')).toBe(3.14)
    })

    it('should return undefined for invalid inputs', () => {
      expect(safeParseNumber('not a number')).toBeUndefined()
      expect(safeParseNumber('')).toBeUndefined()
      expect(safeParseNumber('   ')).toBeUndefined()
      expect(safeParseNumber(null)).toBeUndefined()
      expect(safeParseNumber(undefined)).toBeUndefined()
    })

    it('should handle edge cases correctly', () => {
      expect(safeParseNumber('0')).toBe(0)
      expect(safeParseNumber('-0')).toBe(-0)
      expect(safeParseNumber('Infinity')).toBeUndefined()
      expect(safeParseNumber('NaN')).toBeUndefined()
    })
  })

  describe('assertDefined and requireDefined', () => {
    it('should pass through defined values', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.object()
        ),
        (value) => {
          expect(() => assertDefined(value)).not.toThrow()
          expect(requireDefined(value)).toBe(value)
        }
      ))
    })

    it('should throw for null and undefined values', () => {
      expect(() => assertDefined(null)).toThrow()
      expect(() => assertDefined(undefined)).toThrow()
      expect(() => requireDefined(null)).toThrow()
      expect(() => requireDefined(undefined)).toThrow()
    })

    it('should use custom error messages', () => {
      const customMessage = 'Custom error message'
      expect(() => assertDefined(null, customMessage)).toThrow(customMessage)
      expect(() => requireDefined(undefined, customMessage)).toThrow(customMessage)
    })
  })

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1 }),
        (str) => {
          expect(isNonEmptyString(str)).toBe(true)
        }
      ))
    })

    it('should return false for empty strings and non-strings', () => {
      expect(isNonEmptyString('')).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
      expect(isNonEmptyString(123)).toBe(false)
      expect(isNonEmptyString({})).toBe(false)
    })
  })

  describe('isValidNumber', () => {
    it('should return true for valid finite numbers', () => {
      fc.assert(fc.property(
        fc.float({ noNaN: true }).filter(n => isFinite(n)),
        (num) => {
          expect(isValidNumber(num)).toBe(true)
        }
      ))
    })

    it('should return false for invalid numbers', () => {
      expect(isValidNumber(NaN)).toBe(false)
      expect(isValidNumber(Infinity)).toBe(false)
      expect(isValidNumber(-Infinity)).toBe(false)
      expect(isValidNumber('123' as any)).toBe(false)
      expect(isValidNumber(null as any)).toBe(false)
    })
  })

  describe('hasProperty', () => {
    it('should return true for existing properties', () => {
      fc.assert(fc.property(
        fc.record({
          name: fc.string(),
          age: fc.integer()
        }),
        (obj) => {
          expect(hasProperty(obj, 'name')).toBe(true)
          expect(hasProperty(obj, 'age')).toBe(true)
        }
      ))
    })

    it('should return false for missing properties and invalid objects', () => {
      const obj = { name: 'test' }
      expect(hasProperty(obj, 'nonexistent')).toBe(false)
      expect(hasProperty(null, 'any')).toBe(false)
      expect(hasProperty(undefined, 'any')).toBe(false)
      expect(hasProperty('string', 'any')).toBe(false)
    })
  })

  describe('Integration: Complex null safety scenarios', () => {
    it('should handle deeply nested nullable structures safely', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.record({
            user: fc.oneof(
              fc.record({
                profile: fc.oneof(
                  fc.record({
                    settings: fc.oneof(
                      fc.record({
                        theme: fc.string()
                      }),
                      fc.constant(null)
                    )
                  }),
                  fc.constant(null)
                )
              }),
              fc.constant(null)
            )
          }),
          fc.constant(null)
        ),
        (data) => {
          // Should never throw, always return string or undefined
          const theme = safeNestedAccess(
            safePropertyAccess(data, 'user'),
            'profile',
            'settings'
          )?.theme
          
          expect(typeof theme === 'string' || theme === undefined).toBe(true)
        }
      ))
    })

    it('should safely process arrays with nullable elements', () => {
      fc.assert(fc.property(
        fc.array(fc.oneof(
          fc.record({ id: fc.string(), name: fc.string() }),
          fc.constant(null),
          fc.constant(undefined)
        )),
        (items) => {
          // Filter out null/undefined items and process safely
          const validItems = filterDefined(items)
          const names = validItems
            .map(item => safePropertyAccess(item, 'name'))
            .filter(isDefined)
          
          expect(Array.isArray(names)).toBe(true)
          expect(names.every(name => typeof name === 'string')).toBe(true)
        }
      ))
    })

    it('should provide fallback values for nullable chains', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.record({
            config: fc.oneof(
              fc.record({
                api: fc.oneof(
                  fc.record({ url: fc.string({ minLength: 1 }) }), // Ensure non-empty string
                  fc.constant(null)
                )
              }),
              fc.constant(null)
            )
          }),
          fc.constant(null)
        ),
        (data) => {
          // Safe access with fallback
          const apiUrl = firstDefined(
            safePropertyAccess(
              safePropertyAccess(data, 'config'),
              'api'
            )?.url,
            'https://default-api.com'
          )
          
          expect(typeof apiUrl).toBe('string')
          expect(apiUrl.length).toBeGreaterThan(0)
        }
      ))
    })
  })
})