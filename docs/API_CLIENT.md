# API Client Documentation

Complete reference for the standardized API client used throughout the frontend application.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Methods](#api-methods)
- [Error Handling](#error-handling)
- [Type Safety](#type-safety)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)

## Overview

The API Client is a type-safe HTTP client that provides:

- **Automatic Response Unwrapping**: Clean data extraction by default
- **Standardized Error Handling**: Consistent error structure across all endpoints
- **Request Tracing**: Unique request IDs for debugging
- **Retry Logic**: Automatic retry for network errors
- **Tenant Context**: Built-in multi-tenant support
- **Type Safety**: Full TypeScript support

## Installation

The API client is automatically initialized in the application. Access it using the composable:

```typescript
const apiClient = useApiClient()
```

## Basic Usage

### Simple GET Request

```typescript
// Returns unwrapped data directly
const users = await apiClient.get<User[]>('/users')
// users: User[]
```

### POST Request

```typescript
const newUser = await apiClient.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
// newUser: User
```

### PUT Request

```typescript
const updatedUser = await apiClient.put<User>(`/users/${id}`, {
  name: 'Jane Doe'
})
// updatedUser: User
```

### DELETE Request

```typescript
await apiClient.delete(`/users/${id}`)
```

## API Methods

### GET Methods

#### `get<T>(endpoint: string, options?: RequestOptions): Promise<T>`

Performs a GET request and returns unwrapped data.

```typescript
// Simple GET
const users = await apiClient.get<User[]>('/users')

// With query parameters
const users = await apiClient.get<User[]>('/users', {
  params: { role: 'admin', active: true }
})

// With custom timeout
const users = await apiClient.get<User[]>('/users', {
  timeout: 5000
})
```

#### `getRaw<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>`

Performs a GET request and returns the full ApiResponse with metadata.

```typescript
const response = await apiClient.getRaw<User[]>('/users')

console.log(response.data)           // User[]
console.log(response.meta.requestId) // 'req-1234567890-abc123'
console.log(response.meta.timestamp) // '2023-12-20T10:30:00.000Z'
console.log(response.statusCode)     // 200
```

### POST Methods

#### `post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T>`

Performs a POST request and returns unwrapped data.

```typescript
const newUser = await apiClient.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

#### `postRaw<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>>`

Performs a POST request and returns the full ApiResponse.

```typescript
const response = await apiClient.postRaw<User>('/users', userData)
console.log(response.meta.requestId) // For logging
```

### PUT Methods

#### `put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T>`

Performs a PUT request and returns unwrapped data.

```typescript
const updatedUser = await apiClient.put<User>(`/users/${id}`, {
  name: 'Jane Doe'
})
```

#### `putRaw<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>>`

Performs a PUT request and returns the full ApiResponse.

### PATCH Methods

#### `patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T>`

Performs a PATCH request and returns unwrapped data.

```typescript
const updatedUser = await apiClient.patch<User>(`/users/${id}`, {
  email: 'newemail@example.com'
})
```

#### `patchRaw<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>>`

Performs a PATCH request and returns the full ApiResponse.

### DELETE Methods

#### `delete<T>(endpoint: string, options?: RequestOptions): Promise<T>`

Performs a DELETE request and returns unwrapped data.

```typescript
await apiClient.delete(`/users/${id}`)
```

#### `deleteRaw<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>`

Performs a DELETE request and returns the full ApiResponse.

## Request Options

All methods accept an optional `RequestOptions` parameter:

```typescript
interface RequestOptions {
  /** Whether to automatically unwrap data from ApiResponse (default: true) */
  unwrap?: boolean
  
  /** Skip global error handling and let component handle errors */
  skipErrorHandling?: boolean
  
  /** Request timeout in milliseconds */
  timeout?: number
  
  /** Number of retry attempts for failed requests */
  retries?: number
  
  /** Bypass tenant context for system-wide requests */
  bypassTenant?: boolean
  
  /** Override current tenant for specific requests */
  targetTenant?: string
  
  /** Additional HTTP headers */
  headers?: Record<string, string>
  
  /** Query parameters */
  params?: Record<string, any>
}
```

### Examples

```typescript
// Custom timeout
const data = await apiClient.get('/data', { timeout: 5000 })

// Skip global error handling
const data = await apiClient.get('/data', { skipErrorHandling: true })

// Custom retry count
const data = await apiClient.get('/data', { retries: 5 })

// System-wide request (bypass tenant)
const systemData = await apiClient.get('/system/health', { bypassTenant: true })

// Request with specific tenant
const data = await apiClient.get('/data', { targetTenant: 'other-tenant' })

// Custom headers
const data = await apiClient.get('/data', {
  headers: { 'X-Custom-Header': 'value' }
})

// Query parameters
const users = await apiClient.get('/users', {
  params: { role: 'admin', page: 1, limit: 20 }
})
```

## Error Handling

### Error Structure

All errors follow the `ApiError` interface:

```typescript
interface ApiError {
  /** Machine-readable error code */
  code: string
  
  /** Human-readable error message */
  message: string
  
  /** Additional error details */
  details?: ApiErrorDetail[] | Record<string, any>
  
  /** Request ID for tracing */
  requestId?: string
  
  /** Tenant ID if applicable */
  tenantId?: string
  
  /** Timestamp of the error */
  timestamp?: string
}
```

### Basic Error Handling

```typescript
try {
  const user = await apiClient.get<User>('/users/123')
} catch (error: ApiError) {
  console.error(`Error ${error.code}: ${error.message}`)
  console.error(`Request ID: ${error.requestId}`)
}
```

### Handling Specific Error Codes

```typescript
try {
  const user = await apiClient.post<User>('/users', userData)
} catch (error: ApiError) {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      // Handle validation errors
      if (Array.isArray(error.details)) {
        error.details.forEach(detail => {
          console.error(`${detail.field}: ${detail.message}`)
        })
      }
      break
      
    case 'AUTHENTICATION_ERROR':
      // Redirect to login
      router.push('/login')
      break
      
    case 'NOT_FOUND':
      // Show 404 page
      showNotFoundError()
      break
      
    default:
      // Generic error handling
      showErrorToast(error.message)
  }
}
```

### Validation Errors

Validation errors include field-specific details:

```typescript
try {
  await apiClient.post('/users', userData)
} catch (error: ApiError) {
  if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
    error.details.forEach((detail: ApiErrorDetail) => {
      console.log(`Field: ${detail.field}`)
      console.log(`Error: ${detail.message}`)
      console.log(`Value: ${detail.value}`)
    })
  }
}
```

### Global Error Handler

Use the global error handler composable for automatic error handling:

```typescript
const { handleApiError } = useGlobalErrorHandler()

try {
  const data = await apiClient.get('/data')
} catch (error: ApiError) {
  // Automatically handles:
  // - 401: Redirects to login
  // - 403: Shows access denied message
  // - 500: Shows generic error toast
  await handleApiError(error, response.meta, { url: '/data', method: 'GET' })
}
```

## Type Safety

### Defining Response Types

```typescript
interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

interface CreateUserRequest {
  name: string
  email: string
  password: string
}

// Type-safe request
const newUser = await apiClient.post<User>('/users', {
  name: 'John',
  email: 'john@example.com',
  password: 'secret'
} as CreateUserRequest)

// newUser is typed as User
console.log(newUser.id)
console.log(newUser.name)
```

### Paginated Responses

```typescript
interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationMeta
}

