# Frontend API Standardization Migration Guide

This guide helps developers understand the changes made during the API standardization migration and how to work with the new system.

## Overview

The frontend has been migrated from a mixed API response format to a standardized `ApiResponse<T>` format that aligns with the backend. This migration provides:

- **Type Safety**: Strict TypeScript types for all API interactions
- **Consistent Error Handling**: Standardized error codes and structures
- **Automatic Unwrapping**: Clean data extraction for components
- **Better Debugging**: Request IDs and metadata for tracing
- **Tenant Support**: Built-in multi-tenant context management

## What Changed

### 1. API Response Format

**Before (Legacy):**
```typescript
// Direct data responses
const users = await fetch('/api/users').then(r => r.json())
// users = [{ id: 1, name: 'John' }, ...]

// Mixed pagination formats
const paginated = await fetch('/api/posts').then(r => r.json())
// paginated = { items: [...], total: 100, page: 1, limit: 20 }
```

**After (Standardized):**
```typescript
// All responses now use ApiResponse<T> format
const response = await fetch('/api/users').then(r => r.json())
// response = {
//   success: true,
//   statusCode: 200,
//   data: [{ id: 1, name: 'John' }, ...],
//   error: null,
//   meta: {
//     requestId: 'req-1234567890-abc123',
//     timestamp: '2023-12-20T10:30:00.000Z',
//     tenantId: 'my-tenant'
//   }
// }
```

### 2. API Client Usage

**Before:**
```typescript
// Manual response handling
const response = await $fetch('/api/users')
const users = response.data || response // Inconsistent structure
```

**After:**
```typescript
// Automatic unwrapping (recommended)
const users = await apiClient.get<User[]>('/users')
// Returns: User[] (clean data)

// Access full response when needed
const response = await apiClient.getRaw<User[]>('/users')
// Returns: ApiResponse<User[]> (includes metadata)
```

### 3. Error Handling

**Before:**
```typescript
try {
  const user = await $fetch('/api/users/123')
} catch (error) {
  // Inconsistent error structure
  console.error(error.message || error.data?.message || 'Unknown error')
}
```

**After:**
```typescript
try {
  const user = await apiClient.get<User>('/users/123')
} catch (error: ApiError) {
  // Standardized error structure
  console.error(`Error ${error.code}: ${error.message}`)
  
  // Handle specific error types
  if (error.code === 'VALIDATION_ERROR') {
    // error.details contains field-specific errors
  }
}
```

### 4. Pagination

**Before:**
```typescript
// Various pagination formats
const result = await $fetch('/api/posts')
const posts = result.items || result.data
const total = result.total || result.count || result.totalCount
```

**After:**
```typescript
// Consistent pagination through services
const result = await menuService.getMenuItems({ page: 1, limit: 20 })
// result: PaginatedResult<MenuItem> = {
//   items: MenuItem[],
//   pagination: {
//     page: 1,
//     limit: 20,
//     totalItems: 100,
//     totalPages: 5
//   }
// }
```

## Migration Steps for Developers

### 1. Update Service Methods

**Before:**
```typescript
export class UserService {
  async getUsers(): Promise<User[]> {
    const response = await $fetch('/api/users')
    return response.data || response
  }
}
```

**After:**
```typescript
export class UserService {
  constructor(private apiClient: ApiClient) {}
  
  async getUsers(): Promise<User[]> {
    // ApiClient automatically unwraps the response
    return this.apiClient.get<User[]>('/users')
  }
  
  async getUsersPaginated(params: PaginationParams): Promise<PaginatedResult<User>> {
    const response = await this.apiClient.getRaw<User[]>('/users', { params })
    return {
      items: response.data || [],
      pagination: response.meta.pagination!
    }
  }
}
```

### 2. Update Store Actions

**Before:**
```typescript
export const useUserStore = defineStore('users', {
  state: () => ({
    users: [] as User[],
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchUsers() {
      try {
        this.loading = true
        const response = await $fetch('/api/users')
        this.users = response.data || response
      } catch (error: any) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
```

**After:**
```typescript
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
        
        // Clean data is returned directly
        this.users = await this.userService.getUsers()
        
      } catch (error) {
        // Typed error with structured information
        this.error = error as ApiError
        
        // Log with request ID for debugging
        console.error(`User fetch failed [${error.requestId}]:`, error)
        
      } finally {
        this.loading = false
      }
    }
  }
})
```

### 3. Update Components

**Before:**
```vue
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <div v-else>
    <UserCard v-for="user in users" :key="user.id" :user="user" />
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const { users, loading, error } = storeToRefs(userStore)

onMounted(() => {
  userStore.fetchUsers()
})
</script>
```

**After:**
```vue
<template>
  <div v-if="loading">Loading...</div>
  <ErrorMessage v-else-if="error" :error="error" />
  <div v-else>
    <UserCard v-for="user in users" :key="user.id" :user="user" />
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const { users, loading, error } = storeToRefs(userStore)

onMounted(() => {
  userStore.fetchUsers()
})
</script>
```

### 4. Form Error Handling

**Before:**
```vue
<script setup lang="ts">
const formErrors = ref<Record<string, string>>({})

const submitForm = async () => {
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: formData
    })
  } catch (error: any) {
    // Manual error parsing
    if (error.statusCode === 422) {
      formErrors.value = error.data?.errors || {}
    }
  }
}
</script>
```

