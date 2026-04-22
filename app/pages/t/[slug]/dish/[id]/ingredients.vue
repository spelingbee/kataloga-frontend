<template>
  <div class="ingredients-page">
    <!-- Header -->
    <header class="ingredients-page__header">
      <button class="ingredients-page__back" @click="$router.go(-1)">
        <BaseIcon name="arrow-left" size="md" />
      </button>
      <div>
        <h1 class="ingredients-page__title">{{ $t('common.ingredients', 'Состав') }}</h1>
        <p class="ingredients-page__subtitle">{{ dish?.name }}</p>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="ingredients-page__state">
      <div class="ingredients-page__spinner" />
      <p>{{ $t('common.loading', 'Загрузка...') }}</p>
    </div>

    <!-- No Data State -->
    <div v-else-if="!dish || !ingredients.length" class="ingredients-page__state">
      <BaseIcon name="package" size="4xl" class="ingredients-page__empty-icon" />
      <h2>{{ $t('common.no_ingredients', 'Состав не указан') }}</h2>
      <p>{{ $t('common.no_ingredients_desc', 'Информация о составе для этого блюда пока не добавлена.') }}</p>
      <button class="ingredients-page__action-btn" @click="$router.go(-1)">
        {{ $t('common.back_to_dish', 'Назад к блюду') }}
      </button>
    </div>

    <!-- Ingredients Content -->
    <div v-else class="ingredients-page__content">
      <!-- Dish Image -->
      <div v-if="dish.imageUrl" class="ingredients-page__dish-preview">
        <img :src="resolveImageUrl(dish.imageUrl)" :alt="dish.name" class="ingredients-page__dish-image" />
        <div class="ingredients-page__dish-overlay">
          <span class="ingredients-page__dish-name">{{ dish.name }}</span>
        </div>
      </div>

      <!-- Ingredients List -->
      <section class="ingredients-page__section">
        <h2 class="ingredients-page__section-title">
          <BaseIcon name="list" size="sm" />
          {{ $t('common.ingredients_list', 'Список ингредиентов') }}
        </h2>
        <ul class="ingredients-page__list">
          <li v-for="(ingredient, index) in ingredients" :key="index" class="ingredients-page__item">
            <span class="ingredients-page__item-dot" />
            <span class="ingredients-page__item-name">{{ ingredient }}</span>
          </li>
        </ul>
      </section>

      <!-- Allergens Section -->
      <section v-if="allergens.length > 0" class="ingredients-page__section ingredients-page__section--allergens">
        <h2 class="ingredients-page__section-title">
          <BaseIcon name="alert-triangle" size="sm" />
          {{ $t('common.allergens', 'Аллергены') }}
        </h2>
        <div class="ingredients-page__allergens-grid">
          <span v-for="allergen in allergens" :key="allergen" class="ingredients-page__allergen-badge">
            {{ allergen }}
          </span>
        </div>
      </section>

      <!-- Preparation Time -->
      <section v-if="dish.preparationTime" class="ingredients-page__section">
        <h2 class="ingredients-page__section-title">
          <BaseIcon name="clock" size="sm" />
          {{ $t('common.preparation_time', 'Время приготовления') }}
        </h2>
        <div class="ingredients-page__prep-time">
          <span class="ingredients-page__prep-value">{{ dish.preparationTime }}</span>
          <span class="ingredients-page__prep-unit">{{ $t('common.minutes', 'мин') }}</span>
        </div>
      </section>

      <!-- Back to Dish CTA -->
      <div class="ingredients-page__footer">
        <button class="ingredients-page__action-btn" @click="$router.go(-1)">
          <BaseIcon name="arrow-left" size="sm" />
          {{ $t('common.back_to_dish', 'Назад к блюду') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'
import { useMenuStore } from '~/stores/menu'
import { useTenant } from '~/composables/useTenant'
import { resolveImageUrl } from '~/utils/image-optimization'

definePageMeta({
  title: 'Ingredients'
})

const route = useRoute()
const menuStore = useMenuStore()
const { tPath } = useTenant()

const loading = ref(true)
const dishId = computed(() => route.params.id as string)
const dish = ref<MenuItem | null>(null)

const ingredients = computed<string[]>(() => {
  if (!dish.value?.ingredients) return []
  // ingredients is stored as JSON — could be string[] or already parsed
  const raw = dish.value.ingredients
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
})

const allergens = computed<string[]>(() => {
  if (!dish.value?.allergens) return []
  const raw = dish.value.allergens
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
})

const loadDish = async () => {
  loading.value = true
  try {
    // Try from store cache first
    const cached = menuStore.getMenuItemById(dishId.value)
    if (cached) {
      dish.value = cached
    }
    // Always try fetching fresh data from API
    const slug = route.params.slug as string
    if (slug) {
      const { data } = await useFetch(`/api/public/menu/${slug}/items/${dishId.value}`)
      if (data.value) {
        dish.value = data.value as MenuItem
      }
    }
  } catch (error) {
    console.error('Error loading dish:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadDish())

watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `${dish.value.name} — Состав`
    })
  }
})
</script>

<style scoped>
.ingredients-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.ingredients-page__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 10;
}

.ingredients-page__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s;
}
.ingredients-page__back:hover { background: var(--bg-tertiary, #e5e7eb); }

.ingredients-page__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.ingredients-page__subtitle {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.ingredients-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  color: var(--text-secondary);
}
.ingredients-page__state h2 { margin: 16px 0 8px; color: var(--text-primary); }

.ingredients-page__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ingredients-page__empty-icon { color: var(--text-tertiary); margin-bottom: 8px; }

.ingredients-page__content {
  padding: 0 20px 100px;
}

.ingredients-page__dish-preview {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin: 20px 0;
  max-height: 200px;
}
.ingredients-page__dish-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.ingredients-page__dish-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}
.ingredients-page__dish-name {
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
}

.ingredients-page__section {
  margin: 24px 0;
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
}
.ingredients-page__section--allergens {
  border: 1px solid #fbbf24;
  background: rgba(251, 191, 36, 0.05);
}

.ingredients-page__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.ingredients-page__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredients-page__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-primary);
}
.ingredients-page__item:last-child { border-bottom: none; }

.ingredients-page__item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.ingredients-page__item-name {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.ingredients-page__allergens-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ingredients-page__allergen-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(251, 191, 36, 0.15);
  color: #92400e;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.ingredients-page__prep-time {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.ingredients-page__prep-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}
.ingredients-page__prep-unit {
  font-size: 1rem;
  color: var(--text-secondary);
}

.ingredients-page__footer {
  margin-top: 32px;
  text-align: center;
}

.ingredients-page__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.ingredients-page__action-btn:hover { opacity: 0.9; }
</style>

