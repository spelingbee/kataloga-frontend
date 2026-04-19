<template>
  <div class="product-page-container">
    <!-- Loading State -->
    <div v-if="loading" class="product-page__state">
      <div class="product-page__spinner" />
      <AppText class="text-neutral-20">Loading dish details...</AppText>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="product-page__state">
      <BaseIcon name="alert-circle" size="4xl" class="text-primary-red mx-auto mb-6" />
      <AppHeading level="h2" size="heading-lg" class="text-white mb-4">
        Dish Not Found
      </AppHeading>
      <AppText class="text-neutral-20 mb-8">
        {{ error }}
      </AppText>
      <div class="flex gap-4 justify-center">
        <BaseButton @click="$router.go(-1)">
          Go Back
        </BaseButton>
        <NuxtLink :to="tPath('/menu')">
          <BaseButton variant="secondary">
            Browse Menu
          </BaseButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Dish Details -->
    <div v-else-if="dish" class="product-page">
      <!-- Header with Navigation -->
      <header class="product-page__header">
        <div class="product-page__header-nav">
          <button 
            class="product-page__nav-btn"
            @click="$router.go(-1)"
          >
            <BaseIcon name="arrow-left" size="md" />
          </button>
          
          <div class="product-page__header-actions">
            <button
              :class="{ 'product-page__nav-btn--active': isFavourite }"
              class="product-page__nav-btn"
              @click="toggleFavourite"
            >
              <BaseIcon :name="isFavourite ? 'heart-filled' : 'heart'" size="md" />
            </button>
            <button class="product-page__nav-btn" @click="shareDish">
              <BaseIcon name="share" size="md" />
            </button>
          </div>
        </div>

        <div class="product-page__hero">
          <div class="product-page__image-wrapper">
            <img 
              :src="dish.imageUrl || '/images/placeholder-dish.svg'" 
              :alt="dish.name" 
              class="product-page__image" 
            />
            <div v-if="isPopular" class="product-page__popular-badge">
              <BaseIcon name="fire" size="xs" />
              {{ $t('common.popular', 'Популярное') }}
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="product-page__content">
        <div class="product-page__main-info">
          <div class="product-page__title-row">
            <h1 class="product-page__title">
              {{ dish.name }}
            </h1>
            <AppPrice :amount="dish.price" size="xl" class="product-page__price" />
          </div>

          <div class="product-page__meta">
            <div v-if="dish.calories" class="product-page__meta-item">
              <BaseIcon name="fire" size="xs" />
              {{ dish.calories }} {{ $t('common.cal', 'ккал') }}
            </div>
            <!-- Rating removed as it was hardcoded -->
          </div>

          <p class="product-page__description">
            {{ dish.description || $t('common.no_description', 'Описание отсутствует') }}
          </p>
        </div>

        <!-- Customization Sections -->
        <div class="product-page__customization">
          <section v-if="dish.ingredients?.length" class="product-page__section">
            <div class="product-page__section-header">
              <h2 class="product-page__section-title">{{ $t('common.ingredients', 'Состав') }}</h2>
            </div>
            <DishIngredients 
              :ingredients="dish.ingredients || []"
              :selected-ingredients="[]"
              class="product-page__ingredients-list"
            />
          </section>

          <section v-if="dish.allergens?.length" class="product-page__section">
            <h2 class="product-page__section-title product-page__section-title--small">{{ $t('common.allergens', 'Аллергены') }}</h2>
            <div class="product-page__allergens-grid">
              <BaseBadge
                v-for="allergen in dish.allergens"
                :key="allergen"
                variant="warning"
                size="sm"
              >
                {{ allergen }}
              </BaseBadge>
            </div>
          </section>
        </div>

        <!-- Related Items -->
        <section v-if="relatedDishes.length > 0" class="product-page__related">
          <h2 class="product-page__related-title">
            {{ $t('common.related', 'Вам также может понравиться') }}
          </h2>
          <MenuItemGrid 
            :items="relatedDishes"
            @item-selected="onRelatedDishSelected"
          />
        </section>
      </div>

      <!-- Sticky Footer / Action Bar -->
      <footer class="product-page__footer">
        <div class="product-page__footer-container">
          <div class="product-page__qty-control">
            <button class="product-page__qty-btn" @click="quantity = Math.max(1, quantity - 1)">
              <BaseIcon name="minus" size="sm" />
            </button>
            <span class="product-page__qty-value">{{ quantity }}</span>
            <button class="product-page__qty-btn" @click="quantity++">
              <BaseIcon name="plus" size="sm" />
            </button>
          </div>
          
          <button 
            class="product-page__add-btn"
            @click="onAddedToCart"
          >
            <span class="product-page__add-text">{{ $t('common.add_to_order', 'В корзину') }}</span>
            <span class="product-page__add-divider"/>
            <span class="product-page__add-price">{{ formatPriceDisplay(totalPrice) }}</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useTenantSettings, useTenant } from '~/composables/useTenant'

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const { formatCurrency } = useTenantSettings()
const { tPath } = useTenant()

const loading = ref(true)
const error = ref<string | null>(null)
const quantity = ref(1)
const dishId = computed(() => route.params.id as string)
const dish = ref<MenuItem | null>(null)
const relatedDishes = ref<MenuItem[]>([])

const isFavourite = computed(() => {
  return dish.value ? menuStore.favourites.some(fav => fav.id === dish.value!.id) : false
})

const isPopular = computed(() => dish.value?.isPopular || false)

const totalPrice = computed(() => {
  if (!dish.value) return 0
  return dish.value.price * quantity.value
})

