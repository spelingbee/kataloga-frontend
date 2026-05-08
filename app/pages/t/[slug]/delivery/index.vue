<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-4">
        <BaseIcon name="truck" size="lg" class="text-primary-green" />
        <AppHeading level="h1" size="display-md" class="text-white">
          {{ $t('delivery_page.title') }}
        </AppHeading>
      </div>
      <AppText size="body-lg" class="text-neutral-20">
        {{ $t('delivery_page.subtitle') }}
      </AppText>
    </div>

    <!-- Active Delivery Tracking -->
    <div v-if="activeDelivery" class="px-6 mb-8">
      <BaseCard class="p-6 bg-background-card border-primary-green/30">
        <div class="flex items-center gap-3 mb-4">
          <BaseIcon name="truck" size="md" class="text-primary-green" />
          <AppHeading level="h3" size="heading-lg" class="text-white">
            {{ $t('delivery_page.activeDelivery') }}
          </AppHeading>
          <StatusBadge :status="activeDelivery.status" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Order Info -->
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-2">Order #{{ activeDelivery.orderId }}</AppText>
            <div class="flex items-center gap-4 mb-4">
              <div class="flex items-center gap-2">
                <BaseIcon name="clock" size="sm" class="text-primary-orange" />
                <AppText class="text-white">
                  {{ estimatedTimeText }}
                </AppText>
              </div>
              <div v-if="courierInfo" class="flex items-center gap-2">
                <BaseIcon name="user" size="sm" class="text-primary-green" />
                <AppText class="text-white">
                  {{ courierInfo.name }}
                </AppText>
              </div>
            </div>

            <!-- Delivery Progress -->
            <div class="mb-4">
              <ProgressBar 
                :current="deliveryProgress" 
                :total="100" 
                class="mb-2"
              />
              <AppText size="body-sm" class="text-neutral-20">
                {{ deliveryStatusText }}
              </AppText>
            </div>

            <!-- Courier Contact -->
            <div v-if="courierInfo" class="flex gap-2">
              <BaseButton 
                variant="secondary" 
                size="sm"
                @click="callCourier"
              >
                <BaseIcon name="phone" size="sm" class="mr-2" />
                {{ $t('delivery_page.callCourier') }}
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                size="sm"
                @click="showTrackingDetails = true"
              >
                <BaseIcon name="map" size="sm" class="mr-2" />
                {{ $t('delivery_page.trackOnMap') }}
              </BaseButton>
            </div>
          </div>

          <!-- Delivery Map Preview -->
          <div class="bg-neutral-80/20 rounded-lg h-48 flex items-center justify-center">
            <div class="text-center">
              <BaseIcon name="map" size="xl" class="text-neutral-80 mx-auto mb-2" />
              <AppText size="body-sm" class="text-neutral-20">
                {{ $t('delivery_page.liveTrackingMap') }}
              </AppText>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Delivery Options -->
    <div class="px-6 mb-8">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        {{ $t('delivery_page.deliveryOptions') }}
      </AppHeading>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Standard Delivery -->
        <BaseCard class="p-6 bg-background-card">
          <div class="flex items-center gap-3 mb-4">
            <BaseIcon name="truck" size="lg" class="text-primary-green" />
            <div>
              <AppHeading level="h3" size="heading-md" class="text-white">
                {{ $t('delivery_page.standardDelivery') }}
              </AppHeading>
              <AppText size="body-sm" class="text-neutral-20">
                30-45 minutes
              </AppText>
            </div>
          </div>
          <AppText class="text-neutral-20 mb-4">
            Regular delivery to your address with real-time tracking
          </AppText>
          <div class="flex items-center justify-between">
            <AppPrice :price="2.99" size="lg" />
            <AppText size="body-sm" class="text-primary-green">
              {{ $t('delivery_page.mostPopular') }}
            </AppText>
          </div>
        </BaseCard>

        <!-- Express Delivery -->
        <BaseCard class="p-6 bg-background-card border-primary-orange/30">
          <div class="flex items-center gap-3 mb-4">
            <BaseIcon name="zap" size="lg" class="text-primary-orange" />
            <div>
              <AppHeading level="h3" size="heading-md" class="text-white">
                {{ $t('delivery_page.expressDelivery') }}
              </AppHeading>
              <AppText size="body-sm" class="text-neutral-20">
                15-25 minutes
              </AppText>
            </div>
          </div>
          <AppText class="text-neutral-20 mb-4">
            Priority delivery for when you need it fast
          </AppText>
          <div class="flex items-center justify-between">
            <AppPrice :price="5.99" size="lg" />
            <AppText size="body-sm" class="text-primary-orange">
              {{ $t('delivery_page.fastest') }}
            </AppText>
          </div>
        </BaseCard>

        <!-- Pickup -->
        <BaseCard class="p-6 bg-background-card">
          <div class="flex items-center gap-3 mb-4">
            <BaseIcon name="store" size="lg" class="text-primary-red" />
            <div>
              <AppHeading level="h3" size="heading-md" class="text-white">
                {{ $t('delivery_page.pickup') }}
              </AppHeading>
              <AppText size="body-sm" class="text-neutral-20">
                15-20 minutes
              </AppText>
            </div>
          </div>
          <AppText class="text-neutral-20 mb-4">
            Collect your order from the restaurant
          </AppText>
          <div class="flex items-center justify-between">
            <AppPrice :price="0" size="lg" />
            <AppText size="body-sm" class="text-primary-green">
              {{ $t('delivery_page.free') }}
            </AppText>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Delivery Zones -->
    <div class="px-6 mb-8">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        {{ $t('delivery_page.deliveryAreas') }}
      </AppHeading>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Zone List -->
        <div>
          <div class="space-y-3">
            <div
              v-for="zone in deliveryZones"
              :key="zone.id"
              class="bg-background-card rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <AppHeading level="h4" size="heading-sm" class="text-white mb-1">
                  {{ zone.name }}
                </AppHeading>
                <AppText size="body-sm" class="text-neutral-20">
                  {{ $t('delivery_page.minOrder') }} {{ zone.minOrderAmount }}
                </AppText>
              </div>
              <div class="text-right">
                <AppPrice :price="parseFloat(zone.deliveryFee)" size="md" />
                <AppText size="caption" class="text-neutral-20">
                  {{ $t('delivery_page.deliveryFee') }}
                </AppText>
              </div>
            </div>
          </div>

          <!-- Check Address -->
          <div class="mt-6 bg-background-card rounded-xl p-4">
            <AppHeading level="h4" size="heading-sm" class="text-white mb-3">
              {{ $t('delivery_page.checkAvailability') }}
            </AppHeading>
            <div class="flex gap-2">
              <BaseInput
                v-model="addressToCheck"
                :placeholder="$t('delivery_page.enterAddress')"
                class="flex-1"
              />
              <BaseButton 
                :disabled="!addressToCheck.trim()"
                @click="checkDeliveryAvailability"
              >
                {{ $t('delivery_page.check') }}
              </BaseButton>
            </div>
            <div v-if="deliveryCheckResult" class="mt-3">
              <AppText 
                :class="deliveryCheckResult.available ? 'text-primary-green' : 'text-primary-red'"
              >
                {{ deliveryCheckResult.message }}
              </AppText>
            </div>
          </div>
        </div>

        <!-- Zone Map -->
        <div class="bg-background-card rounded-xl p-4">
          <div class="w-full h-64 bg-neutral-80/20 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <BaseIcon name="map" size="xl" class="text-neutral-80 mx-auto mb-2" />
              <AppText class="text-white mb-1">{{ $t('delivery_page.zoneMap') }}</AppText>
              <AppText size="body-sm" class="text-neutral-20">
                {{ $t('delivery_page.interactiveMap') }}
              </AppText>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Deliveries -->
    <div class="px-6 mb-8">
      <div class="flex items-center justify-between mb-6">
        <AppHeading level="h2" size="heading-xl" class="text-white">
          {{ $t('delivery_page.recentDeliveries') }}
        </AppHeading>
        <NuxtLink to="/orders">
          <BaseButton variant="secondary" size="sm">
            {{ $t('orders.viewAll') }}
          </BaseButton>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="delivery in recentDeliveries"
          :key="delivery.id"
          class="bg-background-card rounded-xl p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <AppText size="body-sm" class="text-neutral-20">
              Order #{{ delivery.orderId }}
            </AppText>
            <StatusBadge :status="delivery.status" size="sm" />
          </div>
          
          <AppText class="text-white mb-2">
            {{ formatDeliveryDate(delivery.timestamp) }}
          </AppText>
          
          <div class="flex items-center gap-2">
            <BaseIcon name="clock" size="sm" class="text-neutral-20" />
            <AppText size="body-sm" class="text-neutral-20">
              {{ $t('delivery_page.deliveredIn', { time: delivery.actualTime || 'N/A' }) }}
            </AppText>
          </div>
        </div>
      </div>
    </div>

    <!-- Tracking Details Modal -->
    <BaseModal 
      v-if="showTrackingDetails" 
      title="Live Tracking"
      @close="showTrackingDetails = false"
    >
      <div class="p-6">
        <OrderTracker 
          v-if="activeDelivery"
          :delivery="activeDelivery"
          :courier="courierInfo"
        />
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import type { Delivery, CourierInfo, DeliveryZone } from '~/types'

