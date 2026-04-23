<template>
  <div class="promotions-page">
    <!-- Header Section -->
    <header class="promotions-header">
      <div class="promotions-header__content">
        <div class="promotions-header__title-group">
          <BaseIcon name="tag" size="lg" class="promotions-header__icon" />
          <AppHeading level="h1" size="display-md" class="promotions-header__title">
            {{ $t('promotions.title', 'Акции и спецпредложения') }}
          </AppHeading>
        </div>
        <AppText size="body-lg" class="promotions-header__subtitle">
          {{ $t('promotions.subtitle', 'Экономьте с нашими эксклюзивными предложениями') }}
        </AppText>
      </div>
    </header>

    <!-- Featured Promotion -->
    <section v-if="featuredPromotion" class="promotions-featured">
      <div class="featured-card">
        <div class="featured-card__pattern">
          <div class="pattern-circle pattern-circle--1" />
          <div class="pattern-circle pattern-circle--2" />
        </div>
        
        <div class="featured-card__content">
          <div class="featured-card__badges">
            <BaseBadge variant="success" size="lg">
              <BaseIcon name="star" size="sm" class="u-mr-2" />
              {{ $t('promotions.featured', 'Лучшее предложение') }}
            </BaseBadge>
            <BaseBadge variant="warning" size="sm">
              {{ $t('promotions.limited', 'Ограничено') }}
            </BaseBadge>
          </div>
          
          <AppHeading level="h2" size="display-md" class="featured-card__title">
            {{ featuredPromotion.title }}
          </AppHeading>
          
          <AppText size="body-lg" class="featured-card__description">
            {{ featuredPromotion.description }}
          </AppText>
          
          <div class="featured-card__footer">
            <div class="featured-card__stats">
              <div class="stat-item">
                <AppText size="display-lg" class="stat-item__value">
                  {{ featuredPromotion.discountValue }}{{ featuredPromotion.discountType === 'percentage' ? '%' : '$' }}
                </AppText>
                <AppText size="body-sm" class="stat-item__label">
                  {{ featuredPromotion.discountType === 'percentage' ? 'СКИДКА' : 'ЭКОНОМИЯ' }}
                </AppText>
              </div>
              
              <div class="stat-item">
                <AppText size="body-lg" class="stat-item__value">
                  {{ getTimeRemaining(featuredPromotion.validTo) }}
                </AppText>
                <AppText size="body-sm" class="stat-item__label">
                  {{ $t('promotions.timeLeft', 'Осталось') }}
                </AppText>
              </div>
            </div>
            
            <div class="featured-card__actions">
              <BaseButton 
                variant="secondary"
                size="lg"
                class="featured-card__btn-primary"
                @click="usePromotion(featuredPromotion)"
              >
                <BaseIcon name="shopping-cart" size="sm" class="u-mr-2" />
                {{ $t('promotions.useNow', 'Использовать') }}
              </BaseButton>
              <BaseButton 
                variant="ghost"
                size="lg"
                class="featured-card__btn-ghost"
                @click="sharePromotion(featuredPromotion)"
              >
                <BaseIcon name="share" size="sm" class="u-mr-2" />
                {{ $t('common.share', 'Поделиться') }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Filter Options -->
    <div class="promotions-filters">
      <div class="promotions-filters__scroll">
        <BaseButton
          :variant="activeFilter === 'all' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('all')"
        >
          {{ $t('common.all', 'Все акции') }}
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'active' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('active')"
        >
          {{ $t('promotions.active', 'Активные') }}
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'percentage' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('percentage')"
        >
          {{ $t('promotions.filterPercent', '% Скидки') }}
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'fixed' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('fixed')"
        >
          {{ $t('promotions.filterFixed', 'Сумма') }}
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'expiring' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('expiring')"
        >
          {{ $t('promotions.filterExpiring', 'Сгорают') }}
        </BaseButton>
      </div>
      
      <AppText size="body-sm" class="promotions-filters__count">
        {{ filteredPromotions.length }} {{ $t('promotions.offersFound', 'предложений найдено') }}
      </AppText>
    </div>

    <!-- Promotions Grid -->
    <div class="promotions-grid-container">
      <!-- Loading State -->
      <div v-if="loading" class="promotions-state promotions-state--loading">
        <div class="promotions-state__spinner"/>
        <AppText>{{ $t('common.loading', 'Загрузка...') }}</AppText>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPromotions.length === 0" class="promotions-state promotions-state--empty">
        <BaseIcon name="tag" size="4xl" class="promotions-state__icon" />
        <AppHeading level="h3" size="heading-lg" class="promotions-state__title">
          {{ $t('promotions.notFound', 'Ничего не найдено') }}
        </AppHeading>
        <AppText class="promotions-state__desc">
          {{ activeFilter === 'all' ? 
            $t('promotions.emptyAll', 'Следите за обновлениями, новые акции скоро появятся.') : 
            $t('promotions.emptyFilter', 'Нет подходящих акций в данный момент.') 
          }}
        </AppText>
        <div class="promotions-state__actions">
          <NuxtLink :to="tPath('/menu')">
            <BaseButton variant="primary">
              <BaseIcon name="utensils" size="sm" class="u-mr-2" />
              {{ $t('common.browseMenu', 'В меню') }}
            </BaseButton>
          </NuxtLink>
          <BaseButton 
            v-if="activeFilter !== 'all'"
            variant="secondary"
            @click="setFilter('all')"
          >
            {{ $t('promotions.showAll', 'Все акции') }}
          </BaseButton>
        </div>
      </div>

      <!-- Promotions List -->
      <div v-else class="promotions-grid">
        <div
          v-for="promotion in filteredPromotions"
          :key="promotion.id"
          class="promotion-card"
        >
          <!-- Promotion Header -->
          <div class="promotion-card__header">
            <div class="promotion-card__badges">
              <BaseBadge 
                :variant="promotion.isActive ? 'success' : 'secondary'"
                size="sm"
              >
                {{ promotion.isActive ? $t('promotions.statusActive', 'Активна') : $t('promotions.statusInactive', 'Истекла') }}
              </BaseBadge>
              <BaseBadge 
                v-if="isExpiringSoon(promotion.validTo)"
                variant="warning"
                size="sm"
              >
                <BaseIcon name="clock" size="xs" class="u-mr-1" />
                {{ $t('promotions.expiringSoon', 'Скоро сгорит') }}
              </BaseBadge>
            </div>
            
            <BaseButton
              variant="ghost"
              size="sm"
              class="promotion-card__share"
              @click="sharePromotion(promotion)"
            >
              <BaseIcon name="share" size="sm" />
            </BaseButton>
          </div>

          <!-- Discount Display -->
          <div class="promotion-card__main">
            <div class="discount-badge">
              <AppText size="heading-lg" class="discount-badge__value">
                {{ promotion.discountValue }}{{ promotion.discountType === 'percentage' ? '%' : '$' }}
              </AppText>
            </div>
            <AppText size="caption" class="discount-badge__label">
              {{ promotion.discountType === 'percentage' ? $t('promotions.discount', 'Скидка') : $t('promotions.offOrder', 'Минус от счета') }}
            </AppText>
          </div>

          <!-- Promotion Details -->
          <div class="promotion-card__info">
            <AppHeading level="h3" size="heading-md" class="promotion-card__title">
              {{ promotion.title }}
            </AppHeading>
            
            <AppText size="body-sm" class="promotion-card__desc">
              {{ promotion.description }}
            </AppText>

            <!-- Validity Period -->
            <div class="promotion-card__validity">
              <AppText size="caption" class="validity-date">
                {{ $t('promotions.validUntil', 'До') }} {{ formatDate(promotion.validTo) }}
              </AppText>
              <AppText size="caption" class="validity-remaining">
                {{ getTimeRemaining(promotion.validTo) }} {{ $t('promotions.remaining', 'осталось') }}
              </AppText>
            </div>
          </div>

          <!-- Promotion Actions -->
          <div class="promotion-card__actions">
            <BaseButton 
              variant="primary"
              size="sm"
              class="u-flex-1"
              :disabled="!promotion.isActive"
              @click="usePromotion(promotion)"
            >
              <BaseIcon name="shopping-cart" size="sm" class="u-mr-2" />
              {{ promotion.isActive ? $t('promotions.useNow', 'Применить') : $t('promotions.expired', 'Истекла') }}
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

    <!-- Newsletter Signup -->
    <div class="promotions-newsletter">
      <div class="newsletter-container">
        <BaseIcon name="mail" size="4xl" class="newsletter-container__icon" />
        <AppHeading level="h2" size="heading-xl" class="newsletter-container__title">
          {{ $t('promotions.newsletterTitle', 'Не пропускайте выгоду!') }}
        </AppHeading>
        <AppText class="newsletter-container__desc">
          {{ $t('promotions.newsletterDesc', 'Подпишитесь на нашу рассылку и первыми узнавайте об эксклюзивных акциях и спецпредложениях.') }}
        </AppText>
        
        <form class="newsletter-form" @submit.prevent="subscribeNewsletter">
          <BaseInput
            v-model="newsletterEmail"
            type="email"
            :placeholder="$t('promotions.emailPlaceholder', 'Ваш email')"
            class="newsletter-form__input"
            required
          />
          <BaseButton 
            type="submit"
            variant="primary"
            class="newsletter-form__btn"
            :disabled="subscribing"
          >
            <BaseIcon 
              v-if="subscribing"
              name="loader" 
              size="sm" 
              class="u-mr-2 u-animate-spin" 
            />
            {{ $t('promotions.subscribe', 'Подписаться') }}
          </BaseButton>
        </form>
        
        <AppText size="caption" class="newsletter-container__privacy">
          {{ $t('promotions.privacy', 'Вы можете отписаться в любое время. Мы уважаем вашу конфиденциальность.') }}
        </AppText>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="promotions-quick-actions">
      <div class="quick-actions-container">
        <NuxtLink :to="tPath('/menu')">
          <BaseButton variant="secondary">
            <BaseIcon name="utensils" size="sm" class="u-mr-2" />
            {{ $t('common.browseMenu', 'В меню') }}
          </BaseButton>
        </NuxtLink>
        <NuxtLink :to="tPath('/orders')">
          <BaseButton variant="ghost">
            <BaseIcon name="receipt" size="sm" class="u-mr-2" />
            {{ $t('common.orders', 'История заказов') }}
          </BaseButton>
        </NuxtLink>
        <NuxtLink :to="tPath('/notifications')">
          <BaseButton variant="ghost">
            <BaseIcon name="bell" size="sm" class="u-mr-2" />
            {{ $t('common.notifications', 'Уведомления') }}
          </BaseButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Promotion } from '~/types'