**After:**
```vue
<script setup lang="ts">
const { fieldErrors, handleValidationError, clearFieldError } = useApiForm()

const submitForm = async () => {
  try {
    await apiClient.post('/users', formData)
  } catch (error: ApiError) {
    // Automatic error mapping
    if (error.code === 'VALIDATION_ERROR') {
      handleValidationError(error)
    }
  }
}
</script>

<template>
  <BaseInput
    v-model="formData.email"
    :error="fieldErrors.email"
    @input="clearFieldError('email')"
  />
</template>
```

## New Features Available

### 1. Request Tracing

Every API request now includes a unique `requestId` for debugging:

```typescript
try {
  const user = await apiClient.get<User>('/users/123')
} catch (error: ApiError) {
  // Log error with request ID for support
  console.error(`Request ${error.requestId} failed:`, error.message)
  
  // Send to error tracking service
  errorTracker.captureException(error, {
    requestId: error.requestId,
    tenantId: error.tenantId
  })
}
```

### 2. Tenant Context Management

```typescript
// Set tenant for all subsequent requests
apiClient.setTenant('my-tenant')

// Make request with specific tenant
const data = await apiClient.get('/data', { targetTenant: 'other-tenant' })

// Make system-wide request (bypass tenant)
const systemData = await apiClient.get('/system/health', { bypassTenant: true })
```

### 3. Global Error Handling

```typescript
// Composable for centralized error handling
const { handleApiError } = useGlobalErrorHandler()

// Automatically handles:
// - 401: Redirects to login
// - 403: Shows access denied message
// - 500: Shows generic error toast
// - VALIDATION_ERROR: Maps to form fields
```

### 4. Retry Logic

```typescript
// Automatic retry for network errors
const data = await apiClient.get('/data', {
  retries: 3,           // Override default retry count
  timeout: 15000        // Override default timeout
})
```

## Best Practices

### 1. Service Layer Pattern

Always use services to encapsulate API calls:

```typescript
// ✅ Good: Service encapsulates API logic
export class MenuService {
  async getCategories(): Promise<Category[]> {
    return this.apiClient.get<Category[]>('/categories')
  }
}

// ❌ Bad: Direct API calls in components
const categories = await apiClient.get<Category[]>('/categories')
```

### 2. Error Handling Strategy

```typescript
// ✅ Good: Specific error handling
try {
  const user = await userService.createUser(userData)
} catch (error: ApiError) {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      handleValidationError(error)
      break
    case 'EMAIL_ALREADY_EXISTS':
      showEmailExistsError()
      break
    default:
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
interface CreateUserRequest {
  name: string
  email: string
}

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

const newUser = await apiClient.post<User>('/users', userData as CreateUserRequest)

// ❌ Bad: Using any
const newUser = await apiClient.post('/users', userData as any)
```

### 4. Pagination Handling

```typescript
// ✅ Good: Use PaginatedResult
const result = await menuService.getMenuItems({ page: 1, limit: 20 })
const { items, pagination } = result

// ❌ Bad: Manual pagination parsing
const response = await apiClient.getRaw('/menu')
const items = response.data
const pagination = response.meta.pagination
```

## Troubleshooting

### Common Issues

1. **"Property 'requestId' does not exist on type 'Error'"**
   - Solution: Cast error to `ApiError` type
   ```typescript
   } catch (error) {
     const apiError = error as ApiError
     console.log(apiError.requestId)
   }
   ```

2. **"Cannot read property 'pagination' of undefined"**
   - Solution: Check if pagination exists before accessing
   ```typescript
   const response = await apiClient.getRaw<Item[]>('/items')
   if (response.meta.pagination) {
     // Handle pagination
   }
   ```

3. **"Tenant not found" errors**
   - Solution: Ensure tenant is set before making requests
   ```typescript
   apiClient.setTenant('your-tenant-slug')
   ```

### Debugging Tips

1. **Enable request logging:**
   ```typescript
   // Check browser console for detailed request logs
   // Format: "🌐 API Client - Making request: { method, url, headers, ... }"
   ```

2. **Use request IDs for support:**
   ```typescript
   // Include request ID when reporting issues
   console.error(`Request ${error.requestId} failed`)
   ```

3. **Check response structure:**
   ```typescript
   // Use getRaw() to inspect full response
   const response = await apiClient.getRaw('/endpoint')
   console.log('Full response:', response)
   ```

## Migration Checklist

- [ ] Update all service methods to use new ApiClient
- [ ] Replace direct `$fetch` calls with service methods
- [ ] Update error handling to use ApiError type
- [ ] Implement form validation error mapping
- [ ] Update pagination handling to use PaginatedResult
- [ ] Add proper TypeScript types for all API calls
- [ ] Test error scenarios (401, 403, 500, validation errors)
- [ ] Verify tenant context is working correctly
- [ ] Update component error displays
- [ ] Remove any legacy response handling code

## Support

For questions or issues during migration:

1. Check the browser console for detailed error logs
2. Look for request IDs in error messages for debugging
3. Refer to the API documentation for endpoint specifications
4. Contact the development team with specific error codes and request IDs

## Related Documentation

- [API Client Reference](./docs/api-client.md)
- [Error Handling Guide](./docs/error-handling.md)
- [Type Definitions](./app/types/api.ts)
- [Backend API Documentation](../backend/docs/API_MIGRATION_GUIDE.md)