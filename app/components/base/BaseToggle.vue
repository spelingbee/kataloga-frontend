<template>
  <div class="flex items-center">
    <label
      v-if="label && labelPosition === 'left'"
      :for="toggleId"
      class="text-body-sm text-white mr-3 cursor-pointer"
    >
      {{ label }}
    </label>
    
    <button
      :id="toggleId"
      type="button"
      :disabled="disabled"
      :class="[
        'relative inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green',
        'min-w-[44px] min-h-[44px] p-2', // Ensure proper touch target
        {
          'opacity-50 cursor-not-allowed': disabled,
          'cursor-pointer': !disabled,
        }
      ]"
      @click="toggle"
    >
      <span
        :class="[
          'relative inline-flex items-center transition-all duration-200',
          sizeClasses[size],
          {
            'bg-primary-green': modelValue,
            'bg-gray-600': !modelValue,
          }
        ]"
      >
        <span
          :class="[
            'bg-white rounded-full shadow-md transform transition-transform duration-200',
            thumbSizeClasses[size],
            {
              'translate-x-5': modelValue && size === 'sm',
              'translate-x-6': modelValue && size === 'md',
              'translate-x-7': modelValue && size === 'lg',
              'translate-x-0': !modelValue,
            }
          ]"
        />
      </span>
    </button>
    
    <label
      v-if="label && labelPosition === 'right'"
      :for="toggleId"
      class="text-body-sm text-white ml-3 cursor-pointer"
    >
      {{ label }}
    </label>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  labelPosition?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  labelPosition: 'right',
  size: 'md',
  disabled: false
})

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  change: [value: boolean]
}>()

const slots = defineSlots<{}>()

const toggleId = computed(() => `toggle-${Math.random().toString(36).substring(2, 11)}`)

const sizeClasses = {
  sm: 'w-9 h-5 rounded-full',
  md: 'w-11 h-6 rounded-full',
  lg: 'w-14 h-7 rounded-full'
}

const thumbSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
}

const toggle = () => {
  if (!props.disabled) {
    const newValue = !modelValue.value
    modelValue.value = newValue
    emit('change', newValue)
  }
}
</script>