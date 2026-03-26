<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="home-hero">
      <h1 class="home-hero__title">
        Welcome to Menu Ordering
      </h1>
      <p class="home-hero__subtitle">
        Discover delicious dishes and order your favorites with ease. 
        Browse our menu, customize your order, and enjoy fast delivery.
      </p>
    </section>

    <!-- Popular Dishes Section -->
    <section class="home-section">
      <div class="home-section__header">
        <h2 class="home-section__title">
          For You
          <BaseIcon name="fire" size="md" class="home-section__icon" />
        </h2>
        <NuxtLink 
          to="/menu" 
          class="home-section__link"
        >
          View All
        </NuxtLink>
      </div>
      
      <div v-if="menuStore.loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green"/>
      </div>
      <PopularSection v-else />
    </section>

    <!-- Categories Preview -->
    <section class="home-section">
      <h2 class="home-section__title">
        Browse Categories
      </h2>
      
      <div v-if="menuStore.loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green"/>
      </div>
      <div v-else class="home-categories">
        <NuxtLink
          v-for="category in categories" 
          :key="category.id"
          :to="`/menu/categories/${category.id}`"
          class="home-category"
        >
          <BaseIcon :name="getCategoryIcon(category.id)" size="lg" class="home-category__icon" />
          <span class="home-category__name">
            {{ category.name }}
          </span>
          <span class="home-category__count">
            {{ category.count }} items
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="home-actions">
      <BaseCard class="home-action-card" padding="sm" hoverable>
        <BaseIcon name="heart" size="xl" class="home-action-card__icon home-action-card__icon--red" />
        <h3 class="home-action-card__title">
          Your Favourites
        </h3>
        <p class="home-action-card__description">
          Quick access to your favorite dishes
        </p>
        <BaseButton variant="secondary" @click="router.push('/favourites')">
          View Favourites
        </BaseButton>
      </BaseCard>

      <BaseCard class="home-action-card" padding="none" hoverable>
        <BaseIcon name="receipt" size="xl" class="home-action-card__icon home-action-card__icon--green" />
        <h3 class="home-action-card__title">
          Order History
        </h3>
        <p class="home-action-card__description">
          Track and reorder from your history
        </p>
        <BaseButton variant="secondary" @click="router.push('/orders')">
          View Orders
        </BaseButton>
      </BaseCard>

      <BaseCard class="home-action-card" padding="sm" hoverable>
        <BaseIcon name="map" size="xl" class="home-action-card__icon home-action-card__icon--orange" />
        <h3 class="home-action-card__title">
          Find Locations
        </h3>
        <p class="home-action-card__description">
          Find restaurants near you
        </p>
        <BaseButton variant="secondary" @click="router.push('/map')">
          View Map
        </BaseButton>
      </BaseCard>
    </section>
  </div>
</template>

<script setup lang="ts">
// Page setup
// Stores
import { useMenuStore } from '~/stores/menu'
import PopularSection from '../components/menu/PopularSection.vue'

definePageMeta({
  title: 'Home - Menu Ordering App'
})

const menuStore = useMenuStore()
const router = useRouter()

// Computed
const categories = computed(() => menuStore.categories)

// Helper function to get category icon
const getCategoryIcon = (categoryId: string) => {
  const iconMap: Record<string, string> = {
    'appetizers': 'utensils',
    'mains': 'chef-hat',
    'desserts': 'cake',
    'drinks': 'coffee',
    'salads': 'leaf',
    'pizza': 'pizza',
    'burgers': 'burger',
    'pasta': 'bowl'
  }
  return iconMap[categoryId] || 'utensils'
}

// Initialize menu data
onMounted(() => {
  menuStore.fetchMenu()
})
</script>

<style scoped lang="scss">
@use '../assets/scss/tokens/colors' as *;
@use '../assets/scss/tokens/spacing' as *;
@use '../assets/scss/tokens/typography' as *;
@use '../assets/scss/tokens/radius' as *;
@use '../assets/scss/tokens/shadows' as *;
@use '../assets/scss/tokens/transitions' as *;

.home-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: $space-4;
}

.home-hero {
  text-align: center;
  padding: $space-8 $space-4 $space-8;
  max-width: 800px;
  margin: 0 auto;
}

.home-hero__title {
  font-family: $font-secondary;
  font-size: $text-4xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-6;
  line-height: $leading-tight;
}

.home-hero__subtitle {
  font-size: $text-lg;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  margin: 0;
}

.home-section {
  max-width: 1200px;
  margin: 0 auto $space-8;
}

.home-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
}

.home-section__title {
  margin-bottom: $space-4;
  font-family: $font-secondary;
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
}

.home-section__icon {
  color: var(--color-primary);
}

.home-section__link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: $font-medium;
  transition: $transition-base;
  
  &:hover {
    color: var(--color-primary-light);
  }
}

.home-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $space-4;
}

.home-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6;
  background: var(--bg-secondary);
  border-radius: $radius-lg;
  text-decoration: none;
  transition: $transition-base;
  border: 1px solid var(--border-primary);
  
  &:hover {
    background: var(--bg-tertiary);
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

.home-category__icon {
  color: var(--color-primary);
  margin-bottom: $space-3;
}

.home-category__name {
  font-size: $text-base;
  font-weight: $font-medium;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.home-category__count {
  font-size: $text-sm;
  color: var(--text-secondary);
}

.home-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $space-6;
  max-width: 1200px;
  margin: 0 auto;
}

.home-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: $space-4; // Restored padding as BaseCard content padding is now none
  gap: $space-2;
}

.home-action-card__icon {
  &--red {
    color: var(--color-error);
  }
  
  &--green {
    color: var(--color-success);
  }
  
  &--orange {
    color: var(--color-primary);
  }
}

.home-action-card__title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0;
}

.home-action-card__description {
  font-size: $text-base;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  margin: 0;
}

// Responsive design
@media (max-width: 768px) {
  .home-page {
    padding: $space-2;
  }
  
  .home-hero {
    padding: $space-12 $space-2 $space-8;
  }
  
  .home-hero__title {
    font-size: $text-3xl;
  }
  
  .home-section__header {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-4;
  }
  
  .home-categories {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .home-actions {
    grid-template-columns: repeat(2, 1fr);
    gap: $space-2;
  }
}

@media (max-width: 480px) {
  .home-hero__title {
    font-size: $text-2xl;
  }
  
  .home-categories {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .home-category {
    padding: $space-4;
  }
}
</style>