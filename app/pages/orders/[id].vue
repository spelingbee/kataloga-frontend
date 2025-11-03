<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
        <AppText class="text-neutral-20">Loading order details...</AppText>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <BaseIcon name="alert-circle" size="4xl" class="text-primary-red mx-auto mb-6" />
        <AppHeading level="h2" size="heading-lg" class="text-white mb-4">
          Order Not Found
        </AppHeading>
        <AppText class="text-neutral-20 mb-8">
          {{ error }}
        </AppText>
        <div class="flex gap-4 justify-center">
          <BaseButton @click="$router.go(-1)">
            Go Back
          </BaseButton>
          <NuxtLink to="/orders">
            <BaseButton variant="secondary">
              View All Orders
            </BaseButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Order Details -->
    <div v-else-if="order" class="pb-8">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-neutral-80/20">
        <div class="flex items-center gap-4 mb-4">
          <BaseButton 
            variant="ghost" 
            @click="$router.go(-1)"
          >
            <BaseIcon name="arrow-left" size="md" />
          </BaseButton>
          <div class="flex-1">
            <AppHeading level="h1" size="heading-lg" class="text-white">
              Order #{{ order.id }}
            </AppHeading>
            <AppText class="text-neutral-20">
              {{ formatDate(order.createdAt) }}
            </AppText>
          </div>
          <StatusBadge :status="order.status" size="lg" />
        </div>

        <!-- Tab Navigation -->
        <div class="flex gap-1 bg-background-card rounded-lg p-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            :class="activeTab === tab.id ? 
              'bg-primary-green text-white' : 
              'text-neutral-20 hover:text-white hover:bg-neutral-80/20'"
            @click="activeTab = tab.id"
          >
            <BaseIcon :name="tab.icon" size="sm" class="mr-2" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="px-6 py-8">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <!-- Order Summary -->
          <div class="mb-8 bg-background-card rounded-xl p-6">
            <div class="flex items-center justify-between mb-6">
              <AppHeading level="h3" size="heading-md" class="text-white">
                Order Summary
              </AppHeading>
              <AppPrice :price="order.total" size="xl" />
            </div>

            <!-- Order Items -->
            <div class="space-y-4 mb-6">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex items-center gap-4 p-4 bg-neutral-80/10 rounded-lg"
              >
                <!-- Item Image -->
                <div class="w-16 h-16 bg-neutral-80/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BaseIcon name="utensils" size="lg" class="text-neutral-80" />
                </div>

                <!-- Item Details -->
                <div class="flex-1 min-w-0">
                  <AppHeading level="h4" size="heading-sm" class="text-white mb-1">
                    {{ item.menuItem.name }}
                  </AppHeading>
                  <AppText size="body-sm" class="text-neutral-20 mb-2">
                    {{ item.menuItem.description }}
                  </AppText>
                  <div class="flex items-center gap-4">
                    <AppText size="body-sm" class="text-neutral-20">
                      Qty: {{ item.quantity }}
                    </AppText>
                    <AppPrice :price="item.price" size="sm" />
                  </div>
                </div>

                <!-- Item Total -->
                <div class="text-right">
                  <AppPrice :price="item.subtotal" size="md" />
                </div>
              </div>
            </div>

            <!-- Order Totals -->
            <div class="border-t border-neutral-80/20 pt-4 space-y-2">
              <div class="flex items-center justify-between">
                <AppText class="text-neutral-20">Subtotal</AppText>
                <AppText class="text-white">{{ formatPrice(subtotal) }}</AppText>
              </div>
              <div class="flex items-center justify-between">
                <AppText class="text-neutral-20">Delivery Fee</AppText>
                <AppText class="text-white">{{ formatPrice(deliveryFee) }}</AppText>
              </div>
              <div class="flex items-center justify-between">
                <AppText class="text-neutral-20">Tax</AppText>
                <AppText class="text-white">{{ formatPrice(tax) }}</AppText>
              </div>
              <div class="flex items-center justify-between pt-2 border-t border-neutral-80/20">
                <AppText size="body-lg" class="text-white font-semibold">Total</AppText>
                <AppPrice :price="order.total" size="lg" />
              </div>
            </div>
          </div>

          <!-- Customer Information -->
          <div class="mb-8 bg-background-card rounded-xl p-6">
            <AppHeading level="h3" size="heading-md" class="text-white mb-6">
              Customer Information
            </AppHeading>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <AppText size="body-sm" class="text-neutral-20 mb-2">Contact Details</AppText>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <BaseIcon name="user" size="sm" class="text-neutral-80" />
                    <AppText class="text-white">{{ order.customerInfo.name }}</AppText>
                  </div>
                  <div class="flex items-center gap-2">
                    <BaseIcon name="phone" size="sm" class="text-neutral-80" />
                    <AppText class="text-white">{{ order.customerInfo.phone }}</AppText>
                  </div>
                  <div v-if="order.customerInfo.email" class="flex items-center gap-2">
                    <BaseIcon name="mail" size="sm" class="text-neutral-80" />
                    <AppText class="text-white">{{ order.customerInfo.email }}</AppText>
                  </div>
                </div>
              </div>
              
              <div v-if="order.deliveryAddress">
                <AppText size="body-sm" class="text-neutral-20 mb-2">Delivery Address</AppText>
                <div class="flex items-start gap-2">
                  <BaseIcon name="map-pin" size="sm" class="text-neutral-80 mt-1" />
                  <AppText class="text-white">{{ order.deliveryAddress }}</AppText>
                </div>
              </div>
            </div>

            <!-- Special Instructions -->
            <div v-if="order.customerInfo.notes" class="mt-6 pt-6 border-t border-neutral-80/20">
              <AppText size="body-sm" class="text-neutral-20 mb-2">Special Instructions</AppText>
              <AppText class="text-white">{{ order.customerInfo.notes }}</AppText>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-col sm:flex-row gap-4">
            <BaseButton 
              variant="primary"
              @click="reorderItems"
              class="flex-1"
            >
              <BaseIcon name="repeat" size="sm" class="mr-2" />
              Reorder Items
            </BaseButton>
            <BaseButton 
              variant="secondary"
              @click="shareOrder"
              class="flex-1"
            >
              <BaseIcon name="share" size="sm" class="mr-2" />
              Share Order
            </BaseButton>
            <BaseButton 
              v-if="canCancelOrder"
              variant="ghost"
              @click="cancelOrder"
              class="flex-1"
            >
              <BaseIcon name="x" size="sm" class="mr-2" />
              Cancel Order
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
          <div class="max-w-md mx-auto bg-white text-black p-8 rounded-lg">
            <!-- Receipt Header -->
            <div class="text-center mb-6">
              <AppHeading level="h2" size="heading-lg" class="text-black mb-2">
                Menu Ordering App
              </AppHeading>
              <AppText size="body-sm" class="text-gray-600">
                Digital Receipt
              </AppText>
            </div>

            <!-- Order Info -->
            <div class="mb-6 pb-4 border-b border-gray-300">
              <div class="flex justify-between mb-2">
                <AppText size="body-sm" class="text-gray-600">Order #</AppText>
                <AppText size="body-sm" class="text-black font-medium">{{ order.id }}</AppText>
              </div>
              <div class="flex justify-between mb-2">
                <AppText size="body-sm" class="text-gray-600">Date</AppText>
                <AppText size="body-sm" class="text-black">{{ formatReceiptDate(order.createdAt) }}</AppText>
              </div>
              <div class="flex justify-between">
                <AppText size="body-sm" class="text-gray-600">Status</AppText>
                <AppText size="body-sm" class="text-black font-medium">{{ order.status }}</AppText>
              </div>
            </div>

            <!-- Items -->
            <div class="mb-6">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex justify-between items-start mb-3"
              >
                <div class="flex-1">
                  <AppText size="body-sm" class="text-black font-medium">
                    {{ item.menuItem.name }}
                  </AppText>
                  <AppText size="caption" class="text-gray-600">
                    {{ item.quantity }} × {{ formatPrice(item.price) }}
                  </AppText>
                </div>
                <AppText size="body-sm" class="text-black font-medium">
                  {{ formatPrice(item.subtotal) }}
                </AppText>
              </div>
            </div>

            <!-- Totals -->
            <div class="border-t border-gray-300 pt-4 space-y-2">
              <div class="flex justify-between">
                <AppText size="body-sm" class="text-gray-600">Subtotal</AppText>
                <AppText size="body-sm" class="text-black">{{ formatPrice(subtotal) }}</AppText>
              </div>
              <div class="flex justify-between">
                <AppText size="body-sm" class="text-gray-600">Delivery</AppText>
                <AppText size="body-sm" class="text-black">{{ formatPrice(deliveryFee) }}</AppText>
              </div>
              <div class="flex justify-between">
                <AppText size="body-sm" class="text-gray-600">Tax</AppText>
                <AppText size="body-sm" class="text-black">{{ formatPrice(tax) }}</AppText>
              </div>
              <div class="flex justify-between pt-2 border-t border-gray-300">
                <AppText size="body-md" class="text-black font-bold">Total</AppText>
                <AppText size="body-md" class="text-black font-bold">{{ formatPrice(order.total) }}</AppText>
              </div>
            </div>

            <!-- Footer -->
            <div class="text-center mt-6 pt-4 border-t border-gray-300">
              <AppText size="caption" class="text-gray-600">
                Thank you for your order!
              </AppText>
            </div>
          </div>

          <!-- Receipt Actions -->
          <div class="flex justify-center gap-4 mt-8">
            <BaseButton 
              variant="secondary"
              @click="downloadReceipt"
            >
              <BaseIcon name="download" size="sm" class="mr-2" />
              Download PDF
            </BaseButton>
            <BaseButton 
              variant="ghost"
              @click="emailReceipt"
            >
              <BaseIcon name="mail" size="sm" class="mr-2" />
              Email Receipt
            </BaseButton>
          </div>
        </div>

        <!-- Support Tab -->
        <div v-if="activeTab === 'support'">
          <div class="max-w-2xl mx-auto">
            <!-- Support Options -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <BaseCard class="p-6 text-center">
                <BaseIcon name="message-circle" size="xl" class="text-primary-green mx-auto mb-4" />
                <AppHeading level="h3" size="heading-md" class="text-white mb-2">
                  Chat Support
                </AppHeading>
                <AppText class="text-neutral-20 mb-4">
                  Get instant help from our support team
                </AppText>
                <BaseButton variant="primary" @click="startChat">
                  Start Chat
                </BaseButton>
              </BaseCard>

              <BaseCard class="p-6 text-center">
                <BaseIcon name="phone" size="xl" class="text-primary-orange mx-auto mb-4" />
                <AppHeading level="h3" size="heading-md" class="text-white mb-2">
                  Call Support
                </AppHeading>
                <AppText class="text-neutral-20 mb-4">
                  Speak directly with our support team
                </AppText>
                <BaseButton variant="secondary" @click="callSupport">
                  Call Now
                </BaseButton>
              </BaseCard>
            </div>

            <!-- Common Issues -->
            <div class="mb-8">
              <AppHeading level="h3" size="heading-md" class="text-white mb-6">
                Common Issues
              </AppHeading>
              
              <div class="space-y-4">
                <div
                  v-for="issue in commonIssues"
                  :key="issue.id"
                  class="bg-background-card rounded-xl p-4 cursor-pointer hover:bg-background-card/80 transition-colors"
                  @click="handleIssue(issue)"
                >
                  <div class="flex items-center justify-between">
                    <AppText class="text-white">{{ issue.title }}</AppText>
                    <BaseIcon name="chevron-right" size="sm" class="text-neutral-80" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Form -->
            <div class="bg-background-card rounded-xl p-6">
              <AppHeading level="h3" size="heading-md" class="text-white mb-6">
                Report an Issue
              </AppHeading>
              
              <form @submit.prevent="submitIssue" class="space-y-4">
                <div>
                  <label class="block text-white text-sm font-medium mb-2">
                    Issue Type
                  </label>
                  <select 
                    v-model="issueForm.type"
                    class="w-full bg-background-dark border border-neutral-80/30 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    <option value="">Select issue type</option>
                    <option value="wrong-order">Wrong Order</option>
                    <option value="missing-items">Missing Items</option>
                    <option value="quality-issue">Quality Issue</option>
                    <option value="delivery-delay">Delivery Delay</option>
                    <option value="refund-request">Refund Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-white text-sm font-medium mb-2">
                    Description
                  </label>
                  <BaseInput
                    v-model="issueForm.description"
                    type="textarea"
                    rows="4"
                    placeholder="Please describe the issue in detail..."
                    required
                  />
                </div>
                
                <BaseButton 
                  type="submit"
                  variant="primary"
                  class="w-full"
                  :disabled="submittingIssue"
                >
                  <BaseIcon 
                    v-if="submittingIssue"
                    name="loader" 
                    size="sm" 
                    class="mr-2 animate-spin" 
                  />
                  Submit Issue
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

