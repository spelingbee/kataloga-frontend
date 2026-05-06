<template>
  <div class="order-details-page">
    <!-- Loading State -->
    <div v-if="loading" class="order-details-page__loading">
      <div class="order-details-page__loading-content">
        <div class="order-details-page__spinner" />
        <AppText>Loading order details...</AppText>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="order-details-page__error">
      <div class="order-details-page__error-content">
        <BaseIcon name="alert-circle" size="xl" class="order-details-page__error-icon" />
        <AppHeading level="h2" size="heading-lg">Order Not Found</AppHeading>
        <AppText>
          {{ error }}
        </AppText>
        <div class="order-details-page__error-actions">
          <BaseButton @click="goBack">Go Back</BaseButton>
          <NuxtLink to="/orders">
            <BaseButton variant="secondary">View All Orders</BaseButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Order Details -->
    <div v-else-if="order">
      <!-- Header -->
      <div class="order-header">
        <div class="order-header__top">
          <BaseButton variant="ghost" class="order-header__back-btn" @click="goBack">
            <BaseIcon name="arrow-left" size="md" />
          </BaseButton>
          <div class="order-header__info">
            <div class="order-header__title-row">
              <AppHeading level="h2" size="heading-sm" class="order-header__title">
                {{ $t('orders.orderNumber', { number: order.orderNumber || order.id.slice(-6).toUpperCase() }) }}
              </AppHeading>
              <StatusBadge :status="order.status" size="sm" class="order-header__status" />
            </div>
            <AppText size="body-xs" class="order-header__date">
              {{ formatDate(order.createdAt) }}
            </AppText>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="order-header__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="order-header__tab"
            :class="{ 'order-header__tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <BaseIcon :name="tab.icon" size="sm" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="order-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <!-- Order Summary -->
          <div class="order-summary">
            <div class="order-summary__header">
              <AppHeading level="h3" size="heading-sm" class="order-summary__title">
                {{ $t('orders.summary') }}
              </AppHeading>
            </div>

            <!-- Order Items -->
            <div class="order-summary__items">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="order-item"
              >
                <!-- Item Image -->
                <div class="order-item__image">
                  <BaseIcon name="utensils" size="lg" />
                </div>

                <!-- Item Details -->
                <div class="order-item__details">
                  <AppHeading level="h4" size="heading-sm" class="order-item__name">
                    {{ item.product?.name || item.name || item.title || $t('common.error') }}
                  </AppHeading>
                  <AppText size="body-sm" class="order-item__description">
                    {{ item.menuItem?.description }}
                  </AppText>
                  <div class="order-item__meta">
                    <AppText size="body-xs" class="order-item__quantity">
                      {{ $t('menu.quantity') }}: {{ item.quantity }}
                    </AppText>
                  </div>
                </div>
                <!-- Item Total -->
                <div class="order-item__total">
                  <AppPrice :price="item.price * item.quantity || 0" size="sm" />
                </div>
              </div>
            </div>

            <!-- Order Totals -->
            <div class="order-summary__totals">
              <div class="order-summary__total-row">
                <AppText class="order-summary__total-label">{{ $t('orders.subtotal') }}</AppText>
                <AppPrice :price="subtotal" size="sm" />
              </div>
              <div v-if="order.deliveryFee" class="order-summary__total-row">
                <AppText class="order-summary__total-label">{{ $t('orders.deliveryFee') }}</AppText>
                <AppPrice :price="order.deliveryFee" size="sm" />
              </div>
              <div v-if="tax > 0" class="order-summary__total-row">
                <AppText class="order-summary__total-label">{{ $t('orders.tax') }}</AppText>
                <AppPrice :price="tax" size="sm" />
              </div>
              <div class="order-summary__total-row order-summary__total-row--final">
                <AppText size="body-lg" class="order-summary__total-label order-summary__total-label--final">{{ $t('orders.total') }}</AppText>
                <AppPrice :price="order.total" size="lg" color="orange" />
              </div>
            </div>
          </div>

          <!-- Customer Information -->
          <div class="customer-info">
            <AppHeading level="h3" size="heading-sm" class="customer-info__title">
              {{ $t('orders.customerInfo') }}
            </AppHeading>
            
            <div class="customer-info__grid">
              <div>
                <AppText size="body-xs" class="customer-info__section-title">{{ $t('orders.contactDetails') }}</AppText>
                <div class="customer-info__details">
                  <div v-if="customerInfo?.name" class="customer-info__detail-row">
                    <BaseIcon name="user" size="sm" class="customer-info__detail-icon" />
                    <AppText size="body-sm" class="customer-info__detail-text">{{ customerInfo.name }}</AppText>
                  </div>
                  <div v-if="customerInfo?.phone" class="customer-info__detail-row">
                    <BaseIcon name="phone" size="sm" class="customer-info__detail-icon" />
                    <AppText size="body-sm" class="customer-info__detail-text">{{ customerInfo.phone }}</AppText>
                  </div>
                  <div v-if="customerInfo?.email" class="customer-info__detail-row">
                    <BaseIcon name="mail" size="sm" class="customer-info__detail-icon" />
                    <AppText size="body-sm" class="customer-info__detail-text">{{ customerInfo.email }}</AppText>
                  </div>
                </div>
              </div>
              
              <div v-if="customerInfo?.address">
                <AppText size="body-xs" class="customer-info__section-title">{{ $t('orders.deliveryAddress') }}</AppText>
                <div class="customer-info__detail-row">
                  <BaseIcon name="map-pin" size="sm" class="customer-info__detail-icon" />
                  <AppText size="body-sm" class="customer-info__detail-text">{{ customerInfo.address }}</AppText>
                </div>
              </div>
            </div>

            <!-- Special Instructions -->
            <div v-if="order.customerInfo && order.customerInfo.notes" class="customer-info__notes">
              <AppText size="body-xs" class="customer-info__section-title">{{ $t('orders.specialInstructions') }}</AppText>
              <AppText size="body-sm" class="customer-info__notes-text">{{ order.customerInfo.notes }}</AppText>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="order-actions">
            <BaseButton 
              variant="primary"
              size="md"
              class="order-actions__button"
              @click="reorderItemsInDetails"
            >
              <BaseIcon name="repeat" size="sm" />
              {{ $t('orders.reorderItems') }}
            </BaseButton>
            <BaseButton 
              variant="secondary"
              size="md"
              class="order-actions__button"
              @click="shareOrder"
            >
              <BaseIcon name="share" size="sm" />
              {{ $t('orders.shareOrder') }}
            </BaseButton>
          </div>
          <div v-if="canCancelOrder" class="order-actions-cancel">
            <BaseButton 
              variant="ghost"
              size="sm"
              class="order-actions-cancel__button"
              @click="cancelOrder"
            >
              {{ $t('orders.cancelOrder') }}
            </BaseButton>
          </div>
        </div>

        <!-- Tracking Tab -->
        <div v-if="activeTab === 'tracking'">
          <OrderTracker 
            :order="order"
            :show-map="true"
            :show-timeline="true"
          />
        </div>

        <!-- Receipt Tab -->
        <div v-if="activeTab === 'receipt'">
          <!-- Digital Receipt -->
          <div class="receipt">
            <!-- Receipt Header -->
            <div class="receipt__header">
              <AppHeading level="h2" size="heading-lg" class="receipt__title">
                {{ tenantSettings?.name || 'Kataloga' }}
              </AppHeading>
              <AppText size="body-sm" class="receipt__subtitle">
                {{ $t('orders.receipt') }}
              </AppText>
            </div>

            <!-- Order Info -->
            <div class="receipt__info">
              <div class="receipt__info-row">
                <AppText size="body-sm" class="receipt__info-label">{{ $t('orders.orderNumber', { number: '' }).replace(' №', '') }}</AppText>
                <AppText size="body-sm" class="receipt__info-value">{{ order.id }}</AppText>
              </div>
              <div class="receipt__info-row">
                <AppText size="body-sm" class="receipt__info-label">{{ $t('delivery.time') }}</AppText>
                <AppText size="body-sm" class="receipt__info-value">{{ formatReceiptDate(order.createdAt) }}</AppText>
              </div>
              <div class="receipt__info-row">
                <AppText size="body-sm" class="receipt__info-label">{{ $t('orders.status') }}</AppText>
                <StatusBadge :status="order.status" size="sm" />
              </div>
            </div>

            <!-- Items -->
            <div class="receipt__items">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="receipt__item"
              >
                <div class="receipt__item-details">
                  <AppText size="body-sm" class="receipt__item-name">
                    {{ item.quantity }}× {{ item.product?.name || item.name || item.title || $t('common.error') }}
                  </AppText>
                  <AppText size="caption" class="receipt__item-meta">
                    {{ item.quantity }} × {{ formatCurrency(item.price) }}
                  </AppText>
                </div>
                <AppText size="body-sm" class="receipt__item-total">
                  {{ formatCurrency(Number(item.subtotal) || (item.price * item.quantity)) }}
                </AppText>
              </div>
            </div>

            <!-- Totals -->
            <div class="receipt__totals">
              <div class="receipt__total-row">
                <AppText size="body-sm" class="receipt__total-label">{{ $t('orders.subtotal') }}</AppText>
                <AppText size="body-sm" class="receipt__total-value">{{ formatCurrency(subtotal) }}</AppText>
              </div>
              <div v-if="order.deliveryFee > 0" class="receipt__total-row">
                <AppText size="body-sm" class="receipt__total-label">{{ $t('orders.deliveryFee') }}</AppText>
                <AppText size="body-sm" class="receipt__total-value">{{ formatCurrency(order.deliveryFee) }}</AppText>
              </div>
              <div v-if="tax > 0" class="receipt__total-row">
                <AppText size="body-sm" class="receipt__total-label">{{ $t('orders.tax') }}</AppText>
                <AppText size="body-sm" class="receipt__total-value">{{ formatCurrency(tax) }}</AppText>
              </div>
              <div class="receipt__total-row receipt__total-row--final">
                <AppText size="body-md" class="receipt__total-label receipt__total-label--final">{{ $t('orders.total') }}</AppText>
                <AppText size="body-md" class="receipt__total-value receipt__total-value--final">{{ formatCurrency(order.total) }}</AppText>
              </div>
            </div>

            <!-- Footer -->
            <div class="receipt__footer">
              <AppText size="caption" class="receipt__footer-text">
                {{ $t('checkout.orderPlaced') }}!
              </AppText>
            </div>
          </div>

          <!-- Receipt Actions -->
          <div class="receipt-actions">
            <BaseButton 
              variant="secondary"
              @click="downloadReceipt"
            >
              <BaseIcon name="download" size="sm" />
              {{ $t('orders.export') }} PDF
            </BaseButton>
            <BaseButton 
              variant="ghost"
              @click="emailReceipt"
            >
              <BaseIcon name="mail" size="sm" />
              {{ $t('orders.support') }}
            </BaseButton>
          </div>
        </div>

        <!-- Support Tab -->
        <div v-if="activeTab === 'support'">
          <div class="support-section">
            <!-- Support Options -->
            <div class="support-section__options">
              <BaseCard class="support-section__option-card">
                <BaseIcon name="message-circle" size="xl" class="support-section__option-icon" />
                <AppHeading level="h3" size="heading-md" class="support-section__option-title">
                  {{ $t('orders.chatSupport') }}
                </AppHeading>
                <AppText class="support-section__option-text">
                  {{ $t('orders.stats.favorite') }}
                </AppText>
                <BaseButton variant="primary" @click="startChat">
                  {{ $t('common.submit') }}
                </BaseButton>
              </BaseCard>

              <BaseCard class="support-section__option-card">
                <BaseIcon name="phone" size="xl" class="support-section__option-icon" />
                <AppHeading level="h3" size="heading-md" class="support-section__option-title">
                  {{ $t('orders.callSupport') }}
                </AppHeading>
                <AppText class="support-section__option-text">
                  {{ $t('orders.contactRestaurant') }}
                </AppText>
                <BaseButton variant="secondary" @click="callSupport">
                  {{ $t('orders.callSupport') }}
                </BaseButton>
              </BaseCard>
            </div>

            <!-- Common Issues -->
            <div class="support-section__issues">
              <AppHeading level="h3" size="heading-md" class="support-section__issues-title">
                {{ $t('orders.commonIssues') }}
              </AppHeading>
              
              <div class="support-section__issues-list">
                <div
                  v-for="issue in commonIssues"
                  :key="issue.id"
                  class="support-section__issue-item"
                  @click="handleIssue(issue)"
                >
                  <div class="support-section__issue-content">
                    <AppText class="support-section__issue-text">{{ issue.title }}</AppText>
                    <BaseIcon name="chevron-right" size="sm" class="support-section__issue-icon" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Form -->
            <div class="support-section__form">
              <AppHeading level="h3" size="heading-md" class="support-section__form-title">
                {{ $t('orders.reportIssue') }}
              </AppHeading>
              
              <form class="support-section__form-fields" @submit.prevent="submitIssue">
                <div class="support-section__form-field">
                  <label class="support-section__form-label">
                    {{ $t('orders.issueType') }}
                  </label>
                  <select 
                    v-model="issueForm.type"
                    class="support-section__form-select"
                    required
                  >
                    <option value="">{{ $t('common.viewDetails') }}</option>
                    <option value="wrong-order">{{ $t('orders.statuses.cancelled') }}</option>
                    <option value="missing-items">{{ $t('common.error') }}</option>
                    <option value="quality-issue">{{ $t('orders.stats.favorite') }}</option>
                    <option value="delivery-delay">{{ $t('orders.estimatedTime') }}</option>
                    <option value="refund-request">{{ $t('orders.stats.totalSpent') }}</option>
                    <option value="other">{{ $t('common.clear') }}</option>
                  </select>
                </div>
                
                <div class="support-section__form-field">
                  <label class="support-section__form-label">
                    {{ $t('orders.description') }}
                  </label>
                  <BaseTextarea
                    v-model="issueForm.description"
                    rows="4"
                    placeholder="Please describe the issue in detail..."
                    required
                  />
                </div>
                
                <BaseButton 
                  type="submit"
                  variant="primary"
                  class="support-section__form-submit"
                  :disabled="submittingIssue"
                >
                  <BaseIcon 
                    v-if="submittingIssue"
                    name="loader" 
                    size="sm"
                  />
                  {{ $t('orders.submitIssue') }}
                </BaseButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types'
