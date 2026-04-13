<template>
  <div class="base-select">
    <div class="base-select__wrapper">
      <select
        :id="selectId"
        ref="selectRef"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined"
        :class="selectClasses"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
          :disabled="getOptionDisabled(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      
      <label
        v-if="floatingLabel && label"
        :for="selectId"
        :class="labelClasses"
      >
        {{ label }}
        <span v-if="required" class="base-select__required">*</span>
      </label>
      
      <div class="base-select__icon">
        <BaseIcon name="chevron-down" size="sm" />
      </div>
    </div>
    
    <!-- Non-floating label -->
    <label
      v-if="!floatingLabel && label"
      :for="selectId"
      class="base-select__label"
    >
      {{ label }}
      <span v-if="required" class="base-select__required">*</span>
    </label>
    
    <div v-if="error || success || hint" class="base-select__message">
      <span
        v-if="error"
        :id="`${selectId}-error`"
        class="base-select__error"
        role="alert"
      >
        {{ error }}
      </span>
      <span
        v-else-if="success"
        class="base-select__success"
        role="status"
      >
        {{ success }}
      </span>
      <span
        v-else-if="hint"
        :id="`${selectId}-hint`"
        class="base-select__hint"
      >
        {{ hint }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option {
  label: string
  value: string | number
  disabled?: boolean
}

interface Props {
  options: Option[] | string[] | number[]
  label?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
  floatingLabel?: boolean
  error?: string
  success?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
  required: false,
  floatingLabel: true
})

const modelValue = defineModel<string | number>()

const emit = defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const slots = defineSlots<{}>()

const selectRef = ref<HTMLSelectElement>()
const isFocused = ref(false)

const selectId = useId()

const hasValue = computed(() => {
  return modelValue.value !== undefined && modelValue.value !== null && modelValue.value !== ''
})

const selectClasses = computed(() => {
  const classes = ['base-select__field']
  
  // Add size modifier
  classes.push(`base-select__field--${props.size}`)
  
  // Add state modifiers
  if (props.error) classes.push('base-select__field--error')
  if (props.success) classes.push('base-select__field--success')
  if (props.disabled) classes.push('base-select__field--disabled')
  
  return classes
})

const labelClasses = computed(() => {
  const classes = ['base-select__floating-label']
  
  if (isFocused.value || hasValue.value) {
    classes.push('base-select__floating-label--active')
  }
  
  if (props.error) classes.push('base-select__floating-label--error')
  if (props.success) classes.push('base-select__floating-label--success')
  
  return classes
})

const getOptionValue = (option: Option | string | number): string | number => {
  if (typeof option === 'object') {
    return option.value
  }
  return option
}

const getOptionLabel = (option: Option | string | number): string => {
  if (typeof option === 'object') {
    return option.label
  }
  return String(option)
}

const getOptionDisabled = (option: Option | string | number): boolean => {
  if (typeof option === 'object') {
    return option.disabled || false
  }
  return false
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  modelValue.value = value
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-select {
  width: 100%;
}

.base-select__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.base-select__field {
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-input;
  color: var(--text-primary);
  font-family: $font-primary;
  transition: $transition-base-ease;
  cursor: pointer;
  appearance: none;
  padding-right: 2.5rem;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }
  
  // Size variants
  &--sm {
    padding: $space-2 $space-3;
    font-size: $text-sm;
    min-height: 36px;
  }
  
  &--md {
    padding: $space-3 $space-4;
    font-size: $text-base;
    min-height: $touch-target-min;
  }
  
  &--lg {
    padding: $space-4 $space-5;
    font-size: $text-lg;
    min-height: 52px;
  }
  
  // State variants
  &--error {
    border-color: var(--color-error);
    
    &:focus {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
  
  &--success {
    border-color: var(--color-success);
    
    &:focus {
      border-color: var(--color-success);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
  }
  
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--bg-secondary);
  }
}

.base-select__icon {
  position: absolute;
  right: $space-3;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.base-select__floating-label {
  position: absolute;
  left: $space-4;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: $text-base;
  font-weight: $font-regular;
  transition: $transition-base-ease;
  pointer-events: none;
  background-color: var(--bg-primary);
  padding: 0 $space-1;
  
  &--active {
    top: 0;
    transform: translateY(-50%);
    font-size: $text-sm;
    color: var(--color-primary);
  }
  
  &--error {
    color: var(--color-error);
    
    &.base-select__floating-label--active {
      color: var(--color-error);
    }
  }
  
  &--success {
    color: var(--color-success);
    
    &.base-select__floating-label--active {
      color: var(--color-success);
    }
  }
}

.base-select__label {
  display: block;
  margin-bottom: $space-2;
  color: var(--text-primary);
  font-size: $text-sm;
  font-weight: $font-medium;
}

.base-select__required {
  color: var(--color-error);
  margin-left: $space-1;
}

.base-select__message {
  margin-top: $space-2;
  font-size: $text-sm;
}

.base-select__error {
  color: var(--color-error);
}

.base-select__success {
  color: var(--color-success);
}

.base-select__hint {
  color: var(--text-tertiary);
}
</style>