// Service method
async getUsers(params: PaginationParams): Promise<PaginatedResult<User>> {
  const response = await apiClient.getRaw<User[]>('/users', { params })
  return {
    items: response.data || [],
    pagination: response.meta.pagination!
  }
}

// Usage
const result = await userService.getUsers({ page: 1, limit: 20 })
console.log(result.items)        // User[]
console.log(result.pagination)   // PaginationMeta
```

## Advanced Features

### Tenant Context Management

```typescript
// Set tenant for all subsequent requests
apiClient.setTenant('my-tenant')

// Get current tenant
const currentTenant = apiClient.getCurrentTenant()

// Clear tenant
apiClient.clearTenant()

// Make request with specific tenant
const data = await apiClient.get('/data', {
  targetTenant: 'other-tenant'
})

// Make system-wide request (bypass tenant)
const systemData = await apiClient.get('/system/health', {
  bypassTenant: true
})

// Execute multiple requests with temporary tenant
await apiClient.withTenant('temp-tenant', async (client) => {
  const data1 = await client.get('/data1')
  const data2 = await client.get('/data2')
  return { data1, data2 }
})
```

### Retry Logic

The client automatically retries failed requests:

```typescript
// Default retry behavior (3 attempts)
const data = await apiClient.get('/data')

// Custom retry count
const data = await apiClient.get('/data', { retries: 5 })

// Retries are triggered for:
// - Network errors
// - Timeout errors
// - 5xx server errors
// - 408 Request Timeout
// - 429 Too Many Requests
```

### Request Tracing

Every request includes a unique request ID:

```typescript
try {
  const data = await apiClient.get('/data')
} catch (error: ApiError) {
  // Log error with request ID
  console.error(`Request ${error.requestId} failed`)
  
  // Send to error tracking service
  errorTracker.captureException(error, {
    requestId: error.requestId,
    tenantId: error.tenantId
  })
}
```

### Token Management

The client handles authentication tokens automatically:

```typescript
// Set token store
const authStore = useAuthStore()
apiClient.setTokenStore(authStore)