import AppText from '~/components/base/AppText.vue'

// Page setup
definePageMeta({
  title: 'Promotions & Offers - Menu Ordering App'
})

// Stores
const router = useRouter()
const { t } = useI18n()
const { tPath } = useTenant()
const { showSuccess, showError } = useNotification()

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
    path: tPath('/menu'),
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
    showSuccess(
      t('promotions.successTitle', 'Успешно!'),
      t('promotions.successDesc', 'Вы подписались на нашу рассылку.')
    )
    newsletterEmail.value = ''
    
  } catch (error) {
    console.error('Failed to subscribe:', error)
    showError(
      t('promotions.errorTitle', 'Ошибка'),
      t('promotions.errorDesc', 'Не удалось подписаться. Попробуйте позже.')
    )
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

<style lang="scss" scoped>
@use '../../../assets/scss/tokens/colors' as *;
@use '../../../assets/scss/tokens/spacing' as *;
@use '../../../assets/scss/tokens/typography' as *;
@use '../../../assets/scss/tokens/radius' as *;
@use '../../../assets/scss/tokens/shadows' as *;
@use '../../../assets/scss/tokens/transitions' as *;
@use '../../../assets/scss/abstracts/mixins' as *;

.promotions-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: $space-12;
}

.promotions-header {
  padding: $space-8 $space-6;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  
  &__content {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__title-group {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-4;
  }

  &__icon {
    color: var(--color-warning);
  }

  &__title {
    color: var(--text-primary);
    margin: 0;
  }

  &__subtitle {
    color: var(--text-secondary);
  }
}

.promotions-featured {
  padding: 0 $space-6;
  margin-bottom: $space-8;
}

.featured-card {
  position: relative;
  background: linear-gradient(135deg, var(--color-warning) 0%, var(--color-error) 100%);
  border-radius: $radius-2xl;
  padding: $space-8;
  overflow: hidden;
  color: white;
  box-shadow: $shadow-lg;

  &__pattern {
    position: absolute;
    inset: 0;
    opacity: 0.1;
    pointer-events: none;
  }

  .pattern-circle {
    position: absolute;
    background: white;
    border-radius: 50%;
    
    &--1 {
      top: 10%;
      right: 5%;
      width: 128px;
      height: 128px;
    }
    
    &--2 {
      bottom: 10%;
      left: 5%;
      width: 96px;
      height: 96px;
    }
  }

  &__content {
    position: relative;
    z-index: 1;
  }

  &__badges {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-bottom: $space-4;
  }

  &__title {
    color: white;
    margin-bottom: $space-4;
  }

  &__description {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: $space-8;
    max-width: 800px;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    gap: $space-8;
    align-items: flex-end;
  }

  &__stats {
    display: flex;
    gap: $space-8;
  }

  .stat-item {
    text-align: center;
    
    &__value {
      color: white;
      font-weight: $font-bold;
      margin-bottom: $space-1;
    }
    
    &__label {
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  &__actions {
    display: flex;
    gap: $space-3;
  }

  &__btn-primary {
    background: white;
    color: var(--color-warning);
    border: none;
    
    &:hover {
      background: rgba(255, 255, 255, 0.9);
    }
  }

  &__btn-ghost {
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.promotions-filters {
  padding: 0 $space-6;
  margin-bottom: $space-8;

  &__scroll {
    display: flex;
    gap: $space-2;
    overflow-x: auto;
    padding-bottom: $space-4;
    -webkit-overflow-scrolling: touch;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__count {
    color: var(--text-secondary);
    margin-top: $space-2;
  }
}

.promotions-grid-container {
  padding: 0 $space-6;
}

.promotions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $space-6;
}

.promotion-card {
  background: var(--bg-card);
  border-radius: $radius-xl;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  transition: all $transition-base;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
    border-color: var(--color-primary);
  }

  &__header {
    padding: $space-6 $space-6 $space-4;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__badges {
    display: flex;
    gap: $space-2;
  }

  &__share {
    color: var(--text-secondary);
    
    &:hover {
      color: var(--color-primary);
    }
  }

  &__main {
    padding: $space-4;
    text-align: center;
  }

  .discount-badge {
    width: 80px;
    height: 80px;
    background: rgba(var(--color-warning-rgb), 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-3;
    
    &__value {
      color: var(--color-warning);
      font-weight: $font-bold;
    }
    
    &__label {
      color: var(--text-secondary);
    }
  }

  &__info {
    padding: 0 $space-6 $space-6;
    flex-grow: 1;
    text-align: center;
  }

  &__title {
    color: var(--text-primary);
    margin-bottom: $space-2;
  }

  &__desc {
    color: var(--text-secondary);
    margin-bottom: $space-4;
  }

  &__validity {
    .validity-date {
      color: var(--text-secondary);
      display: block;
    }
    
    .validity-remaining {
      color: var(--color-warning);
      font-weight: $font-medium;
    }
  }

  &__actions {
    padding: $space-6;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    gap: $space-2;
  }
}

.promotions-state {
  text-align: center;
  padding: $space-16 0;

  &--loading {
    color: var(--text-secondary);
  }

  &__spinner {
    width: 48px;
    height: 48px;
    border: 3px solid var(--bg-secondary);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto $space-4;
  }

  &--empty {
    .promotions-state__icon {
      color: var(--text-muted);
      margin-bottom: $space-6;
    }
    
    .promotions-state__title {
      color: var(--text-primary);
      margin-bottom: $space-4;
    }
    
    .promotions-state__desc {
      color: var(--text-secondary);
      margin-bottom: $space-8;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .promotions-state__actions {
      display: flex;
      gap: $space-4;
      justify-content: center;
    }
  }
}

.promotions-newsletter {
  padding: $space-12 $space-6;
  margin-top: $space-12;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
}

.newsletter-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;

  &__icon {
    color: var(--color-success);
    margin-bottom: $space-6;
  }

  &__title {
    color: var(--text-primary);
    margin-bottom: $space-4;
  }

  &__desc {
    color: var(--text-secondary);
    margin-bottom: $space-8;
  }

  &__privacy {
    color: var(--text-muted);
    margin-top: $space-4;
  }
}

.newsletter-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  max-width: 500px;
  margin: 0 auto;

  @include tablet-up {
    flex-direction: row;
  }

  &__input {
    flex-grow: 1;
  }
}

.promotions-quick-actions {
  padding: $space-8 $space-6;
  border-top: 1px solid var(--border-subtle);
}

.quick-actions-container {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  justify-content: center;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .featured-card {
    padding: $space-6;
    
    &__stats {
      width: 100%;
      justify-content: space-between;
    }
    
    &__actions {
      width: 100%;
      flex-direction: column;
      
      button {
        width: 100%;
      }
    }
  }
}
</style>
