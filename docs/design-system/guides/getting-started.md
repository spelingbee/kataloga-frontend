# Getting Started

Welcome to the new minimalist design system! This guide will help you get up and running quickly with our design tokens, components, and patterns.

## 🚀 Quick Start

### 1. Basic Component Usage
Components are auto-imported and ready to use:

```vue
<template>
  <div>
    <!-- Use base components directly -->
    <BaseButton variant="primary" @click="handleOrder">
      Order Now
    </BaseButton>
    
    <BaseCard hoverable>
      <h3>Grilled Salmon</h3>
      <p>Fresh Atlantic salmon with seasonal vegetables</p>
    </BaseCard>
  </div>
</template>

<script setup>
const handleOrder = () => {
  console.log('Order placed!')
}
</script>
```

### 2. Using Design Tokens
Import and use design tokens in your styles:

```vue
<template>
  <div class="custom-component">
    <h2 class="title">Welcome</h2>
    <p class="description">Discover our delicious menu</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/colors' as *;
@use '@/assets/scss/tokens/spacing' as *;
@use '@/assets/scss/tokens/typography' as *;

.custom-component {
  padding: $space-6;
  background-color: var(--bg-primary);
  border-radius: $radius-lg;
}

.title {
  font-family: var(--font-secondary);
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-3;
}

.description {
  font-size: $text-base;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
}
</style>
```

## 📦 What's Included

### Base Components
Ready-to-use foundational components:

- **BaseButton** - Primary action component with multiple variants
- **BaseInput** - Text input with floating labels and validation
- **BaseSelect** - Dropdown selection with consistent styling
- **BaseTextarea** - Multi-line text input with auto-resize
- **BaseCard** - Container component with elevation and hover effects
- **BaseModal** - Accessible modal dialog with focus management
- **BaseBadge** - Status indicators and labels

### Design Tokens
Consistent design values:

- **Colors** - Primary, semantic, and neutral color palettes
- **Spacing** - 4px-based spacing scale
- **Typography** - Font families, sizes, weights, and line heights
- **Shadows** - Elevation and depth effects
- **Radius** - Border radius values
- **Transitions** - Animation timing and easing

### Layout System
Responsive layout components:

- **ResponsiveGrid** - CSS Grid-based layout system
- **AppNavigation** - Navigation components with icon support
- **AppBreadcrumbs** - Breadcrumb navigation
- **TouchOptimizedContainer** - Mobile-optimized containers

## 🎨 Design Principles

### Minimalism
Our design system embraces minimalism:

```vue
<template>
  <!-- ✅ Clean, focused design -->
  <BaseCard>
    <template #image>
      <img src="/salmon.jpg" alt="Grilled salmon" />
    </template>
    
    <h3>Grilled Salmon</h3>
    <p>$24.99</p>
    
    <BaseButton variant="primary">Add to Cart</BaseButton>
  </BaseCard>
</template>
```

**Key principles:**
- Generous white space
- Focus on essential content
- Quality over quantity
- Clean, uncluttered interfaces

### Food-First Design
Optimized for food ordering experiences:

```vue
<template>
  <div class="menu-item">
    <!-- Large, appetizing images -->
    <img 
      src="/food-image.jpg" 
      alt="Delicious food"
      class="menu-item__image"
    />
    
    <!-- Clear pricing -->
    <div class="menu-item__info">
      <h3 class="menu-item__name">{{ item.name }}</h3>
      <p class="menu-item__price">${{ item.price }}</p>
    </div>
    
    <!-- Prominent add button -->
    <BaseButton variant="primary" size="sm">
      Add to Cart
    </BaseButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;
@use '@/assets/scss/tokens/typography' as *;

.menu-item__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: $radius-lg;
}

.menu-item__info {
  padding: $space-4;
}

.menu-item__name {
  font-size: $text-lg;
  font-weight: $font-semibold;
  margin-bottom: $space-2;
}

.menu-item__price {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--color-primary);
}
</style>
```

## 🎯 Common Patterns

### Form Pattern
Standard form layout with validation:

