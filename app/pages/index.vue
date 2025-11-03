<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="home-hero">
      <AppHeading level="h1" size="display-lg" class="home-hero__title">
        Welcome to Menu Ordering
      </AppHeading>
      <AppText size="body-lg" class="home-hero__subtitle">
        Discover delicious dishes and order your favorites with ease. 
        Browse our menu, customize your order, and enjoy fast delivery.
      </AppText>
    </section>

    <!-- Popular Dishes Section -->
    <section class="home-section">
      <div class="home-section__header">
        <AppHeading level="h2" size="heading-xl" class="home-section__title">
          For You
          <FireIcon class="home-section__icon" />
        </AppHeading>
        <NuxtLink 
          to="/menu" 
          class="home-section__link"
        >
          View All
        </NuxtLink>
      </div>
      
      <PopularSection />
    </section>

    <!-- Categories Preview -->
    <section class="home-section">
      <AppHeading level="h2" size="heading-xl" class="home-section__title u-mb-6">
        Browse Categories
      </AppHeading>
      
      <div class="home-categories">
        <NuxtLink
          v-for="category in categories" 
          :key="category.id"
          :to="`/menu/categories/${category.id}`"
          class="home-category"
        >
          <CategoryIcon :category="category.id" class="home-category__icon" />
          <AppText size="body-sm" class="home-category__name">
            {{ category.name }}
          </AppText>
          <AppText size="caption" class="home-category__count">
            {{ category.count }} items
          </AppText>
        </NuxtLink>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="home-actions">
      <BaseCard class="home-action-card">
        <BaseIcon name="heart" size="xl" class="home-action-card__icon u-text-primary-red" />
        <AppHeading level="h3" size="heading-md" class="home-action-card__title">
          Your Favourites
        </AppHeading>
        <AppText class="home-action-card__description">
          Quick access to your favorite dishes
        </AppText>
        <BaseButton variant="secondary" @click="$router.push('/favourites')">
          View Favourites
        </BaseButton>
      </BaseCard>

      <BaseCard class="home-action-card">
        <BaseIcon name="receipt" size="xl" class="home-action-card__icon u-text-primary-green" />
        <AppHeading level="h3" size="heading-md" class="home-action-card__title">
          Order History
        </AppHeading>
        <AppText class="home-action-card__description">
          Track and reorder from your history
        </AppText>
        <BaseButton variant="secondary" @click="$router.push('/orders')">
          View Orders
        </BaseButton>
      </BaseCard>

      <BaseCard class="home-action-card">
        <BaseIcon name="map" size="xl" class="home-action-card__icon u-text-primary-orange" />
        <AppHeading level="h3" size="heading-md" class="home-action-card__title">
          Find Locations
        </AppHeading>
        <AppText class="home-action-card__description">
          Find restaurants near you
        </AppText>
        <BaseButton variant="secondary" @click="$router.push('/map')">
          View Map
        </BaseButton>
      </BaseCard>
    </section>
  </div>
</template>

<script setup lang="ts">
// Page setup
definePageMeta({
  title: 'Home - Menu Ordering App'
})

// Stores
import { useMenuStore } from '~/stores/menu'

const menuStore = useMenuStore()

// Sample data - will be replaced with real data from API
const categories = [
  { id: 'all', name: 'All', icon: '🍔', count: 24 },
  { id: 'salads', name: 'Salads', icon: '🥗', count: 8 },
  { id: 'main-dishes', name: 'Main Dishes', icon: '🍽️', count: 12 },
  { id: 'meat', name: 'Meat', icon: '🥩', count: 10 },
  { id: 'fastfood', name: 'Fastfood', icon: '🍟', count: 15 },
  { id: 'desserts', name: 'Desserts', icon: '🧁', count: 6 },
  { id: 'drinks', name: 'Drinks', icon: '🥤', count: 12 }
]

// Initialize menu data
onMounted(() => {
  menuStore.fetchMenu()
})
</script>
