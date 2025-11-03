<template>
  <div class="space-y-6">
    <!-- Dish Image and Basic Info -->
    <div class="text-center space-y-4">
      <!-- Image Slider -->
      <DishImageSlider
        v-if="dish.images && dish.images.length > 1"
        :images="dish.images"
        :alt="dish.name"
        class="mx-auto"
      />
      <!-- Single Image -->
      <BaseImage
        v-else
        :src="dish.imageUrl || '/placeholder-dish.jpg'"
        :alt="dish.name"
        class="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg object-cover"
      />

      <!-- Dish Name and Description -->
      <div class="space-y-2">
        <AppHeading level="h2" size="heading-xl" class="text-white">
          {{ dish.name }}
        </AppHeading>
        <AppText class="text-neutral-20 max-w-md mx-auto">
          {{ dish.description }}
        </AppText>
      </div>

      <!-- Price and Calories -->
      <div class="flex items-center justify-center space-x-6">
        <PriceDisplay :price="dish.price" size="lg" />
        <CalorieDisplay 
          v-if="dish.calories" 
          :calories="dish.calories" 
        />
      </div>

      <!-- Waiting Time -->
      <WaitingTimeIndicator 
        v-if="dish.preparationTime"
        :time="dish.preparationTime"
      />
    </div>

    <!-- Subcategory Selector -->
    <SubcategorySelector
      v-if="dish.subcategories && dish.subcategories.length > 0"
      :subcategories="dish.subcategories"
      :selected="selectedSubcategory"
      @select="$emit('subcategory-selected', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

interface Props {
  dish: MenuItem
  selectedSubcategory?: string
}

interface Emits {
  (e: 'subcategory-selected', subcategoryId: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>