import { useOrderStore } from '~/stores/order'
import { useCartStore } from '~/stores/cart'
import { useTenantSettings } from '~/composables/useTenant'
import { OrderStatus } from '~/types'
import AppHeading from '~/components/base/AppHeading.vue'
import AppText from '~/components/base/AppText.vue'
import AppPrice from '~/components/base/AppPrice.vue'
import StatusBadge from '~/components/order/StatusBadge.vue'
import { useNavigation } from '~/composables/useNavigation'

// Page setup
definePageMeta({
  title: 'История заказа',
})

// Route and stores
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const orderStore = useOrderStore()
const cartStore = useCartStore()
const { formatCurrency, tenantSettings } = useTenantSettings()
const { goBack } = useNavigation()

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('overview')
const submittingIssue = ref(false)

const issueForm = ref({
  type: '',
  description: '',
})

// Get order ID from route
const orderId = computed(() => route.params.id as string)

// Real order data
const order = ref<Order | null>(null)

// Tab configuration
const tabs = computed(() => [
  { id: 'overview', label: t('orders.overview'), icon: 'eye' },
  { id: 'tracking', label: t('orders.trackOrder'), icon: 'map' },
  { id: 'receipt', label: t('orders.receipt'), icon: 'receipt' },
  { id: 'support', label: t('orders.support'), icon: 'info' },
])

