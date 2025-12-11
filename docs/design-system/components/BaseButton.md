# BaseButton

The BaseButton component is the primary action element in our design system. It provides consistent styling, behavior, and accessibility features for all button interactions.

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `tag` | `'button' \| 'a' \| 'router-link' \| 'nuxt-link'` | `'button'` | HTML tag or component to render |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading state |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `icon` | `string` | `undefined` | Icon name to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |

## 🎯 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `Event` | Emitted when button is clicked |

## 🎨 Variants

### Primary
The main call-to-action button with warm orange background.

```vue
<BaseButton variant="primary">
  Order Now
</BaseButton>
```

**Use cases:**
- Primary actions (Submit, Save, Order)
- Call-to-action buttons
- Most important action on a page

### Secondary
Neutral button for secondary actions.

```vue
<BaseButton variant="secondary">
  View Details
</BaseButton>
```

**Use cases:**
- Secondary actions (Cancel, Back, Edit)
- Less important actions
- Multiple actions in a group

### Outline
Outlined button for tertiary actions.

```vue
<BaseButton variant="outline">
  Learn More
</BaseButton>
```

**Use cases:**
- Tertiary actions
- Alternative to primary when less emphasis needed
- Buttons on colored backgrounds

### Ghost
Minimal button with no background.

```vue
<BaseButton variant="ghost">
  Skip
</BaseButton>
```

**Use cases:**
- Minimal actions (Close, Skip, Dismiss)
- Navigation buttons
- Actions in tight spaces

## 📏 Sizes

### Small
Compact button for tight spaces.

```vue
<BaseButton size="sm">
  Small Button
</BaseButton>
```

**Dimensions:** 36px min-height, 12px vertical padding

### Medium (Default)
Standard button size for most use cases.

```vue
<BaseButton size="md">
  Medium Button
</BaseButton>
```

**Dimensions:** 44px min-height (touch-friendly), 12px vertical padding

### Large
Prominent button for important actions.

```vue
<BaseButton size="lg">
  Large Button
</BaseButton>
```

**Dimensions:** 52px min-height, 16px vertical padding

## 🔧 Advanced Usage

### With Icons
```vue
<template>
  <!-- Icon on the left (default) -->
  <BaseButton icon="plus" variant="primary">
    Add Item
  </BaseButton>
  
  <!-- Icon on the right -->
  <BaseButton icon="arrow-right" icon-position="right" variant="outline">
    Continue
  </BaseButton>
  
  <!-- Icon only -->
  <BaseButton icon="heart" variant="ghost" />
</template>
```

### Loading State
```vue
<template>
  <BaseButton
    :loading="isSubmitting"
    @click="handleSubmit"
  >
    {{ isSubmitting ? 'Submitting...' : 'Submit Order' }}
  </BaseButton>
</template>

<script setup>
const isSubmitting = ref(false)

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    await submitOrder()
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

### As Link
```vue
<template>
  <!-- External link -->
  <BaseButton
    tag="a"
    href="https://example.com"
    target="_blank"
    variant="outline"
  >
    External Link
  </BaseButton>
  
  <!-- Router link -->
  <BaseButton
    tag="router-link"
    to="/menu"
    variant="primary"
  >
    View Menu
  </BaseButton>
</template>
```

### Full Width
```vue
<BaseButton full-width variant="primary">
  Complete Order
</BaseButton>
```

## ♿ Accessibility Features

### Keyboard Navigation
- **Tab**: Focus the button
- **Enter/Space**: Activate the button
- **Escape**: Remove focus (when appropriate)

### ARIA Attributes
```html
<!-- Automatically applied -->
<button
  aria-disabled="true"
  aria-busy="true"
  type="button"
>
  Loading...
</button>
```

### Focus Management
- Visible focus indicators (2px outline)
- High contrast mode support
- Focus trapping in modals

### Screen Reader Support
```vue
<!-- Provide descriptive text -->
<BaseButton
  icon="trash"
  variant="ghost"
  aria-label="Delete item"
/>

<!-- Loading state announcement -->
<BaseButton
  :loading="isDeleting"
  :aria-label="isDeleting ? 'Deleting item...' : 'Delete item'"
>
  Delete
