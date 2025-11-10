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
.tenant-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  &--selected {
    border-color: var(--tenant-primary-color, $color-primary-red);
    background-color: rgba(var(--tenant-primary-color-rgb, 239, 68, 68), 0.1);
  }

  &__logo-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: $spacing-md;
    background-color: $color-background-card;
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
    color: $color-text-muted;
  }

  &__content {
    text-align: center;
    width: 100%;
  }

  &__name {
    font-size: $font-size-heading-sm;
    font-weight: $font-weight-semibold;
    color: $color-neutral-80;
    margin-bottom: $spacing-sm;
  }

  &__status {
    margin-bottom: $spacing-md;
  }

  &__features {
    display: flex;
    gap: $spacing-md;
    justify-content: center;
    margin-bottom: $spacing-sm;
  }

  &__feature {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-caption;
    color: $color-text-secondary;
  }

  &__domain {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    font-size: $font-size-caption;
    color: $color-text-muted;
    margin-top: $spacing-sm;
  }

  &__selected-indicator {
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
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
