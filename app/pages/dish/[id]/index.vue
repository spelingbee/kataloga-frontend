<template>
  <div class="dish-detail">
    <!-- Loading State -->
    <div v-if="loading" class="dish-detail__loading">
      <div class="dish-detail__spinner">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">Loading dish details...</AppText>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="dish-detail__error">
      <div class="dish-detail__error-content">
        <BaseIcon name="alert-circle" size="4xl" class="text-primary-red mx-auto mb-6" />
        <AppHeading level="h2" size="heading-lg" class="dish-detail__error-title">
          Dish Not Found
        </AppHeading>
        <AppText class="dish-detail__error-text">
          {{ error }}
        </AppText>
        <div class="dish-detail__error-actions">
          <BaseButton @click="router.go(-1)">
            Go Back
          </BaseButton>
          <NuxtLink to="/menu">
            <BaseButton variant="secondary">
              Browse Menu
            </BaseButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Dish Details -->
    <div v-else-if="dish" class="dish-detail__content-wrapper">
      <!-- Header with Navigation -->
      <div class="dish-detail__header">
        <div class="dish-detail__nav">
          <BaseButton 
            variant="ghost" 
            class="dish-detail__back-btn"
            @click="router.go(-1)"
          >
            <BaseIcon name="arrow-left" size="md" />
          </BaseButton>
          <AppHeading level="h1" size="heading-lg" class="dish-detail__title">
            {{ dish.name }}
          </AppHeading>
        </div>
        
        <div class="dish-detail__actions">
          <BaseButton
            variant="ghost"
            :class="isFavourite ? 'text-primary-red' : 'text-neutral-80'"
            @click="toggleFavourite"
          >
            <BaseIcon :name="isFavourite ? 'heart-filled' : 'heart'" size="md" />
          </BaseButton>
          <BaseButton variant="ghost" @click="shareDish">
            <BaseIcon name="share" size="md" />
          </BaseButton>
        </div>
      </div>

      <!-- Main Content -->
      <div class="dish-detail__sheet">
        <!-- Left Column - Images and Info -->
        <div class="dish-detail__main">
          <!-- Dish Hero Section -->
          <img :src="dish.imageUrl || '/images/placeholder-dish.svg'" :alt="dish.name" class="dish-detail__hero-image" />

          <!-- Dish Images Slider -->
          <div class="dish-detail__section">
            <DishImageSlider 
              :images="dishImages"
              :dish-name="dish.name"
              :current-index="currentIndex"
              :alt="dish.name"
              @update:current-index="currentIndex = $event"
            />
          </div>

          <!-- Description -->
          <div class="dish-detail__section">
            <AppHeading level="h2" size="heading-md" class="dish-detail__section-title">
              Description
            </AppHeading>
            <AppText class="dish-detail__description">
              {{ dish.description }}
            </AppText>
          </div>

          <!-- Ingredients -->
          <div class="dish-detail__section">
            <div class="dish-detail__section-header">
              <AppHeading level="h2" size="heading-md" class="dish-detail__section-title">
                Ingredients
              </AppHeading>
              <NuxtLink :to="`/dish/${dish.id}/ingredients`">
                <BaseButton variant="ghost" size="sm">
                  View All
                  <BaseIcon name="arrow-right" size="sm" class="ml-2" />
                </BaseButton>
              </NuxtLink>
            </div>
            <DishIngredients 
              :ingredients="(dish.ingredients as any) || []"
              :selected-ingredients="selectedIngredients"
              :show-all="false"
              :max-items="6"
            />
          </div>

          <!-- Nutrition Info -->
          <div class="dish-detail__section">
            <div class="dish-detail__section-header">
              <AppHeading level="h2" size="heading-md" class="dish-detail__section-title">
                Nutrition Information
              </AppHeading>
              <NuxtLink :to="`/dish/${dish.id}/caloric-content`">
                <BaseButton variant="ghost" size="sm">
                  Full Details
                  <BaseIcon name="arrow-right" size="sm" class="ml-2" />
                </BaseButton>
              </NuxtLink>
            </div>
            <DishNutrition 
              v-if="dish.nutritionInfo"
              :nutrition="(dish.nutritionInfo as any)"
              :calories="dish.calories"
              :compact="true"
            />
          </div>

          <!-- Preparation Time -->
          <div class="dish-detail__section">
            <div class="dish-detail__section-header">
              <AppHeading level="h2" size="heading-md" class="dish-detail__section-title">
                Preparation Time
              </AppHeading>
              <NuxtLink :to="`/dish/${dish.id}/waiting-time`">
                <BaseButton variant="ghost" size="sm">
                  More Info
                  <BaseIcon name="arrow-right" size="sm" class="ml-2" />
                </BaseButton>
              </NuxtLink>
            </div>
            <WaitingTimeIndicator 
              :preparation-time="dish.preparationTime || 20"
              :show-details="false"
            />
          </div>

          <!-- Allergens -->
          <div v-if="dish.allergens && dish.allergens.length > 0" class="dish-detail__section">
            <AppHeading level="h2" size="heading-md" class="dish-detail__section-title">
              Allergen Information
            </AppHeading>
            <div class="dish-detail__tags">
              <BaseBadge
                v-for="allergen in dish.allergens"
                :key="allergen"
                variant="warning"
                size="sm"
              >
                <BaseIcon name="alert-triangle" size="xs" class="mr-1" />
                {{ allergen }}
              </BaseBadge>
            </div>
          </div>
        </div>

        <!-- Right Column - Customization and Order -->
        <div class="dish-detail__sidebar">
          <div class="dish-detail__sidebar-content">
            <!-- Price and Basic Info -->
            <div class="dish-detail__price-block">
              <div class="dish-detail__price-row">
                <AppPrice :price="dish.price" size="xl" color="primary" />
                <div v-if="dish.calories" class="dish-detail__calories">
                  <BaseIcon name="fire" size="sm" class="text-primary-orange" />
                  <AppText size="body-sm" class="text-neutral-60">
                    {{ dish.calories }} cal
                  </AppText>
                </div>
              </div>
              
              <!-- Rating and Reviews (Mock) -->
              <div class="dish-detail__rating">
                <BaseIcon name="star" size="sm" class="text-primary-orange" />
                <AppText size="body-sm" class="text-neutral-90">4.8</AppText>
                <AppText size="body-sm" class="text-neutral-60">(124 reviews)</AppText>
              </div>
            </div>

            <!-- Subcategory Selection -->
            <div v-if="hasSubcategories" class="dish-detail__option">
              <div class="dish-detail__option-header">
                <AppText size="body-sm" class="text-neutral-90 font-medium">
                  Choose Size/Type
                </AppText>
                <NuxtLink :to="`/dish/${dish.id}/subcategory`">
                  <BaseButton variant="ghost" size="sm">
                    More Options
                  </BaseButton>
                </NuxtLink>
              </div>
              <SubcategorySelector 
                v-model="selectedSubcategory"
                :options="subcategoryOptions"
                :compact="true"
              />
            </div>

            <!-- Customization Options -->
            <div class="dish-detail__option">
              <div class="dish-detail__option-header">
                <AppText size="body-sm" class="text-neutral-90 font-medium">
                  Customize
                </AppText>
                <NuxtLink :to="`/dish/${dish.id}/change-ingredients`">
                  <BaseButton variant="ghost" size="sm">
                    Full Options
                  </BaseButton>
                </NuxtLink>
              </div>
              <DishCustomization 
                :dish="dish"
                :selected-ingredients="selectedIngredients"
                :customizations="customizations"
                :compact="true"
                @ingredients-changed="selectedIngredients = $event"
                @customizations-changed="customizations = $event"
              />
            </div>

            <!-- Quantity Selection -->
            <div class="dish-detail__option">
              <div class="dish-detail__option-header">
                <AppText size="body-sm" class="text-neutral-90 font-medium">
                  Quantity
                </AppText>
                <NuxtLink :to="`/dish/${dish.id}/change-quantity`">
                  <BaseButton variant="ghost" size="sm">
                    Bulk Order
                  </BaseButton>
                </NuxtLink>
              </div>
              <QuantitySelector 
                v-model="quantity"
                :min="1"
                :max="10"
                size="lg"
              />
            </div>

            <!-- Special Instructions -->
            <div class="dish-detail__option">
              <AppText size="body-sm" class="text-neutral-90 font-medium mb-3">
                Special Instructions (Optional)
              </AppText>
              <BaseInput
                v-model="specialInstructions"
                placeholder="Any special requests..."
                type="textarea"
                rows="3"
              />
            </div>

            <!-- Total Price -->
            <div class="dish-detail__total">
              <div class="dish-detail__total-row">
                <AppText size="body-md" class="text-neutral-90 font-medium">
                  Total
                </AppText>
                <AppPrice :price="totalPrice" size="lg" />
              </div>
              <AppText size="body-sm" class="text-neutral-60 mt-1">
                {{ quantity }} × <AppPrice :price="dish.price" size="sm" :show-currency="false" />
                <span v-if="customizationPrice > 0">
                  + <AppPrice :price="customizationPrice" size="sm" :show-currency="false" /> extras
                </span>
              </AppText>
            </div>

          </div>
        </div>
      </div>
      
      <div class="dish-detail__sticky-footer">
        <div class="dish-detail__footer-actions">
          <BaseButton
            variant="secondary"
            size="sm"
            class="flex-1"
            @click="addToFavourites"
          >
            <BaseIcon name="heart" size="sm" class="mr-2" />
            Save
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            class="flex-1"
            @click="compareDish"
          >
            <BaseIcon name="compare" size="sm" class="mr-2" />
            Compare
          </BaseButton>
        </div>
        <AddToCartButton
          :item="dish"
          :quantity="quantity"
          :customizations="customizations"
          :special-instructions="specialInstructions"
          size="lg"
          class="w-full"
          @added="onAddedToCart"
        />
      </div>

      <!-- Related Dishes -->
      <div class="dish-detail__related">
        <AppHeading level="h2" size="heading-lg" class="dish-detail__section-title text-white">
          You Might Also Like
        </AppHeading>
        <MenuItemGrid 
          :items="relatedDishes"
          :columns="4"
          @item-selected="onRelatedDishSelected"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItemUI, NutritionInfo } from '~/types/ui'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useFavoritesStore } from '~/stores/favorites'
