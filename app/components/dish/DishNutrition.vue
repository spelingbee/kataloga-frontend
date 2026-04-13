<template>
  <div class="space-y-4">
    <AppHeading level="h4" size="heading-md" class="text-white">
      Nutrition Information
    </AppHeading>

    <!-- Main Calorie Display -->
    <div class="flex items-center justify-center">
      <CalorieDisplay :calories="nutrition.calories" size="lg" />
    </div>

    <!-- Detailed Nutrition Grid -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Macronutrients -->
      <div class="space-y-2">
        <AppText size="body-sm" class="text-neutral-20 font-medium">
          Macronutrients
        </AppText>
        <div class="space-y-1">
          <NutritionItem
            label="Protein"
            :value="nutrition.protein"
            unit="g"
            :percentage="getProteinPercentage(nutrition.protein)"
          />
          <NutritionItem
            label="Carbs"
            :value="nutrition.carbs"
            unit="g"
            :percentage="getCarbsPercentage(nutrition.carbs)"
          />
          <NutritionItem
            label="Fat"
            :value="nutrition.fat"
            unit="g"
            :percentage="getFatPercentage(nutrition.fat)"
          />
        </div>
      </div>

      <!-- Additional Info -->
      <div class="space-y-2">
        <AppText size="body-sm" class="text-neutral-20 font-medium">
          Additional
        </AppText>
        <div class="space-y-1">
          <NutritionItem
            v-if="nutrition.fiber"
            label="Fiber"
            :value="nutrition.fiber"
            unit="g"
          />
          <NutritionItem
            v-if="nutrition.sugar"
            label="Sugar"
            :value="nutrition.sugar"
            unit="g"
          />
          <NutritionItem
            v-if="nutrition.sodium"
            label="Sodium"
            :value="nutrition.sodium"
            unit="mg"
          />
        </div>
      </div>
    </div>

    <!-- Allergens -->
    <div v-if="nutrition.allergens && nutrition.allergens.length > 0" class="space-y-2">
      <AppText size="body-sm" class="text-neutral-20 font-medium">
        Allergens
      </AppText>
      <div class="flex flex-wrap gap-2">
        <BaseBadge
          v-for="allergen in nutrition.allergens"
          :key="allergen"
          variant="warning"
          size="sm"
        >
          {{ allergen }}
        </BaseBadge>
      </div>
    </div>

    <!-- Dietary Labels -->
    <div v-if="nutrition.dietaryLabels && nutrition.dietaryLabels.length > 0" class="space-y-2">
      <AppText size="body-sm" class="text-neutral-20 font-medium">
        Dietary Information
      </AppText>
      <div class="flex flex-wrap gap-2">
        <BaseBadge
          v-for="label in nutrition.dietaryLabels"
          :key="label"
          variant="success"
          size="sm"
        >
          {{ label }}
        </BaseBadge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Nutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  allergens?: string[]
  dietaryLabels?: string[]
}

interface Props {
  nutrition: Nutrition
}

defineProps<Props>()

// Calculate percentage of daily value (based on 2000 calorie diet)
const getProteinPercentage = (protein: number) => {
  return Math.round((protein / 50) * 100) // 50g daily value
}

const getCarbsPercentage = (carbs: number) => {
  return Math.round((carbs / 300) * 100) // 300g daily value
}

const getFatPercentage = (fat: number) => {
  return Math.round((fat / 65) * 100) // 65g daily value
}
</script>
