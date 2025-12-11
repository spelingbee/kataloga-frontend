# Accessibility Guidelines

Our design system is built with accessibility as a core principle. This guide provides comprehensive guidelines for creating inclusive experiences that work for all users.

## 🎯 Accessibility Standards

### WCAG 2.1 AA Compliance
We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:

- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable by all users
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

### Legal Requirements
- **ADA Compliance**: Americans with Disabilities Act
- **Section 508**: US Federal accessibility requirements
- **EN 301 549**: European accessibility standard

## 🎨 Visual Accessibility

### Color Contrast
All color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

#### Contrast Ratios
```scss
// ✅ WCAG AA Compliant colors
$color-primary: #B8571A;     // 4.5:1 on white
$color-success: #047857;     // 4.5:1 on white
$color-warning: #B45309;     // 4.5:1 on white
$color-error: #DC2626;       // 4.83:1 on white
$color-info: #2563EB;        // 5.17:1 on white
```

#### Testing Contrast
```vue
<template>
  <div class="contrast-example">
    <!-- ✅ Good contrast -->
    <p class="good-contrast">This text has sufficient contrast</p>
    
    <!-- ❌ Poor contrast -->
    <p class="poor-contrast">This text has insufficient contrast</p>
  </div>
</template>

<style scoped lang="scss">
.good-contrast {
  color: var(--text-primary);     // High contrast
  background: var(--bg-primary);
}

.poor-contrast {
  color: #ccc;                    // Low contrast - avoid
  background: white;
}
</style>
```

### Color Independence
Never rely solely on color to convey information.

```vue
<template>
  <!-- ❌ Color only -->
  <span class="error-text">Error message</span>
  
  <!-- ✅ Color + icon + text -->
  <span class="error-message">
    <BaseIcon name="alert-circle" />
    <span class="sr-only">Error:</span>
    Error message
  </span>
</template>
```

### Focus Indicators
All interactive elements have visible focus indicators.

```scss
.focusable-element {
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: $radius-sm;
  }
}

// High contrast mode support
@media (forced-colors: active) {
  .focusable-element:focus-visible {
    outline: 2px solid ButtonText;
  }
}
```

## ⌨️ Keyboard Navigation

### Tab Order
Ensure logical tab order through interactive elements.

```vue
<template>
  <form>
    <!-- Tab order: 1 → 2 → 3 → 4 -->
    <BaseInput label="Name" />           <!-- 1 -->
    <BaseInput label="Email" />          <!-- 2 -->
    <BaseButton variant="outline">      <!-- 3 -->
      Cancel
    </BaseButton>
    <BaseButton type="submit">          <!-- 4 -->
      Submit
    </BaseButton>
  </form>
</template>
```

### Keyboard Shortcuts
Standard keyboard interactions for common patterns.

| Element | Key | Action |
|---------|-----|--------|
| Button | Enter, Space | Activate |
| Link | Enter | Navigate |
| Modal | Escape | Close |
| Menu | Arrow keys | Navigate |
| Tabs | Arrow keys | Switch tabs |

### Focus Management
```vue
<template>
  <BaseModal v-model="showModal" @opened="handleModalOpened">
    <BaseInput ref="firstInput" label="Name" />
    <BaseButton @click="closeModal">Close</BaseButton>
  </BaseModal>
</template>

<script setup>
const firstInput = ref()
const showModal = ref(false)

const handleModalOpened = () => {
  // Focus first input when modal opens
  nextTick(() => {
    firstInput.value?.focus()
  })
}

const closeModal = () => {
  showModal.value = false
  // Focus returns to trigger element automatically
}
</script>
```

## 🔊 Screen Reader Support

### Semantic HTML
Use proper HTML elements for their intended purpose.

```vue
<template>
  <!-- ✅ Semantic structure -->
  <main>
    <h1>Menu</h1>
    <nav aria-label="Menu categories">
      <ul>
        <li><a href="#appetizers">Appetizers</a></li>
        <li><a href="#mains">Main Courses</a></li>
      </ul>
    </nav>
    
    <section id="appetizers">
      <h2>Appetizers</h2>
      <article>
        <h3>Caesar Salad</h3>
        <p>Fresh romaine lettuce...</p>
      </article>
    </section>
  </main>
</template>
```

