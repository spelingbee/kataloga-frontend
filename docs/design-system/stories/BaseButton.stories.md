# BaseButton Stories

Interactive examples and documentation for the BaseButton component, showcasing all variants, states, and usage patterns.

## 🎨 Basic Variants

### Primary Button
The main call-to-action button with warm orange background.

```vue
<BaseButton variant="primary">
  Order Now
</BaseButton>
```

**When to use:**
- Primary actions (Submit, Save, Order)
- Most important action on a page
- Call-to-action buttons

### Secondary Button
Neutral button for secondary actions.

```vue
<BaseButton variant="secondary">
  View Details
</BaseButton>
```

**When to use:**
- Secondary actions (Cancel, Back, Edit)
- Less important actions
- Multiple actions in a group

### Outline Button
Outlined button for tertiary actions.

```vue
<BaseButton variant="outline">
  Learn More
</BaseButton>
```

**When to use:**
- Tertiary actions
- Alternative to primary when less emphasis needed
- Buttons on colored backgrounds

### Ghost Button
Minimal button with no background.

```vue
<BaseButton variant="ghost">
  Skip
</BaseButton>
```

**When to use:**
- Minimal actions (Close, Skip, Dismiss)
- Navigation buttons
- Actions in tight spaces

## 📏 Size Variants

### Small
Compact button for tight spaces (36px min-height).

```vue
<div class="button-group">
  <BaseButton size="sm" variant="primary">Small Primary</BaseButton>
  <BaseButton size="sm" variant="secondary">Small Secondary</BaseButton>
  <BaseButton size="sm" variant="outline">Small Outline</BaseButton>
  <BaseButton size="sm" variant="ghost">Small Ghost</BaseButton>
</div>
```

### Medium (Default)
Standard button size for most use cases (44px min-height - touch-friendly).

```vue
<div class="button-group">
  <BaseButton size="md" variant="primary">Medium Primary</BaseButton>
  <BaseButton size="md" variant="secondary">Medium Secondary</BaseButton>
  <BaseButton size="md" variant="outline">Medium Outline</BaseButton>
  <BaseButton size="md" variant="ghost">Medium Ghost</BaseButton>
</div>
```

### Large
Prominent button for important actions (52px min-height).

```vue
<div class="button-group">
  <BaseButton size="lg" variant="primary">Large Primary</BaseButton>
  <BaseButton size="lg" variant="secondary">Large Secondary</BaseButton>
  <BaseButton size="lg" variant="outline">Large Outline</BaseButton>
  <BaseButton size="lg" variant="ghost">Large Ghost</BaseButton>
</div>
```

## 🔧 Interactive States

### Loading State
Shows spinner and prevents interaction.

```vue
<template>
  <div class="story-example">
    <BaseButton
      :loading="isLoading"
      @click="simulateLoading"
    >
      {{ isLoading ? 'Processing...' : 'Submit Order' }}
    </BaseButton>
    
    <BaseButton
      variant="outline"
      :loading="isLoading"
      @click="simulateLoading"
    >
      {{ isLoading ? 'Saving...' : 'Save Draft' }}
    </BaseButton>
  </div>
</template>

<script setup>
const isLoading = ref(false)

const simulateLoading = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  isLoading.value = false
}
</script>
```

### Disabled State
Prevents interaction and shows disabled styling.

```vue
<div class="button-group">
  <BaseButton variant="primary" disabled>Disabled Primary</BaseButton>
  <BaseButton variant="secondary" disabled>Disabled Secondary</BaseButton>
  <BaseButton variant="outline" disabled>Disabled Outline</BaseButton>
  <BaseButton variant="ghost" disabled>Disabled Ghost</BaseButton>
</div>
```

### Full Width
Expands to fill container width.

```vue
<div class="full-width-example">
  <BaseButton variant="primary" full-width>
    Complete Order
  </BaseButton>
  
  <BaseButton variant="outline" full-width>
    Continue Shopping
  </BaseButton>
</div>
```

## 🎯 With Icons

### Icon Positions
Icons can be positioned on the left (default) or right side.

```vue
<div class="icon-examples">
  <!-- Left icons (default) -->
  <BaseButton icon="plus" variant="primary">
    Add Item
  </BaseButton>
  
  <BaseButton icon="heart" variant="outline">
    Add to Favorites
  </BaseButton>
  
  <!-- Right icons -->
  <BaseButton icon="arrow-right" icon-position="right" variant="secondary">
    Continue
  </BaseButton>
  
  <BaseButton icon="external-link" icon-position="right" variant="ghost">
    Open Link
  </BaseButton>
  
  <!-- Icon only -->
  <BaseButton icon="search" variant="ghost" aria-label="Search" />
  <BaseButton icon="heart" variant="outline" aria-label="Add to favorites" />
  <BaseButton icon="share" variant="secondary" aria-label="Share" />
</div>
```