const loadDish = async () => {
  // If dish exists in store, use it immediately for faster load
  const cachedDish = menuStore.getMenuItemById(dishId.value)
  if (cachedDish) {
    dish.value = cachedDish
    loading.value = false
    // Still fetch fresh data in background
  }

  try {
    const response = await menuStore.fetchMenuItem(dishId.value)
    if (response) {
      dish.value = response
      if (response.categoryId) {
        relatedDishes.value = menuStore.itemsByCategory[response.categoryId]?.slice(0, 4) || []
      }
    } else if (!dish.value) {
      throw new Error('Dish not found')
    }
  } catch (err) {
    if (!dish.value) {
      error.value = err instanceof Error ? err.message : 'Failed to load'
    }
  } finally {
    loading.value = false
  }
}

const toggleFavourite = () => {
  if (dish.value) menuStore.toggleFavourite(dish.value.id)
}

const shareDish = () => {
  if (navigator.share && dish.value) {
    navigator.share({ title: dish.value.name, url: window.location.href })
  }
}

const onAddedToCart = () => {
  if (dish.value) {
    const cartStore = useCartStore()
    cartStore.addItem(dish.value, quantity.value)
    router.push(tPath('/checkout'))
  }
}

const onRelatedDishSelected = (item: MenuItem) => router.push(tPath(`/dish/${item.id}`))
const formatPriceDisplay = (price: number) => formatCurrency(price)

onMounted(loadDish)
watch(() => dishId.value, loadDish)
</script>

<style lang="scss" scoped>
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/typography' as *;
@use '~/assets/scss/tokens/transitions' as *;
@use '~/assets/scss/tokens/shadows' as *;

.product-page-container {
  min-height: 100vh;
  background: var(--bg-primary);
}

.product-page {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.product-page__header {
  position: relative;
  width: 100%;
}

.product-page__header-nav {
  position: absolute;
  top: $space-4;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 0 $space-4;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-page__nav-btn {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-full;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-md;
  color: var(--text-primary);
  cursor: pointer;
  transition: all $transition-base;
  padding: 0;
  
  &:hover {
    background: var(--bg-secondary);
    transform: scale(1.05);
    border-color: var(--color-primary);
  }

  &--active {
    color: var(--color-error);
    border-color: var(--color-error);
  }
}

.product-page__header-actions {
  display: flex;
  gap: $space-2;
}

.product-page__hero {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--bg-secondary);
}

.product-page__image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.product-page__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-page__popular-badge {
  position: absolute;
  bottom: $space-4;
  left: $space-4;
  background: var(--color-primary);
  color: white;
  padding: $space-1 $space-3;
  border-radius: $radius-full;
  font-size: $text-xs;
  font-weight: $font-bold;
  display: flex;
  align-items: center;
  gap: $space-1;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.product-page__content {
  flex: 1;
  padding: $space-6 $space-4 $space-32;
  background: var(--bg-primary);
  border-top-left-radius: $radius-xl;
  border-top-right-radius: $radius-xl;
  margin-top: -$radius-xl;
  position: relative;
  z-index: 5;
}

.product-page__title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-2;
}

.product-page__title {
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  padding-right: $space-4;
  font-size: $text-2xl;
  font-weight: $font-bold;
}

.product-page__meta {
  display: flex;
  gap: $space-4;
  margin-bottom: $space-4;
}

.product-page__meta-item {
  display: flex;
  align-items: center;
  gap: $space-1;
  font-size: $text-sm;
  color: var(--text-secondary);
}

.product-page__meta-icon--star {
  color: var(--color-warning);
}

.product-page__description {
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  margin-bottom: $space-8;
  font-size: $text-base;
}

.product-page__section {
  margin-bottom: $space-8;
}

.product-page__section-header {
  margin-bottom: $space-4;
}

.product-page__section-title {
  color: var(--text-primary);
  font-size: $text-lg;
  font-weight: $font-bold;

  &--small {
    font-size: $text-base;
    margin-bottom: $space-2;
  }
}

.product-page__allergens-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.product-page__related {
  margin-top: $space-12;
  padding-top: $space-8;
  border-top: 1px solid var(--border-primary);
}

.product-page__related-title {
  color: var(--text-primary);
  margin-bottom: $space-6;
  font-size: $text-xl;
  font-weight: $font-bold;
}

.product-page__footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $space-4 $space-4 calc($space-4 + env(safe-area-inset-bottom));
  background: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
  z-index: 100;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  background: rgba(var(--bg-primary-rgb), 0.9);
}

.product-page__footer-container {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  gap: $space-3;
}

.product-page__qty-control {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: $radius-full;
  padding: $space-1;
  border: 1px solid var(--border-primary);
}

.product-page__qty-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-base;
  border-radius: $radius-full;

  &:hover {
    background: var(--bg-tertiary);
  }
}

.product-page__qty-value {
  min-width: 32px;
  text-align: center;
  font-weight: $font-bold;
  color: var(--text-primary);
  font-size: $text-base;
}

.product-page__add-btn {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-3;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: $radius-full;
  font-weight: $font-bold;
  font-size: $text-base;
  cursor: pointer;
  transition: all $transition-base;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);

  &:hover {
    background: var(--color-primary-light);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.product-page__add-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
}

.product-page__add-price {
  font-weight: $font-bold;
}

.product-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: $space-10;
}

.product-page__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--bg-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: $space-6;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .product-page__hero {
    aspect-ratio: 4 / 3;
  }
}
</style>
