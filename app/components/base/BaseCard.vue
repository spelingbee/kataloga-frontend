<template>
  <div
    :class="cardClasses"
    @click="handleClick"
  >
    <div v-if="$slots.header" class="card__header">
      <slot name="header" />
    </div>
    
    <div class="card__body">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  radius?: 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  radius: 'lg',
  shadow: 'md',
  hoverable: false,
  selected: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const cardClasses = computed(() => {
  const classes = ['card']
  
  // Add modifier classes
  classes.push(`card--padding-${props.padding}`)
  classes.push(`card--radius-${props.radius}`)
  classes.push(`card--shadow-${props.shadow}`)
  
  // Add state modifiers
  if (props.hoverable) classes.push('card--hoverable')
  if (props.selected) classes.push('card--selected')
  
  return classes
})

const handleClick = (event: Event) => {
  if (props.hoverable) {
    emit('click', event)
  }
}
</script>