```vue
<template>
  <form @submit.prevent="handleSubmit" class="form">
    <div class="form__section">
      <h2 class="form__title">Contact Information</h2>
      
      <BaseInput
        v-model="form.name"
        label="Full Name"
        :error="errors.name"
        required
      />
      
      <BaseInput
        v-model="form.email"
        label="Email"
        type="email"
        :error="errors.email"
        required
      />
      
      <BaseInput
        v-model="form.phone"
        label="Phone Number"
        type="tel"
        :error="errors.phone"
      />
    </div>
    
    <div class="form__actions">
      <BaseButton variant="outline" type="button" @click="handleCancel">
        Cancel
      </BaseButton>
      <BaseButton variant="primary" type="submit" :loading="isSubmitting">
        Submit
      </BaseButton>
    </div>
  </form>
</template>

<script setup>
const form = reactive({
  name: '',
  email: '',
  phone: ''
})

const errors = reactive({})
const isSubmitting = ref(false)

const handleSubmit = async () => {
  // Validation and submission logic
}

const handleCancel = () => {
  // Cancel logic
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.form {
  max-width: 500px;
  margin: 0 auto;
}

.form__section {
  margin-bottom: $space-8;
}

.form__title {
  margin-bottom: $space-6;
}

.form__actions {
  display: flex;
  gap: $space-3;
  justify-content: flex-end;
}
</style>
```

### Card Grid Pattern
Responsive grid layout for menu items:

```vue
<template>
  <div class="menu-grid">
    <BaseCard
      v-for="item in menuItems"
      :key="item.id"
      hoverable
      class="menu-card"
      @click="selectItem(item)"
    >
      <template #image>
        <img 
          :src="item.image" 
          :alt="item.name"
          class="menu-card__image"
        />
        <BaseBadge
          v-if="item.isPopular"
          variant="primary"
          class="menu-card__badge"
        >
          Popular
        </BaseBadge>
      </template>
      
      <div class="menu-card__content">
        <h3 class="menu-card__name">{{ item.name }}</h3>
        <p class="menu-card__description">{{ item.description }}</p>
        
        <div class="menu-card__footer">
          <span class="menu-card__price">${{ item.price }}</span>
          <BaseButton size="sm" variant="primary">
            Add to Cart
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;
@use '@/assets/scss/tokens/typography' as *;

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $space-6;
  padding: $space-4;
}

.menu-card {
  position: relative;
}

.menu-card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.menu-card__badge {
  position: absolute;
  top: $space-2;
  right: $space-2;
}

.menu-card__content {
  padding: $space-4;
}

.menu-card__name {
  font-size: $text-lg;
  font-weight: $font-semibold;
  margin-bottom: $space-2;
}

.menu-card__description {
  color: var(--text-secondary);
  margin-bottom: $space-4;
  line-height: $leading-relaxed;
}

.menu-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-card__price {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--color-primary);
}
</style>
```

### Modal Pattern
Accessible modal with proper focus management:

```vue
<template>
  <div>
    <BaseButton @click="showModal = true">
      Open Modal
    </BaseButton>
    
    <BaseModal
      v-model="showModal"
      title="Confirm Your Order"
      size="md"
    >
      <div class="modal-content">
        <p>Are you sure you want to place this order for <strong>${{ total }}</strong>?</p>
        
        <div class="order-summary">
          <div v-for="item in orderItems" :key="item.id" class="order-item">
            <span>{{ item.name }} × {{ item.quantity }}</span>
            <span>${{ item.total }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <BaseButton variant="outline" @click="showModal = false">
          Cancel
        </BaseButton>
        <BaseButton variant="primary" @click="confirmOrder">
          Confirm Order
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
const showModal = ref(false)
const total = ref(45.99)
const orderItems = ref([
  { id: 1, name: 'Grilled Salmon', quantity: 1, total: 24.99 },
  { id: 2, name: 'Caesar Salad', quantity: 2, total: 21.00 }
])

const confirmOrder = () => {
  // Order confirmation logic
  showModal.value = false
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.modal-content {
  margin-bottom: $space-4;
}

.order-summary {
  background: var(--bg-secondary);
  padding: $space-4;
  border-radius: $radius-md;
  margin-top: $space-4;
}

.order-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-2;
  
  &:last-child {
    margin-bottom: 0;
  }
}
</style>
```

## 🌙 Theme Support

### Automatic Theme Detection
The design system automatically detects and applies the user's preferred theme:

