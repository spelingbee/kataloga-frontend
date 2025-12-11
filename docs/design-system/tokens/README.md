# Design Tokens

Design tokens are the foundational elements of our design system. They ensure consistency across all components and provide a single source of truth for design decisions.

## 🎨 Color Tokens

### Primary Colors
Our primary color palette uses a warm orange that's perfect for the food industry while maintaining WCAG AA accessibility standards.

```scss
// Primary palette
$color-primary: #B8571A;        // Main brand color (4.5:1 contrast)
$color-primary-light: #D2691E;  // Hover states
$color-primary-dark: #A04D17;   // Active states
```

**Usage:**
```scss
.button-primary {
  background-color: var(--color-primary);
  
  &:hover {
    background-color: var(--color-primary-light);
  }
  
  &:active {
    background-color: var(--color-primary-dark);
  }
}
```

### Semantic Colors
Semantic colors convey meaning and state information.

```scss
$color-success: #047857;  // Success states (4.5:1 contrast)
$color-warning: #B45309;  // Warning states (4.5:1 contrast)
$color-error: #DC2626;    // Error states (4.83:1 contrast)
$color-info: #2563EB;     // Info states (5.17:1 contrast)
```

### Neutral Colors
A complete grayscale palette for text, backgrounds, and borders.

```scss
$color-neutral-50: #F9FAFB;   // Lightest
$color-neutral-100: #F3F4F6;
$color-neutral-200: #E5E7EB;
$color-neutral-300: #D1D5DB;
$color-neutral-400: #9CA3AF;
$color-neutral-500: #6B7280;
$color-neutral-600: #4B5563;
$color-neutral-700: #374151;
$color-neutral-800: #1F2937;
$color-neutral-900: #111827;   // Darkest
```

### Semantic Aliases
Semantic color aliases make it easier to understand color usage.

```scss
// Backgrounds
$bg-primary: white;
$bg-secondary: $color-neutral-50;
$bg-tertiary: $color-neutral-100;

// Text
$text-primary: $color-neutral-900;
$text-secondary: $color-neutral-600;
$text-tertiary: $color-neutral-400;

// Borders
$border-primary: $color-neutral-200;
$border-secondary: $color-neutral-300;
```

## 📏 Spacing Tokens

### Spacing Scale
Our spacing system is based on a 4px (0.25rem) increment for consistency.

```scss
$space-1: 0.25rem;    // 4px
$space-2: 0.5rem;     // 8px
$space-3: 0.75rem;    // 12px
$space-4: 1rem;       // 16px
$space-5: 1.25rem;    // 20px
$space-6: 1.5rem;     // 24px
$space-8: 2rem;       // 32px
$space-10: 2.5rem;    // 40px
$space-12: 3rem;      // 48px
$space-16: 4rem;      // 64px
$space-20: 5rem;      // 80px
```

### Semantic Spacing
Semantic spacing tokens for common use cases.

```scss
$spacing-xs: $space-1;    // 4px
$spacing-sm: $space-2;    // 8px
$spacing-md: $space-4;    // 16px
$spacing-lg: $space-6;    // 24px
$spacing-xl: $space-8;    // 32px
$spacing-2xl: $space-12;  // 48px
```

### Component Spacing
Pre-defined spacing for specific components.

```scss
$card-padding: $space-6;           // 24px
$button-padding-x: $space-4;       // 16px
$button-padding-y: $space-3;       // 12px
$input-padding: $space-3;          // 12px
$modal-padding: $space-8;          // 32px
$section-spacing: $space-16;       // 64px
$touch-target-min: 44px;           // Accessibility minimum
```

## 🔤 Typography Tokens

### Font Families
```scss
$font-primary: 'Inter', system-ui, sans-serif;    // Body text
$font-secondary: 'Poppins', system-ui, sans-serif; // Headings
```

### Font Sizes
Consistent scale from 12px to 36px.

```scss
$text-xs: 0.75rem;      // 12px
$text-sm: 0.875rem;     // 14px
$text-base: 1rem;       // 16px
$text-lg: 1.125rem;     // 18px
$text-xl: 1.25rem;      // 20px
$text-2xl: 1.5rem;      // 24px
$text-3xl: 1.875rem;    // 30px
$text-4xl: 2.25rem;     // 36px
```

### Font Weights
```scss
$font-light: 300;
$font-regular: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

### Line Heights
```scss
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.75;
```

## 🎭 Other Tokens

### Border Radius
```scss
$radius-sm: 0.25rem;    // 4px
$radius-md: 0.5rem;     // 8px
$radius-lg: 0.75rem;    // 12px
$radius-full: 9999px;   // Fully rounded
```

### Shadows
```scss
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### Transitions
```scss
$transition-fast: 150ms ease-in-out;
$transition-base: 200ms ease-in-out;
$transition-slow: 300ms ease-in-out;
```

## 🌙 Theme Support

All tokens support both light and dark themes through CSS custom properties:

```scss
:root {
  --color-primary: #{$color-primary};
  --bg-primary: #{$bg-primary};
  --text-primary: #{$text-primary};
}

[data-theme="dark"] {
  --bg-primary: #{$color-neutral-900};
  --text-primary: #{$color-neutral-50};
}
```

## 📱 Usage Examples

### Basic Usage
```scss
@use '@/assets/scss/tokens/colors' as *;
@use '@/assets/scss/tokens/spacing' as *;

.my-component {
  padding: $space-4;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-radius: $radius-md;
}
```

### Responsive Usage
```scss
.responsive-component {
  padding: $space-2;
  
  @media (min-width: 768px) {
    padding: $space-4;
  }
  
  @media (min-width: 1024px) {
    padding: $space-6;
  }
}
```

### Theme-Aware Usage
```scss
.theme-aware-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  
  // Will automatically adapt to light/dark theme
}
```

## ✅ Best Practices

1. **Always use tokens**: Never hardcode values like colors or spacing
2. **Use CSS custom properties**: For runtime theme switching
3. **Semantic naming**: Use semantic aliases when possible
4. **Consistent spacing**: Stick to the spacing scale
5. **Accessible colors**: Ensure proper contrast ratios
6. **Test both themes**: Verify components work in light and dark modes

## 🚫 Don't Do This

```scss
// ❌ Don't hardcode values
.bad-component {
  padding: 16px;
  color: #333;
  background: #fff;
}

// ❌ Don't use arbitrary values
.bad-spacing {
  margin: 13px; // Not on our scale
}
```

## ✅ Do This Instead

```scss
// ✅ Use design tokens
.good-component {
  padding: $space-4;
  color: var(--text-primary);
  background: var(--bg-primary);
}

// ✅ Use scale values
.good-spacing {
  margin: $space-3; // On our scale
}
```