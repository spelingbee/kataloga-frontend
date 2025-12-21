<template>
  <div class="menu-filters">
    <div class="menu-filters__header">
      <h3 class="menu-filters__title">Filters</h3>
      <button class="menu-filters__close" @click="$emit('close')">
        <BaseIcon name="x" size="sm" />
      </button>
    </div>

    <div class="menu-filters__content">
      <!-- Price Range -->
      <div class="menu-filters__section">
        <h4 class="menu-filters__section-title">Price Range</h4>
        <div class="menu-filters__price-inputs">
          <BaseInput
            v-model="filters.priceMin"
            type="number"
            placeholder="Min"
            min="0"
            step="0.01"
          />
          <span class="menu-filters__price-separator">-</span>
          <BaseInput
            v-model="filters.priceMax"
            type="number"
            placeholder="Max"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <!-- Dietary Options -->
      <div class="menu-filters__section">
        <h4 class="menu-filters__section-title">Dietary</h4>
        <div class="menu-filters__checkboxes">
          <label
            v-for="option in dietaryOptions"
            :key="option.value"
            class="menu-filters__checkbox"
          >
            <input
              v-model="filters.dietary"
              type="checkbox"
              :value="option.value"
            />
            <span class="menu-filters__checkbox-label">{{ option.label }}</span>
          </label>
        </div>
      </div>

      <!-- Availability -->
      <div class="menu-filters__section">
        <label class="menu-filters__checkbox">
          <input
            v-model="filters.availableOnly"
            type="checkbox"
          />
          <span class="menu-filters__checkbox-label">Available items only</span>
        </label>
      </div>
    </div>

    <div class="menu-filters__actions">
      <BaseButton variant="secondary" @click="clearFilters">
        Clear All
      </BaseButton>
      <BaseButton variant="primary" @click="applyFilters">
        Apply Filters
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useMenuStore } from '~/stores/menu'

defineEmits<{
  close: []
}>()

const menuStore = useMenuStore()

const filters = reactive({
  priceMin: '',
  priceMax: '',
  dietary: [] as string[],
  availableOnly: false
})

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'nut-free', label: 'Nut Free' }
]

const applyFilters = () => {
  const menuFilters: any = {}

  if (filters.priceMin || filters.priceMax) {
    menuFilters.priceRange = [
      parseFloat(filters.priceMin) || 0,
      parseFloat(filters.priceMax) || 999
    ]
  }

  if (filters.dietary.length > 0) {
    menuFilters.dietary = filters.dietary
  }

  if (filters.availableOnly) {
    menuFilters.availability = true
  }

  menuStore.applyFilters(menuFilters)
}

const clearFilters = () => {
  filters.priceMin = ''
  filters.priceMax = ''
  filters.dietary = []
  filters.availableOnly = false
  menuStore.clearFilters()
}
</script>

<style scoped lang="scss">
.menu-filters {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
}

.menu-filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.menu-filters__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.menu-filters__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
}

.menu-filters__content {
  margin-bottom: 20px;
}

.menu-filters__section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.menu-filters__section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.menu-filters__price-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-filters__price-separator {
  color: var(--text-secondary);
  font-weight: 500;
}

.menu-filters__checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-filters__checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
  }
}

.menu-filters__checkbox-label {
  font-size: 14px;
  color: var(--text-primary);
  user-select: none;
}

.menu-filters__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

// Mobile optimizations
@media (max-width: 640px) {
  .menu-filters {
    max-width: none;
    padding: 16px;
  }

  .menu-filters__actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>