```vue
<template>
  <div class="theme-aware-component">
    <h2>This component adapts to light/dark theme</h2>
    <p>Colors automatically switch based on user preference</p>
    
    <BaseButton variant="primary">Primary Button</BaseButton>
    <BaseButton variant="secondary">Secondary Button</BaseButton>
  </div>
</template>

<style scoped lang="scss">
.theme-aware-component {
  padding: $space-6;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  
  // Automatically adapts to light/dark theme
  // No additional CSS needed!
}
</style>
```

### Manual Theme Control
You can also provide manual theme switching:

```vue
<template>
  <div>
    <div class="theme-switcher">
      <BaseButton
        size="sm"
        variant="ghost"
        icon="sun"
        @click="setTheme('light')"
      >
        Light
      </BaseButton>
      
      <BaseButton
        size="sm"
        variant="ghost"
        icon="moon"
        @click="setTheme('dark')"
      >
        Dark
      </BaseButton>
      
      <BaseButton
        size="sm"
        variant="ghost"
        icon="monitor"
        @click="setTheme('auto')"
      >
        Auto
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
const setTheme = (theme) => {
  if (theme === 'auto') {
    localStorage.removeItem('theme')
    document.documentElement.removeAttribute('data-theme')
  } else {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }
}
</script>
```

## 📱 Responsive Design

### Mobile-First Approach
All components are designed mobile-first:

```vue
<template>
  <div class="responsive-layout">
    <!-- Mobile: Stacked layout -->
    <!-- Desktop: Side-by-side layout -->
    <div class="content-section">
      <h2>Menu Categories</h2>
      <div class="category-grid">
        <BaseCard v-for="category in categories" :key="category.id">
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.responsive-layout {
  padding: $space-4;
  
  @media (min-width: 768px) {
    padding: $space-6;
  }
  
  @media (min-width: 1024px) {
    padding: $space-8;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
```

## ♿ Accessibility

### Built-in Accessibility
All components include accessibility features by default:

```vue
<template>
  <div>
    <!-- Automatic ARIA attributes -->
    <BaseButton
      :loading="isLoading"
      :aria-label="isLoading ? 'Processing...' : 'Submit form'"
    >
      {{ isLoading ? 'Processing...' : 'Submit' }}
    </BaseButton>
    
    <!-- Proper form labeling -->
    <BaseInput
      v-model="email"
      label="Email Address"
      type="email"
      required
      :error="emailError"
    />
    
    <!-- Keyboard navigation -->
    <BaseModal v-model="showModal" title="Settings">
      <!-- Focus automatically managed -->
      <BaseInput label="Name" />
      <BaseButton>Save</BaseButton>
    </BaseModal>
  </div>
</template>
```

### Accessibility Checklist
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ High contrast mode support
- ✅ Focus management
- ✅ WCAG AA color contrast
- ✅ Touch-friendly targets (44px minimum)

## 🧪 Testing

### Component Testing
Test components using the provided utilities:

```typescript
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/base/BaseButton.vue'

describe('BaseButton', () => {
  it('renders correctly', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Click me' }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('base-button--primary')
  })
})
```

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should be accessible', async () => {
  const wrapper = mount(BaseButton, {
    slots: { default: 'Accessible button' }
  })
  
  const results = await axe(wrapper.html())
  expect(results).toHaveNoViolations()
})
```

## 📚 Next Steps

### Learn More
- [Design Tokens](../tokens/README.md) - Deep dive into design tokens
- [Component Documentation](../components/README.md) - Detailed component guides
- [Accessibility Guidelines](./accessibility.md) - Comprehensive accessibility guide
- [Performance Best Practices](./performance.md) - Optimization techniques

### Explore Examples
- [Component Stories](../stories/README.md) - Interactive component examples
- [Usage Patterns](../patterns/README.md) - Common patterns and recipes

### Migration
- [Migration Guide](./migration-guide.md) - Migrate from the old design system

## 🆘 Getting Help

### Common Issues
1. **Components not found**: Ensure components are properly auto-imported
2. **Styles not applying**: Check SCSS import paths
3. **Theme not working**: Verify CSS custom properties are supported
4. **Accessibility issues**: Review accessibility guidelines

### Resources
- Component documentation for detailed API reference
- Interactive stories for visual examples
- Migration guide for updating existing code
- Performance guide for optimization tips

---

*Welcome to the new design system! Start building beautiful, accessible, and performant food ordering experiences. 🍽️*