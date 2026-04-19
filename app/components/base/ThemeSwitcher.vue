<template>
  <div class="theme-switcher">
    <BaseButton
      variant="ghost"
      size="sm"
      :aria-label="themeToggleLabel"
      class="theme-switcher__button"
      @click="toggleTheme"
    >
      <BaseIcon :name="themeIcon" size="md" />
      <span v-if="showLabel" class="theme-switcher__label">
        {{ currentThemeLabel }}
      </span>
    </BaseButton>
    
    <!-- Advanced theme selector (dropdown) -->
    <div v-if="showAdvanced" class="theme-switcher__dropdown">
      <BaseButton
        v-for="option in themeOptions"
        :key="option.value"
        variant="ghost"
        size="sm"
        :class="{ 'theme-switcher__option--active': currentTheme === option.value }"
        class="theme-switcher__option"
        @click="setTheme(option.value)"
      >
        <BaseIcon :name="option.icon" size="sm" />
        <span>{{ option.label }}</span>
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showLabel?: boolean
  showAdvanced?: boolean
  variant?: 'simple' | 'advanced'
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  showAdvanced: false,
  variant: 'simple'
})

// Composables
const { currentTheme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme()

// Theme options for advanced selector
const themeOptions = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'auto', label: 'System', icon: 'monitor' }
] as const

// Computed properties
const themeIcon = computed(() => {
  if (currentTheme.value === 'auto') {
    return 'monitor'
  }
  return isDark.value ? 'sun' : 'moon'
})

const themeToggleLabel = computed(() => {
  if (currentTheme.value === 'auto') {
    return `Switch from system theme (currently ${resolvedTheme.value})`
  }
  return isDark.value ? 'Switch to light theme' : 'Switch to dark theme'
})

const currentThemeLabel = computed(() => {
  const option = themeOptions.find(opt => opt.value === currentTheme.value)
  return option?.label || 'Theme'
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;

.theme-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.theme-switcher__button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--transition-base);
  
  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.theme-switcher__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  
  @media (max-width: 640px) {
    display: none;
  }
}

.theme-switcher__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  margin-top: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 120px;
  
  // Hide by default, show with JavaScript
  display: none;
  
  &.is-open {
    display: block;
  }
}

.theme-switcher__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  text-align: left;
  font-size: var(--text-sm);
  
  &:hover {
    background: var(--bg-secondary);
  }
  
  &--active {
    background: var(--color-primary);
    color: white;
    
    &:hover {
      background: var(--color-primary-dark);
    }
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .theme-switcher__button {
    border: 1px solid transparent;
    
    &:focus {
      border-color: Highlight;
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .theme-switcher__button {
    transition: none;
  }
}

// Forced colors mode support
@media (forced-colors: active) {
  .theme-switcher__button {
    border: 1px solid ButtonText;
    
    &:hover {
      background: Highlight;
      color: HighlightText;
    }
  }
  
  .theme-switcher__dropdown {
    border: 2px solid ButtonText;
    background: ButtonFace;
  }
  
  .theme-switcher__option--active {
    background: Highlight;
    color: HighlightText;
  }
}
</style>
