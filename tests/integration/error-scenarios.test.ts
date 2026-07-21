/**
 * Error Scenarios Integration Tests
 * 
 * These tests verify that the frontend correctly handles various error scenarios
 * that can occur when communicating with the backend API, ensuring robust
 * error handling and user experience.
 * 
 * Requirements: 6.5 - Integration testing for error scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ApiResponse } from '~/types';
import { 
  createMockErrorResponse, 
  createMockAuthError,
  createMockValidationError,
  createMockTenantError,
  createMockNetworkError
} from '../factories/api-response.factory';

describe('Error Scenarios Integration Tests', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('🚨 Network and Connection Errors', () => {
    it('should handle complete network failure', async () => {
      // Mock complete network failure for all retries
      (global.fetch as any).mockRejectedValue(
        new TypeError('Failed to fetch')
      );

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/test-endpoint');
        expect.fail('Expected network error to be thrown');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'NETWORK_ERROR');
        expect(error.message).toContain('Network request failed');
        expect(error.message).toContain('Failed to fetch');
      }
    });

    it('should handle DNS resolution failures', async () => {
      // Mock DNS failure for all retries
      (global.fetch as any).mockRejectedValue(
        new TypeError('getaddrinfo ENOTFOUND api.example.com')
      );

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/test-endpoint');
        expect.fail('Expected DNS error to be thrown');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'NETWORK_ERROR');
        expect(error.message).toContain('ENOTFOUND');
      }
    });

    it('should handle connection timeout', async () => {
      // Mock timeout for all retries
      (global.fetch as any).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/slow-endpoint', { timeout: 50 });
        expect.fail('Expected timeout error');
      } catch (error: any) {
        expect(error.message).toContain('timeout');
      }
    });

    it('should handle CORS errors', async () => {
      // Mock CORS error for all retries
      (global.fetch as any).mockRejectedValue(
        new TypeError('Failed to fetch: CORS policy')
      );

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/cors-blocked-endpoint');
        expect.fail('Expected CORS error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'NETWORK_ERROR');
        expect(error.message).toContain('CORS policy');
      }
    });
  });

  describe('🔐 Authentication and Authorization Errors', () => {
    it('should handle 401 Unauthorized errors', async () => {
      const authError = createMockAuthError({
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        statusCode: 401,
        requestId: 'auth-test-123'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => authError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/protected-endpoint');
        expect.fail('Expected auth error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'AUTH_REQUIRED');
        expect(error).toHaveProperty('requestId', 'auth-test-123');
      }
    });

    it('should handle 403 Forbidden errors', async () => {
      const forbiddenError = createMockAuthError({
        code: 'ACCESS_DENIED',
        message: 'Insufficient permissions',
        statusCode: 403,
        requestId: 'forbidden-test-456'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => forbiddenError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/admin-only-endpoint');
        expect.fail('Expected forbidden error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'ACCESS_DENIED');
        expect(error).toHaveProperty('message', 'Insufficient permissions');
      }
    });

    it('should handle expired token scenarios', async () => {
      const expiredTokenError = createMockAuthError({
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
        statusCode: 401,
        requestId: 'expired-token-789'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => expiredTokenError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/protected-endpoint');
        expect.fail('Expected expired token error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'TOKEN_EXPIRED');
        expect(error).toHaveProperty('message', 'Token has expired');
      }
    });

    it('should handle invalid token format', async () => {
      const invalidTokenError = createMockAuthError({
        code: 'INVALID_TOKEN',
        message: 'Token format is invalid',
        statusCode: 401,
        requestId: 'invalid-token-123'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => invalidTokenError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/protected-endpoint');
        expect.fail('Expected invalid token error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'INVALID_TOKEN');
      }
    });
  });

  describe('✅ Validation and Input Errors', () => {
    it('should handle field validation errors', async () => {
      const validationError = createMockValidationError({
        email: 'Email format is invalid',
        password: 'Password must be at least 8 characters',
        firstName: 'First name is required'
      }, {
        statusCode: 422,
        requestId: 'validation-test-123'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => validationError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.post('/auth/register', {
          email: 'invalid-email',
          password: '123',
          firstName: ''
        });
        expect.fail('Expected validation error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(error).toHaveProperty('details');
        expect(Array.isArray(error.details)).toBe(true);
        expect(error.details).toHaveLength(3);
        
        // Check specific field errors
        const emailError = error.details.find((d: any) => d.field === 'email');
        expect(emailError).toHaveProperty('message', 'Email format is invalid');
      }
    });

    it('should handle business rule violations', async () => {
      const businessRuleError = createMockErrorResponse(
        'BUSINESS_RULE_VIOLATION',
        'Cannot delete category with existing items',
        {
          statusCode: 409,
          details: {
            categoryId: 'cat-123',
            itemCount: 5
          },
          requestId: 'business-rule-456'
        }
      );

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => businessRuleError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.delete('/categories/cat-123');
        expect.fail('Expected business rule error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'BUSINESS_RULE_VIOLATION');
        expect(error).toHaveProperty('details');
        expect(error.details).toHaveProperty('categoryId', 'cat-123');
        expect(error.details).toHaveProperty('itemCount', 5);
      }
    });

    it('should handle duplicate resource errors', async () => {
      const duplicateError = createMockErrorResponse(
        'DUPLICATE_RESOURCE',
        'Email already exists',
        {
          statusCode: 409,
          details: {
            field: 'email',
            value: 'test@example.com'
          },
          requestId: 'duplicate-789'
        }
      );

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => duplicateError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.post('/users', {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        });
        expect.fail('Expected duplicate error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'DUPLICATE_RESOURCE');
        expect(error).toHaveProperty('message', 'Email already exists');
      }
    });
  });

  describe('🏢 Tenant-Specific Errors', () => {
    it('should handle tenant not found errors', async () => {
      const tenantError = createMockTenantError('TENANT_NOT_FOUND', 'nonexistent-tenant', {
        message: 'Tenant not found',
        statusCode: 404,
        requestId: 'tenant-not-found-123'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => tenantError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/public/menu/nonexistent-tenant');
        expect.fail('Expected tenant not found error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'TENANT_NOT_FOUND');
        expect(error).toHaveProperty('tenantId', 'nonexistent-tenant');
      }
    });

    it('should handle inactive tenant errors', async () => {
      const inactiveError = createMockTenantError('TENANT_INACTIVE', 'inactive-tenant', {
        message: 'Tenant is currently inactive',
        statusCode: 403,
        requestId: 'tenant-inactive-456'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => inactiveError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/public/menu/inactive-tenant');
        expect.fail('Expected inactive tenant error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'TENANT_INACTIVE');
        expect(error).toHaveProperty('message', 'Tenant is currently inactive');
      }
    });

    it('should handle tenant access denied errors', async () => {
      const accessDeniedError = createMockTenantError('TENANT_ACCESS_DENIED', 'restricted-tenant', {
        message: 'Access denied for this tenant',
        statusCode: 403,
        requestId: 'tenant-access-denied-789'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => accessDeniedError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/admin/restricted-tenant/settings');
        expect.fail('Expected tenant access denied error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'TENANT_ACCESS_DENIED');
        expect(error).toHaveProperty('tenantId', 'restricted-tenant');
      }
    });
  });

  describe('🖥️ Server and System Errors', () => {
    it('should handle 500 Internal Server Error', async () => {
      const serverError = createMockErrorResponse('SERVER_ERROR', 'Internal server error', {
        statusCode: 500,
        requestId: 'server-error-123'
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => serverError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/test-endpoint');
        expect.fail('Expected server error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'SERVER_ERROR');
        expect(error).toHaveProperty('requestId', 'server-error-123');
      }
    });

    it('should handle 503 Service Unavailable', async () => {
      const serviceUnavailableError = createMockErrorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable', {
        statusCode: 503,
        requestId: 'service-unavailable-456'
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => serviceUnavailableError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/test-endpoint');
        expect.fail('Expected service unavailable error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'SERVICE_UNAVAILABLE');
        expect(error).toHaveProperty('message', 'Service temporarily unavailable');
      }
    });

    it('should handle database connection errors', async () => {
      const dbError = createMockErrorResponse('DATABASE_ERROR', 'Database connection failed', {
        statusCode: 500,
        details: {
          type: 'CONNECTION_ERROR',
          database: 'main'
        },
        requestId: 'db-error-789'
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => dbError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/test-endpoint');
        expect.fail('Expected database error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'DATABASE_ERROR');
        expect(error).toHaveProperty('details');
        expect(error.details).toHaveProperty('type', 'CONNECTION_ERROR');
      }
    });
  });

  describe('📊 Rate Limiting and Quota Errors', () => {
    it('should handle rate limiting errors', async () => {
      const rateLimitError = createMockErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests', {
        statusCode: 429,
        details: {
          limit: 100,
          remaining: 0,
          resetTime: '2023-12-20T11:00:00Z'
        },
        requestId: 'rate-limit-123'
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => rateLimitError,
        headers: new Headers({ 
          'content-type': 'application/json',
          'retry-after': '3600'
        })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/test-endpoint');
        expect.fail('Expected rate limit error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
        expect(error).toHaveProperty('details');
        expect(error.details).toHaveProperty('limit', 100);
        expect(error.details).toHaveProperty('remaining', 0);
      }
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = createMockErrorResponse('QUOTA_EXCEEDED', 'Monthly quota exceeded', {
        statusCode: 402,
        details: {
          quotaType: 'API_CALLS',
          limit: 10000,
          used: 10000,
          resetDate: '2024-01-01'
        },
        requestId: 'quota-exceeded-456'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: async () => quotaError,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/test-endpoint');
        expect.fail('Expected quota exceeded error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'QUOTA_EXCEEDED');
        expect(error).toHaveProperty('message', 'Monthly quota exceeded');
        expect(error.details).toHaveProperty('quotaType', 'API_CALLS');
      }
    });
  });

  describe('🔧 Malformed Response Handling', () => {
    it('should handle malformed JSON responses', async () => {
      // Mock malformed JSON
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON at position 0');
        },
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/malformed-endpoint');
        expect.fail('Expected JSON parse error');
      } catch (error: any) {
        expect(error.message).toContain('JSON');
      }
    });

    it('should handle empty response body', async () => {
      // Mock empty response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => null,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      const result = await apiClient.get('/empty-endpoint');
      
      // Should handle empty response gracefully
      expect(result).toBeNull();
    });

    it('should handle non-JSON content type', async () => {
      // Mock HTML response instead of JSON
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Response is not JSON');
        },
        text: async () => '<html><body>Internal Server Error</body></html>',
        headers: new Headers({ 'content-type': 'text/html' })
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/html-error-endpoint');
        expect.fail('Expected error for non-JSON response');
      } catch (error: any) {
        expect(error.message).toContain('JSON');
      }
    });
  });

  describe('🔄 Error Recovery and Retry', () => {
    it('should retry on retryable errors', async () => {
      let callCount = 0;
      
      // Mock retryable error then success
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => createMockErrorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable'),
            headers: new Headers({ 'content-type': 'application/json' })
          });
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, statusCode: 200, data: { success: true }, error: null, meta: { requestId: 'retry-success', timestamp: new Date().toISOString() } }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      const result = await apiClient.get('/retry-endpoint', { retries: 3 });
      
      expect(callCount).toBe(3);
      expect(result).toEqual({ success: true });
    });

    it('should not retry on non-retryable errors', async () => {
      let callCount = 0;
      
      // Mock non-retryable error (400 Bad Request)
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => createMockErrorResponse('BAD_REQUEST', 'Invalid request format'),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/bad-request-endpoint', { retries: 3 });
        expect.fail('Expected bad request error');
      } catch (error: any) {
        // Should not retry 400 errors
        expect(callCount).toBe(1);
        expect(error).toHaveProperty('code', 'BAD_REQUEST');
      }
    });

    it('should handle exponential backoff correctly', async () => {
      const retryTimes: number[] = [];
      let callCount = 0;
      
      // Mock network failures
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        retryTimes.push(Date.now());
        return Promise.reject(new TypeError('Network error'));
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/network-fail-endpoint', { retries: 2 });
        expect.fail('Expected network error');
      } catch (error: any) {
        expect(callCount).toBe(3); // Initial + 2 retries
        
        // Verify exponential backoff (each retry should take longer)
        if (retryTimes.length >= 3) {
          const firstRetryDelay = retryTimes[1] - retryTimes[0];
          const secondRetryDelay = retryTimes[2] - retryTimes[1];
          
          // Second retry should take longer than first (exponential backoff)
          expect(secondRetryDelay).toBeGreaterThan(firstRetryDelay);
        }
      }
    });
  });
});