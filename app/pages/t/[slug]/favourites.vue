<template>
  <div class="favourites-page">
    <!-- Header Section -->
    <section class="favourites-header">
      <div class="favourites-header__title-row">
        <BaseIcon name="heart" size="lg" class="favourites-header__icon" />
        <AppHeading level="h1" size="display-md" class="favourites-header__title">
          {{ $t('favorites.title') }}
        </AppHeading>
      </div>
      <AppText size="body-lg" class="favourites-header__subtitle">
        {{ $t('favorites.subtitle') }}
      </AppText>
    </section>

    <!-- Favourites Count & Controls -->
    <section class="favourites-controls">
      <div class="favourites-controls__row">
        <AppText class="favourites-controls__count">
          {{ $t('favorites.count', { count: favourites.length }) }}
        </AppText>
        <div class="favourites-controls__actions">
          <BaseButton 
            variant="secondary" 
            class="favourites-controls__view-toggle"
            @click="showGridView = !showGridView"
          >
            <BaseIcon :name="showGridView ? 'list' : 'grid'" size="sm" />
          </BaseButton>
          <BaseButton 
            variant="ghost" 
            class="favourites-controls__clear"
            :disabled="favourites.length === 0"
            @click="clearAllFavourites"
          >
            {{ $t('favorites.clearAll') }}
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="favourites-content">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="favourites-state favourites-state--loading">
        <div class="favourites-loading-spinner"/>
        <AppText class="favourites-state__text">{{ $t('favorites.loading') }}</AppText>
      </div>

      <!-- Empty State -->
      <div v-else-if="favourites.length === 0" class="favourites-state favourites-state--empty">
        <div class="favourites-state__icon-wrapper">
          <BaseIcon name="heart" size="xl" class="favourites-state__icon" />
        </div>
        <AppHeading level="h3" size="heading-lg" class="favourites-state__title">
          {{ $t('favorites.emptyTitle') }}
        </AppHeading>
        <AppText class="favourites-state__text">
          {{ $t('favorites.emptyText') }}
        </AppText>
        <div class="favourites-state__actions">
          <NuxtLink to="/menu">
            <BaseButton variant="primary" class="favourites-state__button">
              <BaseIcon name="search" size="sm" class="u-mr-2" />
              {{ $t('favorites.browseMenu') }}
            </BaseButton>
          </NuxtLink>
          <NuxtLink to="/">
            <BaseButton variant="secondary" class="favourites-state__button">
              {{ $t('favorites.viewPopular') }}
            </BaseButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Favourites Grid/List -->
      <div v-else class="favourites-items">
        <!-- Grid View -->
        <div v-if="showGridView" class="favourites-items__grid">
          <FavouritesGrid 
            :items="favourites"
            @item-selected="onItemSelected"
            @toggle-favourite="onToggleFavourite"
          />
        </div>

        <!-- List View -->
        <div v-else class="favourites-items__list">
          <div
            v-for="item in favourites"
            :key="item.id"
            class="favourites-item"
          >
            <!-- Item Image -->
            <div class="favourites-item__image">
              <BaseImage 
                :src="item.imageUrl || '/images/placeholder-dish.svg'"
                :alt="item.name"
                class="favourites-item__image-element"
                @click="onItemSelected(item)"
              />
            </div>

            <!-- Item Info -->
            <div class="favourites-item__content">
              <AppHeading 
                level="h3" 
                size="heading-sm" 
                class="favourites-item__title"
                @click="onItemSelected(item)"
              >
                {{ item.name }}
              </AppHeading>
              <AppText size="body-sm" class="favourites-item__description">
                {{ item.description }}
              </AppText>
              <div class="favourites-item__meta">
                <AppPrice :price="item.price" size="md" />
                <div v-if="item.calories" class="favourites-item__calories">
                  <BaseIcon name="flame" size="sm" />
                  <AppText size="caption" class="favourites-item__calories-text">
                    {{ item.calories }} {{ $t('menu.units.kcal') }}
                  </AppText>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="favourites-item__actions">
              <BaseButton
                variant="ghost"
                size="sm"
                class="favourites-item__favorite-btn"
                @click="onToggleFavourite(item.id)"
              >
                <BaseIcon name="heart-filled" size="sm" />
              </BaseButton>
              <AddToCartButton 
                :item="item"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <section class="favourites-actions">
          <div class="favourites-actions__content">
            <BaseButton 
              variant="primary"
              class="favourites-actions__button"
              :disabled="favourites.length === 0"
              @click="addAllToCart"
            >
              <BaseIcon name="shopping-cart" size="sm" class="u-mr-2" />
              {{ $t('favorites.addAllToCart') }}
            </BaseButton>
            <NuxtLink to="/menu">
              <BaseButton variant="secondary" class="favourites-actions__button">
                <BaseIcon name="plus" size="sm" class="u-mr-2" />
                {{ $t('favorites.findMore') }}
              </BaseButton>
            </NuxtLink>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

// Stores
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useFavoritesStore } from '~/stores/favorites'
import { useUserStore } from '~/stores/user'

// Page setup
definePageMeta({
  title: 'Favourites - Menu Ordering App'
})

const menuStore = useMenuStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const authStore = useUserStore()
const router = useRouter()

// Reactive state
const showGridView = ref(true)

// Computed
const favourites = computed(() => favoritesStore.getFavoriteItems())

// Methods
const onItemSelected = (item: MenuItem) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const onToggleFavourite = async (itemId: string) => {
  await favoritesStore.toggleFavorite(itemId)
}

const clearAllFavourites = async () => {
  if (confirm(useI18n().t('favorites.clearConfirm'))) {
    await favoritesStore.clearAllFavorites()
  }
}

const addAllToCart = () => {
  favourites.value.forEach(item => {
    cartStore.addItem(item, 1)
  })
  
  // Show success message or navigate to cart
  router.push('/checkout')
}

// Initialize
onMounted(async () => {
  // Load menu items first
  await menuStore.fetchMenu()
  
  // Initialize favorites from localStorage
  favoritesStore.initializeFavorites()
  
  // If user is authenticated, sync with server
  if (authStore.isAuthenticated) {
    await favoritesStore.fetchFavoritesFromServer()
  }
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/tokens' as *;

@use '~/assets/scss/abstracts/mixins' as *;

// Import the favourites page styles
@import '~/assets/scss/pages/favourites';
</style>