### ARIA Attributes
Enhance semantics with ARIA when HTML isn't sufficient.

```vue
<template>
  <!-- Form with ARIA -->
  <form @submit.prevent="handleSubmit">
    <BaseInput
      v-model="email"
      label="Email"
      type="email"
      :error="emailError"
      :aria-describedby="emailError ? 'email-error' : undefined"
      aria-required="true"
    />
    
    <div
      v-if="emailError"
      id="email-error"
      role="alert"
      class="error-message"
    >
      {{ emailError }}
    </div>
    
    <BaseButton
      type="submit"
      :loading="isSubmitting"
      :aria-label="isSubmitting ? 'Submitting form...' : 'Submit form'"
    >
      Submit
    </BaseButton>
  </form>
</template>
```

### Live Regions
Announce dynamic content changes.

```vue
<template>
  <div>
    <BaseButton @click="addToCart">
      Add to Cart
    </BaseButton>
    
    <!-- Announces cart updates -->
    <div
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ cartMessage }}
    </div>
  </div>
</template>

<script setup>
const cartMessage = ref('')

const addToCart = () => {
  // Add item logic...
  cartMessage.value = 'Item added to cart. Cart now has 3 items.'
  
  // Clear message after announcement
  setTimeout(() => {
    cartMessage.value = ''
  }, 1000)
}
</script>
```

### Screen Reader Only Content
Provide additional context for screen readers.

```scss
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```vue
<template>
  <BaseButton icon="heart" variant="ghost">
    <span class="sr-only">Add to favorites</span>
  </BaseButton>
</template>
```

## 📱 Touch and Mobile Accessibility

### Touch Targets
Minimum 44x44px touch targets (WCAG AA).

```scss
.touch-target {
  min-width: 44px;
  min-height: 44px;
  
  // Ensure adequate spacing between targets
  margin: $space-1;
}
```

### Gesture Support
Provide alternatives to complex gestures.

```vue
<template>
  <div class="swipeable-card">
    <!-- Swipe gesture with button alternatives -->
    <div class="card-content">
      <h3>{{ item.name }}</h3>
      <p>{{ item.description }}</p>
    </div>
    
    <!-- Alternative buttons for swipe actions -->
    <div class="card-actions">
      <BaseButton
        size="sm"
        variant="ghost"
        icon="heart"
        @click="addToFavorites"
      >
        <span class="sr-only">Add to favorites</span>
      </BaseButton>
      
      <BaseButton
        size="sm"
        variant="ghost"
        icon="share"
        @click="shareItem"
      >
        <span class="sr-only">Share item</span>
      </BaseButton>
    </div>
  </div>
</template>
```

## 🎭 Motion and Animation

### Reduced Motion
Respect user preferences for reduced motion.

```scss
// Default animations
.animated-element {
  transition: transform $transition-base $ease-out;
  
  &:hover {
    transform: translateY(-2px);
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: none;
    
    &:hover {
      transform: none;
    }
  }
}
```

### Safe Animations
Avoid animations that could trigger vestibular disorders.

```scss
// ✅ Safe animations
.safe-animation {
  transition: opacity $transition-base;
  // Fade in/out is generally safe
}

// ❌ Potentially problematic
.problematic-animation {
  animation: spin 1s linear infinite;
  // Continuous spinning can cause issues
}
```

## 🔧 Component Accessibility Patterns

### Form Components
```vue
<template>
  <fieldset>
    <legend>Personal Information</legend>
    
    <BaseInput
      v-model="firstName"
      label="First Name"
      required
      :error="firstNameError"
      autocomplete="given-name"
    />
    
    <BaseInput
      v-model="lastName"
      label="Last Name"
      required
      :error="lastNameError"
      autocomplete="family-name"
    />
    
    <BaseSelect
      v-model="country"
      label="Country"
      :options="countries"
      required
      autocomplete="country"
    />
  </fieldset>