// Automatic token refresh on 401
// The client will:
// 1. Detect 401 response
// 2. Attempt to refresh token
// 3. Retry original request with new token
// 4. If refresh fails, redirect to login
```

## Best Practices

### 1. Use Service Layer

Encapsulate API calls in service classes:

```typescript
// ✅ Good
export class UserService {
  constructor(private apiClient: ApiClient) {}
  
  async getUsers(): Promise<User[]> {
    return this.apiClient.get<User[]>('/users')
  }
  
  async createUser(data: CreateUserRequest): Promise<User> {
    return this.apiClient.post<User>('/users', data)
  }
}

// ❌ Bad: Direct API calls in components
const users = await apiClient.get<User[]>('/users')
```

### 2. Proper Error Handling

```typescript
// ✅ Good: Specific error handling
try {
  const user = await userService.createUser(userData)
} catch (error: ApiError) {
  if (error.code === 'VALIDATION_ERROR') {
    handleValidationError(error)
  } else if (error.code === 'EMAIL_ALREADY_EXISTS') {
    showEmailExistsError()
  } else {
    showGenericError(error.message)
  }
}

// ❌ Bad: Generic error handling
try {
  const user = await userService.createUser(userData)
} catch (error) {
  alert('Something went wrong')
}
```

### 3. Type Safety

```typescript
// ✅ Good: Proper typing
interface User {
  id: string
  name: string
  email: string
}

const user = await apiClient.get<User>('/users/123')

// ❌ Bad: Using any
const user = await apiClient.get('/users/123') as any
```

### 4. Use getRaw() When Needed

```typescript
// ✅ Good: Use getRaw() for metadata access
const response = await apiClient.getRaw<User[]>('/users')
console.log(`Request ${response.meta.requestId} completed`)

// ✅ Good: Use get() for simple data access
const users = await apiClient.get<User[]>('/users')

// ❌ Bad: Using getRaw() when metadata isn't needed
const response = await apiClient.getRaw<User[]>('/users')
const users = response.data // Unnecessary complexity
```

### 5. Pagination Handling

```typescript
// ✅ Good: Use PaginatedResult
async getUsers(params: PaginationParams): Promise<PaginatedResult<User>> {
  const response = await this.apiClient.getRaw<User[]>('/users', { params })
  return {
    items: response.data || [],
    pagination: response.meta.pagination!
  }
}

// ❌ Bad: Manual pagination parsing
const response = await apiClient.getRaw('/users')
const users = response.data
const page = response.meta.pagination?.page
```

## Examples

### Complete Service Example

```typescript
import type { ApiClient } from '~/utils/api'
import type { User, CreateUserRequest, UpdateUserRequest } from '~/types'
import type { PaginatedResult, PaginationParams } from '~/types/api'

export class UserService {
  constructor(private apiClient: ApiClient) {}
  
  async getUsers(params?: PaginationParams): Promise<PaginatedResult<User>> {
    const response = await this.apiClient.getRaw<User[]>('/users', { params })
    return {
      items: response.data || [],
      pagination: response.meta.pagination!
    }
  }
  
  async getUser(id: string): Promise<User | null> {
    try {
      return await this.apiClient.get<User>(`/users/${id}`)
    } catch (error: ApiError) {
      if (error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }
  
  async createUser(data: CreateUserRequest): Promise<User> {
    return this.apiClient.post<User>('/users', data)
  }
  
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    return this.apiClient.put<User>(`/users/${id}`, data)
  }
  
  async deleteUser(id: string): Promise<void> {
    await this.apiClient.delete(`/users/${id}`)
  }
  
  async searchUsers(query: string): Promise<User[]> {
    return this.apiClient.get<User[]>('/users/search', {
      params: { q: query }
    })
  }
}
```

### Complete Store Example

```typescript
import { defineStore } from 'pinia'
import type { User } from '~/types'
import type { ApiError } from '~/types/api'

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [] as User[],
    loading: false,
    error: null as ApiError | null
  }),
  
  actions: {
    async fetchUsers() {
      try {
        this.loading = true
        this.error = null
        
        this.users = await this.userService.getUsers()
        
      } catch (error) {
        this.error = error as ApiError
        console.error(`User fetch failed [${error.requestId}]:`, error)
        
      } finally {
        this.loading = false
      }
    },
    
    async createUser(userData: CreateUserRequest) {
      try {
        this.loading = true
        this.error = null
        
        const newUser = await this.userService.createUser(userData)
        this.users.push(newUser)
        
        return newUser
        
      } catch (error) {
        this.error = error as ApiError
        throw error
        
      } finally {
        this.loading = false
      }
    }
  }
})
```

## Related Documentation

- [Migration Guide](../MIGRATION_GUIDE.md) - Guide for migrating from legacy API format
- [Error Handling Guide](./ERROR_HANDLING.md) - Comprehensive error handling documentation
- [Type Definitions](../app/types/api.ts) - TypeScript type definitions
- [Backend API Documentation](../../backend/docs/API_MIGRATION_GUIDE.md) - Backend API reference