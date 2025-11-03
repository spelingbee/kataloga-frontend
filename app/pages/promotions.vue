<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-4">
        <BaseIcon name="tag" size="lg" class="text-primary-orange" />
        <AppHeading level="h1" size="display-md" class="text-white">
          Promotions & Special Offers
        </AppHeading>
      </div>
      <AppText size="body-lg" class="text-neutral-20">
        Save money with our exclusive deals and limited-time offers
      </AppText>
    </div>

    <!-- Featured Promotion -->
    <div v-if="featuredPromotion" class="px-6 mb-8">
      <div class="relative bg-gradient-to-r from-primary-orange to-primary-red rounded-2xl p-8 overflow-hidden">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"></div>
          <div class="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full"></div>
        </div>
        
        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-4">
            <BaseBadge variant="success" size="lg">
              <BaseIcon name="star" size="sm" class="mr-2" />
              Featured Deal
            </BaseBadge>
            <BaseBadge variant="warning" size="sm">
              Limited Time
            </BaseBadge>
          </div>
          
          <AppHeading level="h2" size="display-md" class="text-white mb-4">
            {{ featuredPromotion.title }}
          </AppHeading>
          
          <AppText size="body-lg" class="text-white/90 mb-6 max-w-2xl">
            {{ featuredPromotion.description }}
          </AppText>
          
          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="flex items-center gap-4">
              <div class="text-center">
                <AppText size="display-lg" class="text-white font-bold">
                  {{ featuredPromotion.discountValue }}{{ featuredPromotion.discountType === 'percentage' ? '%' : '$' }}
                </AppText>
                <AppText size="body-sm" class="text-white/80">
                  {{ featuredPromotion.discountType === 'percentage' ? 'OFF' : 'DISCOUNT' }}
                </AppText>
              </div>
              
              <div class="text-center">
                <AppText size="body-lg" class="text-white font-semibold">
                  {{ getTimeRemaining(featuredPromotion.validTo) }}
                </AppText>
                <AppText size="body-sm" class="text-white/80">
                  Time Left
                </AppText>
              </div>
            </div>
            
            <div class="flex gap-3">
              <BaseButton 
                variant="secondary"
                size="lg"
                @click="usePromotion(featuredPromotion)"
                class="bg-white text-primary-orange hover:bg-white/90"
              >
                <BaseIcon name="shopping-cart" size="sm" class="mr-2" />
                Use Now
              </BaseButton>
              <BaseButton 
                variant="ghost"
                size="lg"
                @click="sharePromotion(featuredPromotion)"
                class="text-white border-white/30 hover:bg-white/10"
              >
                <BaseIcon name="share" size="sm" class="mr-2" />
                Share
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Options -->
    <div class="px-6 mb-8">
      <div class="flex flex-wrap gap-2 mb-4">
        <BaseButton
          :variant="activeFilter === 'all' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('all')"
        >
          All Offers
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'active' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('active')"
        >
          Active Now
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'percentage' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('percentage')"
        >
          Percentage Off
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'fixed' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('fixed')"
        >
          Fixed Amount
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'expiring' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('expiring')"
        >
          Expiring Soon
        </BaseButton>
      </div>
      
      <AppText size="body-sm" class="text-neutral-20">
        {{ filteredPromotions.length }} offer{{ filteredPromotions.length !== 1 ? 's' : '' }} available
      </AppText>
    </div>

    <!-- Promotions Grid -->
    <div class="px-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
        <AppText class="text-neutral-20">Loading promotions...</AppText>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPromotions.length === 0" class="text-center py-16">
        <BaseIcon name="tag" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
          No promotions found
        </AppHeading>
        <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
          {{ activeFilter === 'all' ? 
            'Check back later for new deals and special offers.' : 
            `No ${activeFilter} promotions are currently available.` 
          }}
        </AppText>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/menu">
            <BaseButton variant="primary">
              <BaseIcon name="utensils" size="sm" class="mr-2" />
              Browse Menu
            </BaseButton>
          </NuxtLink>
          <BaseButton 
            v-if="activeFilter !== 'all'"
            variant="secondary"
            @click="setFilter('all')"
          >
            View All Offers
          </BaseButton>
        </div>
      </div>

      <!-- Promotions List -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="promotion in filteredPromotions"
          :key="promotion.id"
          class="bg-background-card rounded-xl overflow-hidden hover:bg-background-card/80 transition-all duration-300 hover:scale-105"
        >
          <!-- Promotion Header -->
          <div class="p-6 pb-4">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <BaseBadge 
                  :variant="promotion.isActive ? 'success' : 'secondary'"
                  size="sm"
                >
                  {{ promotion.isActive ? 'Active' : 'Inactive' }}
                </BaseBadge>
                <BaseBadge 
                  v-if="isExpiringSoon(promotion.validTo)"
                  variant="warning"
                  size="sm"
                >
                  <BaseIcon name="clock" size="xs" class="mr-1" />
                  Expiring Soon
                </BaseBadge>
              </div>
              
              <BaseButton
                variant="ghost"
                size="sm"
                @click="sharePromotion(promotion)"
              >
                <BaseIcon name="share" size="sm" />
              </BaseButton>
            </div>

            <!-- Discount Display -->
            <div class="text-center mb-4">
              <div class="w-20 h-20 bg-primary-orange/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AppText size="heading-lg" class="text-primary-orange font-bold">
                  {{ promotion.discountValue }}{{ promotion.discountType === 'percentage' ? '%' : '$' }}
                </AppText>
              </div>
              <AppText size="caption" class="text-neutral-20">
                {{ promotion.discountType === 'percentage' ? 'Discount' : 'Off Your Order' }}
              </AppText>
            </div>

            <!-- Promotion Details -->
            <AppHeading level="h3" size="heading-md" class="text-white mb-2 text-center">
              {{ promotion.title }}
            </AppHeading>
            
            <AppText size="body-sm" class="text-neutral-20 text-center mb-4">
              {{ promotion.description }}
            </AppText>

            <!-- Validity Period -->
            <div class="text-center mb-4">
              <AppText size="caption" class="text-neutral-20">
                Valid until {{ formatDate(promotion.validTo) }}
              </AppText>
              <AppText size="caption" class="text-primary-orange">
                {{ getTimeRemaining(promotion.validTo) }} remaining
              </AppText>
            </div>
          </div>

          <!-- Promotion Actions -->
          <div class="px-6 pb-6">
            <div class="flex gap-2">
              <BaseButton 
                variant="primary"
                size="sm"
                class="flex-1"
                @click="usePromotion(promotion)"
                :disabled="!promotion.isActive"
              >
                <BaseIcon name="shopping-cart" size="sm" class="mr-2" />
                {{ promotion.isActive ? 'Use Now' : 'Expired' }}
              </BaseButton>
              <BaseButton 
                variant="ghost"
                size="sm"
                @click="savePromotion(promotion)"
              >
                <BaseIcon name="bookmark" size="sm" />
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Newsletter Signup -->
    <div class="px-6 py-12 mt-12 border-t border-neutral-80/20">
      <div class="max-w-2xl mx-auto text-center">
        <BaseIcon name="mail" size="4xl" class="text-primary-green mx-auto mb-6" />
        <AppHeading level="h2" size="heading-xl" class="text-white mb-4">
          Never Miss a Deal
        </AppHeading>
        <AppText class="text-neutral-20 mb-8">
          Subscribe to our newsletter and be the first to know about exclusive promotions and special offers.
        </AppText>
        
        <form @submit.prevent="subscribeNewsletter" class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <BaseInput
            v-model="newsletterEmail"
            type="email"
            placeholder="Enter your email"
            class="flex-1"
            required
          />
          <BaseButton 
            type="submit"
            variant="primary"
            :disabled="subscribing"
          >
            <BaseIcon 
              v-if="subscribing"
              name="loader" 
              size="sm" 
              class="mr-2 animate-spin" 
            />
            Subscribe
          </BaseButton>
        </form>
        
        <AppText size="caption" class="text-neutral-20 mt-4">
          You can unsubscribe at any time. We respect your privacy.
        </AppText>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-6 py-8 border-t border-neutral-80/20">
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink to="/menu">
          <BaseButton variant="secondary">
            <BaseIcon name="utensils" size="sm" class="mr-2" />
            Browse Menu
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/orders">
          <BaseButton variant="ghost">
            <BaseIcon name="receipt" size="sm" class="mr-2" />
            Order History
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/notifications">
          <BaseButton variant="ghost">
            <BaseIcon name="bell" size="sm" class="mr-2" />
            Notifications
          </BaseButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Promotion } from '~/types'

