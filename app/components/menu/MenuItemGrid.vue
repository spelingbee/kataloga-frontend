<template>
  <div class="menu-item-grid">
    <MenuItemCard
      v-for="item in items"
      :key="item.id"
      :menu-item="item"
      class="menu-item-grid__item"
      @click="$emit('item-selected', item)"
      @add-to-cart="$emit('add-to-cart', item)"
    />
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

interface Props {
  items: MenuItem[]
}

defineProps<Props>()

defineEmits<{
  'item-selected': [item: MenuItem]
  'add-to-cart': [item: MenuItem]
}>()
</script>

<style lang="scss" scoped>
@use '../../assets/scss/tokens/spacing' as *;

.menu-item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $space-6;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: $space-4;
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: $space-3;
  }
}

.menu-item-grid__item {
  animation: fadeInUp 0.4s ease-out backwards;

  @for $i from 1 through 12 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .menu-item-grid__item {
    animation: none;
  }
}
</style>
