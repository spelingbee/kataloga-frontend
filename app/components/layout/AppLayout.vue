<template>
  <div class="app-layout" :class="layoutClasses">
    <!-- Skip links for accessibility -->
    <SkipLinks />
    
    <!-- Header -->
    <header v-if="showHeader" class="app-layout__header">
      <ResponsiveContainer>
        <div class="app-layout__header-content">
          <!-- Logo/Brand -->
          <NuxtLink to="/" class="app-layout__brand">
            <BaseIcon name="restaurant" size="lg" />
            <span class="app-layout__brand-text">{{ brandName }}</span>
          </NuxtLink>
          
          <!-- Desktop Navigation -->
          <AppNavigation 
            v-if="showDesktopNav"
            variant="horizontal" 
            class="app-layout__desktop-nav"
          />
          
          <!-- Header Actions -->
          <div class="app-layout__header-actions">
            <slot name="header-actions">
              <!-- Language Switcher -->
              <LanguageSwitcher v-if="showLanguageSwitcher" />
              
              <!-- Theme Toggle -->
              <BaseButton
                v-if="showThemeToggle"
                variant="ghost"
                size="sm"
                :aria-label="themeToggleLabel"
                @click="toggleTheme"
              >
                <BaseIcon :name="themeIcon" size="md" />
              </BaseButton>
              
              <!-- Cart Button -->
              <NuxtLink 
                v-if="showCartButton"
                to="/cart" 
                class="app-layout__cart-button"
                :aria-label="`Cart with ${cartItemCount} items`"
              >
                <BaseIcon name="shopping-cart" size="md" />
                <BaseBadge 
                  v-if="cartItemCount > 0"
                  :count="cartItemCount"
                  size="sm"
                  class="app-layout__cart-badge"
                />
              </NuxtLink>
            </slot>
          </div>
        </div>
      </ResponsiveContainer>
    </header>
    
    <!-- Breadcrumbs -->
    <div v-if="showBreadcrumbs" class="app-layout__breadcrumbs">
      <ResponsiveContainer>
        <AppBreadcrumbs :items="breadcrumbItems" />
      </ResponsiveContainer>
    </div>
    
    <!-- Main Content Area -->
    <main :id="mainId" class="app-layout__main">
      <TouchOptimizedContainer
        :touch-target="touchTargetSize"
        :swipe-enabled="swipeEnabled"
        :haptic-feedback="hapticFeedback"
        class="app-layout__content"
      >
        <slot />
      </TouchOptimizedContainer>
    </main>
    
    <!-- Sidebar Navigation (Tablet/Desktop) -->
    <aside v-if="showSidebar" class="app-layout__sidebar">
      <AppNavigation variant="sidebar" />
    </aside>
    
    <!-- Mobile Bottom Navigation -->
    <AppNavigation 
      v-if="showMobileNav"
      variant="bottom" 
      class="app-layout__mobile-nav"
    />
    
    <!-- Footer -->
    <footer v-if="showFooter" class="app-layout__footer">
      <ResponsiveContainer>
        <slot name="footer">
          <div class="app-layout__footer-content">
            <p class="app-layout__footer-text">
              © {{ currentYear }} {{ brandName }}. All rights reserved.
            </p>
          </div>
        </slot>
      </ResponsiveContainer>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {useCartStore} from '~/stores/cart'
import LanguageSwitcher from '../base/LanguageSwitcher.vue'
import AppNavigation from './AppNavigation.vue'

interface BreadcrumbItem {
  label: string
  path?: string
  icon?: string
}

interface Props {
  variant?: 'default' | 'sidebar' | 'minimal'
  showHeader?: boolean
  showFooter?: boolean
  showBreadcrumbs?: boolean
  showMobileNav?: boolean
  showDesktopNav?: boolean
  showSidebar?: boolean
  showLanguageSwitcher?: boolean
  showThemeToggle?: boolean
  showCartButton?: boolean
  brandName?: string
  breadcrumbItems?: BreadcrumbItem[]
  touchTargetSize?: 'small' | 'medium' | 'large'
  swipeEnabled?: boolean
  hapticFeedback?: boolean
  mainId?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showHeader: true,
  showFooter: false,
  showBreadcrumbs: false,
  showMobileNav: true,
  showDesktopNav: true,
  showSidebar: false,
  showLanguageSwitcher: true,
  showThemeToggle: true,
  showCartButton: true,
  brandName: 'Restaurant',
  breadcrumbItems: () => [],
  touchTargetSize: 'medium',
  swipeEnabled: false,
  hapticFeedback: true,
  mainId: 'main-content'
})

