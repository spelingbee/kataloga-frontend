<template>
  <nav class="app-navbar">
    <div class="app-navbar__header">
      <NuxtLink to="/" class="app-navbar__logo">
        <BaseIcon name="restaurant" size="lg" class="app-navbar__logo-icon" />
        <span class="app-navbar__logo-text">Menu</span>
      </NuxtLink>
    </div>

    <div class="app-navbar__menu">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="app-navbar__item"
        :class="{ 'app-navbar__item--active': isActive(item.path) }"
      >
        <BaseIcon :name="item.icon" size="md" class="app-navbar__item-icon" />
        <span class="app-navbar__item-text">{{ item.label }}</span>
      </NuxtLink>
    </div>

    <div class="app-navbar__footer">
      <NuxtLink to="/favourites" class="app-navbar__item">
        <BaseIcon name="heart" size="md" class="app-navbar__item-icon" />
        <span class="app-navbar__item-text">Favourites</span>
      </NuxtLink>
      
      <NuxtLink to="/auth/login" class="app-navbar__item">
        <BaseIcon name="user" size="md" class="app-navbar__item-icon" />
        <span class="app-navbar__item-text">Account</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const menuItems = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/menu', label: 'Menu', icon: 'book-open' },
  { path: '/orders', label: 'Orders', icon: 'receipt' },
  { path: '/map', label: 'Locations', icon: 'map' },
  { path: '/promotions', label: 'Promotions', icon: 'tag' },
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;

.app-navbar {
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100vh;
  background-color: $color-background-sidebar;
  border-right: 1px solid $color-border-subtle;
  position: fixed;
  left: 0;
  top: 0;
  z-index: $z-index-fixed;
  overflow-y: auto;

  &__header {
    padding: $space-8 $space-6;
    border-bottom: 1px solid $color-border-subtle;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: $space-4;
    text-decoration: none;
    color: $color-neutral-20;
    transition: color $transition-normal;

    &:hover {
      color: var(--color-success);
    }
  }

  &__logo-icon {
    color: var(--color-success);
  }

  &__logo-text {
    font-size: $font-size-heading-lg;
    font-weight: $font-bold;
  }

  &__menu {
    flex: 1;
    padding: $space-6 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-4 $space-6;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all $transition-normal;
    border-left: 3px solid transparent;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: $color-neutral-20;
    }

    &--active {
      background-color: rgba(32, 171, 71, 0.1);
      color: var(--color-success);
      border-left-color: var(--color-success);
    }
  }

  &__item-icon {
    flex-shrink: 0;
  }

  &__item-text {
    font-size: $font-size-body-md;
    font-weight: $font-medium;
  }

  &__footer {
    padding: $space-6 0;
    border-top: 1px solid $color-border-subtle;
  }
}

// Hide on mobile, show on desktop
@media (max-width: 1024px) {
  .app-navbar {
    display: none;
  }
}
</style>
