# Migration Guide

This guide helps you migrate from the old design system to the new minimalist design system. Follow these steps to update your components and styles systematically.

## 🎯 Migration Overview

### What's Changing
- **Complete visual redesign**: New minimalist aesthetic with warm orange primary color
- **New component library**: All base components rebuilt from scratch
- **Updated design tokens**: New color palette, spacing scale, and typography
- **Modern SCSS architecture**: DART SASS with @use modules instead of @import
- **Enhanced accessibility**: WCAG AA compliance throughout
- **Theme system**: Built-in light/dark mode support

### Migration Timeline
1. **Phase 1**: Update design tokens and base styles
2. **Phase 2**: Migrate base components
3. **Phase 3**: Update specialized components
4. **Phase 4**: Test and refine

## 🔄 Component Migration Map

### Buttons
| Old Component | New Component | Changes |
|---------------|---------------|---------|
| `Button` | `BaseButton` | New variants, improved accessibility |
| `PrimaryButton` | `BaseButton variant="primary"` | Consolidated into single component |
| `SecondaryButton` | `BaseButton variant="secondary"` | New styling |
| `LinkButton` | `BaseButton tag="router-link"` | Use tag prop |

### Form Components
| Old Component | New Component | Changes |
|---------------|---------------|---------|
| `Input` | `BaseInput` | Floating labels, better validation |
| `Select` | `BaseSelect` | Consistent styling with BaseInput |
| `Textarea` | `BaseTextarea` | Auto-resize, character count |
| `FormField` | Use individual components | No wrapper needed |

### Layout Components
| Old Component | New Component | Changes |
|---------------|---------------|---------|
| `Card` | `BaseCard` | New elevation system, hover effects |
| `Modal` | `BaseModal` | Improved focus management |
| `Badge` | `BaseBadge` | New variants and sizes |

## 🎨 Design Token Migration

### Colors
```scss
// ❌ Old colors
$primary-color: #007bff;
$secondary-color: #6c757d;
$success-color: #28a745;

// ✅ New colors
@use '@/assets/scss/tokens/colors' as *;
// Use: $color-primary, $color-success, etc.
```

### Spacing
```scss
// ❌ Old spacing
$spacing-small: 8px;
$spacing-medium: 16px;
$spacing-large: 24px;

// ✅ New spacing scale
@use '@/assets/scss/tokens/spacing' as *;
// Use: $space-2, $space-4, $space-6, etc.
```

### Typography
```scss
// ❌ Old typography
$font-size-small: 14px;
$font-size-base: 16px;
$font-size-large: 18px;

// ✅ New typography scale
@use '@/assets/scss/tokens/typography' as *;
// Use: $text-sm, $text-base, $text-lg, etc.
```

## 🔧 Step-by-Step Migration

### Step 1: Update SCSS Architecture

#### 1.1 Replace @import with @use
```scss
// ❌ Old way
@import 'variables';
@import 'mixins';

// ✅ New way
@use '@/assets/scss/tokens/colors' as *;
@use '@/assets/scss/tokens/spacing' as *;
@use '@/assets/scss/tokens/typography' as *;
```

#### 1.2 Update Variable References
```scss
// ❌ Old variables
.component {
  color: $primary-color;
  padding: $spacing-medium;
  font-size: $font-size-base;
}

// ✅ New design tokens
.component {
  color: var(--color-primary);
  padding: $space-4;
  font-size: $text-base;
}
```

### Step 2: Migrate Components

#### 2.1 Button Migration
```vue
<!-- ❌ Old button -->
<template>
  <PrimaryButton @click="handleClick">
    Submit
  </PrimaryButton>
</template>

<!-- ✅ New button -->
<template>
  <BaseButton variant="primary" @click="handleClick">
    Submit
  </BaseButton>
</template>
```

#### 2.2 Form Migration
```vue
<!-- ❌ Old form -->
<template>
  <FormField label="Email">
    <Input
      v-model="email"
      type="email"
      :error="emailError"
    />
  </FormField>
</template>

<!-- ✅ New form -->
<template>
  <BaseInput
    v-model="email"
    type="email"
    label="Email"
    :error="emailError"
    floating-label
  />
</template>
```

#### 2.3 Card Migration
```vue
<!-- ❌ Old card -->
<template>
  <Card class="menu-item">
    <CardImage :src="item.image" />
    <CardContent>
      <h3>{{ item.name }}</h3>
      <p>{{ item.description }}</p>
    </CardContent>
  </Card>
</template>

<!-- ✅ New card -->
<template>
  <BaseCard hoverable>
    <template #image>
      <img :src="item.image" :alt="item.name" />
    </template>
    
    <h3>{{ item.name }}</h3>
    <p>{{ item.description }}</p>
  </BaseCard>
</template>
```

### Step 3: Update Styling

#### 3.1 BEM Class Migration
```scss
// ❌ Old nested BEM
.menu-item {
  &__header {
    &__title {
      font-size: 18px;
    }
  }
}

// ✅ New flat BEM
.menu-item {
  // Base styles
}

.menu-item__header {
  // Header styles
}

.menu-item__header-title {
  font-size: $text-lg;
}
```

