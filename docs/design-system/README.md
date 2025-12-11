# Design System Documentation

Welcome to the new minimalist design system for the customer frontend application. This documentation provides comprehensive guides for using the design system components, tokens, and patterns.

## 📚 Documentation Structure

### Core Documentation
- [Design Tokens](./tokens/README.md) - Colors, spacing, typography, and other design tokens
- [Base Components](./components/README.md) - Foundational UI components
- [Layout System](./layout/README.md) - Grid, navigation, and layout components
- [Food Components](./food-components/README.md) - Specialized components for food ordering

### Guides
- [Getting Started](./guides/getting-started.md) - Quick start guide for developers
- [Migration Guide](./guides/migration-guide.md) - Migrating from the old design system
- [Accessibility Guidelines](./guides/accessibility.md) - Accessibility best practices
- [Performance Best Practices](./guides/performance.md) - Optimization guidelines

### Examples
- [Component Stories](./stories/README.md) - Interactive component examples
- [Usage Patterns](./patterns/README.md) - Common usage patterns and recipes

## 🎨 Design Principles

### Minimalism
- Clean, uncluttered interfaces
- Focus on essential functionality
- Generous white space
- Quality over quantity

### Food-First Design
- Warm, appetizing color palette
- Image-focused layouts
- Clear pricing display
- Intuitive ordering flow

### Accessibility
- WCAG AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### Performance
- Optimized CSS delivery
- Minimal bundle size
- Fast loading times
- Smooth animations

## 🚀 Quick Start

```vue
<template>
  <div>
    <!-- Use base components -->
    <BaseButton variant="primary" @click="handleClick">
      Order Now
    </BaseButton>
    
    <!-- Use design tokens -->
    <div class="custom-component">
      Content with design tokens
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/colors' as *;
@use '@/assets/scss/tokens/spacing' as *;

.custom-component {
  padding: $space-4;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
```

## 📦 Installation

The design system is already integrated into the project. To use components:

1. Import base components directly:
   ```vue
   <script setup>
   // Components are auto-imported
   </script>
   ```

2. Use design tokens in styles:
   ```scss
   @use '@/assets/scss/tokens/colors' as *;
   @use '@/assets/scss/tokens/spacing' as *;
   ```

## 🔧 Development

### File Structure
```
apps/frontend/app/
├── assets/scss/
│   ├── tokens/           # Design tokens
│   ├── base/            # Base styles
│   └── utilities/       # Utility classes
├── components/
│   ├── base/           # Base components
│   ├── layout/         # Layout components
│   ├── menu/           # Menu components
│   └── cart/           # Cart components
└── docs/design-system/ # This documentation
```

### Contributing

1. Follow the [BEM methodology](./guides/bem-guidelines.md) for CSS classes
2. Use design tokens instead of hardcoded values
3. Ensure WCAG AA accessibility compliance
4. Test components in both light and dark themes
5. Document new components with examples

## 📞 Support

For questions or issues with the design system:

1. Check the [troubleshooting guide](./guides/troubleshooting.md)
2. Review component documentation
3. Look at usage examples in the stories
4. Consult the migration guide for legacy code

## 📄 License

This design system is part of the customer frontend application and follows the same licensing terms.