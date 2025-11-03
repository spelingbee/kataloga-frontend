<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-4">
        <BaseIcon name="heart" size="lg" class="text-primary-red" />
        <AppHeading level="h1" size="display-md" class="text-white">
          Your Favourites
        </AppHeading>
      </div>
      <AppText size="body-lg" class="text-neutral-20">
        Your favorite dishes, ready to order again
      </AppText>
    </div>

    <!-- Favourites Count -->
    <div class="px-6 mb-8">
      <div class="flex items-center justify-between">
        <AppText class="text-neutral-20">
          {{ favourites.length }} favorite{{ favourites.length !== 1 ? 's' : '' }}
        </AppText>
        <div class="flex gap-2">
          <BaseButton 
            variant="secondary" 
            size="sm"
            @click="showGridView = !showGridView"
          >
            <BaseIcon :name="showGridView ? 'list' : 'grid'" size="sm" />
          </BaseButton>
          <BaseButton 
            variant="ghost" 
            size="sm"
            @click="clearAllFavourites"
            :disabled="favourites.length === 0"
          >
            Clear All
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-6">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
        <AppText class="text-neutral-20">Loading favourites...</AppText>
      </div>

      <!-- Empty State -->
      <div v-else-if="favourites.length === 0" class="text-center py-16">
        <BaseIcon name="heart" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
          No favourites yet
        </AppHeading>
        <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
          Start exploring our menu and add dishes to your favourites by clicking the heart icon
        </AppText>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/menu">
            <BaseButton variant="primary">
              <BaseIcon name="search" size="sm" class="mr-2" />
              Browse Menu
            </BaseButton>
          </NuxtLink>
          <NuxtLink to="/">
            <BaseButton variant="secondary">
              View Popular Dishes
            </BaseButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Favourites Grid/List -->
      <div v-else>
        <!-- Grid View -->
        <div v-if="showGridView">
          <FavouritesGrid 
            :items="favourites"
            @item-selected="onItemSelected"
            @toggle-favourite="onToggleFavourite"
          />
        </div>

        <!-- List View -->
        <div v-else class="space-y-4">
          <div
            v-for="item in favourites"
            :key="item.id"
            class="bg-background-card rounded-xl p-4 flex items-center gap-4 hover:bg-background-card/80 transition-colors"
          >
            <!-- Item Image -->
            <div class="flex-shrink-0">
              <MenuItemImage 
                :item="item"
                size="md"
                class="cursor-pointer"
                @click="onItemSelected(item)"
              />
            </div>

            <!-- Item Info -->
            <div class="flex-1 min-w-0">
              <AppHeading 
                level="h3" 
                size="heading-sm" 
                class="text-white mb-1 cursor-pointer hover:text-primary-green transition-colors"
                @click="onItemSelected(item)"
              >
                {{ item.name }}
              </AppHeading>
              <AppText size="body-sm" class="text-neutral-20 mb-2 line-clamp-2">
                {{ item.description }}
              </AppText>
              <div class="flex items-center gap-4">
                <AppPrice :price="item.price" size="md" />
                <div v-if="item.calories" class="flex items-center gap-1">
                  <FireIcon size="sm" />
                  <AppText size="caption" class="text-neutral-20">
                    {{ item.calories }} cal
                  </AppText>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex-shrink-0 flex items-center gap-2">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="onToggleFavourite(item.id)"
                class="text-primary-red hover:text-primary-red/80"
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
        <div class="mt-12 pt-8 border-t border-neutral-80/20">
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <BaseButton 
              variant="primary"
              @click="addAllToCart"
              :disabled="favourites.length === 0"
            >
              <BaseIcon name="shopping-cart" size="sm" class="mr-2" />
              Add All to Cart
            </BaseButton>
            <NuxtLink to="/menu">
              <BaseButton variant="secondary">
                <BaseIcon name="plus" size="sm" class="mr-2" />
                Find More Dishes
              </BaseButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

// Page setup
definePageMeta({
  title: 'Favourites - Menu Ordering App'
})

// Stores
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'

const menuStore = useMenuStore()
const cartStore = useCartStore()
const router = useRouter()

// Reactive state
const showGridView = ref(true)

// Computed
const favourites = computed(() => menuStore.favourites)

// Methods
const onItemSelected = (item: MenuItem) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const onToggleFavourite = (itemId: string) => {
  menuStore.toggleFavourite(itemId)
}

const clearAllFavourites = () => {
  if (confirm('Are you sure you want to remove all favourites?')) {
    favourites.value.forEach(item => {
      menuStore.toggleFavourite(item.id)
    })
  }
}

const addAllToCart = () => {
  favourites.value.forEach(item => {
    cartStore.addItem(item, 1)
  })
  
  // Show success message or navigate to cart
  router.push('/cart')
}

// Initialize
onMounted(() => {
  menuStore.fetchMenu()
  menuStore.initializeFavourites()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>