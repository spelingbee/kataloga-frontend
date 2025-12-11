<template>
  <BaseCard
    :class="[
      'tenant-card',
      { 'tenant-card--selected': selected }
    ]"
    @click="handleSelect"
    role="button"
    :tabindex="0"
    @keydown.enter="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <!-- Tenant Logo -->
    <div class="tenant-card__logo-container">
      <img
        v-if="tenant.branding?.logo"
        :src="tenant.branding.logo"
        :alt="tenant.name"
        class="tenant-card__logo"
      />
      <BaseIcon v-else name="store" size="xl" class="tenant-card__logo-placeholder" />
    </div>

    <!-- Tenant Info -->
    <div class="tenant-card__content">
      <h3 class="tenant-card__name">
        {{ tenant.name }}
      </h3>

      <!-- Status Badge -->
      <div class="tenant-card__status">
        <BaseBadge
          :variant="tenant.isActive ? 'success' : 'secondary'"
          size="sm"
        >
          {{ tenant.isActive ? 'Active' : 'Inactive' }}
        </BaseBadge>
      </div>

      <!-- Features -->
      <div v-if="tenant.settings?.features" class="tenant-card__features">
        <div v-if="tenant.settings.features.deliveryEnabled" class="tenant-card__feature">
          <BaseIcon name="truck" size="xs" />
          <span>Delivery</span>
        </div>
        <div v-if="tenant.settings.features.pickupEnabled" class="tenant-card__feature">
          <BaseIcon name="shopping-bag" size="xs" />
          <span>Pickup</span>
        </div>
      </div>

      <!-- Domain (if available) -->
      <div v-if="tenant.domain" class="tenant-card__domain">
        <BaseIcon name="globe" size="xs" />
        <span>{{ tenant.domain }}</span>
      </div>
    </div>

    <!-- Selected Indicator -->
    <div v-if="selected" class="tenant-card__selected-indicator">
      <BaseIcon name="check-circle" size="md" class="u-text-success" />
    </div>

    <!-- Hover Overlay -->
    <div class="tenant-card__overlay" />
  </BaseCard>
</template>

<script setup lang="ts">
import type { TenantInfo } from '~/types/tenant'

interface Props {
  tenant: TenantInfo
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

const emit = defineEmits<{
  select: [tenant: TenantInfo]
}>()

// Methods
const handleSelect = () => {
  if (props.tenant.isActive) {
    emit('select', props.tenant)
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;

.tenant-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  &--selected {
    border-color: var(--tenant-primary-color, var(--color-error));
    background-color: rgba(var(--tenant-primary-color-rgb, 239, 68, 68), 0.1);
  }

  &__logo-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: $space-4;
    background-color: var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__logo {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__logo-placeholder {
    color: var(--text-tertiary);
  }

  &__content {
    text-align: center;
    width: 100%;
  }

  &__name {
    font-size: $font-size-heading-sm;
    font-weight: $font-semibold;
    color: var(--text-primary);
    margin-bottom: $space-2;
  }

  &__status {
    margin-bottom: $space-4;
  }

  &__features {
    display: flex;
    gap: $space-4;
    justify-content: center;
    margin-bottom: $space-2;
  }

  &__feature {
    display: flex;
    align-items: center;
    gap: $space-1;
    font-size: $font-size-caption;
    color: var(--text-secondary);
  }

  &__domain {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-1;
    font-size: $font-size-caption;
    color: var(--text-tertiary);
    margin-top: $space-2;
  }

  &__selected-indicator {
    position: absolute;
    top: $space-4;
    right: $space-4;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover &__overlay {
    opacity: 1;
  }
}
</style>
