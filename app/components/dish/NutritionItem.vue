<template>
  <div class="flex items-center justify-between text-body-sm">
    <AppText class="text-neutral-20">
      {{ label }}:
    </AppText>
    <div class="flex items-center space-x-2">
      <AppText class="text-white">
        {{ value }}{{ unit }}
      </AppText>
      <AppText 
        v-if="percentage"
        class="text-neutral-20 text-caption"
      >
        ({{ percentage }}%)
      </AppText>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: number
  unit: string
  percentage?: number
}

defineProps<Props>()
</script>
