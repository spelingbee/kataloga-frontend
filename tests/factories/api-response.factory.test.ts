/**
 * Tests for API Response Mock Factories
 * 
 * These tests verify that the mock factories create properly structured
 * ApiResponse objects that match the expected format.
 */

import { describe, it, expect } from 'vitest'
import {
  createMockSuccessResponse,
  createMockErrorResponse,
  createMockPaginatedResponse,
  createMockValidationError,
  createMockAuthError,
  createMockNetworkError,
  createMockTenantError,
  createMockApiMeta,
  createMockPaginationMeta,
  createMockApiError,
  createMockSuccessResponseBatch,
  createMockErrorResponseBatch
} from './api-response.factory'
import type { ApiResponse, PaginationMeta } from '~/types/api'

describe('API Response Mock Factories', () => {
  describe('createMockSuccessResponse', () => {
    it('should create a valid success response with minimal data', () => {
      const data = { id: 1, name: 'Test Item' }
      const response = createMockSuccessResponse(data)
      
      expect(response.success).toBe(true)
      expect(response.statusCode).toBe(200)
      expect(response.data).toEqual(data)
      expect(response.error).toBeNull()
      expect(response.meta).toBeDefined()
      expect(response.meta.requestId).toMatch(/^test-req-/)
      expect(response.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
    
    it('should create a success response with custom options', () => {
      const data = ['item1', 'item2']
      const options = {
        statusCode: 201,
        requestId: 'custom-req-123',
        tenantId: 'tenant-456',
        timestamp: '2023-01-01T00:00:00.000Z'
      }
      
      const response = createMockSuccessResponse(data, options)
      
      expect(response.success).toBe(true)
      expect(response.statusCode).toBe(201)
      expect(response.data).toEqual(data)
      expect(response.meta.requestId).toBe('custom-req-123')
      expect(response.meta.tenantId).toBe('tenant-456')
      expect(response.meta.timestamp).toBe('2023-01-01T00:00:00.000Z')
    })
    
    it('should create a success response with pagination', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const pagination = { page: 2, limit: 10, totalItems: 50 }
      
      const response = createMockSuccessResponse(data, { pagination })
      
      expect(response.meta.pagination).toBeDefined()
      expect(response.meta.pagination!.page).toBe(2)
      expect(response.meta.pagination!.limit).toBe(10)
      expect(response.meta.pagination!.totalItems).toBe(50)
      expect(response.meta.pagination!.totalPages).toBe(5)
    })
  })
  
  describe('createMockErrorResponse', () => {
    it('should create a valid error response', () => {
      const response = createMockErrorResponse('USER_NOT_FOUND', 'User not found')
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(400)
      expect(response.data).toBeNull()
      expect(response.error).toBeDefined()
      expect(response.error!.code).toBe('USER_NOT_FOUND')
      expect(response.error!.message).toBe('User not found')
      expect(response.meta.requestId).toMatch(/^test-req-/)
    })
    
    it('should create an error response with custom options', () => {
      const details = { userId: '123', reason: 'Account suspended' }
      const response = createMockErrorResponse('ACCESS_DENIED', 'Access denied', {
        statusCode: 403,
        details,
        requestId: 'error-req-456'
      })
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(403)
      expect(response.error!.details).toEqual(details)
      expect(response.meta.requestId).toBe('error-req-456')
    })
  })
  
  describe('createMockPaginatedResponse', () => {
    it('should create a paginated response with default pagination', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const response = createMockPaginatedResponse(items)
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual(items)
      expect(response.meta.pagination).toBeDefined()
      expect(response.meta.pagination!.page).toBe(1)
      expect(response.meta.pagination!.limit).toBe(20)
      expect(response.meta.pagination!.totalItems).toBe(3)
      expect(response.meta.pagination!.totalPages).toBe(1)
    })
    
    it('should create a paginated response with custom pagination', () => {
      const items = [{ id: 1 }]
      const pagination = { page: 3, limit: 5, totalItems: 25 }
      const response = createMockPaginatedResponse(items, pagination)
      
      expect(response.meta.pagination!.page).toBe(3)
      expect(response.meta.pagination!.limit).toBe(5)
      expect(response.meta.pagination!.totalItems).toBe(25)
      expect(response.meta.pagination!.totalPages).toBe(5)
    })
  })
  
  describe('createMockValidationError', () => {
    it('should create a validation error with field details', () => {
      const fieldErrors = {
        email: 'Email is required',
        password: 'Password must be at least 8 characters'
      }
      
      const response = createMockValidationError(fieldErrors)
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(422)
      expect(response.error!.code).toBe('VALIDATION_ERROR')
      expect(response.error!.message).toBe('Validation failed')
      expect(Array.isArray(response.error!.details)).toBe(true)
      
      const details = response.error!.details as Array<{ field: string; message: string }>
      expect(details).toHaveLength(2)
      expect(details.find(d => d.field === 'email')?.message).toBe('Email is required')
      expect(details.find(d => d.field === 'password')?.message).toBe('Password must be at least 8 characters')
    })
  })
  
  describe('createMockAuthError', () => {
    it('should create an auth error with default values', () => {
      const response = createMockAuthError()
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(401)
      expect(response.error!.code).toBe('AUTH_REQUIRED')
      expect(response.error!.message).toBe('Authentication required')
    })
    
    it('should create an access denied error', () => {
      const response = createMockAuthError({ 
        code: 'ACCESS_DENIED',
        message: 'Insufficient permissions'
      })
      
      expect(response.statusCode).toBe(403)
      expect(response.error!.code).toBe('ACCESS_DENIED')
      expect(response.error!.message).toBe('Insufficient permissions')
    })
  })
  
  describe('createMockNetworkError', () => {
    it('should create a network error', () => {
      const response = createMockNetworkError()
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(0)
      expect(response.error!.code).toBe('NETWORK_ERROR')
      expect(response.error!.message).toBe('Network connection failed')
    })
  })
  
  describe('createMockTenantError', () => {
    it('should create a tenant not found error', () => {
      const response = createMockTenantError('TENANT_NOT_FOUND', 'test-tenant')
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(404)
      expect(response.error!.code).toBe('TENANT_NOT_FOUND')
      expect(response.meta.tenantId).toBe('test-tenant')
    })
    
    it('should create a tenant access denied error', () => {
      const response = createMockTenantError('TENANT_ACCESS_DENIED')
      
      expect(response.statusCode).toBe(403)
      expect(response.error!.code).toBe('TENANT_ACCESS_DENIED')
    })
  })
  
  describe('Utility Functions', () => {
    it('should create mock API meta', () => {
      const meta = createMockApiMeta({
        requestId: 'test-123',
        tenantId: 'tenant-456'
      })
      
      expect(meta.requestId).toBe('test-123')
      expect(meta.tenantId).toBe('tenant-456')
      expect(meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
    
    it('should create mock pagination meta', () => {
      const pagination = createMockPaginationMeta({
        page: 2,
        totalItems: 50
      })
      
      expect(pagination.page).toBe(2)
      expect(pagination.limit).toBe(20) // default
      expect(pagination.totalItems).toBe(50)
      expect(pagination.totalPages).toBe(3) // calculated
    })
    
    it('should create mock API error', () => {
      const error = createMockApiError('TEST_ERROR', 'Test message', { field: 'test' })
      
      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('Test message')
      expect(error.details).toEqual({ field: 'test' })
    })
  })
  
  describe('Batch Creation Utilities', () => {
    it('should create batch of success responses', () => {
      const dataArray = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const responses = createMockSuccessResponseBatch(dataArray, {
        statusCode: 201,
        baseRequestId: 'batch'
      })
      
      expect(responses).toHaveLength(3)
      responses.forEach((response, index) => {
        expect(response.success).toBe(true)
        expect(response.statusCode).toBe(201)
        expect(response.data).toEqual(dataArray[index])
        expect(response.meta.requestId).toBe(`batch-${index}`)
      })
    })
    
    it('should create batch of error responses', () => {
      const errors = [
        { code: 'ERROR_1', message: 'First error' },
        { code: 'ERROR_2', message: 'Second error', details: { field: 'test' } }
      ]
      
      const responses = createMockErrorResponseBatch(errors, {
        statusCode: 400,
        baseRequestId: 'error-batch'
      })
      
      expect(responses).toHaveLength(2)
      expect(responses[0].error!.code).toBe('ERROR_1')
      expect(responses[1].error!.details).toEqual({ field: 'test' })
      expect(responses[0].meta.requestId).toBe('error-batch-0')
      expect(responses[1].meta.requestId).toBe('error-batch-1')
    })
  })
})