### Common Icon Combinations
Frequently used icon and text combinations.

```vue
<div class="common-icons">
  <!-- Actions -->
  <BaseButton icon="plus" variant="primary">Add</BaseButton>
  <BaseButton icon="edit" variant="secondary">Edit</BaseButton>
  <BaseButton icon="trash" variant="outline">Delete</BaseButton>
  <BaseButton icon="download" variant="ghost">Download</BaseButton>
  
  <!-- Navigation -->
  <BaseButton icon="arrow-left" variant="ghost">Back</BaseButton>
  <BaseButton icon="arrow-right" icon-position="right" variant="primary">Next</BaseButton>
  
  <!-- Social -->
  <BaseButton icon="share" variant="outline">Share</BaseButton>
  <BaseButton icon="heart" variant="ghost">Like</BaseButton>
</div>
```

## 🔗 As Links

### External Links
Using the button component as an anchor tag.

```vue
<div class="link-examples">
  <BaseButton
    tag="a"
    href="https://example.com"
    target="_blank"
    rel="noopener noreferrer"
    variant="primary"
    icon="external-link"
    icon-position="right"
  >
    Visit Website
  </BaseButton>
  
  <BaseButton
    tag="a"
    href="mailto:support@example.com"
    variant="outline"
    icon="mail"
  >
    Contact Support
  </BaseButton>
</div>
```

### Router Links
Using with Vue Router for internal navigation.

```vue
<div class="router-examples">
  <BaseButton
    tag="router-link"
    to="/menu"
    variant="primary"
  >
    View Menu
  </BaseButton>
  
  <BaseButton
    tag="router-link"
    to="/orders"
    variant="secondary"
    icon="list"
  >
    Order History
  </BaseButton>
  
  <BaseButton
    tag="nuxt-link"
    to="/profile"
    variant="ghost"
    icon="user"
  >
    Profile
  </BaseButton>
</div>
```

## 🎭 Interactive Playground

### Live Component Editor
Experiment with different props and see real-time changes.

```vue
<template>
  <div class="playground">
    <!-- Controls -->
    <div class="playground-controls">
      <div class="control-group">
        <label for="variant-select">Variant:</label>
        <select id="variant-select" v-model="playgroundProps.variant">
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="size-select">Size:</label>
        <select id="size-select" v-model="playgroundProps.size">
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="icon-select">Icon:</label>
        <select id="icon-select" v-model="playgroundProps.icon">
          <option value="">None</option>
          <option value="plus">Plus</option>
          <option value="heart">Heart</option>
          <option value="star">Star</option>
          <option value="arrow-right">Arrow Right</option>
          <option value="download">Download</option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="icon-position-select">Icon Position:</label>
        <select id="icon-position-select" v-model="playgroundProps.iconPosition">
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>
          <input v-model="playgroundProps.disabled" type="checkbox">
          Disabled
        </label>
      </div>
      
      <div class="control-group">
        <label>
          <input v-model="playgroundProps.loading" type="checkbox">
          Loading
        </label>
      </div>
      
      <div class="control-group">
        <label>
          <input v-model="playgroundProps.fullWidth" type="checkbox">
          Full Width
        </label>
      </div>
      
      <div class="control-group">
        <label for="text-input">Button Text:</label>
        <input
          id="text-input"
          v-model="buttonText"
          type="text"
          placeholder="Enter button text"
        >
      </div>
    </div>
    
    <!-- Preview -->
    <div class="playground-preview">
      <BaseButton
        :variant="playgroundProps.variant"
        :size="playgroundProps.size"
        :icon="playgroundProps.icon || undefined"
        :icon-position="playgroundProps.iconPosition"
        :disabled="playgroundProps.disabled"
        :loading="playgroundProps.loading"
        :full-width="playgroundProps.fullWidth"
        @click="handlePlaygroundClick"
      >
        {{ buttonText }}
      </BaseButton>
    </div>
    
    <!-- Generated Code -->
    <div class="playground-code">
      <h4>Generated Code:</h4>
      <pre><code>{{ generatedCode }}</code></pre>
      <BaseButton
        size="sm"
        variant="outline"
        @click="copyCode"
      >
        Copy Code
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
const playgroundProps = reactive({
  variant: 'primary',
  size: 'md',
  icon: '',
  iconPosition: 'left',
  disabled: false,
  loading: false,
  fullWidth: false
})

const buttonText = ref('Click me')

const generatedCode = computed(() => {
  const props = []
  
  if (playgroundProps.variant !== 'primary') {
    props.push(`variant="${playgroundProps.variant}"`)
  }
  
  if (playgroundProps.size !== 'md') {
    props.push(`size="${playgroundProps.size}"`)
  }
  
  if (playgroundProps.icon) {
    props.push(`icon="${playgroundProps.icon}"`)
  }
  
  if (playgroundProps.iconPosition !== 'left' && playgroundProps.icon) {
    props.push(`icon-position="${playgroundProps.iconPosition}"`)
  }
  
  if (playgroundProps.disabled) {
    props.push('disabled')
  }
  
  if (playgroundProps.loading) {
    props.push('loading')
  }
  
  if (playgroundProps.fullWidth) {
    props.push('full-width')
  }
  
  const propsString = props.length ? ` ${props.join(' ')}` : ''
  
  return `<BaseButton${propsString}>
  ${buttonText.value}