// Page setup
definePageMeta({
  title: 'Order Details - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()
import { useOrderStore } from '~/stores/order'
import { useCartStore } from '~/stores/cart'
import { OrderStatus } from '~/types'

const orderStore = useOrderStore()
const cartStore = useCartStore()

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('overview')
const submittingIssue = ref(false)

const issueForm = ref({
  type: '',
  description: ''
})

// Get order ID from route
const orderId = computed(() => route.params.id as string)

// Mock order data
const order = ref<Order | null>(null)

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', icon: 'eye' },
  { id: 'tracking', label: 'Tracking', icon: 'map' },
  { id: 'receipt', label: 'Receipt', icon: 'receipt' },
  { id: 'support', label: 'Support', icon: 'help-circle' }
]

// Common support issues
const commonIssues = [
  { id: '1', title: 'Order is taking too long', action: 'track' },
  { id: '2', title: 'Missing items from my order', action: 'report' },
  { id: '3', title: 'Food quality issue', action: 'report' },
  { id: '4', title: 'Wrong delivery address', action: 'contact' },
  { id: '5', title: 'Request refund', action: 'refund' }
]

// Computed
const subtotal = computed(() => {
  if (!order.value) return 0
  return order.value.items.reduce((sum, item) => sum + item.subtotal, 0)
})

const deliveryFee = computed(() => 2.99)
const tax = computed(() => subtotal.value * 0.08)

const canCancelOrder = computed(() => {
  return order.value && ['PENDING', 'CONFIRMED'].includes(order.value.status)
})

// Methods
const loadOrder = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create mock order data
    order.value = {
      id: orderId.value,
      status: OrderStatus.DELIVERED,
      total: 23.47,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      estimatedTime: 25,
      deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
      customerInfo: {
        name: 'John Doe',
        phone: '+1 (555) 123-4567',
        email: 'john.doe@example.com',
        notes: 'Please ring doorbell twice'
      },
      items: [
        {
          id: '1',
          menuItemId: '1',
          menuItem: {
            id: '1',
            name: 'Delicious Burger',
            description: 'A mouth-watering burger with fresh ingredients',
            price: 15.99,
            categoryId: 'fastfood',
            isActive: true
          },
          quantity: 1,
          price: 15.99,
          subtotal: 15.99
        },
        {
          id: '2',
          menuItemId: '2',
          menuItem: {
            id: '2',
            name: 'Crispy Fries',
            description: 'Golden crispy french fries',
            price: 4.99,
            categoryId: 'fastfood',
            isActive: true
          },
          quantity: 1,
          price: 4.99,
          subtotal: 4.99
        }
      ]
    }
    
  } catch (err) {
    error.value = 'Failed to load order details'
    console.error('Error loading order:', err)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatReceiptDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

const reorderItems = () => {
  if (order.value) {
    order.value.items.forEach(item => {
      cartStore.addItem(item.menuItem, item.quantity)
    })
    router.push('/cart')
  }
}

const shareOrder = () => {
  if (navigator.share && order.value) {
    navigator.share({
      title: `Order #${order.value.id}`,
      text: `Check out my order from Menu Ordering App`,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
  }
}

const cancelOrder = async () => {
  if (order.value && confirm('Are you sure you want to cancel this order?')) {
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
  if (tabFromQuery && tabs.some(tab => tab.id === tabFromQuery)) {
    activeTab.value = tabFromQuery
  }
})

// Update page title
watchEffect(() => {
  if (order.value) {
    useHead({
      title: `Order #${order.value.id} - Menu Ordering App`
    })
  }
})
</script>