<template>
  <div 
    v-if="shouldShow"
    class="sticky-cart-button"
    :class="{ 'sticky-cart-button--visible': isVisible }"
  >
    <BaseButton
      variant="primary"
      size="lg"
      full-width
      class="sticky-cart-button__btn"
      :disabled="isEmpty"
      @click="handleClick"
    >
      <div class="sticky-cart-button__content">
        <div class="sticky-cart-button__info">
          <BaseIcon name="cart" size="md" class="sticky-cart-button__icon" />
          <span class="sticky-cart-button__count">{{ itemCount }}</span>
        </div>
        
        <span class="sticky-cart-button__text">
          {{ buttonText }}
        </span>
        
        <span class="sticky-cart-button__total">
          {{ formattedTotal }}
        </span>
      </div>
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useTelegramHaptic } from '~/composables/useTelegramHaptic'
import { useTenantSettings } from '~/composables/useTenant'

interface Props {
  /** Show button only on mobile devices */
  mobileOnly?: boolean
  /** Minimum scroll distance before showing button */
  scrollThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  mobileOnly: true,
  scrollThreshold: 100
})

const emit = defineEmits<{
  click: []
}>()

// Store
const cartStore = useCartStore()

// Reactive state
const isVisible = ref(false)
const scrollY = ref(0)

// Computed properties
const itemCount = computed(() => cartStore.itemCount)
const total = computed(() => cartStore.total)
const isEmpty = computed(() => cartStore.isEmpty)

const shouldShow = computed(() => {
  if (isEmpty.value) return false
  if (props.mobileOnly && !isMobile.value) return false
  return scrollY.value > props.scrollThreshold
})

const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
})

const buttonText = computed(() => {
  if (isEmpty.value) return 'Корзина пуста'
  return 'Оформить заказ'
})

const { formatCurrency } = useTenantSettings()

const formattedTotal = computed(() => {
  if (isEmpty.value) return ''
  return formatCurrency(total.value)
})

// Methods
const router = useRouter()
const handleClick = () => {
  if (!isEmpty.value) {
    // Trigger haptic feedback on cart button click
    try {
      const { impactOccurred } = useTelegramHaptic()
      impactOccurred('light')
    } catch (error) {
      // Silently fail if haptic feedback is not available
    }
    
    const { tPath } = useTenant()
    router.push(tPath('/checkout'))
  }
}

const handleScroll = () => {
  scrollY.value = window.scrollY
  
  // Show/hide with slight delay for smooth animation
  if (scrollY.value > props.scrollThreshold) {
    setTimeout(() => {
      isVisible.value = true
    }, 100)
  } else {
    isVisible.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;

.sticky-cart-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: $space-4;
  padding-bottom: calc($space-4 + env(safe-area-inset-bottom));
  background: linear-gradient(
    to top,
    var(--bg-primary) 70%,
    transparent 100%
  );
  backdrop-filter: blur(8px);
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  
  &--visible {
    transform: translateY(0);
  }
  
  // Hide on larger screens if mobileOnly is true
  @media (min-width: 768px) {
    display: none;
  }
}

.sticky-cart-button__btn {
  background: var(--color-primary);
  border: none;
  border-radius: $space-3;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-height: var(--touch-target-min);
  
  &:hover:not(:disabled) {
    background: var(--color-primary-light);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.sticky-cart-button__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $space-2 $space-4;
  color: white;
}

.sticky-cart-button__info {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.sticky-cart-button__icon {
  color: white;
}

.sticky-cart-button__count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  padding: $space-1 $space-2;
  border-radius: $space-3;
  min-width: 1.5rem;
  text-align: center;
}

.sticky-cart-button__text {
  font-weight: 600;
  font-size: 1rem;
  color: white;
}

.sticky-cart-button__total {
  font-weight: 700;
  font-size: 1.125rem;
  color: white;
}

// Animation for smooth appearance
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.sticky-cart-button--visible {
  animation: slideUp 0.3s ease-out;
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .sticky-cart-button {
    transition: none;
  }
  
  .sticky-cart-button--visible {
    animation: none;
  }
  
  .sticky-cart-button__btn {
    &:hover:not(:disabled) {
      transform: none;
    }
    
    &:active:not(:disabled) {
      transform: none;
    }
  }
}

// High contrast mode support
@media (prefers-contrast: more) {
  .sticky-cart-button__btn {
    border: 2px solid white;
  }
  
  .sticky-cart-button__count {
    border: 1px solid white;
  }
}
</style>
