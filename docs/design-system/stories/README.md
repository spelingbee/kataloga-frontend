# Component Stories

Component stories provide interactive examples and documentation for all design system components. They serve as both documentation and testing tools, showing components in various states and configurations.

## 📚 Story Structure

Each component has comprehensive stories covering:

### Basic Usage
- Default state
- All variants
- All sizes
- Common use cases

### Interactive States
- Hover effects
- Focus states
- Active states
- Disabled states
- Loading states

### Edge Cases
- Long text content
- Empty states
- Error conditions
- Extreme values

### Accessibility
- Keyboard navigation
- Screen reader compatibility
- High contrast mode
- Reduced motion

## 🎨 Available Stories

### Base Components

#### [BaseButton Stories](./BaseButton.stories.md)
Interactive examples of the BaseButton component with all variants, sizes, and states.

```vue
<!-- Primary Button -->
<BaseButton variant="primary">
  Order Now
</BaseButton>

<!-- Button with Icon -->
<BaseButton variant="outline" icon="plus">
  Add Item
</BaseButton>

<!-- Loading State -->
<BaseButton :loading="true">
  Processing...
</BaseButton>
```

#### [BaseInput Stories](./BaseInput.stories.md)
Form input examples with validation, floating labels, and accessibility features.

```vue
<!-- Basic Input -->
<BaseInput
  v-model="email"
  label="Email"
  type="email"
/>

<!-- Input with Error -->
<BaseInput
  v-model="password"
  label="Password"
  type="password"
  :error="passwordError"
/>

<!-- Input with Icon -->
<BaseInput
  v-model="search"
  label="Search"
  prefix-icon="search"
  clearable
/>
```

#### [BaseCard Stories](./BaseCard.stories.md)
Card component examples with different variants and content types.

```vue
<!-- Basic Card -->
<BaseCard>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</BaseCard>

<!-- Card with Image -->
<BaseCard hoverable>
  <template #image>
    <img src="/food-image.jpg" alt="Delicious food" />
  </template>
  
  <h3>Menu Item</h3>
  <p>Description of the menu item.</p>
  
  <template #footer>
    <span class="price">$12.99</span>
    <BaseButton size="sm">Add to Cart</BaseButton>
  </template>
</BaseCard>
```

#### [BaseModal Stories](./BaseModal.stories.md)
Modal dialog examples with different sizes and content types.

```vue
<!-- Confirmation Modal -->
<BaseModal
  v-model="showConfirm"
  title="Confirm Order"
  size="sm"
>
  <p>Are you sure you want to place this order?</p>
  
  <template #footer>
    <BaseButton variant="outline" @click="showConfirm = false">
      Cancel
    </BaseButton>
    <BaseButton @click="confirmOrder">
      Confirm
    </BaseButton>
  </template>
</BaseModal>
```

### Food-Specific Components

#### [MenuItemCard Stories](./MenuItemCard.stories.md)
Specialized card component for displaying menu items.

```vue
<MenuItemCard
  :item="{
    id: '1',
    name: 'Grilled Salmon',
    description: 'Fresh Atlantic salmon with herbs',
    price: 24.99,
    image: '/salmon.jpg',
    isPopular: true
  }"
  @add-to-cart="handleAddToCart"
/>
```

#### [CartItem Stories](./CartItem.stories.md)
Cart item component with quantity controls and pricing.

```vue
<CartItem
  :item="{
    id: '1',
    name: 'Caesar Salad',
    price: 12.99,
    quantity: 2,
    image: '/salad.jpg'
  }"
  @update-quantity="handleQuantityUpdate"
  @remove="handleRemove"
/>
```

## 🎭 Interactive Playground

### Live Component Editor
Each story includes an interactive playground where you can:

- Modify component props in real-time
- See immediate visual feedback
- Copy generated code
- Test accessibility features
- Switch between themes

