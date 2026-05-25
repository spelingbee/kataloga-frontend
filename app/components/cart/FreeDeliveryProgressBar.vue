<template>
  <div v-if="isVisible" class="free-delivery-progress">
    <div class="progress-header">
      <div class="progress-text-container">
        <BaseIcon 
          :name="isQualified ? 'check-circle' : 'truck'" 
          :class="['status-icon', { 'qualified': isQualified }]"
          size="sm"
        />
        <span class="progress-message" :class="{ 'qualified': isQualified }">
          {{ message }}
        </span>
      </div>
      <span v-if="!isQualified" class="progress-percentage">
        {{ Math.round(percentage) }}%
      </span>
      <span v-else class="sparkle-badge animate-bounce">
        <BaseIcon name="sparkles" size="xs" class="mr-1" />
        {{ $t('delivery.free') }}
      </span>
    </div>
    
    <div class="progress-track-wrapper">
      <div class="progress-track">
        <div 
          class="progress-bar-fill" 
          :style="{ width: `${percentage}%` }"
          :class="{ 'qualified': isQualified }"
        >
          <div class="progress-glow"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTenantStore } from '~/stores/tenant'
import { useCartStore } from '~/stores/cart'
import { useTenantSettings } from '~/composables/useTenant'

const { t } = useI18n()
const tenantStore = useTenantStore()
const cartStore = useCartStore()
const { formatCurrency } = useTenantSettings()

const settings = computed(() => tenantStore.currentTenant?.settings?.deliverySettings)
const subtotal = computed(() => cartStore.subtotal)

const threshold = computed(() => settings.value?.freeDeliveryThreshold || 0)
const enabled = computed(() => settings.value?.enabled ?? false)

const isVisible = computed(() => {
  return enabled.value && threshold.value > 0 && cartStore.items.length > 0
})

const percentage = computed(() => {
  if (threshold.value <= 0) return 0
  return Math.min(100, (subtotal.value / threshold.value) * 100)
})

const isQualified = computed(() => percentage.value >= 100)

const remainingAmount = computed(() => {
  return Math.max(0, threshold.value - subtotal.value)
})

const message = computed(() => {
  if (isQualified.value) {
    return t('delivery.freeProgressQualified')
  }
  return t('delivery.freeProgressRemaining', { amount: formatCurrency(remainingAmount.value) })
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/radius' as *;

.free-delivery-progress {
  background: var(--bg-card-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border-radius: $radius-lg;
  padding: $space-3 $space-4;
  margin-bottom: $space-4;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.progress-text-container {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex: 1;
  min-width: 0;
}

.status-icon {
  flex-shrink: 0;
  color: var(--color-primary, #3b82f6);
  transition: transform 0.3s ease, color 0.3s ease;

  &.qualified {
    color: var(--color-success, #10b981);
    transform: scale(1.1);
    animation: pulse-icon 2s infinite;
  }
}

.progress-message {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &.qualified {
    font-weight: 600;
    color: var(--color-success, #10b981);
  }
}

.progress-percentage {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  font-feature-settings: "tnum";
}

.sparkle-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-success, #10b981);
  background: rgba(16, 185, 129, 0.1);
  padding: $space-1 $space-2;
  border-radius: $radius-full;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.progress-track-wrapper {
  position: relative;
  width: 100%;
}

.progress-track {
  height: 8px;
  background: var(--bg-neutral-light, rgba(255, 255, 255, 0.1));
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: $radius-full;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  position: relative;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.qualified {
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  }
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shine 2s infinite linear;
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse-icon {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-5%);
    animation-timing-function: cubic-bezier(0.8,0,1,1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0,0,0.2,1);
  }
}
</style>
