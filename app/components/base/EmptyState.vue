<template>
  <div class="empty-state" :class="sizeClass">
    <!-- Icon -->
    <div class="empty-icon">
      <BaseIcon 
        :name="icon" 
        :size="iconSize"
        class="text-neutral-20 opacity-50"
      />
    </div>
    
    <!-- Title -->
    <h3 class="empty-title">{{ title }}</h3>
    
    <!-- Description -->
    <p v-if="description" class="empty-description">{{ description }}</p>
    
    <!-- Action Button -->
    <div v-if="actionText" class="empty-action">
      <BaseButton
        :variant="actionVariant"
        :size="actionSize"
        @click="$emit('action')"
      >
        <BaseIcon 
          v-if="actionIcon" 
          :name="actionIcon" 
          size="xs"
          class="mr-2"
        />
        {{ actionText }}
      </BaseButton>
    </div>
    
    <!-- Custom Slot -->
    <div v-if="$slots.default" class="empty-custom">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  description?: string
  actionText?: string
  actionIcon?: string
  actionVariant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'inbox',
  actionVariant: 'primary',
  size: 'md',
})

defineEmits<{
  action: []
}>()

const sizeClass = computed(() => `empty-state--${props.size}`)

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'md'
    case 'lg':
      return 'xl'
    default:
      return 'lg'
  }
})

const actionSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'sm'
    case 'lg':
      return 'md'
    default:
      return 'sm'
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.empty-state--sm {
  padding: 1rem;
}

.empty-state--lg {
  padding: 3rem;
}

.empty-icon {
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-neutral-80);
  margin-bottom: 0.5rem;
}

.empty-state--sm .empty-title {
  font-size: 1rem;
}

.empty-state--lg .empty-title {
  font-size: 1.25rem;
}

.empty-description {
  color: var(--color-neutral-20);
  opacity: 0.7;
  margin-bottom: 1.5rem;
  max-width: 28rem;
}

.empty-state--sm .empty-description {
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.empty-state--lg .empty-description {
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.empty-action {
  margin-bottom: 1rem;
}

.empty-custom {
  width: 100%;
}

/* Dark theme support */
.dark .empty-title {
  color: var(--color-neutral-20);
}

.dark .empty-description {
  color: var(--color-neutral-80);
}
</style>