#### 3.2 Theme Support
```scss
// ❌ Old hardcoded colors
.component {
  background: white;
  color: #333;
  border: 1px solid #ddd;
}

// ✅ New theme-aware colors
.component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

## 🧪 Testing Migration

### Component Testing
```typescript
// Update component tests for new props and behavior
describe('BaseButton Migration', () => {
  it('should work with new variant prop', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary' }
    })
    
    expect(wrapper.classes()).toContain('base-button--primary')
  })
  
  it('should maintain backward compatibility', () => {
    // Test that existing functionality still works
    const wrapper = mount(BaseButton, {
      props: { disabled: true }
    })
    
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
```

### Visual Regression Testing
```typescript
// Add visual tests to catch styling changes
describe('Visual Regression', () => {
  it('should match new design system snapshot', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Test Button' }
    })
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})
```

## 🎨 Style Migration Patterns

### Pattern 1: Color Updates
```scss
// ❌ Before
.alert {
  &.success { background: #d4edda; color: #155724; }
  &.error { background: #f8d7da; color: #721c24; }
  &.warning { background: #fff3cd; color: #856404; }
}

// ✅ After
.alert {
  padding: $space-3;
  border-radius: $radius-md;
  
  &--success {
    background: rgba(var(--color-success-rgb), 0.1);
    color: var(--color-success);
  }
  
  &--error {
    background: rgba(var(--color-error-rgb), 0.1);
    color: var(--color-error);
  }
  
  &--warning {
    background: rgba(var(--color-warning-rgb), 0.1);
    color: var(--color-warning);
  }
}
```

### Pattern 2: Spacing Updates
```scss
// ❌ Before
.card {
  padding: 20px;
  margin-bottom: 15px;
  
  .header {
    margin-bottom: 10px;
  }
}

// ✅ After
.card {
  padding: $space-5;
  margin-bottom: $space-4;
  
  .header {
    margin-bottom: $space-3;
  }
}
```

### Pattern 3: Typography Updates
```scss
// ❌ Before
.heading {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.2;
}

// ✅ After
.heading {
  font-family: var(--font-secondary);
  font-size: $text-2xl;
  font-weight: $font-semibold;
  line-height: $leading-tight;
}
```

## 🚨 Breaking Changes

### Component API Changes
1. **Button variants**: `primary`, `secondary`, `outline`, `ghost` (removed `danger`, `info`)
2. **Size props**: Standardized to `sm`, `md`, `lg` across all components
3. **Event names**: Standardized event naming (e.g., `@click` instead of `@onClick`)

### CSS Class Changes
1. **BEM structure**: Flattened nested selectors
2. **Utility classes**: New utility class naming convention
3. **Theme classes**: New theme system with CSS custom properties

### Removed Features
1. **Old color variants**: Removed non-semantic color names
2. **Legacy spacing**: Removed arbitrary spacing values
3. **Deprecated components**: Removed redundant wrapper components

## 📋 Migration Checklist

### Pre-Migration
- [ ] Audit existing components and styles
- [ ] Create migration plan with priorities
- [ ] Set up new design system files
- [ ] Update build configuration for DART SASS

### During Migration
- [ ] Update design tokens first
- [ ] Migrate components one by one
- [ ] Update tests for each component
- [ ] Test in both light and dark themes
- [ ] Verify accessibility compliance

### Post-Migration
- [ ] Remove old design system files
- [ ] Update documentation
- [ ] Train team on new patterns
- [ ] Monitor for issues in production

## 🆘 Common Issues and Solutions

### Issue 1: Import Errors
```scss
// ❌ Error: Can't find module
@import 'old-variables';

// ✅ Solution: Update to new path
@use '@/assets/scss/tokens/colors' as *;
```

### Issue 2: Missing Variables
```scss
// ❌ Error: Undefined variable $old-primary
color: $old-primary;

// ✅ Solution: Use new token
color: var(--color-primary);
```

### Issue 3: Component Not Found
```vue
<!-- ❌ Error: Component not found -->
<OldButton>Click me</OldButton>

<!-- ✅ Solution: Use new component -->
<BaseButton>Click me</BaseButton>
```

### Issue 4: Styling Conflicts
```scss
// ❌ Problem: Old styles overriding new ones
.old-component {
  background: blue !important;
}

// ✅ Solution: Remove old styles and use new system
.new-component {
  background: var(--color-primary);
}
```

## 🔗 Resources

- [Design Tokens Documentation](../tokens/README.md)
- [Component Documentation](../components/README.md)
- [Accessibility Guidelines](./accessibility.md)
- [Performance Best Practices](./performance.md)

## 💬 Getting Help

If you encounter issues during migration:

1. Check the [troubleshooting guide](./troubleshooting.md)
2. Review component documentation
3. Look at migration examples in this guide
4. Test changes in isolation before applying broadly

Remember: Migration is an iterative process. Start with high-impact, low-risk changes and gradually work through the entire system.