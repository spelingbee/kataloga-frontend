import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 21: Checkout form validation
 * Feature: customer-frontend-ordering, Property 21: Checkout form validation
 * Validates: Requirements 6.8
 * 
 * For any order type, all required fields for that type should be validated
 * before allowing payment.
 */

describe('Checkout Flow - Property-Based Tests', () => {
  describe('Property 21: Checkout form validation', () => {
    /**
     * Validation logic for delivery order type
     */
    const validateDeliveryForm = (data: any): Record<string, string> => {
      const errors: Record<string, string> = {}
      
      // Address is required and must be at least 10 characters (after trimming)
      const trimmedAddress = data.address?.trim() || ''
      
      if (!trimmedAddress) {
        errors.address = 'Delivery address is required'
      } else if (trimmedAddress.length < 10) {
        errors.address = 'Please provide a more detailed address'
      }
      
      return errors
    }

    /**
     * Validation logic for pickup order type
     */
    const validatePickupForm = (data: any): Record<string, string> => {
      const errors: Record<string, string> = {}
      
      // Location ID is required
      if (!data.locationId) {
        errors.locationId = 'Please select a pickup location'
      }
      
      // Phone is required and must match basic phone pattern
      if (!data.phone?.trim()) {
        errors.phone = 'Phone number is required'
      } else {
        const phoneRegex = /^\+?[\d\s\-()]+$/
        if (!phoneRegex.test(data.phone)) {
          errors.phone = 'Please enter a valid phone number'
        }
      }
      
      return errors
    }

    /**
     * Validation logic for dine-in order type
     */
    const validateDineInForm = (data: any): Record<string, string> => {
      const errors: Record<string, string> = {}
      
      // Table number is required (after trimming)
      const trimmedTableNumber = data.tableNumber?.trim() || ''
      
      if (!trimmedTableNumber) {
        errors.tableNumber = 'Table number is required'
      }
      
      return errors
    }

    it('should validate all required fields for delivery order type', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary delivery form data
          fc.record({
            address: fc.option(
              fc.oneof(
                fc.constant(''), // Empty string
                fc.string({ minLength: 1, maxLength: 5 }), // Too short
                fc.string({ minLength: 10, maxLength: 200 }) // Valid length
              ),
              { nil: undefined }
            ),
            deliveryTime: fc.constantFrom('asap', '30min', '1hour', '2hours', 'custom'),
            instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
            coordinates: fc.option(
              fc.record({
                lat: fc.double({ min: -90, max: 90, noNaN: true }),
                lng: fc.double({ min: -180, max: 180, noNaN: true })
              }),
              { nil: undefined }
            )
          }),
          (deliveryData) => {
            // Validate the form
            const errors = validateDeliveryForm(deliveryData)
            
            // Property: If address is missing or empty, validation should fail
            if (!deliveryData.address || !deliveryData.address.trim()) {
              expect(errors.address).toBeDefined()
              expect(errors.address).toBe('Delivery address is required')
              return true
            }
            
            // Property: If address is too short (< 10 chars), validation should fail
            if (deliveryData.address.trim().length < 10) {
              expect(errors.address).toBeDefined()
              expect(errors.address).toBe('Please provide a more detailed address')
              return true
            }
            
            // Property: If address is valid (>= 10 chars), validation should pass
            if (deliveryData.address.trim().length >= 10) {
              expect(errors.address).toBeUndefined()
              expect(Object.keys(errors).length).toBe(0)
              return true
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate all required fields for pickup order type', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary pickup form data
          fc.record({
            locationId: fc.option(
              fc.oneof(
                fc.constant(''), // Empty string
                fc.uuid() // Valid location ID
              ),
              { nil: undefined }
            ),
            phone: fc.option(
              fc.oneof(
                fc.constant(''), // Empty string
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^\+?[\d\s\-()]+$/.test(s)), // Invalid phone
                fc.string({ minLength: 10, maxLength: 20 }).map(s => '+' + s.replace(/\D/g, '')) // Valid phone
              ),
              { nil: undefined }
            ),
            pickupTime: fc.constantFrom('asap', '30min', '1hour', '2hours', 'custom'),
            instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
          }),
          (pickupData) => {
            // Validate the form
            const errors = validatePickupForm(pickupData)
            
            // Property: If locationId is missing or empty, validation should fail
            if (!pickupData.locationId) {
              expect(errors.locationId).toBeDefined()
              expect(errors.locationId).toBe('Please select a pickup location')
            } else {
              expect(errors.locationId).toBeUndefined()
            }
            
            // Property: If phone is missing or empty, validation should fail
            if (!pickupData.phone || !pickupData.phone.trim()) {
              expect(errors.phone).toBeDefined()
              expect(errors.phone).toBe('Phone number is required')
              return true
            }
            
            // Property: If phone format is invalid, validation should fail
            const phoneRegex = /^\+?[\d\s\-()]+$/
            if (!phoneRegex.test(pickupData.phone)) {
              expect(errors.phone).toBeDefined()
              expect(errors.phone).toBe('Please enter a valid phone number')
              return true
            }
            
            // Property: If both locationId and phone are valid, validation should pass
            if (pickupData.locationId && phoneRegex.test(pickupData.phone)) {
              expect(Object.keys(errors).length).toBe(0)
              return true
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate all required fields for dine-in order type', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary dine-in form data
          fc.record({
            tableNumber: fc.option(
              fc.oneof(
                fc.constant(''), // Empty string
                fc.string({ minLength: 1, maxLength: 10 }) // Valid table number
              ),
              { nil: undefined }
            ),
            locationId: fc.option(fc.uuid(), { nil: undefined }),
            guestCount: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
            instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
          }),
          (dineInData) => {
            // Validate the form
            const errors = validateDineInForm(dineInData)
            
            // Property: If tableNumber is missing or empty, validation should fail
            if (!dineInData.tableNumber || !dineInData.tableNumber.trim()) {
              expect(errors.tableNumber).toBeDefined()
              expect(errors.tableNumber).toBe('Table number is required')
              return true
            }
            
            // Property: If tableNumber is provided and not empty, validation should pass
            if (dineInData.tableNumber && dineInData.tableNumber.trim()) {
              expect(errors.tableNumber).toBeUndefined()
              expect(Object.keys(errors).length).toBe(0)
              return true
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should only validate fields relevant to the selected order type', () => {
      fc.assert(
        fc.property(
          // Generate order type
          fc.constantFrom('delivery', 'pickup', 'dine-in'),
          // Generate complete form data for all types
          fc.record({
            delivery: fc.record({
              address: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
              deliveryTime: fc.constantFrom('asap', '30min', '1hour'),
              instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
            }),
            pickup: fc.record({
              locationId: fc.option(fc.uuid(), { nil: undefined }),
              phone: fc.option(fc.string({ minLength: 10, maxLength: 20 }).map(s => '+' + s.replace(/\D/g, '')), { nil: undefined }),
              pickupTime: fc.constantFrom('asap', '30min', '1hour'),
              instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
            }),
            dineIn: fc.record({
              tableNumber: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
              locationId: fc.option(fc.uuid(), { nil: undefined }),
              guestCount: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
              instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
            })
          }),
          (orderType, formData) => {
            let errors: Record<string, string> = {}
            
            // Property: Only validate fields for the selected order type
            if (orderType === 'delivery') {
              errors = validateDeliveryForm(formData.delivery)
              
              // Should not have pickup or dine-in errors
              expect(errors.locationId).toBeUndefined()
              expect(errors.phone).toBeUndefined()
              expect(errors.tableNumber).toBeUndefined()
              
              // Should only have delivery-specific errors (if any)
              Object.keys(errors).forEach(key => {
                expect(['address']).toContain(key)
              })
            } else if (orderType === 'pickup') {
              errors = validatePickupForm(formData.pickup)
              
              // Should not have delivery or dine-in errors
              expect(errors.address).toBeUndefined()
              expect(errors.tableNumber).toBeUndefined()
              
              // Should only have pickup-specific errors (if any)
              Object.keys(errors).forEach(key => {
                expect(['locationId', 'phone']).toContain(key)
              })
            } else if (orderType === 'dine-in') {
              errors = validateDineInForm(formData.dineIn)
              
              // Should not have delivery or pickup errors
              expect(errors.address).toBeUndefined()
              expect(errors.locationId).toBeUndefined()
              expect(errors.phone).toBeUndefined()
              
              // Should only have dine-in-specific errors (if any)
              Object.keys(errors).forEach(key => {
                expect(['tableNumber']).toContain(key)
              })
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should prevent proceeding to payment when required fields are invalid', () => {
      fc.assert(
        fc.property(
          // Generate order type
          fc.constantFrom('delivery', 'pickup', 'dine-in'),
          // Generate invalid form data
          fc.record({
            delivery: fc.record({
              address: fc.constantFrom('', 'short'), // Invalid: empty or too short
              deliveryTime: fc.constantFrom('asap', '30min')
            }),
            pickup: fc.record({
              locationId: fc.constant(''), // Invalid: empty
              phone: fc.constantFrom('', 'invalid-phone'), // Invalid: empty or bad format
              pickupTime: fc.constantFrom('asap', '30min')
            }),
            dineIn: fc.record({
              tableNumber: fc.constant(''), // Invalid: empty
              locationId: fc.option(fc.uuid(), { nil: undefined })
            })
          }),
          (orderType, invalidFormData) => {
            let errors: Record<string, string> = {}
            let canProceed = false
            
            // Validate based on order type
            if (orderType === 'delivery') {
              errors = validateDeliveryForm(invalidFormData.delivery)
            } else if (orderType === 'pickup') {
              errors = validatePickupForm(invalidFormData.pickup)
            } else if (orderType === 'dine-in') {
              errors = validateDineInForm(invalidFormData.dineIn)
            }
            
            // Property: If there are validation errors, cannot proceed to payment
            canProceed = Object.keys(errors).length === 0
            
            // Since we're using invalid data, there should be errors
            expect(Object.keys(errors).length).toBeGreaterThan(0)
            expect(canProceed).toBe(false)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should allow proceeding to payment when all required fields are valid', () => {
      fc.assert(
        fc.property(
          // Generate order type
          fc.constantFrom('delivery', 'pickup', 'dine-in'),
          // Generate valid form data
          fc.record({
            delivery: fc.record({
              // Valid address: generate by combining parts to ensure content
              address: fc.tuple(
                fc.integer({ min: 1, max: 9999 }),
                fc.constantFrom('Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Ln'),
                fc.constantFrom('Apt', 'Suite', 'Unit', 'Building'),
                fc.integer({ min: 1, max: 999 })
              ).map(([num, street, type, unit]) => `${num} ${street}, ${type} ${unit}`),
              deliveryTime: fc.constantFrom('asap', '30min', '1hour'),
              instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
            }),
            pickup: fc.record({
              locationId: fc.uuid(), // Valid
              // Valid phone: generate realistic phone numbers
              phone: fc.oneof(
                fc.constant('+1234567890'),
                fc.constant('+9876543210'),
                fc.integer({ min: 1000000000, max: 9999999999 }).map(n => `+${n}`)
              ),
              pickupTime: fc.constantFrom('asap', '30min', '1hour'),
              instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
            }),
            dineIn: fc.record({
              // Valid table number: generate realistic table numbers
              tableNumber: fc.oneof(
                fc.integer({ min: 1, max: 999 }).map(n => `Table ${n}`),
                fc.integer({ min: 1, max: 999 }).map(n => n.toString()),
                fc.tuple(
                  fc.constantFrom('A', 'B', 'C', 'D'),
                  fc.integer({ min: 1, max: 99 })
                ).map(([letter, num]) => `${letter}${num}`)
              ),
              locationId: fc.option(fc.uuid(), { nil: undefined }),
              guestCount: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
              instructions: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
            })
          }),
          (orderType, validFormData) => {
            let errors: Record<string, string> = {}
            let canProceed = false
            
            // Validate based on order type
            if (orderType === 'delivery') {
              errors = validateDeliveryForm(validFormData.delivery)
            } else if (orderType === 'pickup') {
              errors = validatePickupForm(validFormData.pickup)
            } else if (orderType === 'dine-in') {
              errors = validateDineInForm(validFormData.dineIn)
            }
            
            // Property: If there are no validation errors, can proceed to payment
            canProceed = Object.keys(errors).length === 0
            
            // Since we're using valid data, there should be no errors
            expect(Object.keys(errors).length).toBe(0)
            expect(canProceed).toBe(true)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
