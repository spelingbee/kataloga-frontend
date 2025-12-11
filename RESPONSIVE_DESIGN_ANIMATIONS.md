# Responsive Design and Animations Implementation

This document describes the responsive design and animation system implemented for the customer frontend ordering application.

## Overview

The application now features a comprehensive responsive design system with smooth animations, touch-friendly interactions, and optimized layouts for mobile, tablet, and desktop devices.

## Features Implemented

### 1. Responsive Design System

#### SCSS Utilities
- **Responsive Utilities** (`utilities/_responsive.scss`)
  - Display utilities (hide/show on different breakpoints)
  - Responsive containers with fluid and fixed widths
  - Responsive grid system
  - Responsive flex layouts
  - Responsive spacing (padding/margin)
  - Responsive typography
  - Touch-friendly utilities
  - Safe area insets for notched devices

#### Breakpoints
```scss
$breakpoint-sm: 640px;   // Mobile
$breakpoint-md: 768px;   // Tablet
$breakpoint-lg: 1024px;  // Desktop
$breakpoint-xl: 1280px;  // Large Desktop
$breakpoint-2xl: 1536px; // XL Desktop
```

#### Mixins
- `@mixin mobile-only` - Styles for mobile only
- `@mixin tablet-up` - Styles for tablet and up
- `@mixin desktop-up` - Styles for desktop and up
- `@mixin breakpoint($size)` - Custom breakpoint
- `@mixin breakpoint-down($size)` - Max-width breakpoint

### 2. Animation System

#### Animation Utilities (`utilities/_animations.scss`)
- Fade animations (in, out, up, down)
- Slide animations (up, down, left, right)
- Scale animations (in, out)
- Loading animations (shimmer, spin, pulse, bounce)
- Interactive animations (shake, hover effects)
- Stagger animations for lists
- Skeleton loading states

#### Animation Mixins (`abstracts/_animations.scss`)
- `@mixin fade-in($duration, $delay)`
- `@mixin slide-in-up($duration, $delay)`
- `@mixin hover-lift` - Lift effect on hover
- `@mixin hover-scale($scale)` - Scale effect on hover
- `@mixin hover-glow($color)` - Glow effect on hover
- `@mixin shimmer($duration)` - Shimmer loading effect
- `@mixin skeleton-loading` - Skeleton loader effect

### 3. Composables

#### useResponsive
Provides reactive breakpoint detection and device information.

```typescript
const {
  isMobile,
  isTablet,
  isDesktop,
  isTouch,
  isRetina,
  prefersReducedMotion,
  currentBreakpoint,
  deviceInfo,
} = useResponsive()
```

**Features:**
- Reactive window dimensions
- Breakpoint detection
- Device capability detection (touch, retina)
- Orientation detection (portrait/landscape)
- Reduced motion preference detection

#### useAnimations
Manages animations and transitions throughout the app.

```typescript
const {
  animationsEnabled,
  triggerAnimation,
  staggerAnimation,
  shakeElement,
  pulseElement,
  bounceElement,
  pageTransition,
  modalTransition,
} = useAnimations()
```

**Features:**
- Programmatic animation triggering
- Stagger animations for lists
- Feedback animations (shake, pulse, bounce)
- Pre-configured transitions for common UI elements
- Respects reduced motion preferences

#### useTouchInteractions
Provides touch-friendly gesture detection and haptic feedback.

```typescript
const {
  useSwipe,
  useLongPress,
  usePullToRefresh,
  lightHaptic,
  mediumHaptic,
  heavyHaptic,
  successHaptic,
  errorHaptic,
} = useTouchInteractions()
```

**Features:**
- Swipe gesture detection (left, right, up, down)
- Long press detection
- Pull-to-refresh gesture
- Haptic feedback patterns
- Touch-friendly event handling

### 4. Reusable Components

#### LoadingSpinner
A customizable loading spinner component.

```vue
<LoadingSpinner size="md" color="primary" />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'secondary' | 'white'
- `label`: Accessibility label

#### SkeletonLoader
A skeleton loading placeholder component.

```vue
<SkeletonLoader variant="card" width="100%" height="200px" />
```

**Props:**
- `variant`: 'text' | 'card' | 'image' | 'circle' | 'button' | 'title'
- `width`: Custom width
- `height`: Custom height
- `size`: 'sm' | 'md' | 'lg'

#### ResponsiveImage
An optimized image component with lazy loading and skeleton states.

```vue
<ResponsiveImage
  src="/path/to/image.jpg"
  alt="Description"
  preset="dish"
  loading="lazy"
/>
```

**Props:**
- `src`: Image source
- `alt`: Alt text
- `preset`: 'thumb' | 'dish' | 'dishLarge' | 'category' | 'hero' | 'avatar'
- `loading`: 'lazy' | 'eager'

#### ResponsiveContainer
A responsive container with configurable padding and max-width.

```vue
<ResponsiveContainer padding="responsive" maxWidth="xl">
  <slot />
