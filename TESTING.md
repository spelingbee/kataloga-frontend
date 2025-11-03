# Testing Guide

This document covers all testing strategies and procedures for the Menu Ordering App frontend.

## Testing Strategy

Our testing approach follows the testing pyramid:

1. **Unit Tests** (70%) - Fast, isolated tests for individual functions and components
2. **Integration Tests** (20%) - Tests for component interactions and API integration
3. **End-to-End Tests** (10%) - Full user journey tests

## Test Types

### Unit Tests

Located in `tests/` directory, these tests cover:

- **Composables**: Business logic and state management
- **Services**: API clients and data processing
- **Utils**: Helper functions and utilities
- **Components**: Vue component behavior (when needed)

**Running Unit Tests:**

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test tests/composables/useAuth.test.ts
```

### Integration Tests

Located in `tests/integration/` directory, these tests cover:

- **API Integration**: Real API connectivity and responses
- **User Flows**: Complete user interactions
- **PWA Functionality**: Service worker, offline features, push notifications

**Running Integration Tests:**

```bash
# Run comprehensive integration tests
pnpm test:integration

# Run specific integration test
pnpm test tests/integration/api-integration.test.ts
```

### End-to-End Tests

Using Playwright for browser automation:

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode
pnpm test:e2e --headed

# Run specific E2E test
pnpm test:e2e tests/e2e/order-flow.spec.ts
```

### Load Testing

Using k6 for performance and load testing:

```bash
# Install k6 (if not already installed)
# macOS: brew install k6
# Windows: choco install k6
# Linux: sudo apt-get install k6

# Run load tests
k6 run tests/load/k6-load-test.js

# Run load tests with custom configuration
k6 run --vus 50 --duration 5m tests/load/k6-load-test.js

# Run load tests against staging
BASE_URL=https://staging.menuapp.com API_URL=https://api-staging.menuapp.com k6 run tests/load/k6-load-test.js
```

## Test Configuration

### Vitest Configuration

Located in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
})
```

### Test Environment Variables

Create `.env.test` for test-specific configuration:

```bash
# Test environment configuration
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001
NUXT_PUBLIC_TENANT_SLUG=test
NUXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001
NODE_ENV=test
```

## Testing Best Practices

### Unit Testing

1. **Test Behavior, Not Implementation**
   ```typescript
   // Good
   it('should add item to cart', () => {
     const cart = useCart()
     cart.addItem({ id: '1', name: 'Pizza', price: 10 })
     expect(cart.items.value).toHaveLength(1)
   })
   
   // Avoid
   it('should call addItem method', () => {
     const cart = useCart()
     const spy = vi.spyOn(cart, 'addItem')
     cart.addItem({ id: '1', name: 'Pizza', price: 10 })
     expect(spy).toHaveBeenCalled()
   })
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should calculate total price including tax', () => {})
   
   // Avoid
   it('should work', () => {})
   ```

3. **Arrange, Act, Assert Pattern**
   ```typescript
   it('should update item quantity', () => {
     // Arrange
     const cart = useCart()
     cart.addItem({ id: '1', name: 'Pizza', price: 10, quantity: 1 })
     
     // Act
     cart.updateQuantity('1', 3)
     
     // Assert
     expect(cart.items.value[0].quantity).toBe(3)
   })
   ```

### Integration Testing

1. **Test Real Scenarios**
   - Use actual API endpoints when possible
   - Test with realistic data
   - Include error scenarios

2. **Mock External Dependencies**
   ```typescript
   // Mock fetch for controlled testing
   global.fetch = vi.fn().mockResolvedValue({
     ok: true,
     json: () => Promise.resolve({ success: true, data: [] })
   })
   ```

3. **Test Error Handling**
   ```typescript
   it('should handle API errors gracefully', async () => {
     global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
     
     const { useMenu } = await import('~/composables/useMenu')
     const menu = useMenu()
     
     await expect(menu.loadMenuItems()).rejects.toThrow('Network error')
   })
   ```

### E2E Testing

1. **Test Critical User Paths**
   - Registration and login
   - Menu browsing and search
   - Adding items to cart
   - Order placement
   - Order tracking

2. **Use Page Object Model**
   ```typescript
   class MenuPage {
     constructor(private page: Page) {}
     
     async searchForItem(query: string) {
       await this.page.fill('[data-testid="search-input"]', query)
       await this.page.click('[data-testid="search-button"]')
     }
     
     async addItemToCart(itemName: string) {
       await this.page.click(`[data-testid="add-to-cart-${itemName}"]`)
     }
   }
   ```

3. **Use Data Test IDs**
   ```vue
   <template>
     <button 
       data-testid="add-to-cart-button"
       @click="addToCart"
     >
       Add to Cart
     </button>
   </template>
   ```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run unit tests
        run: pnpm test
        
      - name: Run integration tests
        run: pnpm test:integration
        env:
          NUXT_PUBLIC_API_BASE_URL: http://localhost:3001
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Data Management

### Fixtures

Store test data in `tests/fixtures/`:

```typescript
// tests/fixtures/menu-items.ts
export const mockMenuItems = [
  {
    id: '1',
    name: 'Pizza Margherita',
    description: 'Classic pizza with tomato and mozzarella',
    price: 12.99,
    category: 'Pizza',
    imageUrl: '/images/pizza-margherita.jpg'
  },
  // ... more items
]
```

### Test Utilities

Create reusable test utilities in `tests/utils/`:

```typescript
// tests/utils/test-helpers.ts
export function createMockUser() {
  return {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  }
}

