<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useI18n } from 'vue-i18n'
import { useTenant } from '~/composables/useTenant'

const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()
const { tPath } = useTenant()

const menuItems = computed(() => [
  { path: '/', label: t('menu.title'), icon: 'menu-book' },
  { path: '/orders', label: t('profile.orders'), icon: 'receipt' },
])

const isActive = (path: string) => {
  const dynamicPath = tPath(path)
  if (path === '/') {
    return route.path === dynamicPath || route.path === dynamicPath + '/'
  }
  return route.path.startsWith(dynamicPath)
}
</script>

<template>
  <nav class="app-navbar">
    <div class="app-navbar__header">
      <NuxtLink :to="tPath('/')" class="app-navbar__logo">
        <BaseIcon name="restaurant" size="lg" class="app-navbar__logo-icon" />
        <span class="app-navbar__logo-text">Kataloga</span>
      </NuxtLink>
    </div>

    <div class="app-navbar__menu">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.path"
        :to="tPath(item.path)"
        class="app-navbar__item"
        :class="{ 'app-navbar__item--active': isActive(item.path) }"
      >
        <BaseIcon :name="item.icon" size="md" class="app-navbar__item-icon" />
        <span class="app-navbar__item-text">{{ item.label }}</span>
      </NuxtLink>
    </div>

    <div class="app-navbar__footer">
      <NuxtLink v-if="userStore.isAuthenticated" :to="tPath('/profile')" class="app-navbar__item">
        <BaseIcon name="user" size="md" class="app-navbar__item-icon" />
        <span class="app-navbar__item-text">{{ $t('profile.title') }}</span>
      </NuxtLink>
      <NuxtLink v-else to="/auth/login" class="app-navbar__item">
        <BaseIcon name="user" size="md" class="app-navbar__item-icon" />
        <span class="app-navbar__item-text">{{ $t('auth.login.submit') }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style lang="scss" scoped>


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