// Computed
const subtotal = computed(() => {
  if (!order.value) return 0
  return (order.value.items || []).reduce((sum, item) => {
    const itemSubtotal = Number(item.subtotal) || (item.price * item.quantity) || 0
    return sum + itemSubtotal
  }, 0)
})

const tax = computed(() => (order.value?.tax || 0))

const customerInfo = computed(() => {
  if (!order.value) return null
  return {
    name: order.value.customerName,
    phone: order.value.customerPhone,
    email: order.value.customerEmail,
    address: order.value.deliveryAddress
  }
})

const canCancelOrder = computed(() => {
  return order.value && ['PENDING', 'CONFIRMED'].includes(order.value.status)
})

// Methods
const loadOrder = async () => {
  loading.value = true
  error.value = null

  try {
    const result = await orderStore.getOrder(orderId.value)
    if (result) {
      order.value = result
    } else {
      error.value = t('orders.noResults')
    }
  } catch (err) {
    error.value = t('errors.serverError')
    console.error('Error loading order:', err)
  } finally {
    loading.value = false
  }
}

const formatReceiptDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const reorderItemsInDetails = () => {
  if (order.value) {
    (order.value.items || []).forEach(item => {
      // Reconstruct minimal MenuItem
      const menuItem: any = {
        id: (item as any).menuItemId || item.id,
        productId: (item as any).productId,
        name: item.product?.name || item.name || '',
        price: item.price,
        imageUrl: item.product?.imageUrl,
        isActive: true
      }
      cartStore.addItem(menuItem, item.quantity)
    })
    router.push('/checkout')
  }
}