</template>
```

### Modal Dialogs
```vue
<template>
  <BaseModal
    v-model="showModal"
    title="Confirm Order"
    role="alertdialog"
    aria-describedby="modal-description"
  >
    <p id="modal-description">
      Are you sure you want to place this order for ${{ total }}?
    </p>
    
    <template #footer>
      <BaseButton
        variant="outline"
        @click="showModal = false"
      >
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        @click="confirmOrder"
      >
        Confirm Order
      </BaseButton>
    </template>
  </BaseModal>
</template>
```

### Data Tables
```vue
<template>
  <table role="table" aria-label="Order history">
    <caption class="sr-only">
      Your recent orders with dates, items, and totals
    </caption>
    
    <thead>
      <tr>
        <th scope="col">Date</th>
        <th scope="col">Items</th>
        <th scope="col">Total</th>
        <th scope="col">Actions</th>
      </tr>
    </thead>
    
    <tbody>
      <tr v-for="order in orders" :key="order.id">
        <td>{{ formatDate(order.date) }}</td>
        <td>{{ order.itemCount }} items</td>
        <td>${{ order.total }}</td>
        <td>
          <BaseButton
            size="sm"
            variant="outline"
            :aria-label="`View details for order ${order.id}`"
          >
            View
          </BaseButton>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

## 🧪 Testing Accessibility

### Automated Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Component Accessibility', () => {
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

### Manual Testing Checklist
- [ ] Tab through all interactive elements
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify keyboard shortcuts work
- [ ] Check color contrast ratios
- [ ] Test with high contrast mode
- [ ] Verify focus indicators are visible
- [ ] Test with zoom up to 200%
- [ ] Check reduced motion preferences

### Testing Tools
- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Accessibility audit
- **Color Oracle**: Color blindness simulator
- **Screen readers**: NVDA (free), JAWS, VoiceOver

## 📋 Accessibility Checklist

### Design Phase
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets are at least 44x44px
- [ ] Focus indicators are clearly visible
- [ ] Information isn't conveyed by color alone
- [ ] Text is readable at 200% zoom

### Development Phase
- [ ] Semantic HTML structure
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Form labels and descriptions
- [ ] ARIA attributes where needed
- [ ] Keyboard navigation support
- [ ] Focus management in dynamic content

### Testing Phase
- [ ] Automated accessibility tests pass
- [ ] Manual keyboard testing
- [ ] Screen reader testing
- [ ] High contrast mode testing
- [ ] Reduced motion testing
- [ ] Mobile accessibility testing

## 🚫 Common Accessibility Mistakes

### ❌ Don't Do This
```vue
<!-- Missing alt text -->
<img src="food.jpg">

<!-- Non-semantic button -->
<div @click="handleClick">Click me</div>

<!-- Color-only error indication -->
<input class="error">

<!-- Missing form labels -->
<input type="email" placeholder="Email">

<!-- Inaccessible modal -->
<div class="modal" v-if="showModal">
  <div @click="closeModal">×</div>
</div>
```

### ✅ Do This Instead
```vue
<!-- Descriptive alt text -->
<img src="food.jpg" alt="Grilled salmon with vegetables">

<!-- Semantic button -->
<BaseButton @click="handleClick">Click me</BaseButton>

<!-- Multiple error indicators -->
<BaseInput
  :error="emailError"
  aria-invalid="true"
  class="input-error"
/>

<!-- Proper form labels -->
<BaseInput
  type="email"
  label="Email Address"
  required
/>

<!-- Accessible modal -->
<BaseModal
  v-model="showModal"
  title="Modal Title"
  @close="closeModal"
>
  Content here
</BaseModal>
```

## 🔗 Resources

### Guidelines and Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA (Free)](https://www.nvaccess.org/)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS/iOS)](https://support.apple.com/guide/voiceover/)

Remember: Accessibility is not a checklist item—it's an ongoing commitment to inclusive design that benefits all users.