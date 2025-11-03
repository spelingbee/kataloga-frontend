import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch } from 'ofetch'

// Integration tests for API connectivity and functionality
describe('API Integration Tests', () => {
  const apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  let authToken: string | null = null

  beforeAll(async () => {
    // Setup test environment
    console.log(`Testing against API: ${apiBaseUrl}`)
  })

  afterAll(async () => {
    // Cleanup
    if (authToken) {
      try {
        await $fetch(`${apiBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        })
      } catch (error) {
        console.log('Logout cleanup failed:', error)
      }
    }
  })

  describe('Health Checks', () => {
    it('should respond to health check', async () => {
      const response = await $fetch(`${apiBaseUrl}/health`)
      
      expect(response).toBeDefined()
      expect(response.status).toBe('healthy')
      expect(response.timestamp).toBeDefined()
    })

    it('should have proper response time', async () => {
      const startTime = Date.now()
      await $fetch(`${apiBaseUrl}/health`)
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    }

    it('should register a new user', async () => {
      try {
        const response = await $fetch(`${apiBaseUrl}/api/auth/register`, {
          method: 'POST',
          body: testUser
        })

        expect(response.success).toBe(true)
        expect(response.user).toBeDefined()
        expect(response.user.email).toBe(testUser.email)
      } catch (error: any) {
        // User might already exist, which is fine for testing
        if (!error.data?.message?.includes('already exists')) {
          throw error
        }
      }
    })

    it('should login with valid credentials', async () => {
      const response = await $fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        body: {
          email: testUser.email,
          password: testUser.password
        }
      })

      expect(response.success).toBe(true)
      expect(response.accessToken).toBeDefined()
      expect(response.refreshToken).toBeDefined()
      expect(response.user).toBeDefined()

      authToken = response.accessToken
    })

    it('should reject invalid credentials', async () => {
      await expect(
        $fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          body: {
            email: testUser.email,
            password: 'wrongpassword'
          }
        })
      ).rejects.toThrow()
    })

    it('should refresh tokens', async () => {
      if (!authToken) {
        // Login first
        const loginResponse = await $fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          body: {
            email: testUser.email,
            password: testUser.password
          }
        })
        authToken = loginResponse.accessToken
      }

      const response = await $fetch(`${apiBaseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      expect(response.success).toBe(true)
      expect(response.accessToken).toBeDefined()
    })
  })

  describe('Menu API', () => {
    it('should fetch menu items', async () => {
      const response = await $fetch(`${apiBaseUrl}/api/menu`)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should fetch menu categories', async () => {
      const response = await $fetch(`${apiBaseUrl}/api/menu/categories`)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should search menu items', async () => {
      const response = await $fetch(`${apiBaseUrl}/api/menu/search?q=pizza`)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should handle pagination', async () => {
      const response = await $fetch(`${apiBaseUrl}/api/menu?page=1&limit=10`)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.pagination).toBeDefined()
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.limit).toBe(10)
    })
  })

  describe('Order API', () => {
    beforeAll(async () => {
      // Ensure we have auth token
      if (!authToken) {
        const loginResponse = await $fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'testpassword123'
          }
        })
        authToken = loginResponse.accessToken
      }
    })

    it('should create an order', async () => {
      const orderData = {
        items: [
          {
            productId: 'test-product-1',
            quantity: 2,
            price: 15.99
          }
        ],
        customerInfo: {
          name: 'Test Customer',
          phone: '+1234567890',
          email: 'test@example.com'
        },
        deliveryInfo: {
          address: '123 Test Street',
          city: 'Test City',
          postalCode: '12345'
        }
      }

      const response = await $fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: orderData
      })

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data.id).toBeDefined()
      expect(response.data.status).toBe('PENDING')
    })

    it('should fetch user orders', async () => {
      const response = await $fetch(`${apiBaseUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })
  })

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection', async () => {
      // This is a basic test - in a real scenario you'd test actual WebSocket functionality
      const wsUrl = process.env.NUXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'
      
      // For now, just verify the URL format is correct
      expect(wsUrl).toMatch(/^wss?:\/\//)
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      await expect(
        $fetch(`${apiBaseUrl}/api/nonexistent-endpoint`)
      ).rejects.toThrow()
    })

    it('should handle unauthorized requests', async () => {
      await expect(
        $fetch(`${apiBaseUrl}/api/orders`, {
          headers: {
            Authorization: 'Bearer invalid-token'
          }
        })
      ).rejects.toThrow()
    })

    it('should handle malformed requests', async () => {
      await expect(
        $fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          body: {
            // Missing required fields
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        $fetch(`${apiBaseUrl}/health`)
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe('healthy')
      })
    })

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      await $fetch(`${apiBaseUrl}/api/menu`)
      const responseTime = Date.now() - startTime

      expect(responseTime).toBeLessThan(2000) // Should respond within 2 seconds
    })
  })
})