export function mockApiResponse(data: any, success = true) {
  return {
    success,
    data,
    message: success ? 'Success' : 'Error'
  }
}
```

## Performance Testing

### Lighthouse CI

Configure Lighthouse CI for performance monitoring:

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/menu"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.8}]
      }
    }
  }
}
```

### Bundle Analysis

Monitor bundle size and performance:

```bash
# Analyze bundle size
pnpm build:analyze

# Check for unused dependencies
npx depcheck

# Audit for vulnerabilities
pnpm audit
```

## Debugging Tests

### VS Code Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Vitest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["--run", "${relativeFile}"],
      "smartStep": true,
      "console": "integratedTerminal"
    }
  ]
}
```

### Common Debugging Techniques

1. **Use `console.log` in tests**
   ```typescript
   it('should debug test', () => {
     const result = someFunction()
     console.log('Debug result:', result)
     expect(result).toBe(expected)
   })
   ```

2. **Use `vi.debug()` for step debugging**
   ```typescript
   it('should step through test', () => {
     vi.debug() // Pauses execution
     const result = someFunction()
     expect(result).toBe(expected)
   })
   ```

3. **Isolate failing tests**
   ```typescript
   it.only('should run only this test', () => {
     // This test will run in isolation
   })
   ```

## Test Maintenance

### Regular Tasks

1. **Update test dependencies**
   ```bash
   pnpm update @vitest/ui vitest @vue/test-utils
   ```

2. **Review test coverage**
   ```bash
   pnpm test:coverage
   # Review coverage report in coverage/index.html
   ```

3. **Clean up obsolete tests**
   - Remove tests for deleted features
   - Update tests for changed functionality
   - Refactor duplicated test code

### Test Quality Metrics

Monitor these metrics:

- **Coverage**: Aim for >80% line coverage
- **Test Speed**: Unit tests should run in <10s
- **Flakiness**: <1% flaky test rate
- **Maintenance**: Tests should be updated with feature changes

## Troubleshooting

### Common Issues

1. **Tests timing out**
   ```typescript
   // Increase timeout for slow operations
   it('should handle slow operation', async () => {
     // ... test code
   }, 10000) // 10 second timeout
   ```

2. **Mock not working**
   ```typescript
   // Ensure mocks are cleared between tests
   beforeEach(() => {
     vi.clearAllMocks()
   })
   ```

3. **DOM not available**
   ```typescript
   // Ensure jsdom environment is configured
   // In vitest.config.ts: environment: 'jsdom'
   ```

4. **Async operations not completing**
   ```typescript
   // Use proper async/await
   it('should wait for async operation', async () => {
     await someAsyncFunction()
     expect(result).toBe(expected)
   })
   ```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)