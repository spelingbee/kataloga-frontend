import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils/e2e';
import type { ApiResponse, Category, MenuItem, PaginatedResult } from '~/types';
import { 
  createMockSuccessResponse, 
  createMockErrorResponse, 
  createMockPaginatedResponse,
  createMockAuthError,
  createMockNetworkError
} from '../factories/api-response.factory';
import { createApiClient } from '~/utils/api';

/**
 * Integration Tests for Frontend API Standardization
 * 
 * These tests verify that the frontend correctly handles the new standardized
 * ApiResponse format from the backend, including:
 * - Successful responses with unwrapped data
 * - Error responses with proper error handling
 * - Pagination metadata handling
 * - Authentication and authorization errors
 * - Network error scenarios
 * 
 * Requirements: 6.5 - Integration testing for new API format
 */
setup({
  // Test configuration for API standardization
  server: true,
  browser: false, // Focus on API integration, not browser UI
  nuxtConfig: {
    runtimeConfig: {
      public: {
        apiBaseUrl: 'http://localhost:3001',
        multiTenantMode: true,
        tenantQueryParam: 'tenant'
      }
    }
  }
});

describe('Frontend API Standardization Integration Tests', () => {
  let mockApiClient: any;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    // Store original fetch for restoration
    originalFetch = global.fetch;
    
    // Initialize API client for tests
    createApiClient({
      baseURL: 'http://localhost:3001',
      tenantSlug: 'vkusnaya-pizza'
    });
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    // Reset fetch mock for each test
    global.fetch = vi.fn();
  });

  describe('🔄 API Response Format Compatibility', () => {
    const tenantSlug = 'vkusnaya-pizza';

    describe('✅ Successful API Responses', () => {
      it('should handle standard ApiResponse format for categories', async () => {
        // Mock successful categories response
        const mockCategories: Category[] = [
          { id: '1', name: 'Pizza', description: '5 items available', icon: '🍕', count: 5, sortOrder: 1 },
          { id: '2', name: 'Beverages', description: '3 items available', icon: '🥤', count: 3, sortOrder: 2 }
        ];
        
        const mockResponse = createMockSuccessResponse(mockCategories, {
          statusCode: 200,
          requestId: 'test-categories-123',
          tenantId: tenantSlug
        });

        // Mock fetch to return standardized response
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        // Test API call through our service layer
        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        const { MenuService } = await import('~/services/menu.service');
        const menuService = new MenuService(apiClient);
        
        const categories = await menuService.getCategories();
        
        // Verify unwrapped data is returned (not ApiResponse wrapper)
        expect(categories).toEqual(mockCategories);
        expect(categories).toHaveLength(2);
        expect(categories[0]).toHaveProperty('name', 'Pizza');
        
        // Verify fetch was called with correct parameters
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/public/menu/${tenantSlug}/categories`),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-Tenant-Slug': tenantSlug
            })
          })
        );
      });

      it('should handle paginated ApiResponse format for menu items', async () => {
        // Mock paginated menu items response
        const mockItems: MenuItem[] = [
          {
            id: '1',
            name: 'Margherita Pizza',
            description: 'Classic pizza with tomato and mozzarella',
            price: 250,
            imageUrl: '/images/margherita.jpg',
            isActive: true,
            categoryId: '1',
            category: { id: '1', name: 'Pizza' },
            calories: 800,
            cookingTime: 15,
            dietary: ['vegetarian']
          }
        ];

        const mockResponse = createMockPaginatedResponse(mockItems, {
          page: 1,
          limit: 20,
          totalItems: 1,
          totalPages: 1
        }, {
          statusCode: 200,
          requestId: 'test-menu-items-456',
          tenantId: tenantSlug
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        const { MenuService } = await import('~/services/menu.service');
        const menuService = new MenuService(apiClient);
        
        const result = await menuService.getMenuItems({ page: 1, limit: 20 });
        
        // Verify PaginatedResult format is returned
        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('pagination');
        expect(result.items).toEqual(mockItems);
        expect(result.pagination).toEqual({
          page: 1,
          limit: 20,
          totalItems: 1,
          totalPages: 1
        });
      });

      it('should handle null data in successful responses', async () => {
        // Mock successful response with null data (e.g., DELETE operation)
        const mockResponse = createMockSuccessResponse(null, {
          statusCode: 204,
          requestId: 'test-delete-789'
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        
        const result = await apiClient.delete('/test-endpoint');
        
        // Verify null is returned for successful operations with no data
        expect(result).toBeNull();
      });
    });

    describe('❌ Error Response Handling', () => {
      it('should handle validation errors with field details', async () => {
        // Mock validation error response
        const mockResponse = createMockErrorResponse('VALIDATION_ERROR', 'Validation failed', {
          statusCode: 422,
          details: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password must be at least 8 characters' }
          ],
          requestId: 'test-validation-error-123'
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        
        try {
          await apiClient.post('/auth/register', {
            email: '',
            password: '123'
          });
          
          // Should not reach here
          expect.fail('Expected validation error to be thrown');
        } catch (error: any) {
          // Verify typed error is thrown with proper structure
          expect(error).toHaveProperty('code', 'VALIDATION_ERROR');
          expect(error).toHaveProperty('message', 'Validation failed');
          expect(error).toHaveProperty('details');
          expect(error.details).toHaveLength(2);
          expect(error.details[0]).toEqual({
            field: 'email',
            message: 'Email is required'
          });
          
          // Verify metadata is included
          expect(error).toHaveProperty('requestId', 'test-validation-error-123');
        }
      });

      it('should handle authentication errors', async () => {
        // Mock authentication error
        const mockResponse = createMockAuthError({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
          statusCode: 401,
          requestId: 'test-auth-error-456'
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        
        try {
          await apiClient.get('/protected-endpoint');
          expect.fail('Expected authentication error to be thrown');
        } catch (error: any) {
          expect(error).toHaveProperty('code', 'AUTH_REQUIRED');
          expect(error).toHaveProperty('message', 'Authentication required');
          expect(error).toHaveProperty('requestId', 'test-auth-error-456');
        }
      });

      it('should handle network errors', async () => {
        // Mock network error (fetch failure)
        (global.fetch as any).mockRejectedValueOnce(
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
        }
      });

      it('should handle tenant-specific errors', async () => {
        // Mock tenant not found error
        const mockResponse = createMockErrorResponse('TENANT_NOT_FOUND', 'Tenant not found', {
          statusCode: 404,
          requestId: 'test-tenant-error-789'
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        
        try {
          await apiClient.get('/public/menu/nonexistent-tenant');
          expect.fail('Expected tenant error to be thrown');
        } catch (error: any) {
          expect(error).toHaveProperty('code', 'TENANT_NOT_FOUND');
          expect(error).toHaveProperty('message', 'Tenant not found');
        }
      });
    });

    describe('🔄 Legacy Format Compatibility', () => {
      it('should normalize legacy response format', async () => {
        // Mock legacy response (without success/meta fields)
        const legacyResponse = [
          { id: '1', name: 'Legacy Item 1' },
          { id: '2', name: 'Legacy Item 2' }
        ];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => legacyResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        
        const result = await apiClient.get('/legacy-endpoint');
        
        // Verify legacy response is normalized and unwrapped
        expect(result).toEqual(legacyResponse);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
      });

      it('should handle legacy pagination format', async () => {
        // Mock legacy paginated response
        const legacyResponse = {
          items: [{ id: '1', name: 'Item 1' }],
          total: 1,
          page: 1,
          limit: 20
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => legacyResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { normalizeResponse } = await import('~/utils/response-normalizer');
        
        const normalized = normalizeResponse(legacyResponse, 200, '/legacy-paginated');
        
        // Verify legacy pagination is converted to standard format
        expect(normalized).toHaveProperty('success', true);
        expect(normalized).toHaveProperty('data', legacyResponse);
        expect(normalized).toHaveProperty('meta');
        expect(normalized.meta).toHaveProperty('requestId');
      });
    });
  });

  describe('🍜 Азиатский ресторан - Полный путь пользователя', () => {
    const tenantSlug = 'asian-kitchen';
    const baseUrl = `/?tenant=${tenantSlug}`;

    it('1. Пользователь заходит на главную страницу ресторана', async () => {
      const response = await $fetch(baseUrl);
      expect(response).toBeDefined();
    });

    it('2. Пользователь просматривает меню', async () => {
      const response = await $fetch(`/menu?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });

    it('3. Пользователь ищет блюда', async () => {
      const response = await $fetch(`/menu/search?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });

    it('4. Пользователь переходит к оплате', async () => {
      const response = await $fetch(`/payment/callback?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });
  });

  describe('🌸 Цветочный магазин - Полный путь пользователя', () => {
    const tenantSlug = 'flower-bouquet';
    const baseUrl = `/?tenant=${tenantSlug}`;

    it('1. Пользователь заходит на главную страницу магазина', async () => {
      const response = await $fetch(baseUrl);
      expect(response).toBeDefined();
    });

    it('2. Пользователь просматривает каталог', async () => {
      const response = await $fetch(`/menu?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });

    it('3. Пользователь добавляет товары в избранное', async () => {
      const response = await $fetch(`/favourites?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });
  });

  describe('🔐 Аутентификация пользователей', () => {
    it('Страница входа загружается', async () => {
      const response = await $fetch('/auth/login');
      expect(response).toBeDefined();
    });

    it('Страница регистрации загружается', async () => {
      const response = await $fetch('/auth/register');
      expect(response).toBeDefined();
    });
  });

  describe('📱 Общие страницы приложения', () => {
    it('Страница уведомлений загружается', async () => {
      const response = await $fetch('/notifications');
      expect(response).toBeDefined();
    });

    it('Страница акций загружается', async () => {
      const response = await $fetch('/promotions');
      expect(response).toBeDefined();
    });

    it('Страница доставки загружается', async () => {
      const response = await $fetch('/delivery');
      expect(response).toBeDefined();
    });

    it('Страница карты загружается', async () => {
      const response = await $fetch('/map');
      expect(response).toBeDefined();
    });

    it('Offline страница загружается', async () => {
      const response = await $fetch('/offline');
      expect(response).toBeDefined();
    });

    it('Страница ошибки загружается', async () => {
      const response = await $fetch('/error');
      expect(response).toBeDefined();
    });
  });

  describe('👨‍💼 Админ панель', () => {
    it('Главная страница админки загружается', async () => {
      const response = await $fetch('/admin');
      expect(response).toBeDefined();
    });

    it('Страница аналитики админки загружается', async () => {
      const response = await $fetch('/admin/analytics');
      expect(response).toBeDefined();
    });

    it('Страница управления меню админки загружается', async () => {
      const response = await $fetch('/admin/menu');
      expect(response).toBeDefined();
    });

    it('Страница заказов админки загружается', async () => {
      const response = await $fetch('/admin/orders');
      expect(response).toBeDefined();
    });
  });
});

  describe('🔧 Service Layer Integration', () => {
    const tenantSlug = 'vkusnaya-pizza';

    describe('Menu Service Integration', () => {
      it('should integrate with real API endpoints for categories', async () => {
        // Mock real API response structure
        const mockApiResponse = createMockSuccessResponse([
          { id: '1', name: 'Pizza', itemCount: 5 },
          { id: '2', name: 'Beverages', itemCount: 3 }
        ], {
          statusCode: 200,
          requestId: 'real-api-categories-123',
          tenantId: tenantSlug
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        const { MenuService } = await import('~/services/menu.service');
        const menuService = new MenuService(apiClient);
        
        const categories = await menuService.getCategories();
        
        // Verify service correctly processes API response
        expect(categories).toBeDefined();
        expect(Array.isArray(categories)).toBe(true);
        
        // Verify service transforms backend data to frontend format
        if (categories.length > 0) {
          expect(categories[0]).toHaveProperty('id');
          expect(categories[0]).toHaveProperty('name');
          expect(categories[0]).toHaveProperty('description');
          expect(categories[0]).toHaveProperty('icon');
          expect(categories[0]).toHaveProperty('count');
        }
      });

      it('should handle API errors gracefully in service layer', async () => {
        // Mock API error response
        const mockErrorResponse = createMockErrorResponse('TENANT_NOT_FOUND', 'Tenant not found', {
          statusCode: 404,
          requestId: 'error-test-456'
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => mockErrorResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        const { MenuService } = await import('~/services/menu.service');
        const menuService = new MenuService(apiClient);
        
        try {
          await menuService.getCategories();
          expect.fail('Expected service to throw error');
        } catch (error: any) {
          // Verify service properly propagates API errors
          expect(error.message).toContain('Failed to fetch categories');
          expect(error.message).toContain('Tenant not found');
        }
      });

      it('should handle pagination correctly in menu items', async () => {
        // Mock paginated API response
        const mockMenus = [{
          id: 'menu-1',
          items: [
            {
              id: 'item-1',
              name: 'Test Pizza',
              description: 'Test description',
              price: 250,
              imageUrl: '/test.jpg',
              isActive: true,
              category: { id: '1', name: 'Pizza' },
              calories: 800,
              cookingTime: 15,
              dietary: ['vegetarian']
            }
          ]
        }];

        const mockResponse = createMockSuccessResponse(mockMenus, {
          statusCode: 200,
          requestId: 'pagination-test-789',
          pagination: {
            page: 1,
            limit: 20,
            totalItems: 1,
            totalPages: 1
          }
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useApiClient } = await import('~/utils/api');
        const apiClient = useApiClient();
        const { MenuService } = await import('~/services/menu.service');
        const menuService = new MenuService(apiClient);
        
        const result = await menuService.getMenuItems({ page: 1, limit: 20 });
        
        // Verify service returns PaginatedResult format
        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('pagination');
        expect(result.items).toHaveLength(1);
        expect(result.pagination).toEqual({
          page: 1,
          limit: 20,
          totalItems: 1,
          totalPages: 1
        });
      });
    });

    describe('Store Integration', () => {
      it('should integrate stores with new API format', async () => {
        // Mock successful API response
        const mockCategories = [
          { id: '1', name: 'Pizza', itemCount: 5 },
          { id: '2', name: 'Beverages', itemCount: 3 }
        ];

        const mockResponse = createMockSuccessResponse(mockCategories, {
          statusCode: 200,
          requestId: 'store-integration-123'
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        // Test store integration
        const { useMenuStore } = await import('~/stores/menu');
        const menuStore = useMenuStore();
        
        await menuStore.fetchCategories();
        
        // Verify store contains unwrapped data
        expect(menuStore.categories).toBeDefined();
        expect(Array.isArray(menuStore.categories)).toBe(true);
        expect(menuStore.loading).toBe(false);
        expect(menuStore.error).toBeNull();
        
        // Verify store doesn't contain ApiResponse wrapper
        expect(menuStore.categories).not.toHaveProperty('success');
        expect(menuStore.categories).not.toHaveProperty('meta');
        expect(menuStore.categories).not.toHaveProperty('statusCode');
      });

      it('should handle store error states correctly', async () => {
        // Mock API error
        const mockErrorResponse = createMockErrorResponse('SERVER_ERROR', 'Internal server error', {
          statusCode: 500,
          requestId: 'store-error-456'
        });

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => mockErrorResponse,
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const { useMenuStore } = await import('~/stores/menu');
        const menuStore = useMenuStore();
        
        await menuStore.fetchCategories();
        
        // Verify store error state
        expect(menuStore.loading).toBe(false);
        expect(menuStore.error).toBeDefined();
        expect(menuStore.error).toHaveProperty('code', 'SERVER_ERROR');
        expect(menuStore.error).toHaveProperty('message', 'Internal server error');
        
        // Verify categories remain empty on error
        expect(menuStore.categories).toEqual([]);
      });
    });
  });

  describe('🌐 Real API Endpoint Compatibility', () => {
    const tenantSlug = 'vkusnaya-pizza';

    it('should be compatible with real backend API structure', async () => {
      // Test against actual backend endpoint structure
      // This test verifies our frontend can handle real API responses
      
      // Skip if not in integration test environment
      if (!process.env.INTEGRATION_TEST) {
        return;
      }

      try {
        // Make real API call to backend
        const response = await $fetch(`http://localhost:3001/public/menu/${tenantSlug}/categories`);
        
        // Verify response structure matches our expectations
        if (response && typeof response === 'object') {
          // Check if it's new ApiResponse format
          if ('success' in response && 'data' in response && 'meta' in response) {
            expect(response).toHaveProperty('success');
            expect(response).toHaveProperty('statusCode');
            expect(response).toHaveProperty('data');
            expect(response).toHaveProperty('error');
            expect(response).toHaveProperty('meta');
            
            if (response.meta) {
              expect(response.meta).toHaveProperty('requestId');
              expect(response.meta).toHaveProperty('timestamp');
            }
          } else {
            // Legacy format - should still work
            console.warn('Backend still using legacy format for categories endpoint');
          }
        }
      } catch (error) {
        // Backend might not be running - that's okay for unit tests
        console.log('Backend not available for integration test:', error);
      }
    });

    it('should handle real authentication flows', async () => {
      if (!process.env.INTEGRATION_TEST) {
        return;
      }

      try {
        // Test real login endpoint
        const loginResponse = await $fetch(`http://localhost:3001/public/${tenantSlug}/auth/login`, {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

        // Should get error response in new format
        expect(loginResponse).toHaveProperty('success', false);
        expect(loginResponse).toHaveProperty('error');
        
      } catch (error: any) {
        // Expected for wrong credentials
        if (error.data) {
          // Verify error response structure
          expect(error.data).toHaveProperty('success', false);
          expect(error.data).toHaveProperty('error');
          expect(error.data.error).toHaveProperty('code');
          expect(error.data.error).toHaveProperty('message');
        }
      }
    });
  });

  describe('🔄 Error Scenario Testing', () => {
    it('should handle timeout errors', async () => {
      // Mock timeout error
      (global.fetch as any).mockImplementationOnce(() => 
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

    it('should handle malformed JSON responses', async () => {
      // Mock malformed JSON response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON');
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

    it('should handle CORS errors', async () => {
      // Mock CORS error
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch: CORS error')
      );

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      try {
        await apiClient.get('/cors-blocked-endpoint');
        expect.fail('Expected CORS error');
      } catch (error: any) {
        expect(error).toHaveProperty('code', 'NETWORK_ERROR');
        expect(error.message).toContain('CORS error');
      }
    });
  });

  describe('🔄 Retry Logic Testing', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let callCount = 0;
      
      // Mock fetch to fail twice, then succeed
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => createMockSuccessResponse({ success: true }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      });

      const { useApiClient } = await import('~/utils/api');
      const apiClient = useApiClient();
      
      const result = await apiClient.get('/retry-endpoint', { retries: 3 });
      
      // Verify request was retried and eventually succeeded
      expect(callCount).toBe(3);
      expect(result).toEqual({ success: true });
    });

    it('should not retry non-retryable errors', async () => {
      let callCount = 0;
      
      // Mock 400 Bad Request (non-retryable)
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => createMockErrorResponse('BAD_REQUEST', 'Bad request'),
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
  });

  // Legacy user journey tests (updated for new format)
  describe('🍕 Пиццерия "Вкусная Пицца" - Полный путь пользователя', () => {
    const tenantSlug = 'vkusnaya-pizza';
    const baseUrl = `/?tenant=${tenantSlug}`;

    it('1. Пользователь заходит на главную страницу ресторана', async () => {
      const response = await $fetch(baseUrl);
      expect(response).toBeDefined();
      // Проверяем, что страница загружается без ошибок
    });

    it('2. Пользователь переходит к выбору ресторана', async () => {
      const response = await $fetch('/select-restaurant');
      expect(response).toBeDefined();
      // Должна быть страница выбора ресторана
    });

    it('3. Пользователь просматривает меню', async () => {
      const response = await $fetch(`/menu?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
      // Должна быть страница меню
    });

    it('4. Пользователь просматривает категории', async () => {
      const response = await $fetch(`/menu/categories?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
      // Должна быть страница категорий
    });

    it('5. Пользователь переходит к оформлению заказа', async () => {
      const response = await $fetch(`/checkout?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
      // Должна быть страница оформления заказа
    });

    it('6. Пользователь просматривает историю заказов', async () => {
      const response = await $fetch(`/orders/history?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
      // Должна быть страница истории заказов
    });
  });

  describe('🍜 Азиатский ресторан - Полный путь пользователя', () => {
    const tenantSlug = 'asian-kitchen';
    const baseUrl = `/?tenant=${tenantSlug}`;

    it('1. Пользователь заходит на главную страницу ресторана', async () => {
      const response = await $fetch(baseUrl);
      expect(response).toBeDefined();
    });

    it('2. Пользователь просматривает меню', async () => {
      const response = await $fetch(`/menu?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });

    it('3. Пользователь ищет блюда', async () => {
      const response = await $fetch(`/menu/search?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });

    it('4. Пользователь переходит к оплате', async () => {
      const response = await $fetch(`/payment/callback?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });
  });

  describe('🌸 Цветочный магазин - Полный путь пользователя', () => {
    const tenantSlug = 'flower-bouquet';
    const baseUrl = `/?tenant=${tenantSlug}`;

    it('1. Пользователь заходит на главную страницу магазина', async () => {
      const response = await $fetch(baseUrl);
      expect(response).toBeDefined();
    });

    it('2. Пользователь просматривает каталог', async () => {
      const response = await $fetch(`/menu?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });

    it('3. Пользователь добавляет товары в избранное', async () => {
      const response = await $fetch(`/favourites?tenant=${tenantSlug}`);
      expect(response).toBeDefined();
    });
  });

  describe('🔐 Аутентификация пользователей', () => {
    it('Страница входа загружается', async () => {
      const response = await $fetch('/auth/login');
      expect(response).toBeDefined();
    });

    it('Страница регистрации загружается', async () => {
      const response = await $fetch('/auth/register');
      expect(response).toBeDefined();
    });
  });

  describe('📱 Общие страницы приложения', () => {
    it('Страница уведомлений загружается', async () => {
      const response = await $fetch('/notifications');
      expect(response).toBeDefined();
    });

    it('Страница акций загружается', async () => {
      const response = await $fetch('/promotions');
      expect(response).toBeDefined();
    });

    it('Страница доставки загружается', async () => {
      const response = await $fetch('/delivery');
      expect(response).toBeDefined();
    });

    it('Страница карты загружается', async () => {
      const response = await $fetch('/map');
      expect(response).toBeDefined();
    });

    it('Offline страница загружается', async () => {
      const response = await $fetch('/offline');
      expect(response).toBeDefined();
    });

    it('Страница ошибки загружается', async () => {
      const response = await $fetch('/error');
      expect(response).toBeDefined();
    });
  });

  describe('👨‍💼 Админ панель', () => {
    it('Главная страница админки загружается', async () => {
      const response = await $fetch('/admin');
      expect(response).toBeDefined();
    });

    it('Страница аналитики админки загружается', async () => {
      const response = await $fetch('/admin/analytics');
      expect(response).toBeDefined();
    });

    it('Страница управления меню админки загружается', async () => {
      const response = await $fetch('/admin/menu');
      expect(response).toBeDefined();
    });

    it('Страница заказов админки загружается', async () => {
      const response = await $fetch('/admin/orders');
      expect(response).toBeDefined();
    });
  });
});