// Page setup
definePageMeta({
  title: 'Promotions & Offers - Menu Ordering App'
})

// Stores
const router = useRouter()

// Reactive state
const loading = ref(false)
const activeFilter = ref('all')
const newsletterEmail = ref('')
const subscribing = ref(false)

// Mock promotions data
const promotions = ref<Promotion[]>([
  {
    id: '1',
    title: 'Weekend Special',
    description: 'Get 20% off on all orders this weekend. Perfect for family dinners!',
    discountType: 'percentage',
    discountValue: 20,
    validFrom: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    validTo: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
    isActive: true
  },
  {
    id: '2',
    title: 'Free Delivery',
    description: 'Enjoy free delivery on orders over $25. No minimum order required!',
    discountType: 'fixed',
    discountValue: 5,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 604800000).toISOString(), // 1 week from now
    isActive: true
  },
  {
    id: '3',
    title: 'Student Discount',
    description: 'Students get 15% off with valid student ID. Show your ID at pickup.',
    discountType: 'percentage',
    discountValue: 15,
    validFrom: new Date(Date.now() - 2592000000).toISOString(), // 1 month ago
    validTo: new Date(Date.now() + 2592000000).toISOString(), // 1 month from now
    isActive: true
  },
  {
    id: '4',
    title: 'First Order Special',
    description: 'New customers get $10 off their first order. Welcome to our family!',
    discountType: 'fixed',
    discountValue: 10,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    isActive: true
  },
  {
    id: '5',
    title: 'Loyalty Reward',
    description: 'Loyal customers get 25% off after 10 orders. Thank you for your support!',
    discountType: 'percentage',
    discountValue: 25,
    validFrom: new Date(Date.now() - 86400000).toISOString(),
    validTo: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    isActive: true
  },
  {
    id: '6',
    title: 'Holiday Special',
    description: 'Celebrate the holidays with 30% off all desserts and drinks.',
    discountType: 'percentage',
    discountValue: 30,
    validFrom: new Date(Date.now() - 172800000).toISOString(),
    validTo: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
    isActive: false
  }
])