import AppPrice from '~/components/base/AppPrice.vue'
import AppHeading from '~/components/base/AppHeading.vue' // Fixed path
import { usePriceFormatter } from '~/composables/usePriceFormatter'
import AppText from '~/components/base/AppText.vue'
import QuantitySelector from '~/components/base/QuantitySelector.vue'

// Page setup
definePageMeta({
  title: 'Dish Details - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

const menuStore = useMenuStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
// const { formatPrice } = usePriceFormatter() // Unused

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const currentIndex = ref(0)
const quantity = ref(1)
const selectedIngredients = ref<string[]>([])
const customizations = ref<Record<string, any>>({})
const specialInstructions = ref('')
const selectedSubcategory = ref('')

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data - will be replaced with real API call
const dish = ref<MenuItemUI | null>(null)

// Mock related data
// Computed for dish images
const dishImages = computed(() => {
  if (dish.value?.images && dish.value.images.length > 0) {
    return dish.value.images
  }
  if (dish.value?.imageUrl) {
    return [dish.value.imageUrl]
  }
  return ['/images/placeholder-dish.svg']
})

const subcategoryOptions = computed(() => {
  return dish.value?.subcategories || []
})

const relatedDishes = ref<MenuItemUI[]>([])

// Computed
const isFavourite = computed(() => {
  return dish.value ? favoritesStore.isFavorite(dish.value.id) : false
})

const hasSubcategories = computed(() => {
  return subcategoryOptions.value.length > 0
})

const customizationPrice = computed(() => {
  // Calculate additional price from customizations
  return Object.values(customizations.value).reduce((total: number, customization: any) => {
    return total + (customization.price || 0)
  }, 0)
})

const totalPrice = computed(() => {
  if (!dish.value) return 0
  const basePrice = dish.value.price
  const subcategoryPrice = selectedSubcategory.value ?
    subcategoryOptions.value.find(opt => opt.id === selectedSubcategory.value)?.price || 0 : 0
  return (basePrice + subcategoryPrice + customizationPrice.value) * quantity.value
})

// Methods
const loadDish = async () => {
  loading.value = true
  error.value = null

  try {
    // Try to get dish from menu store first
    const existingDish = menuStore.getMenuItemById(dishId.value)
    if (existingDish) {
      dish.value = existingDish
    } else {
      // Fetch dish from API
      const response = await menuStore.fetchMenuItem(dishId.value)
      if (response) {
        dish.value = response
      } else {
        throw new Error('Dish not found')
      }
    }

    // Load related dishes from the same category
    if (dish.value?.categoryId) {
      const categoryItems = menuStore.getItemsByCategory(dish.value.categoryId)
      relatedDishes.value = categoryItems
        .filter(item => item.id !== dish.value!.id)
        .slice(0, 4)
    }

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dish details'
    console.error('Error loading dish:', err)
  } finally {
    loading.value = false
  }
}

const toggleFavourite = () => {
  if (dish.value) {
    favoritesStore.toggleFavorite(dish.value.id)
  }
}

const shareDish = () => {
  if (navigator.share && dish.value) {
    navigator.share({
      title: dish.value.name,
      text: dish.value.description,
      url: window.location.href
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
  }
}

const onAddedToCart = () => {
  // Show success message or navigate to cart
  router.push('/cart')
}

const addToFavourites = () => {
  if (dish.value) {
    favoritesStore.toggleFavorite(dish.value.id)
  }
}

const compareDish = () => {
  // Add to comparison list (mock functionality)
  // console.log('Added to comparison')
  alert('Added to comparison list')
}

const onRelatedDishSelected = (selectedDish: MenuItemUI) => {
  router.push(`/dish/${selectedDish.id}`)
}

// Initialize
onMounted(() => {
  loadDish()
})

// Watch for route changes
watch(() => dishId.value, () => {
  loadDish()
})

// Update page title
watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.dish-detail {
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

.dish-detail__loading,
.dish-detail__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: $space-6;
}

.dish-detail__spinner {
  text-align: center;
}

.dish-detail__error-content {
  text-align: center;
  max-width: 400px;
}

.dish-detail__error-title {
  color: var(--text-primary);
  margin-bottom: $space-4;
}

.dish-detail__error-text {
  color: var(--text-secondary);
  margin-bottom: $space-8;
}

.dish-detail__error-actions {
  display: flex;
  gap: $space-4;
  justify-content: center;
}

.dish-detail__content-wrapper {
  padding-bottom: 120px;
}

.dish-detail__header {
  padding: $space-4 $space-6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-primary); // Make header solid
}

.dish-detail__nav {
  display: flex;
  align-items: center;
  gap: $space-4;
}

.dish-detail__title {
  color: var(--text-primary);
}

.dish-detail__actions {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.dish-detail__sheet {
  margin-top: $space-6;
  border-top-left-radius: $radius-xl;
  border-top-right-radius: $radius-xl;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  @media (min-width: $breakpoint-lg) {
    flex-direction: row;
    margin-top: $space-8;
    max-width: $breakpoint-xl;
    margin-left: auto;
    margin-right: auto;
    border-radius: $radius-xl; // Full radius on desktop
  }
}

.dish-detail__main {
  padding: $space-6;
  
  @media (min-width: $breakpoint-lg) {
    width: 66.666667%;
    padding: $space-8;
  }
}

.dish-detail__hero-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: $radius-lg;
  margin-bottom: $space-6;
  
  @media (min-width: $breakpoint-lg) {
    height: 400px;
  }
}

.dish-detail__section {
  margin-bottom: $space-8;
}

.dish-detail__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
}

.dish-detail__section-title {
  color: var(--text-primary);
  margin-bottom: $space-4;
  
  .dish-detail__section & {
     margin-bottom: 0; // Reset for flex headers
  }
  
  &.text-white {
    color: white; // Explicit override if needed for dark sections
  }
}

.dish-detail__description {
  color: var(--text-secondary);
  line-height: $leading-relaxed;
}

.dish-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.dish-detail__sidebar {
  border-top: 1px solid var(--border-primary);
  background: var(--bg-secondary); // Slight contrast for sidebar
  
  @media (min-width: $breakpoint-lg) {
    width: 33.333333%;
    border-top: none;
    border-left: 1px solid var(--border-primary);
  }
}

.dish-detail__sidebar-content {
  padding: $space-6;
  position: sticky;
  top: 0;
}

.dish-detail__price-block {
  margin-bottom: $space-6;
}

.dish-detail__price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
}

.dish-detail__calories {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.dish-detail__rating {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.dish-detail__option {
  margin-bottom: $space-6;
}

.dish-detail__option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;
}

.dish-detail__total {
  margin-bottom: $space-6;
  padding: $space-4;
  border-radius: $radius-xl;
  border: 1px solid var(--border-primary);
}

.dish-detail__total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dish-detail__sticky-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $space-4;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  @media (min-width: $breakpoint-lg) {
    display: none; // Hide on desktop if actions are in sidebar
  }
}

.dish-detail__footer-actions {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-4;
}

.dish-detail__related {
  padding: $space-6;
  border-top: 1px solid var(--border-primary);
  margin-top: $space-8;
  background: var(--bg-primary);
}
</style>