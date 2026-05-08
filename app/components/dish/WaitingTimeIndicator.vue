<template>
  <div :class="containerClasses">
    <!-- Clock Icon -->
    <BaseIcon name="clock" :size="iconSize" class="text-neutral-20" />
    
    <!-- Time Text -->
    <AppText :size="textSize" class="text-neutral-20">
      {{ timeText }}
    </AppText>

    <!-- Status Indicator -->
    <div 
      v-if="showStatus"
      :class="[
        'w-2 h-2 rounded-full',
        statusColor
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  time: number // in minutes
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  status?: 'fast' | 'normal' | 'slow'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showStatus: true,
  status: 'normal'
})

const containerClasses = computed(() => [
  'flex items-center justify-center space-x-2',
  {
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg'
  }
])

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'xs'
    case 'lg': return 'md'
    default: return 'sm'
  }
})

const textSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'body-sm'
    case 'lg': return 'body-lg'
    default: return 'body-md'
  }
})

const { t } = useI18n()
const timeText = computed(() => {
  if (props.time < 60) {
    return t('menu.readyIn', { time: `${props.time} ${t('menu.units.minutes')}` })
  } else {
    const hours = Math.floor(props.time / 60)
    const minutes = props.time % 60
    const timeStr = minutes > 0 
      ? `${hours}${t('menu.units.hours')} ${minutes}${t('menu.units.minutes_short')}`
      : `${hours}${t('menu.units.hours')}`
    return t('menu.readyIn', { time: timeStr })
  }
})

const statusColor = computed(() => {
  switch (props.status) {
    case 'fast': return 'bg-primary-green'
    case 'slow': return 'bg-primary-orange'
    default: return 'bg-neutral-20'
  }
})

// Determine status based on time
const computedStatus = computed(() => {
  if (props.time <= 15) return 'fast'
  if (props.time >= 45) return 'slow'
  return 'normal'
})
</script>