</ResponsiveContainer>
```

**Props:**
- `fluid`: Full width container
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'responsive'
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

#### ResponsiveGrid
A responsive grid layout component.

```vue
<ResponsiveGrid
  :cols="{ mobile: 1, tablet: 2, desktop: 3 }"
  gap="md"
>
  <slot />
</ResponsiveGrid>
```

**Props:**
- `cols`: Number or object with mobile/tablet/desktop values
- `gap`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `alignItems`: 'start' | 'center' | 'end' | 'stretch'
- `justifyItems`: 'start' | 'center' | 'end' | 'stretch'

### 5. Enhanced App Root

The `app.vue` has been enhanced with:
- Page transitions
- Responsive meta tags
- Device detection classes on body
- Touch device optimizations
- Reduced motion support

**Body Classes:**
- `.is-mobile` - Applied on mobile devices
- `.is-tablet` - Applied on tablet devices
- `.is-desktop` - Applied on desktop devices
- `.is-touch` - Applied on touch-capable devices
- `.prefers-reduced-motion` - Applied when user prefers reduced motion

### 6. Touch-Friendly Enhancements

#### BaseButton Component
Enhanced with:
- Touch target sizing (minimum 44x44px)
- Haptic feedback on tap
- Active state animations
- Smooth transitions

#### Touch Utilities
- `.touch-target` - Ensures minimum touch target size
- `.touch-target-lg` - Larger touch target (56x56px)
- `.no-tap-highlight` - Removes tap highlight
- `.active-scale` - Scale down on active state

### 7. Performance Optimizations

#### Image Optimization
- Lazy loading by default
- WebP format with fallbacks
- Responsive image presets
- Automatic srcset generation
- Skeleton loading states

#### Animation Performance
- GPU-accelerated transforms
- Will-change hints for animated properties
- Reduced motion support
- Debounced resize handlers

#### Touch Device Optimizations
- Disabled hover effects on touch devices
- Enabled active states for touch feedback
- Smooth scrolling with momentum
- Optimized tap highlight removal

## Usage Examples

### Responsive Layout

```vue
<template>
  <ResponsiveContainer padding="responsive" maxWidth="xl">
    <ResponsiveGrid :cols="{ mobile: 1, tablet: 2, desktop: 3 }" gap="lg">
      <div v-for="item in items" :key="item.id">
        <ResponsiveImage
          :src="item.image"
          :alt="item.name"
          preset="dish"
        />
        <h3>{{ item.name }}</h3>
      </div>
    </ResponsiveGrid>
  </ResponsiveContainer>
</template>
```

### Animated List

```vue
<template>
  <div class="stagger-children">
    <div v-for="item in items" :key="item.id" class="fade-in-up">
      {{ item.name }}
    </div>
  </div>
</template>
```

### Touch Gestures

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useTouchInteractions } from '~/composables/useTouchInteractions'

const container = ref(null)
const { useSwipe, lightHaptic } = useTouchInteractions()

onMounted(() => {
  useSwipe(container.value, {
    onSwipeLeft: () => {
      lightHaptic()
      // Handle swipe left
    },
    onSwipeRight: () => {
      lightHaptic()
      // Handle swipe right
    },
  })
})
</script>

<template>
  <div ref="container">
    Swipeable content
  </div>
</template>
```

### Responsive Behavior

```vue
<script setup>
import { useResponsive } from '~/composables/useResponsive'

const { isMobile, isDesktop, currentBreakpoint } = useResponsive()
</script>

<template>
  <div>
    <MobileMenu v-if="isMobile" />
    <DesktopMenu v-else />
    
    <p>Current breakpoint: {{ currentBreakpoint }}</p>
  </div>
</template>
```

## Accessibility

### Reduced Motion Support
The system automatically detects and respects the user's reduced motion preference:
- Animations are disabled or minimized
- Transitions are instant
- Scroll behavior is set to auto

### Touch Targets
All interactive elements meet WCAG 2.1 Level AA requirements:
- Minimum touch target size: 44x44px
- Adequate spacing between targets
- Visual feedback on interaction

### Keyboard Navigation
All interactive components support keyboard navigation:
- Focus indicators
- Tab order
- Enter/Space activation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome 80+
- Progressive enhancement for older browsers

## Performance Metrics

Target metrics:
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1
- First Input Delay (FID) < 100ms

## Future Enhancements

- [ ] Add more animation presets
- [ ] Implement gesture-based navigation
- [ ] Add more responsive utility classes
- [ ] Create animation playground/documentation
- [ ] Add performance monitoring
- [ ] Implement adaptive loading based on connection speed
