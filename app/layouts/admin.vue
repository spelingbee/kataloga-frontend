<template>
  <div class="layout-screen u-bg-gray-50">
    <!-- Admin Header -->
    <header class="admin-header">
      <div class="layout-container">
        <div class="admin-header__content">
          <!-- Logo and Title -->
          <div class="admin-header__brand">
            <img 
              v-if="tenantBranding?.logo" 
              :src="tenantBranding.logo" 
              :alt="tenantBranding.appName || 'Admin Panel'"
              class="admin-header__logo"
            />
            <h1 class="admin-header__title">
              {{ tenantBranding?.appName || 'Admin Panel' }}
            </h1>
            
            <!-- Tenant Indicator (multi-tenant mode only) -->
            <BaseBadge v-if="isMultiTenant && currentTenant" variant="primary" size="sm" class="admin-header__tenant-badge">
              {{ currentTenant.name }}
            </BaseBadge>
          </div>

          <!-- User Menu -->
          <div class="admin-header__actions">
            <!-- Notifications -->
            <button
              type="button"
              class="admin-header__notification-btn"
            >
              <BaseIcon name="bell" class="u-w-5 u-h-5" />
            </button>

            <!-- User Dropdown -->
            <div class="admin-header__user-menu" ref="userMenuRef">
              <button
                @click="toggleUserMenu"
                type="button"
                class="admin-header__user-btn"
                id="user-menu-button"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <div class="admin-header__user-avatar">
                  <span class="admin-header__user-initials">
                    {{ userInitials }}
                  </span>
                </div>
                <span class="admin-header__user-name">{{ user?.firstName }} {{ user?.lastName }}</span>
                <BaseIcon name="chevron-down" class="admin-header__user-chevron" />
              </button>

              <!-- Dropdown Menu -->
              <div
                v-show="showUserMenu"
                class="admin-header__dropdown"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                <div class="admin-header__dropdown-content" role="none">
                  <NuxtLink
                    to="/admin/profile"
                    class="admin-header__dropdown-item"
                    role="menuitem"
                  >
                    Profile Settings
                  </NuxtLink>
                  <button
                    @click="handleLogout"
                    class="admin-header__dropdown-item"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="admin-layout">
      <!-- Sidebar Navigation -->
      <nav class="admin-sidebar">
        <div class="admin-sidebar__content">
          <ul class="admin-sidebar__nav">
            <li class="admin-sidebar__nav-item">
              <NuxtLink
                to="/admin"
                :class="[
                  'admin-sidebar__nav-link',
                  { 'admin-sidebar__nav-link--active': isActiveRoute('/admin') }
                ]"
              >
                <BaseIcon name="chart-bar" class="admin-sidebar__nav-icon" />
                Dashboard
              </NuxtLink>
            </li>
            <li class="admin-sidebar__nav-item">
              <NuxtLink
                to="/admin/menu"
                :class="[
                  'admin-sidebar__nav-link',
                  { 'admin-sidebar__nav-link--active': isActiveRoute('/admin/menu') }
                ]"
              >
                <BaseIcon name="clipboard-list" class="admin-sidebar__nav-icon" />
                Menu Management
              </NuxtLink>
            </li>
            <li class="admin-sidebar__nav-item">
              <NuxtLink
                to="/admin/orders"
                :class="[
                  'admin-sidebar__nav-link',
                  { 'admin-sidebar__nav-link--active': isActiveRoute('/admin/orders') }
                ]"
              >
                <BaseIcon name="shopping-bag" class="admin-sidebar__nav-icon" />
                Orders
              </NuxtLink>
            </li>
            <li class="admin-sidebar__nav-item">
              <NuxtLink
                to="/admin/analytics"
                :class="[
                  'admin-sidebar__nav-link',
                  { 'admin-sidebar__nav-link--active': isActiveRoute('/admin/analytics') }
                ]"
              >
                <BaseIcon name="chart-pie" class="admin-sidebar__nav-icon" />
                Analytics
              </NuxtLink>
            </li>
            <li class="admin-sidebar__nav-item">
              <NuxtLink
                to="/admin/users"
                :class="[
                  'admin-sidebar__nav-link',
                  { 'admin-sidebar__nav-link--active': isActiveRoute('/admin/users') }
                ]"
              >
                <BaseIcon name="users" class="admin-sidebar__nav-icon" />
                Users
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Back to Store Link -->
        <div class="admin-sidebar__footer">
          <NuxtLink
            :to="tenantAwareRoute('/')"
            class="admin-sidebar__back-link"
          >
            <BaseIcon name="arrow-left" class="admin-sidebar__nav-icon" />
            Back to Store
          </NuxtLink>
          
          <!-- Tenant Switcher (multi-tenant mode only) -->
          <BaseButton
            v-if="isMultiTenant"
            variant="ghost"
            size="sm"
            @click="navigateToTenantSelector"
            class="admin-sidebar__tenant-switcher"
          >
            <BaseIcon name="refresh" class="admin-sidebar__nav-icon" />
            Switch Restaurant
          </BaseButton>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTenant } from '~/composables/useTenant'

// Store
const authStore = useAuthStore()

// Tenant composable
const { currentTenant, isMultiTenant, tenantBranding } = useTenant()

// Reactive state
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement>()

// Computed
const user = computed(() => authStore.user)
const userInitials = computed(() => {
  if (!user.value) return 'U'
  return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`.toUpperCase()
})

// Methods
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    await navigateTo('/auth/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const isActiveRoute = (path: string) => {
  const route = useRoute()
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

const tenantAwareRoute = (path: string) => {
  const route = useRoute()
  if (route.query.tenant) {
    return `${path}?tenant=${route.query.tenant}`
  }
  return path
}

const navigateToTenantSelector = async () => {
  await navigateTo('/select-restaurant')
}

const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Meta
definePageMeta({
  middleware: 'admin',
  layout: false
})
</script>