</BaseButton>`
})

const handlePlaygroundClick = () => {
  console.log('Playground button clicked!')
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    console.log('Code copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;
@use '@/assets/scss/tokens/colors' as *;

.playground {
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  padding: $space-6;
  margin: $space-4 0;
}

.playground-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $space-4;
  margin-bottom: $space-6;
  padding-bottom: $space-4;
  border-bottom: 1px solid var(--border-primary);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  
  label {
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }
  
  select,
  input[type="text"] {
    padding: $space-2;
    border: 1px solid var(--border-primary);
    border-radius: $radius-sm;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  
  input[type="checkbox"] {
    margin-right: $space-2;
  }
}

.playground-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  padding: $space-6;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  margin-bottom: $space-4;
}

.playground-code {
  background: var(--bg-tertiary);
  padding: $space-4;
  border-radius: $radius-md;
  
  h4 {
    margin: 0 0 $space-2 0;
    color: var(--text-primary);
  }
  
  pre {
    background: var(--bg-primary);
    padding: $space-3;
    border-radius: $radius-sm;
    overflow-x: auto;
    margin-bottom: $space-3;
    
    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      color: var(--text-primary);
    }
  }
}
</style>
```

## ♿ Accessibility Examples

### Keyboard Navigation
All buttons are keyboard accessible and provide proper focus indicators.

```vue
<template>
  <div class="accessibility-demo">
    <h4>Try navigating with Tab/Shift+Tab:</h4>
    
    <div class="keyboard-nav-example">
      <BaseButton variant="primary">First Button</BaseButton>
      <BaseButton variant="secondary">Second Button</BaseButton>
      <BaseButton variant="outline">Third Button</BaseButton>
      <BaseButton variant="ghost">Fourth Button</BaseButton>
    </div>
    
    <p class="accessibility-note">
      <strong>Keyboard shortcuts:</strong>
      <br>• Tab: Move to next button
      <br>• Shift+Tab: Move to previous button
      <br>• Enter/Space: Activate button
    </p>
  </div>
</template>
```

### Screen Reader Support
Buttons provide appropriate labels and state information for screen readers.

```vue
<div class="screen-reader-examples">
  <!-- Icon-only buttons need aria-label -->
  <BaseButton
    icon="heart"
    variant="ghost"
    aria-label="Add to favorites"
  />
  
  <!-- Loading state is announced -->
  <BaseButton
    :loading="isLoading"
    :aria-label="isLoading ? 'Processing order...' : 'Place order'"
  >
    {{ isLoading ? 'Processing...' : 'Place Order' }}
  </BaseButton>
  
  <!-- Disabled state is announced -->
  <BaseButton
    disabled
    aria-label="Submit form (disabled - please fill required fields)"
  >
    Submit
  </BaseButton>
</div>
```

### High Contrast Mode
Buttons maintain visibility and usability in high contrast mode.

```vue
<template>
  <div class="high-contrast-demo">
    <h4>High Contrast Mode Support:</h4>
    
    <div class="contrast-buttons">
      <BaseButton variant="primary">Primary</BaseButton>
      <BaseButton variant="secondary">Secondary</BaseButton>
      <BaseButton variant="outline">Outline</BaseButton>
      <BaseButton variant="ghost">Ghost</BaseButton>
    </div>
    
    <p class="accessibility-note">
      These buttons automatically adapt to high contrast mode using CSS forced-colors media query.
    </p>
  </div>
</template>

<style scoped>
/* Simulate high contrast mode for demo */
@media (forced-colors: active) {
  .contrast-buttons .base-button {
    border: 1px solid ButtonText !important;
    background: ButtonFace !important;
    color: ButtonText !important;
  }
}
</style>
```

