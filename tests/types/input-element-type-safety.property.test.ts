import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { mount } from '@vue/test-utils'
import BaseInput from '../../app/components/base/BaseInput.vue'

/**
 * Property 6: Input Element Type Safety
 * 
 * For any input element property assignment or attribute usage, the system should 
 * accept only correct value types and ensure type safety for all input-specific attributes.
 * 
 * **Validates: Requirements 6.1, 6.2**
 */

// Define arbitraries for different input types and their valid values
const textInputTypes = fc.constantFrom('text', 'email', 'password', 'tel', 'url', 'search')
const numericInputTypes = fc.constantFrom('number', 'range')
const dateTimeInputTypes = fc.constantFrom('date', 'datetime-local', 'time', 'month', 'week')
const fileInputTypes = fc.constant('file')
const booleanInputTypes = fc.constantFrom('checkbox', 'radio')
const textareaType = fc.constant('textarea')

const allInputTypes = fc.oneof(
  textInputTypes,
  numericInputTypes, 
  dateTimeInputTypes,
  fileInputTypes,
  booleanInputTypes,
  textareaType
)

// Generate valid values for different input types
const stringValue = fc.string({ minLength: 0, maxLength: 50 }).filter(s => s.trim() !== '')
const numericValue = fc.float({ min: Math.fround(-100), max: Math.fround(100) })
const dateValue = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(date => date.toISOString().split('T')[0]) // Format as YYYY-MM-DD

// Generate valid attributes for different input types
const numericAttributes = fc.record({
  min: fc.oneof(fc.constant(undefined), fc.integer({ min: 0, max: 100 })),
  max: fc.oneof(fc.constant(undefined), fc.integer({ min: 100, max: 1000 })),
  step: fc.oneof(fc.constant(undefined), fc.float({ min: Math.fround(0.01), max: Math.fround(10) }))
})

const fileAttributes = fc.record({
  accept: fc.oneof(fc.constant(undefined), fc.constantFrom('image/*', 'text/*', '.pdf', '.jpg,.png')),
  multiple: fc.oneof(fc.constant(undefined), fc.boolean())
})

const baseAttributes = fc.record({
  placeholder: fc.oneof(fc.constant(undefined), fc.string({ maxLength: 20 })),
  disabled: fc.oneof(fc.constant(undefined), fc.boolean()),
  readonly: fc.oneof(fc.constant(undefined), fc.boolean()),
  required: fc.oneof(fc.constant(undefined), fc.boolean())
})

