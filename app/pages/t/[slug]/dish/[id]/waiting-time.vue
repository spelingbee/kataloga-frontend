<template>
  <div class="waiting-page">
    <!-- Header -->
    <header class="waiting-page__header">
      <button class="waiting-page__back" @click="$router.go(-1)">
        <BaseIcon name="arrow-left" size="md" />
      </button>
      <div>
        <h1 class="waiting-page__title">{{ $t('common.preparation_time', 'Время приготовления') }}</h1>
        <p class="waiting-page__subtitle">{{ dish?.name }}</p>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="waiting-page__state">
      <div class="waiting-page__spinner" />
      <p>{{ $t('common.loading', 'Загрузка...') }}</p>
    </div>

    <!-- No Data State -->
    <div v-else-if="!dish || !dish.preparationTime" class="waiting-page__state">
      <BaseIcon name="clock" size="4xl" class="waiting-page__empty-icon" />
      <h2>{{ $t('common.no_prep_time', 'Время не указано') }}</h2>
      <p>{{ $t('common.no_prep_time_desc', 'Информация о времени приготовления для этого блюда пока не добавлена.') }}</p>
      <button class="waiting-page__action-btn" @click="$router.go(-1)">
        {{ $t('common.back_to_dish', 'Назад к блюду') }}
      </button>
    </div>

    <!-- Content -->
    <div v-else class="waiting-page__content">
      <!-- Main Timer Display -->
      <div class="waiting-page__timer-card">
        <div class="waiting-page__timer-ring">
          <svg viewBox="0 0 120 120" class="waiting-page__ring-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-primary)" stroke-width="6" />
            <circle 
              cx="60" cy="60" r="52" fill="none" 
              stroke="var(--color-primary)" stroke-width="6" 
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              class="waiting-page__ring-progress"
            />
          </svg>
          <div class="waiting-page__timer-inner">
            <span class="waiting-page__timer-value">{{ dish.preparationTime }}</span>
            <span class="waiting-page__timer-unit">{{ $t('common.min', 'мин') }}</span>
          </div>
        </div>
        <p class="waiting-page__timer-label">
          {{ $t('common.estimated_time', 'Приблизительное время приготовления') }}
        </p>
      </div>

      <!-- Time Breakdown -->
      <section class="waiting-page__section">
        <h2 class="waiting-page__section-title">
          <BaseIcon name="info" size="sm" />
          {{ $t('common.details', 'Подробнее') }}
        </h2>
        <div class="waiting-page__info-grid">
          <div class="waiting-page__info-item">
            <BaseIcon name="chef-hat" size="md" class="waiting-page__info-icon" />
            <div>
              <span class="waiting-page__info-label">{{ $t('common.cooking', 'Приготовление') }}</span>
              <span class="waiting-page__info-value">~{{ dish.preparationTime }} {{ $t('common.min', 'мин') }}</span>
            </div>
          </div>
          <div class="waiting-page__info-item">
            <BaseIcon name="package" size="md" class="waiting-page__info-icon" />
            <div>
              <span class="waiting-page__info-label">{{ $t('common.packaging', 'Упаковка') }}</span>
              <span class="waiting-page__info-value">~2-3 {{ $t('common.min', 'мин') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Note -->
      <div class="waiting-page__note">
        <BaseIcon name="info" size="sm" />
        <p>{{ $t('common.time_note', 'Фактическое время может отличаться в зависимости от загруженности кухни и количества заказов.') }}</p>
      </div>

      <!-- Back Button -->
      <div class="waiting-page__footer">
        <button class="waiting-page__action-btn" @click="$router.go(-1)">
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
import { resolveImageUrl } from '~/utils/image-optimization'

definePageMeta({
  title: 'Preparation Time'
})

const route = useRoute()
const menuStore = useMenuStore()

const loading = ref(true)
const dishId = computed(() => route.params.id as string)
const dish = ref<MenuItem | null>(null)

// SVG ring animation
const circumference = 2 * Math.PI * 52
const maxTime = 60 // max 60 min for visual scale
const dashOffset = computed(() => {
  if (!dish.value?.preparationTime) return circumference
  const progress = Math.min(dish.value.preparationTime / maxTime, 1)
  return circumference * (1 - progress)
})

const loadDish = async () => {
  loading.value = true
  try {
    const cached = menuStore.getMenuItemById(dishId.value)
    if (cached) {
      dish.value = cached
    }
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
      title: `${dish.value.name} — Время приготовления`
    })
  }
})
</script>

<style scoped>
.waiting-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.waiting-page__header {
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

.waiting-page__back {
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
.waiting-page__back:hover { background: var(--bg-tertiary, #e5e7eb); }

.waiting-page__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.waiting-page__subtitle {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.waiting-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  color: var(--text-secondary);
}
.waiting-page__state h2 { margin: 16px 0 8px; color: var(--text-primary); }

.waiting-page__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.waiting-page__empty-icon { color: var(--text-tertiary); margin-bottom: 8px; }

.waiting-page__content {
  padding: 0 20px 100px;
}

/* Timer Card */
.waiting-page__timer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  margin: 24px 0;
  background: var(--bg-secondary);
  border-radius: 24px;
}

.waiting-page__timer-ring {
  position: relative;
  width: 160px;
  height: 160px;
  margin-bottom: 20px;
}
.waiting-page__ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.waiting-page__ring-progress {
  transition: stroke-dashoffset 1.5s ease-out;
}

.waiting-page__timer-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.waiting-page__timer-value {
  display: block;
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}
.waiting-page__timer-unit {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.waiting-page__timer-label {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
}

/* Section */
.waiting-page__section {
  margin: 24px 0;
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
}

.waiting-page__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
}

.waiting-page__info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.waiting-page__info-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: var(--bg-primary);
  border-radius: 12px;
}
.waiting-page__info-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}
.waiting-page__info-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.waiting-page__info-value {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Note */
.waiting-page__note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  margin: 24px 0;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}
.waiting-page__note p { margin: 0; }

/* Footer */
.waiting-page__footer {
  margin-top: 32px;
  text-align: center;
}

.waiting-page__action-btn {
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
.waiting-page__action-btn:hover { opacity: 0.9; }
</style>