// Stores
import { useDeliveryStore } from '~/stores/delivery'
import { useLocationStore } from '~/stores/location'

// Page setup
definePageMeta({
  title: 'Delivery'
})

const deliveryStore = useDeliveryStore()
const locationStore = useLocationStore()
const { t } = useI18n()

// Reactive state
const showTrackingDetails = ref(false)
const addressToCheck = ref('')
const deliveryCheckResult = ref<{ available: boolean; message: string } | null>(null)

// Computed
const activeDelivery = computed(() => deliveryStore.activeDelivery)
const courierInfo = computed(() => deliveryStore.courierInfo)
const deliveryZones = computed(() => locationStore.deliveryZones)

const estimatedTimeText = computed(() => {
  if (!activeDelivery.value?.estimatedTime) return t('delivery_page.calculating')
  const minutes = activeDelivery.value.estimatedTime
  return t('delivery_page.minutesRemaining', { count: minutes })
})

const deliveryProgress = computed(() => {
  if (!activeDelivery.value) return 0
  
  const statusProgress = {
    'pending': 10,
    'assigned': 25,
    'picked_up': 50,
    'in_transit': 75,
    'delivered': 100
  }
  
  return statusProgress[activeDelivery.value.status] || 0
})

const deliveryStatusText = computed(() => {
  if (!activeDelivery.value) return ''
  
  const statusTexts = {
    'pending': t('delivery_page.statuses.pending'),
    'assigned': t('delivery_page.statuses.assigned'),
    'picked_up': t('delivery_page.statuses.picked_up'),
    'in_transit': t('delivery_page.statuses.in_transit'),
    'delivered': t('delivery_page.statuses.delivered')
  }
  
  return statusTexts[activeDelivery.value.status] || t('delivery_page.statuses.unknown')
})