### Example Playground
```vue
<template>
  <div class="story-playground">
    <!-- Controls -->
    <div class="story-controls">
      <label>
        Variant:
        <select v-model="variant">
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </label>
      
      <label>
        Size:
        <select v-model="size">
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </label>
      
      <label>
        <input v-model="disabled" type="checkbox">
        Disabled
      </label>
      
      <label>
        <input v-model="loading" type="checkbox">
        Loading
      </label>
    </div>
    
    <!-- Preview -->
    <div class="story-preview">
      <BaseButton
        :variant="variant"
        :size="size"
        :disabled="disabled"
        :loading="loading"
      >
        {{ buttonText }}
      </BaseButton>
    </div>
    
    <!-- Generated Code -->
    <div class="story-code">
      <pre><code>{{ generatedCode }}</code></pre>
    </div>
  </div>
</template>

<script setup>
const variant = ref('primary')
const size = ref('md')
const disabled = ref(false)
const loading = ref(false)
const buttonText = ref('Click me')

const generatedCode = computed(() => {
  const props = []
  
  if (variant.value !== 'primary') props.push(`variant="${variant.value}"`)
  if (size.value !== 'md') props.push(`size="${size.value}"`)
  if (disabled.value) props.push('disabled')
  if (loading.value) props.push('loading')
  
  const propsString = props.length ? ` ${props.join(' ')}` : ''
  
  return `<BaseButton${propsString}>
  ${buttonText.value}
</BaseButton>`
})
</script>
```

## 🧪 Testing Stories

### Visual Regression Testing
Stories serve as the basis for visual regression tests.

```typescript
// tests/visual/component-stories.test.ts
import { test, expect } from '@playwright/test'

test.describe('Component Stories Visual Tests', () => {
  test('BaseButton variants should match snapshots', async ({ page }) => {
    await page.goto('/stories/base-button')
    
    // Test each variant
    const variants = ['primary', 'secondary', 'outline', 'ghost']
    
    for (const variant of variants) {
      await page.selectOption('[data-testid="variant-select"]', variant)
      await expect(page.locator('[data-testid="button-preview"]')).toHaveScreenshot(`button-${variant}.png`)
    }
  })
  
  test('BaseInput states should match snapshots', async ({ page }) => {
    await page.goto('/stories/base-input')
    
    // Test different states
    await expect(page.locator('[data-testid="input-default"]')).toHaveScreenshot('input-default.png')
    await expect(page.locator('[data-testid="input-error"]')).toHaveScreenshot('input-error.png')
    await expect(page.locator('[data-testid="input-success"]')).toHaveScreenshot('input-success.png')
  })
})
```

### Accessibility Testing
Stories include accessibility tests for each component state.

```typescript
// tests/accessibility/stories.test.ts
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Story Accessibility', () => {
  test('BaseButton stories should be accessible', async () => {
    const { container } = render(BaseButtonStories)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('BaseModal stories should be accessible', async () => {
    const { container } = render(BaseModalStories)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## 📱 Responsive Stories

### Breakpoint Testing
Stories show how components behave at different screen sizes.

```vue
<template>
  <div class="responsive-story">
    <div class="breakpoint-controls">
      <button
        v-for="breakpoint in breakpoints"
        :key="breakpoint.name"
        :class="{ active: currentBreakpoint === breakpoint.name }"
        @click="setBreakpoint(breakpoint)"
      >
        {{ breakpoint.name }} ({{ breakpoint.width }}px)
      </button>
    </div>
    
    <div
      class="responsive-preview"
      :style="{ width: currentWidth + 'px' }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
const breakpoints = [
  { name: 'Mobile', width: 375 },
  { name: 'Tablet', width: 768 },
  { name: 'Desktop', width: 1024 },
  { name: 'Large', width: 1440 }
]

const currentBreakpoint = ref('Desktop')
const currentWidth = ref(1024)

const setBreakpoint = (breakpoint) => {
  currentBreakpoint.value = breakpoint.name
  currentWidth.value = breakpoint.width
}
</script>
```

## 🎨 Theme Stories

### Theme Switching
Stories demonstrate components in both light and dark themes.

```vue
<template>
  <div class="theme-story">
    <div class="theme-controls">
      <button
        :class="{ active: theme === 'light' }"
        @click="setTheme('light')"
      >
        Light Theme
      </button>
      <button
        :class="{ active: theme === 'dark' }"
        @click="setTheme('dark')"
      >
        Dark Theme
      </button>
      <button
        :class="{ active: theme === 'auto' }"
        @click="setTheme('auto')"
      >
        Auto
      </button>
    </div>
    
    <div
      class="theme-preview"
      :data-theme="theme === 'auto' ? undefined : theme"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