// Computed
const featuredPromotion = computed(() => {
  return promotions.value.find(p => p.isActive && p.discountValue >= 20) || promotions.value[0]
})

const filteredPromotions = computed(() => {
  let filtered = promotions.value

  switch (activeFilter.value) {
    case 'active':
      filtered = filtered.filter(p => p.isActive)
      break
    case 'percentage':
      filtered = filtered.filter(p => p.discountType === 'percentage')
      break
    case 'fixed':
      filtered = filtered.filter(p => p.discountType === 'fixed')
      break
    case 'expiring':
      filtered = filtered.filter(p => isExpiringSoon(p.validTo))
      break
  }

  return filtered.sort((a, b) => {
    // Sort by active status first, then by discount value
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1
    }
    return b.discountValue - a.discountValue
  })
})

// Methods
const setFilter = (filter: string) => {
  activeFilter.value = filter
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

const getTimeRemaining = (validTo: string) => {
  const now = new Date()
  const endDate = new Date(validTo)
  const diffTime = endDate.getTime() - now.getTime()
  
  if (diffTime <= 0) return 'Expired'
  
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  
  if (diffDays > 1) {
    return `${diffDays} days`
  } else if (diffHours > 1) {
    return `${diffHours} hours`
  } else {
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))
    return `${diffMinutes} minutes`
  }
}

const isExpiringSoon = (validTo: string) => {
  const now = new Date()
  const endDate = new Date(validTo)
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  return diffDays <= 3 && diffDays > 0 // Expiring within 3 days
}

const usePromotion = (promotion: Promotion) => {
  if (!promotion.isActive) return
  
  // Store the promotion code or apply it to the cart
  // For now, just navigate to menu
  router.push({
    path: '/menu',
    query: { promo: promotion.id }
  })
}

const sharePromotion = (promotion: Promotion) => {
  if (navigator.share) {
    navigator.share({
      title: promotion.title,
      text: promotion.description,
      url: `${window.location.origin}/promotions?promo=${promotion.id}`
    })
  } else {
    // Fallback: copy to clipboard
    const shareText = `${promotion.title}: ${promotion.description} - ${window.location.origin}/promotions?promo=${promotion.id}`
    navigator.clipboard.writeText(shareText)
  }
}

const savePromotion = (promotion: Promotion) => {
  // Save promotion to user's saved promotions
  console.log('Saving promotion:', promotion.id)
  // In a real app, this would save to backend or local storage
}

const subscribeNewsletter = async () => {
  if (!newsletterEmail.value) return
  
  subscribing.value = true
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Show success message
    alert('Successfully subscribed to newsletter!')
    newsletterEmail.value = ''
    
  } catch (error) {
    console.error('Failed to subscribe:', error)
    alert('Failed to subscribe. Please try again.')
  } finally {
    subscribing.value = false
  }
}

// Initialize
onMounted(() => {
  // Check for promotion ID in query params
  const route = useRoute()
  const promoFromQuery = route.query.promo as string
  if (promoFromQuery) {
    const promotion = promotions.value.find(p => p.id === promoFromQuery)
    if (promotion) {
      // Highlight or scroll to the specific promotion
      console.log('Highlighting promotion:', promotion.title)
    }
  }
})
</script>