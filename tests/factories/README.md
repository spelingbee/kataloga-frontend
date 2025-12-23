# API Response Mock Factories

This directory contains factory functions for creating mock API responses in tests. These factories generate standardized `ApiResponse` objects that match the backend structure.

## Usage

### Basic Success Response

```typescript
import { createMockSuccessResponse } from '~/tests/factories'

const response = createMockSuccessResponse({ id: 1, name: 'Test Item' })
// Returns: ApiResponse<{ id: number, name: string }>
```

### Error Response

```typescript
import { createMockErrorResponse } from '~/tests/factories'

const response = createMockErrorResponse('USER_NOT_FOUND', 'User not found', {
  statusCode: 404
})
```

### Paginated Response

```typescript
import { createMockPaginatedResponse } from '~/tests/factories'

const response = createMockPaginatedResponse(
  [{ id: 1 }, { id: 2 }],
  { page: 2, totalItems: 50 }
)
```

### Validation Error

```typescript
import { createMockValidationError } from '~/tests/factories'

const response = createMockValidationError({
  email: 'Email is required',
  password: 'Password must be at least 8 characters'
})
```

### Authentication Error

```typescript
import { createMockAuthError } from '~/tests/factories'

const response = createMockAuthError({ code: 'ACCESS_DENIED' })
```

## Available Factories

- `createMockSuccessResponse<T>(data, options?)` - Creates successful responses
- `createMockErrorResponse(code, message, options?)` - Creates error responses
- `createMockPaginatedResponse<T>(items, pagination?, options?)` - Creates paginated responses
- `createMockValidationError(fieldErrors, options?)` - Creates validation error responses
- `createMockAuthError(options?)` - Creates authentication/authorization errors
- `createMockNetworkError(options?)` - Creates network error responses
- `createMockTenantError(code?, tenantId?, options?)` - Creates tenant-related errors

## Utility Functions

- `createMockApiMeta(options?)` - Creates mock metadata
- `createMockPaginationMeta(options?)` - Creates mock pagination metadata
- `createMockApiError(code, message, details?)` - Creates mock error objects

## Batch Creation

- `createMockSuccessResponseBatch<T>(dataArray, options?)` - Creates multiple success responses
- `createMockErrorResponseBatch(errors, options?)` - Creates multiple error responses

## Testing Examples

### Testing a Service

```typescript
import { vi, describe, it, expect } from 'vitest'
import { createMockSuccessResponse, createMockErrorResponse } from '~/tests/factories'
import { MenuService } from '~/services/menu.service'

describe('MenuService', () => {
  it('should return menu items', async () => {
    const mockData = [{ id: 1, name: 'Pizza' }]
    const mockResponse = createMockSuccessResponse(mockData)
    
    // Mock the API client
    const mockApiClient = {
      get: vi.fn().mockResolvedValue(mockResponse.data)
    }
    
    const service = new MenuService(mockApiClient)
    const result = await service.getMenuItems()
    
    expect(result).toEqual(mockData)
  })
  
  it('should handle errors', async () => {
    const mockError = createMockErrorResponse('NOT_FOUND', 'Menu not found', {
      statusCode: 404
    })
    
    const mockApiClient = {
      get: vi.fn().mockRejectedValue(mockError.error)
    }
    
    const service = new MenuService(mockApiClient)
    
    await expect(service.getMenuItems()).rejects.toThrow('Menu not found')
  })
})
```

### Testing a Store

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { createMockPaginatedResponse } from '~/tests/factories'
import { useMenuStore } from '~/stores/menu'

describe('MenuStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should load menu items', async () => {
    const mockItems = [{ id: 1, name: 'Pizza' }]
    const mockResponse = createMockPaginatedResponse(mockItems, {
      page: 1,
      totalItems: 1
    })
    
    // Mock the service
    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      items: mockResponse.data!,
      pagination: mockResponse.meta.pagination!
    })
    
    const store = useMenuStore()
    await store.fetchMenuItems()
    
    expect(store.menuItems).toEqual(mockItems)
    expect(store.pagination).toEqual(mockResponse.meta.pagination)
  })
})
```

### Testing Components

```typescript
import { mount } from '@vue/test-utils'
import { createMockValidationError } from '~/tests/factories'
import LoginForm from '~/components/LoginForm.vue'

describe('LoginForm', () => {
  it('should display validation errors', async () => {
    const mockError = createMockValidationError({
      email: 'Email is required',
      password: 'Password is too short'
    })
    
    const wrapper = mount(LoginForm, {
      props: {
        error: mockError.error
      }
    })
    
    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is too short')
  })
})
```

## Best Practices

1. **Use specific factories**: Use `createMockValidationError` instead of generic `createMockErrorResponse` for validation errors
2. **Provide realistic data**: Use data that resembles real API responses
3. **Test edge cases**: Use factories to create edge case scenarios (empty arrays, null values, etc.)
4. **Consistent request IDs**: Use the `baseRequestId` option for batch operations to maintain traceability
5. **Match backend structure**: Ensure mock responses match the actual backend API structure