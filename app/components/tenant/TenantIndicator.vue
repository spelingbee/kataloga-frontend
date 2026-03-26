<template>
  <div v-if="isMultiTenant && currentTenant" class="tenant-indicator">
    <div class="tenant-indicator__content">
      <!-- Tenant Logo -->
      <img
        v-if="tenantBranding?.logo"
        :src="tenantBranding.logo"
        :alt="currentTenant.name"
        class="tenant-indicator__logo"
      />
      <BaseIcon v-else name="store" size="sm" class="tenant-indicator__icon" />
      
      <!-- Tenant Name -->
      <span class="tenant-indicator__name">{{ currentTenant.name }}</span>
      
      <!-- Switch Button -->
      <BaseButton
        v-if="showSwitchButton"
        variant="ghost"
        size="sm"
        @click="handleSwitch"
        class="tenant-indicator__switch-btn"
        aria-label="Switch restaurant"
      >
        <BaseIcon name="refresh" size="xs" />
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTenant } from '~/composables/useTenant'

interface Props {
  showSwitchButton?: boolean
}

withDefaults(defineProps<Props>(), {
  showSwitchButton: true
})

// Composables
const { currentTenant, isMultiTenant, tenantBranding } = useTenant()
const router = useRouter()

// Methods
const handleSwitch = async () => {
  await router.push('/select-restaurant')
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;
@use '~/assets/scss/abstracts/functions' as *;

.tenant-indicator {
  display: inline-flex;
  align-items: center;
  padding: $space-1 $space-2;
  background-color: rgba(var(--bg-primary), 0.5);
  border-radius: 9999px;
  border: 1px solid $color-border-subtle;

  &__content {
    display: flex;
    align-items: center;
    gap: $space-1;
  }

  &__logo {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__icon {
    color: var(--text-tertiary);
  }

  &__name {
    font-size: $font-size-caption;
    font-weight: $font-medium;
    color: $color-neutral-20;
    white-space: nowrap;
  }

  &__switch-btn {
    padding: $space-1;
    color: var(--text-secondary);
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-error);
    }
  }
}
</style>