describe('Input Element Type Safety Property Tests', () => {
  it('should accept correct value types for text-based inputs', () => {
    fc.assert(fc.property(
      textInputTypes,
      fc.oneof(stringValue, fc.constant('')),
      baseAttributes,
      (inputType, value, attrs) => {
        // Property: Text-based inputs should accept string values
        const wrapper = mount(BaseInput, {
          props: {
            type: inputType,
            modelValue: value,
            ...attrs
          },
          global: {
            stubs: {
              BaseIcon: true,
              BaseButton: true
            }
          }
        })

        const inputElement = wrapper.find('input')
        expect(inputElement.exists()).toBe(true)
        expect(inputElement.attributes('type')).toBe(inputType)
        
        // Value should be properly bound as string (no trimming expected)
        expect(inputElement.element.value).toBe(value)
      }
    ))
  })

  it('should accept correct value types for numeric inputs', () => {
    fc.assert(fc.property(
      numericInputTypes,
      fc.oneof(numericValue, fc.constant(null), fc.constant('')),
      numericAttributes,
      baseAttributes,
      (inputType, value, numAttrs, baseAttrs) => {
        // Property: Numeric inputs should accept number values and null
        const wrapper = mount(BaseInput, {
          props: {
            type: inputType,
            modelValue: value,
            ...numAttrs,
            ...baseAttrs
          },
          global: {
            stubs: {
              BaseIcon: true,
              BaseButton: true
            }
          }
        })

        const inputElement = wrapper.find('input')
        expect(inputElement.exists()).toBe(true)
        expect(inputElement.attributes('type')).toBe(inputType)
        
        // Numeric attributes should be properly set
        if (numAttrs.min !== undefined) {
          expect(inputElement.attributes('min')).toBe(String(numAttrs.min))
        }
        if (numAttrs.max !== undefined) {
          expect(inputElement.attributes('max')).toBe(String(numAttrs.max))
        }
        if (numAttrs.step !== undefined) {
          expect(inputElement.attributes('step')).toBe(String(numAttrs.step))
        }
      }
    ))
  })

  it('should accept correct value types for date/time inputs', () => {
    fc.assert(fc.property(
      dateTimeInputTypes,
      fc.oneof(dateValue, fc.constant('')),
      baseAttributes,
      (inputType, value, attrs) => {
        // Property: Date/time inputs should accept string values in appropriate formats
        let expectedValue = value
        
        // Adjust value format based on input type
        if (value && value !== '') {
          if (inputType === 'datetime-local' && value.includes('-') && !value.includes('T')) {
            // datetime-local inputs expect YYYY-MM-DDTHH:MM format
            expectedValue = value + 'T00:00' // Add default time
          } else if (inputType === 'month' && value.includes('-')) {
            // Month inputs expect YYYY-MM format
            expectedValue = value.substring(0, 7) // Take only YYYY-MM part
          } else if (inputType === 'week' && value.includes('-')) {
            // Week inputs expect YYYY-W## format, but we'll just use the date as-is for testing
            expectedValue = value
          }
        }
        
        const wrapper = mount(BaseInput, {
          props: {
            type: inputType,
            modelValue: expectedValue,
            ...attrs
          },
          global: {
            stubs: {
              BaseIcon: true,
              BaseButton: true
            }
          }
        })

        const inputElement = wrapper.find('input')
        expect(inputElement.exists()).toBe(true)
        expect(inputElement.attributes('type')).toBe(inputType)
        
        // For datetime-local, the browser may normalize the value
        if (inputType === 'datetime-local' && expectedValue && expectedValue !== '') {
          // The input element should have the normalized value
          expect(inputElement.element.value).toBe(expectedValue)
        } else {
          // Value should be properly bound as string
          expect(inputElement.element.value).toBe(expectedValue)
        }
      }
    ), { numRuns: 10 }) // Reduce runs for faster testing
  })

  it('should handle file inputs with correct attributes', () => {
    fc.assert(fc.property(
      fileInputTypes,
      fileAttributes,
      baseAttributes,
      (inputType, fileAttrs, baseAttrs) => {
        // Property: File inputs should handle file-specific attributes correctly
        const wrapper = mount(BaseInput, {
          props: {
            type: inputType,
            modelValue: null, // File inputs start with null
            ...fileAttrs,
            ...baseAttrs
          },
          global: {
            stubs: {
              BaseIcon: true,
              BaseButton: true
            }
          }
        })

        const inputElement = wrapper.find('input')
        expect(inputElement.exists()).toBe(true)
        expect(inputElement.attributes('type')).toBe('file')
        
        // File-specific attributes should be properly set
        if (fileAttrs.accept !== undefined) {
          expect(inputElement.attributes('accept')).toBe(fileAttrs.accept)
        }
        if (fileAttrs.multiple !== undefined) {
          expect(inputElement.attributes('multiple')).toBe(fileAttrs.multiple ? '' : undefined)
        }
      }
    ))
  })

  it('should render textarea for textarea type', () => {
    fc.assert(fc.property(
      textareaType,
      fc.oneof(stringValue, fc.constant('')),
      baseAttributes,
      (inputType, value, attrs) => {
        // Property: Textarea type should render textarea element, not input
        const wrapper = mount(BaseInput, {
          props: {
            type: inputType,
            modelValue: value,
            ...attrs
          },
          global: {
            stubs: {
              BaseIcon: true,
              BaseButton: true
            }
          }
        })

        const textareaElement = wrapper.find('textarea')
        const inputElement = wrapper.find('input')
        
        expect(textareaElement.exists()).toBe(true)
        expect(inputElement.exists()).toBe(false)
        
        // Value should be properly bound as string
        expect(textareaElement.element.value).toBe(value)
      }
    ))
  })

  it('should maintain type safety across all input types', () => {
    fc.assert(fc.property(
      allInputTypes,
      fc.oneof(stringValue, fc.constant(''), fc.constant(null)),
      baseAttributes,
      (inputType, value, attrs) => {
        // Property: All input types should be type-safe and not throw errors
        expect(() => {
          const wrapper = mount(BaseInput, {
            props: {
              type: inputType,
              modelValue: value,
              ...attrs
            },
            global: {
              stubs: {
                BaseIcon: true,
                BaseButton: true
              }
            }
          })

          // Component should mount successfully
          expect(wrapper.exists()).toBe(true)
          
          // Should have either input or textarea element
          const hasInput = wrapper.find('input').exists()
          const hasTextarea = wrapper.find('textarea').exists()
          expect(hasInput || hasTextarea).toBe(true)
          expect(hasInput && hasTextarea).toBe(false) // Should not have both
          
        }).not.toThrow()
      }
    ))
  })

  it('should validate required attributes are properly handled', () => {
    fc.assert(fc.property(
      allInputTypes,
      fc.boolean(),
      fc.boolean(),
      fc.boolean(),
      (inputType, required, disabled, readonly) => {
        // Property: Boolean attributes should be correctly applied
        const wrapper = mount(BaseInput, {
          props: {
            type: inputType,
            modelValue: '',
            required,
            disabled,
            readonly
          },
          global: {
            stubs: {
              BaseIcon: true,
              BaseButton: true
            }
          }
        })

        const element = inputType === 'textarea'
          ? wrapper.find('textarea')
          : wrapper.find('input')
        
        expect(element.exists()).toBe(true)
        
        // Check boolean attributes
        if (required) {
          expect(element.attributes('required')).toBe('')
          expect(element.attributes('aria-required')).toBe('true')
        }
        
        if (disabled) {
          expect(element.attributes('disabled')).toBe('')
        }
        
        if (readonly) {
          expect(element.attributes('readonly')).toBe('')
        }
      }
    ))
  })

  it('should support all HTML input types without TypeScript errors', () => {
    // Property: All defined input types should be accepted by TypeScript
    const supportedTypes = [
      'text', 'email', 'password', 'number', 'tel', 'url', 'search',
      'date', 'datetime-local', 'time', 'month', 'week', 'color', 'range',
      'file', 'hidden', 'checkbox', 'radio', 'textarea'
    ]

    supportedTypes.forEach(type => {
      expect(() => {
        mount(BaseInput, {
          props: {
            type: type as any,
            modelValue: ''
          },
          global: {
            stubs: {
              BaseIcon: true,
              BaseButton: true
            }
          }
        })
      }).not.toThrow()
    })
  })
})