// Composables
const { isDark, toggle: toggleTheme } = useTheme()
const cartStore = useCartStore()

// Computed properties
const layoutClasses = computed(() => [
  `app-layout--${props.variant}`,
  {
    'app-layout--with-sidebar': props.showSidebar,
    'app-layout--with-mobile-nav': props.showMobileNav,
    'app-layout--minimal': props.variant === 'minimal'
  }
])

const cartItemCount = computed(() => cartStore.itemCount)

const currentYear = computed(() => new Date().getFullYear())

const themeIcon = computed(() => isDark.value ? 'sun' : 'moon')

const themeToggleLabel = computed(() => 
  isDark.value ? 'Switch to light theme' : 'Switch to dark theme'
)
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  
  // Layout variants
  &--default {
    // Standard layout with header and mobile nav
  }
  
  &--sidebar {
    @include desktop-up {
      display: grid;
      grid-template-columns: 240px 1fr;
      grid-template-areas: 
        "sidebar header"
        "sidebar breadcrumbs"
        "sidebar main"
        "sidebar footer";
    }
  }
  
  &--minimal {
    .app-layout__header {
      border-bottom: none;
      box-shadow: none;
    }
  }
  
  &--with-mobile-nav {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
    
    @include tablet-up {
      padding-bottom: 0;
    }
  }
}

// Header
.app-layout__header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  backdrop-filter: blur(8px);
  
  .app-layout--sidebar & {
    @include desktop-up {
      grid-area: header;
      margin-left: 240px;
    }
  }
}

.app-layout__header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
  min-height: 64px;
  
  @include mobile-only {
    padding: var(--space-3) 0;
    min-height: 56px;
  }
}

.app-layout__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  color: var(--text-primary);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  
  &:hover {
    color: var(--color-primary);
  }
}

.app-layout__brand-text {
  @include mobile-only {
    display: none;
  }
}

.app-layout__desktop-nav {
  @include mobile-only {
    display: none;
  }
}

.app-layout__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-layout__cart-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-secondary);
  transition: all var(--transition-base);
  
  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

.app-layout__cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}

// Breadcrumbs
.app-layout__breadcrumbs {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  
  .app-layout--sidebar & {
    @include desktop-up {
      grid-area: breadcrumbs;
      margin-left: 240px;
    }
  }
}

// Main Content
.app-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  .app-layout--sidebar & {
    @include desktop-up {
      grid-area: main;
      margin-left: 240px;
    }
  }
}

.app-layout__content {
  flex: 1;
  width: 100%;
}

// Sidebar
.app-layout__sidebar {
  @include mobile-only {
    display: none;
  }
  
  @include desktop-up {
    position: fixed;
    top: 0;
    left: 0;
    width: 240px;
    height: 100vh;
    background: var(--bg-primary);
    border-right: 1px solid var(--border-primary);
    z-index: 30;
    grid-area: sidebar;
  }
}

// Mobile Navigation
.app-layout__mobile-nav {
  @include tablet-up {
    display: none;
  }
}

// Footer
.app-layout__footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  margin-top: auto;
  
  .app-layout--sidebar & {
    @include desktop-up {
      grid-area: footer;
      margin-left: 240px;
    }
  }
}

.app-layout__footer-content {
  padding: var(--space-8) 0;
  text-align: center;
}

.app-layout__footer-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

// Responsive adjustments
@media (max-width: 320px) {
  .app-layout__header-content {
    padding: var(--space-2) 0;
    min-height: 48px;
  }
  
  .app-layout__header-actions {
    gap: var(--space-2);
  }
}

@media (min-width: 1920px) {
  .app-layout {
    max-width: 1920px;
    margin: 0 auto;
  }
}

// High contrast mode support
@media (prefers-contrast: more) {
  .app-layout__header {
    border-bottom-width: 2px;
  }
  
  .app-layout__brand,
  .app-layout__cart-button {
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
  .app-layout__header {
    backdrop-filter: none;
  }
  
  .app-layout__brand,
  .app-layout__cart-button {
    transition: none;
  }
}

// Print styles
@media print {
  .app-layout__header,
  .app-layout__mobile-nav,
  .app-layout__sidebar {
    display: none;
  }
  
  .app-layout {
    padding-bottom: 0;
  }
}
</style>