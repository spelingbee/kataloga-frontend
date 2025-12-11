<template>
  <BaseCard
    class="menu-item-card"
    variant="default"
    padding="md"
    hoverable
    @click="handleClick"
  >
    <template #image>
      <img 
        :src="menuItem.imageUrl || '/images/placeholder-dish.webp'"
        :alt="menuItem.name"
        class="menu-item-card__image"
        loading="lazy"
      />
      <BaseBadge 
        v-if="isPopular" 
        class="menu-item-card__badge"
        variant="primary"
        size="sm"
      >
        Popular
      </BaseBadge>
    </template>
    
    <div class="menu-item-card__info">
      <h3 class="menu-item-card__name">{{ menuItem.name }}</h3>
      <p class="menu-item-card__description">{{ menuItem.description }}</p>
      <div class="menu-item-card__footer">
        <span class="menu-item-card__price">${{ menuItem.price.toFixed(2) }}</span>
        <BaseButton 
          variant="primary" 
          size="sm"
          :disabled="!menuItem.isActive"
          @click.stop="addToCart"
        >
          Add to Cart
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  isActive: boolean
  isPopular?: boolean
}

interface Props {
  menuItem: MenuItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [menuItem: MenuItem]
  addToCart: [menuItem: MenuItem]
}>()

// Computed properties
const isPopular = computed(() => {
  return props.menuItem.isPopular || false
})

// Methods
const handleClick = () => {
  emit('click', props.menuItem)
}

const addToCart = () => {
  if (!props.menuItem.isActive) return
  emit('addToCart', props.menuItem)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/transitions' as *;

.menu-item-card {
  position: relative;
  max-width: 320px;
}

.menu-item-card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.menu-item-card__badge {
  position: absolute;
  top: $space-3;
  left: $space-3;
  z-index: 2;
}

.menu-item-card__info {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.menu-item-card__name {
  font-family: $font-primary;
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0;
  line-height: $leading-tight;
}

.menu-item-card__description {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-secondary);
  margin: 0;
  line-height: $leading-normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-item-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $space-2;
}

.menu-item-card__price {
  font-family: $font-primary;
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .menu-item-card {
    transition: none;
  }
}
</style>