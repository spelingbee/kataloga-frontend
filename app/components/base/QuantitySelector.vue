<template>
  <div class="flex items-center gap-3">
    <CircularButton
      type="subtract"
      :size="size"
      :disabled="disabled || modelValue <= min"
      @click="decrement"
    />
    
    <div
      :class="[
        'flex items-center justify-center font-semibold text-white min-w-[3rem]',
        textSizeClasses[size]
      ]"
    >
      {{ displayValue }}
    </div>
    
    <CircularButton
      type="add"
      :size="size"
      :disabled="disabled || (max !== undefined && modelValue >= max)"
      @click="increment"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  step: 1,
  size: 'md',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

const textSizeClasses = {
  sm: 'text-body-sm',
  md: 'text-body-md',
  lg: 'text-body-lg'
}

const displayValue = computed(() => {
  return props.modelValue.toString()
})

const increment = () => {
  if (props.disabled) return
  
  const newValue = props.modelValue + props.step
  if (props.max === undefined || newValue <= props.max) {
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}

const decrement = () => {
  if (props.disabled) return
  
  const newValue = props.modelValue - props.step
  if (newValue >= props.min) {
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}
</script>