// Sample data - will be replaced with real data from API
const recentDeliveries = ref([
  {
    id: '1',
    orderId: '12345',
    status: 'delivered' as const,
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    actualTime: 28
  },
  {
    id: '2',
    orderId: '12344',
    status: 'delivered' as const,
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    actualTime: 35
  },
  {
    id: '3',
    orderId: '12343',
    status: 'delivered' as const,
    timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    actualTime: 22
  }
])

// Methods
const callCourier = () => {
  if (courierInfo.value?.phone) {
    window.open(`tel:${courierInfo.value.phone}`)
  }
}

const checkDeliveryAvailability = () => {
  // Simulate API call
  const isAvailable = Math.random() > 0.3 // 70% chance of availability
  
  deliveryCheckResult.value = {
    available: isAvailable,
    message: isAvailable 
      ? t('delivery_page.results.available')
      : t('delivery_page.results.notAvailable')
  }
}

const formatDeliveryDate = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return t('common.yesterday') || 'Yesterday'
  if (diffDays <= 7) return t('common.daysAgo', { count: diffDays }) || `${diffDays} days ago`
  return date.toLocaleDateString()
}

// Initialize
onMounted(() => {
  // Check for active deliveries
  if (activeDelivery.value) {
    deliveryStore.getCourierContacts()
  }
})
</script>