const theme = ref('light')

const setTheme = (newTheme) => {
  theme.value = newTheme
  
  if (newTheme === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', newTheme)
  }
}
</script>
```

## 📋 Story Guidelines

### Writing Good Stories

#### 1. Cover All States
```vue
<!-- ✅ Good: Shows all button states -->
<template>
  <div class="story-grid">
    <BaseButton variant="primary">Default</BaseButton>
    <BaseButton variant="primary" disabled>Disabled</BaseButton>
    <BaseButton variant="primary" loading>Loading</BaseButton>
    <BaseButton variant="primary" icon="plus">With Icon</BaseButton>
  </div>
</template>
```

#### 2. Use Realistic Content
```vue
<!-- ✅ Good: Realistic menu item -->
<MenuItemCard
  :item="{
    name: 'Grilled Atlantic Salmon',
    description: 'Fresh salmon fillet grilled to perfection with seasonal vegetables and lemon herb butter',
    price: 28.99,
    image: '/realistic-salmon-image.jpg'
  }"
/>

<!-- ❌ Bad: Placeholder content -->
<MenuItemCard
  :item="{
    name: 'Lorem ipsum',
    description: 'Lorem ipsum dolor sit amet',
    price: 99.99,
    image: '/placeholder.jpg'
  }"
/>
```

#### 3. Include Edge Cases
```vue
<!-- Test with very long text -->
<BaseButton>
  This is a very long button text that might wrap to multiple lines
</BaseButton>

<!-- Test with empty state -->
<BaseCard>
  <p>No items to display</p>
</BaseCard>

<!-- Test with maximum values -->
<BaseInput
  :maxlength="10"
  show-char-count
  value="1234567890"
/>
```

#### 4. Document Accessibility
```vue
<!-- Include accessibility notes -->
<template>
  <div>
    <h3>Accessibility Features</h3>
    <ul>
      <li>Keyboard navigable with Tab/Shift+Tab</li>
      <li>Activatable with Enter or Space</li>
      <li>Screen reader announces button state</li>
      <li>Focus indicator visible in high contrast mode</li>
    </ul>
    
    <BaseButton variant="primary">
      Accessible Button
    </BaseButton>
  </div>
</template>
```

## 🔗 Navigation

### Story Categories
- **Base Components**: Foundational UI elements
- **Form Components**: Input, validation, and form controls
- **Layout Components**: Cards, modals, and containers
- **Food Components**: Specialized components for food ordering
- **Patterns**: Common usage patterns and recipes

### Quick Links
- [BaseButton Stories](./BaseButton.stories.md)
- [BaseInput Stories](./BaseInput.stories.md)
- [BaseCard Stories](./BaseCard.stories.md)
- [BaseModal Stories](./BaseModal.stories.md)
- [MenuItemCard Stories](./MenuItemCard.stories.md)
- [CartItem Stories](./CartItem.stories.md)

## 🛠️ Development

### Adding New Stories
1. Create a new `.stories.md` file for the component
2. Include all variants and states
3. Add interactive controls
4. Document accessibility features
5. Include realistic content examples
6. Test in both themes
7. Verify responsive behavior

### Story Template
```vue
<template>
  <div class="component-story">
    <h1>ComponentName Stories</h1>
    
    <section class="story-section">
      <h2>Basic Usage</h2>
      <!-- Basic examples -->
    </section>
    
    <section class="story-section">
      <h2>Variants</h2>
      <!-- All variants -->
    </section>
    
    <section class="story-section">
      <h2>States</h2>
      <!-- Different states -->
    </section>
    
    <section class="story-section">
      <h2>Interactive Playground</h2>
      <!-- Interactive controls -->
    </section>
    
    <section class="story-section">
      <h2>Accessibility</h2>
      <!-- Accessibility examples -->
    </section>
  </div>
</template>
```

Stories are living documentation that evolve with the design system. They serve as the single source of truth for how components should look and behave across different contexts.