</BaseButton>
```

## 🎭 States and Interactions

### Hover Effects
- **Primary**: Lighter background, subtle lift animation
- **Secondary**: Darker background, shadow
- **Outline**: Background fill animation
- **Ghost**: Light background

### Active Effects
- Scale down animation (0.98x)
- Ripple effect on primary buttons
- Immediate visual feedback

### Disabled State
- 50% opacity
- No hover effects
- Cursor: not-allowed
- Prevents click events

### Loading State
- Spinning icon animation
- Disabled interaction
- Cursor: wait
- Maintains button dimensions

## 🎨 Customization

### Custom Styling
```vue
<template>
  <BaseButton class="custom-button" variant="primary">
    Custom Button
  </BaseButton>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.custom-button {
  // Add custom styles while preserving base functionality
  border-radius: $space-2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
```

### Theme Customization
```scss
// Override CSS custom properties for theming
.dark-theme {
  --color-primary: #FF8A5C;
  --color-primary-light: #FFB088;
  --color-primary-dark: #E55A2B;
}
```

## 🧪 Testing

### Unit Tests
```typescript
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/base/BaseButton.vue'

describe('BaseButton', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click me' }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('base-button--primary')
    expect(wrapper.classes()).toContain('base-button--md')
  })
  
  it('emits click event when not disabled or loading', async () => {
    const wrapper = mount(BaseButton)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  
  it('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeFalsy()
  })
  
  it('shows loading icon when loading', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true }
    })
    
    expect(wrapper.find('.base-button__icon--loading').exists()).toBe(true)
  })
})
```

### Property-Based Tests
```typescript
import fc from 'fast-check'

describe('BaseButton Properties', () => {
  it('should always have accessible button attributes', () => {
    fc.assert(fc.property(
      fc.record({
        variant: fc.constantFrom('primary', 'secondary', 'outline', 'ghost'),
        size: fc.constantFrom('sm', 'md', 'lg'),
        disabled: fc.boolean(),
        loading: fc.boolean()
      }),
      (props) => {
        const wrapper = mount(BaseButton, { props })
        
        // Should always have button role
        expect(wrapper.attributes('type')).toBeDefined()
        
        // Should have proper ARIA attributes when disabled/loading
        if (props.disabled || props.loading) {
          expect(wrapper.attributes('aria-disabled')).toBe('true')
        }
        
        if (props.loading) {
          expect(wrapper.attributes('aria-busy')).toBe('true')
        }
      }
    ))
  })
})
```

## 📱 Responsive Behavior

### Mobile Considerations
- Minimum 44px touch target (WCAG AA)
- Adequate spacing between buttons
- Full-width option for mobile forms

```vue
<template>
  <div class="button-group">
    <!-- Desktop: side by side -->
    <!-- Mobile: stacked full-width -->
    <BaseButton
      variant="outline"
      :full-width="isMobile"
    >
      Cancel
    </BaseButton>
    
    <BaseButton
      variant="primary"
      :full-width="isMobile"
    >
      Confirm
    </BaseButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.button-group {
  display: flex;
  gap: $space-3;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
}
</style>
```

## 🚫 Common Mistakes

### ❌ Don't Do This
```vue
<!-- Don't use multiple primary buttons -->
<BaseButton variant="primary">Save</BaseButton>
<BaseButton variant="primary">Cancel</BaseButton>

<!-- Don't use buttons for navigation -->
<BaseButton @click="$router.push('/menu')">
  View Menu
</BaseButton>

<!-- Don't hardcode styles -->
<BaseButton style="background: red; padding: 20px;">
  Bad Button
</BaseButton>
```

### ✅ Do This Instead
```vue
<!-- Use button hierarchy -->
<BaseButton variant="primary">Save</BaseButton>
<BaseButton variant="secondary">Cancel</BaseButton>

<!-- Use proper link component -->
<BaseButton tag="router-link" to="/menu" variant="primary">
  View Menu
</BaseButton>

<!-- Use props and CSS classes -->
<BaseButton variant="error" size="lg" class="custom-button">
  Good Button
</BaseButton>
```

## 🔗 Related Components

- [BaseInput](./BaseInput.md) - For form submissions
- [BaseModal](./BaseModal.md) - For modal actions
- [BaseBadge](./BaseBadge.md) - For status indicators

## 📚 Resources

- [Button Design Patterns](../patterns/buttons.md)
- [Form Patterns](../patterns/forms.md)
- [Accessibility Guidelines](../guides/accessibility.md)