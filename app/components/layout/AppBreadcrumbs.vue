<template>
  <nav class="app-breadcrumbs" :aria-label="ariaLabel">
    <ol class="app-breadcrumbs__list">
      <li
        v-for="(item, index) in breadcrumbItems"
        :key="item.path || index"
        class="app-breadcrumbs__item"
      >
        <!-- Breadcrumb link -->
        <NuxtLink
          v-if="item.path && !item.disabled && index < breadcrumbItems.length - 1"
          :to="item.path"
          class="app-breadcrumbs__link"
          :aria-current="index === breadcrumbItems.length - 1 ? 'page' : undefined"
        >
          <BaseIcon
            v-if="item.icon"
            :name="item.icon"
            size="sm"
            class="app-breadcrumbs__icon"
            :aria-hidden="true"
          />
          <span class="app-breadcrumbs__text">{{ item.label }}</span>
        </NuxtLink>
        
        <!-- Current page (no link) -->
        <span
          v-else
          class="app-breadcrumbs__current"
          :aria-current="index === breadcrumbItems.length - 1 ? 'page' : undefined"
        >
          <BaseIcon
            v-if="item.icon"
            :name="item.icon"
            size="sm"
            class="app-breadcrumbs__icon"
            :aria-hidden="true"
          />
          <span class="app-breadcrumbs__text">{{ item.label }}</span>
        </span>
        
        <!-- Separator -->
        <BaseIcon
          v-if="index < breadcrumbItems.length - 1"
          :name="separatorIcon"
          size="xs"
          class="app-breadcrumbs__separator"
          :aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface BreadcrumbItem {
  label: string
  path?: string
  icon?: string
  disabled?: boolean
}

interface Props {
  items?: BreadcrumbItem[]
  separatorIcon?: string
  ariaLabel?: string
  maxItems?: number
  showHome?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  separatorIcon: 'chevron-right',
  ariaLabel: 'Breadcrumb navigation',
  maxItems: 5,
  showHome: true
})

const route = useRoute()

// Generate breadcrumbs from route if no items provided
const routeBreadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []
  
  // Add home if enabled
  if (props.showHome) {
    breadcrumbs.push({
      label: 'Home',
      path: '/',
      icon: 'home'
    })
  }
  
  // Build breadcrumbs from path segments
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    breadcrumbs.push({
      label,
      path: index === pathSegments.length - 1 ? undefined : currentPath
    })
  })
  
  return breadcrumbs
})

// Final breadcrumb items with truncation
const breadcrumbItems = computed(() => {
  const items = props.items.length > 0 ? props.items : routeBreadcrumbs.value
  
  // Truncate if too many items
  if (items.length > props.maxItems) {
    const start = items.slice(0, 1) // Keep first item (usually home)
    const end = items.slice(-(props.maxItems - 2)) // Keep last items
    
    return [
      ...start,
      { label: '...', disabled: true },
      ...end
    ]
  }
  
  return items
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.app-breadcrumbs {
  padding: var(--space-3) 0;
  
  @include mobile-only {
    padding: var(--space-2) 0;
  }
}

.app-breadcrumbs__list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.app-breadcrumbs__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  
  // Responsive text size
  font-size: var(--text-sm);
  
  @include mobile-only {
    font-size: var(--text-xs);
  }
}

.app-breadcrumbs__link {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  min-height: 44px; // Touch target minimum
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  transition: all var(--transition-base);
  
  // Touch-friendly interaction
  @media (hover: hover) {
    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }
  
  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.app-breadcrumbs__current {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.app-breadcrumbs__text {
  // Truncate long text on mobile
  @include mobile-only {
    max-width: 120px;
    @include truncate;
  }
}

.app-breadcrumbs__icon {
  flex-shrink: 0;
  color: currentColor;
}

.app-breadcrumbs__separator {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

// Responsive behavior
@include mobile-only {
  .app-breadcrumbs__item {
    // Hide middle items on very small screens
    &:not(:first-child):not(:last-child):not(:nth-last-child(2)) {
      display: none;
    }
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .app-breadcrumbs__link {
    border: 1px solid transparent;
    
    &:focus {
      border-color: Highlight;
    }
  }
  
  .app-breadcrumbs__separator {
    color: ButtonText;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .app-breadcrumbs__link {
    transition: none;
    
    &:active {
      transform: none;
    }
  }
}

// Print styles
@media print {
  .app-breadcrumbs {
    display: none;
  }
}
</style>