## 📱 Responsive Behavior

### Mobile Optimization
Buttons adapt to mobile devices with appropriate touch targets.

```vue
<template>
  <div class="responsive-demo">
    <h4>Mobile-Optimized Buttons:</h4>
    
    <!-- Mobile: Full-width buttons -->
    <div class="mobile-buttons">
      <BaseButton variant="primary" full-width>
        Primary Action
      </BaseButton>
      
      <BaseButton variant="outline" full-width>
        Secondary Action
      </BaseButton>
    </div>
    
    <!-- Desktop: Side-by-side buttons -->
    <div class="desktop-buttons">
      <BaseButton variant="outline">Cancel</BaseButton>
      <BaseButton variant="primary">Confirm</BaseButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.mobile-buttons {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-4;
  
  @media (min-width: 640px) {
    display: none;
  }
}

.desktop-buttons {
  display: none;
  gap: $space-3;
  
  @media (min-width: 640px) {
    display: flex;
  }
}
</style>
```

## 🎨 Theme Variations

### Light and Dark Themes
Buttons automatically adapt to the current theme.

```vue
<template>
  <div class="theme-demo">
    <div class="theme-controls">
      <BaseButton
        size="sm"
        variant="outline"
        :class="{ active: currentTheme === 'light' }"
        @click="setTheme('light')"
      >
        Light
      </BaseButton>
      
      <BaseButton
        size="sm"
        variant="outline"
        :class="{ active: currentTheme === 'dark' }"
        @click="setTheme('dark')"
      >
        Dark
      </BaseButton>
    </div>
    
    <div class="theme-preview" :data-theme="currentTheme">
      <BaseButton variant="primary">Primary Button</BaseButton>
      <BaseButton variant="secondary">Secondary Button</BaseButton>
      <BaseButton variant="outline">Outline Button</BaseButton>
      <BaseButton variant="ghost">Ghost Button</BaseButton>
    </div>
  </div>
</template>

<script setup>
const currentTheme = ref('light')

const setTheme = (theme) => {
  currentTheme.value = theme
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/tokens/spacing' as *;

.theme-controls {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-4;
  
  .active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
}

.theme-preview {
  display: flex;
  gap: $space-3;
  padding: $space-4;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  
  &[data-theme="dark"] {
    --bg-primary: #111827;
    --bg-secondary: #1F2937;
    --text-primary: #F9FAFB;
    --border-primary: #374151;
  }
}
</style>
```

## 🧪 Testing Examples

### Unit Test Cases
Examples of how the BaseButton component should be tested.

```typescript
// Example test cases for BaseButton
describe('BaseButton', () => {
  it('renders with correct variant class', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Test Button' }
    })
    
    expect(wrapper.classes()).toContain('base-button--primary')
    expect(wrapper.text()).toBe('Test Button')
  })
  
  it('emits click event when clicked', async () => {
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
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })
})
```

## 📋 Usage Guidelines

### Do's ✅
- Use primary buttons for the most important action
- Provide clear, action-oriented labels
- Use icons to enhance understanding
- Ensure adequate spacing between buttons
- Test with keyboard navigation
- Provide aria-labels for icon-only buttons

### Don'ts ❌
- Don't use multiple primary buttons in the same context
- Don't use buttons for navigation (use links instead)
- Don't make buttons too small for touch devices
- Don't rely solely on color to convey meaning
- Don't use vague labels like "Click here"

### Best Practices
1. **Button Hierarchy**: Use only one primary button per section
2. **Clear Labels**: Use action verbs that describe what will happen
3. **Consistent Sizing**: Stick to the three size variants (sm, md, lg)
4. **Accessible Colors**: All variants meet WCAG AA contrast requirements
5. **Touch Targets**: Minimum 44px height for mobile accessibility

## 🔗 Related Components

- [BaseInput](./BaseInput.stories.md) - For form submissions
- [BaseModal](./BaseModal.stories.md) - For modal actions
- [BaseCard](./BaseCard.stories.md) - For card-based interactions

---

*This story serves as both documentation and a testing ground for the BaseButton component. Use the interactive playground to experiment with different configurations and copy the generated code for your own implementations.*