# Base Components

Base components are the foundational building blocks of our design system. They provide consistent styling, behavior, and accessibility features across the application.

## 🧱 Available Components

### Form Components
- [BaseButton](./BaseButton.md) - Primary action component with multiple variants
- [BaseInput](./BaseInput.md) - Text input with floating labels and validation
- [BaseSelect](./BaseSelect.md) - Dropdown selection with consistent styling
- [BaseTextarea](./BaseTextarea.md) - Multi-line text input with auto-resize

### Layout Components
- [BaseCard](./BaseCard.md) - Container component with elevation and hover effects
- [BaseModal](./BaseModal.md) - Accessible modal dialog with focus management

### Feedback Components
- [BaseBadge](./BaseBadge.md) - Status indicators and labels

## 🎨 Design Principles

### Consistency
All base components follow the same design patterns:
- Consistent sizing system (sm, md, lg)
- Unified color variants (primary, secondary, etc.)
- Standardized spacing and typography
- Shared animation and transition timing

### Accessibility
Every component includes:
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast mode support

### Flexibility
Components are designed to be:
- Easily customizable through props
- Extensible with slots
- Theme-aware (light/dark mode)
- Responsive by default

## 🚀 Quick Start

### Import and Use
Components are auto-imported and ready to use:

```vue
<template>
  <div>
    <BaseButton variant="primary" @click="handleClick">
      Click me
    </BaseButton>
    
    <BaseCard hoverable>
      <h3>Card Title</h3>
      <p>Card content goes here.</p>
    </BaseCard>
  </div>
</template>

<script setup>
const handleClick = () => {
  console.log('Button clicked!')
}
</script>
```

### Common Props Pattern
Most components follow this prop pattern:

```typescript
interface BaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}
```

## 📋 Component Checklist

When creating or updating components, ensure they meet these criteria:

### ✅ Functionality
- [ ] Implements all required props
- [ ] Emits appropriate events
- [ ] Handles edge cases gracefully
- [ ] Works with v-model when applicable

### ✅ Styling
- [ ] Uses design tokens exclusively
- [ ] Follows BEM methodology
- [ ] Supports all size variants
- [ ] Includes hover/focus/active states
- [ ] Works in both light and dark themes

### ✅ Accessibility
- [ ] Includes proper ARIA attributes
- [ ] Supports keyboard navigation
- [ ] Has visible focus indicators
- [ ] Works with screen readers
- [ ] Meets WCAG AA standards

### ✅ Performance
- [ ] Uses CSS transforms for animations
- [ ] Respects prefers-reduced-motion
- [ ] Minimal DOM manipulation
- [ ] Efficient re-rendering

## 🎯 Usage Patterns

### Form Validation
```vue
<template>
  <form @submit.prevent="handleSubmit">
    <BaseInput
      v-model="email"
      type="email"
      label="Email"
      :error="emailError"
      required
    />
    
    <BaseButton
      type="submit"
      :loading="isSubmitting"
      :disabled="!isValid"
    >
      Submit
    </BaseButton>
  </form>
</template>
```

### Modal with Form
```vue
<template>
  <BaseModal
    v-model="showModal"
    title="Edit Profile"
    size="md"
  >
    <form @submit.prevent="saveProfile">
      <BaseInput
        v-model="profile.name"
        label="Name"
        required
      />
      
      <BaseTextarea
        v-model="profile.bio"
        label="Bio"
        :maxlength="500"
        show-char-count
      />
    </form>
    
    <template #footer>
      <BaseButton variant="outline" @click="showModal = false">
        Cancel
      </BaseButton>
      <BaseButton @click="saveProfile">
        Save
      </BaseButton>
    </template>
  </BaseModal>
</template>
```

### Card Grid
```vue
<template>
  <div class="card-grid">
    <BaseCard
      v-for="item in items"
      :key="item.id"
      hoverable
      @click="selectItem(item)"
    >
      <template #image>
        <img :src="item.image" :alt="item.name" />
      </template>
      
      <h3>{{ item.name }}</h3>
      <p>{{ item.description }}</p>
      
      <template #footer>
        <BaseBadge
          v-if="item.isPopular"
          variant="primary"
        >
          Popular
        </BaseBadge>
        <span class="price">${{ item.price }}</span>
      </template>
    </BaseCard>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $space-6;
}

.price {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
</style>
```

## 🔧 Customization

### Extending Components
You can extend base components for specific use cases:

```vue
<!-- MenuItemCard.vue -->
<template>
  <BaseCard
    class="menu-item-card"
    hoverable
    @click="$emit('add-to-cart', item)"
  >
    <template #image>
      <img
        :src="item.image"
        :alt="item.name"
        class="menu-item-card__image"
      />
      <BaseBadge
        v-if="item.isPopular"
        class="menu-item-card__badge"
        variant="primary"
      >
        Popular
      </BaseBadge>
    </template>
    
    <div class="menu-item-card__content">
      <h3 class="menu-item-card__name">{{ item.name }}</h3>
      <p class="menu-item-card__description">{{ item.description }}</p>
      <div class="menu-item-card__footer">
        <span class="menu-item-card__price">${{ item.price }}</span>
        <BaseButton size="sm" variant="primary">
          Add to Cart
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;
@use '@/assets/scss/tokens/typography' as *;

.menu-item-card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.menu-item-card__badge {
  position: absolute;
  top: $space-2;
  right: $space-2;
}

.menu-item-card__content {
  padding: $space-4;
}

.menu-item-card__name {
  font-size: $text-lg;
  font-weight: $font-semibold;
  margin-bottom: $space-2;
}

.menu-item-card__description {
  color: var(--text-secondary);
  margin-bottom: $space-4;
}

.menu-item-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-item-card__price {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--color-primary);
}
</style>
```

## 🧪 Testing Components

### Unit Testing
```typescript
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/base/BaseButton.vue'

describe('BaseButton', () => {
  it('renders with correct variant class', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary' }
    })
    
    expect(wrapper.classes()).toContain('base-button--primary')
  })
  
  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
  })
  
  it('is disabled when loading', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true }
    })
    
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })
})
```

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('BaseButton Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Click me' }
    })
    
    const results = await axe(wrapper.html())
    expect(results).toHaveNoViolations()
  })
})
```

## 📚 Further Reading

- [Individual Component Documentation](./BaseButton.md)
- [Accessibility Guidelines](../guides/accessibility.md)
- [Performance Best Practices](../guides/performance.md)
- [Migration Guide](../guides/migration-guide.md)