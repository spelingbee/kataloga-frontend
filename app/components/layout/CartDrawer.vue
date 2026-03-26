<template>
  <!-- Mobile cart drawer overlay -->
  <div class="fixed inset-0 z-50 lg:hidden">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="$emit('close')"
    />
    
    <!-- Drawer -->
    <div 
      class="absolute right-0 top-0 h-full w-full max-w-sm bg-background-card shadow-xl transform transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-0': props.isOpen, 'translate-x-full': !props.isOpen }"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-border-subtle">
        <AppHeading level="h2" size="heading-lg">
          Cart ({{ itemCount }})
        </AppHeading>
        <BaseButton
          variant="ghost"
          size="sm"
          aria-label="Close cart"
          @click="$emit('close')"
        >
          <BaseIcon name="x" size="md" />
        </BaseButton>
      </div>

      <!-- Cart Content -->
      <div class="flex flex-col h-full">
        <!-- Items List -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="items.length === 0" class="text-center py-8">
            <BaseIcon name="cart" size="xl" class="text-neutral-80 mx-auto mb-4" />
            <AppText class="text-neutral-80 mb-4">
              Your cart is empty
            </AppText>
            <BaseButton
              variant="primary"
              @click="goToMenu"
            >
              Browse Menu
            </BaseButton>
          </div>

          <div v-else class="space-y-4">
            <CartItem
              v-for="item in items"
              :key="item.menuItem.id"
              :cart-item="item"
              @update-quantity="updateQuantity"
              @remove="removeItem"
            />
          </div>
        </div>

        <!-- Cart Summary & Checkout -->
        <div v-if="items.length > 0" class="border-t border-border-subtle p-4 space-y-4">
          <!-- Promo Code Input -->
          <PromoCodeInput />
          
          <!-- Cart Summary -->
          <CartSummary 
            :subtotal="subtotal"
            :total="total" 
            :item-count="itemCount"
            :delivery-fee="deliveryFee"
            :discount="discount"
            :min-order-amount="minimumOrderAmount"
            :show-delivery-fee="false"
          />
          
          <!-- Checkout Button -->
          <BaseButton
            variant="primary"
            size="lg"
            class="w-full bg-primary-green hover:bg-green-600 text-white font-semibold"
            :disabled="!canCheckout"
            @click="proceedToCheckout"
          >
            <span v-if="canCheckout">Proceed to Checkout</span>
            <span v-else>Add {{ formatPrice(remainingForMinimum) }} more</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useTenant } from '~/composables/useTenant'

// Props & Emits
interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false
})

const emit = defineEmits<{
  close: []
}>()

// Stores
const cartStore = useCartStore()
const router = useRouter()
const { tenantSettings } = useTenant()

// Computed properties
const items = computed(() => cartStore.items)
const subtotal = computed(() => cartStore.subtotal)
const total = computed(() => cartStore.total)
const itemCount = computed(() => cartStore.itemCount)
const deliveryFee = computed(() => cartStore.deliveryFee)
const discount = computed(() => cartStore.discount)
const minimumOrderAmount = computed(() => cartStore.minimumOrderAmount)
const canCheckout = computed(() => cartStore.canCheckout)
const remainingForMinimum = computed(() => cartStore.remainingForMinimum)

// Helper methods
const formatPrice = (price: number) => {
  const currency = tenantSettings.value?.currency || 'USD'
  const locale = currency === 'USD' ? 'en-US' : currency === 'RUB' ? 'ru-RU' : 'en-US'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

// Methods
const updateQuantity = (itemId: string, quantity: number) => {
  cartStore.updateQuantity(itemId, quantity)
}

const removeItem = (itemId: string) => {
  cartStore.removeItem(itemId)
}

const goToMenu = () => {
  router.push('/menu')
  emit('close')
}

const proceedToCheckout = () => {
  router.push('/checkout')
  emit('close')
}

// Handle escape key
onKeyStroke('Escape', () => {
  emit('close')
})
</script>

<style scoped>
/* Smooth drawer animation */
.transform {
  transform: translateX(100%);
}

.translate-x-0 {
  transform: translateX(0);
}

.translate-x-full {
  transform: translateX(100%);
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
</style>