const shareOrder = () => {
  if (navigator.share && order.value) {
    navigator.share({
      title: t('orders.orderNumber', { number: order.value.orderNumber || order.value.id }),
      text: t('orders.shareOrder'),
      url: window.location.href,
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
  }
}

const cancelOrder = async () => {
  if (order.value && confirm(t('orders.confirmCancel'))) {
    try {
      await orderStore.cancelOrder(order.value.id)
      order.value.status = OrderStatus.CANCELLED
    } catch (error) {
      console.error('Failed to cancel order:', error)
    }
  }
}

const downloadReceipt = () => {
  // Mock PDF download
  console.log('Downloading receipt PDF...')
}

const emailReceipt = () => {
  // Mock email receipt
  console.log('Emailing receipt...')
}

const startChat = () => {
  // Mock chat support
  console.log('Starting chat support...')
}

const callSupport = () => {
  window.open('tel:+1-555-SUPPORT')
}

const handleIssue = (issue: any) => {
  switch (issue.action) {
    case 'track':
      activeTab.value = 'tracking'
      break
    case 'report':
      activeTab.value = 'support'
      issueForm.value.type = 'quality-issue'
      break
    case 'contact':
      startChat()
      break
    case 'refund':
      issueForm.value.type = 'refund-request'
      activeTab.value = 'support'
      break
  }
}

const submitIssue = async () => {
  submittingIssue.value = true

  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Reset form
    issueForm.value = { type: '', description: '' }

    // Show success message
    alert('Issue submitted successfully! We will contact you soon.')
  } catch (error) {
    console.error('Failed to submit issue:', error)
    alert('Failed to submit issue. Please try again.')
  } finally {
    submittingIssue.value = false
  }
}

// Initialize
onMounted(() => {
  loadOrder()

  // Set active tab from query params
  const tabFromQuery = route.query.tab as string
  if (tabFromQuery && tabs.value.some(tab => tab.id === tabFromQuery)) {
    activeTab.value = tabFromQuery
  }
})

// Update page title
watchEffect(() => {
  if (order.value) {
    useHead({
      title: `Order #${order.value.id} - Menu Ordering App`,
    })
  }
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/pages/order-details';
</style>
