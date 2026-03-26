<template>
  <div class="base-input">
    <div class="base-input__wrapper">
      <div
        v-if="$slots.prefix || prefixIcon"
        class="base-input__prefix"
      >
        <slot name="prefix">
          <BaseIcon v-if="prefixIcon" :name="prefixIcon" size="sm" />
        </slot>
      </div>
      
      <textarea
        v-if="type === 'textarea'"
        :id="inputId"
        ref="inputRef"
        :value="String(modelValue || '')"
        :placeholder="floatingLabel ? ' ' : placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <input
        v-else
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="type === 'file' ? undefined : String(modelValue || '')"
        :placeholder="floatingLabel ? ' ' : placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
        :autocomplete="autocomplete"
        :min="min"
        :max="max"
        :step="step"
        :accept="accept"
        :multiple="multiple"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <label
        v-if="floatingLabel && label"
        :for="inputId"
        :class="labelClasses"
      >
        {{ label }}
        <span v-if="required" class="base-input__required">*</span>
      </label>
      
      <div
        v-if="$slots.suffix || suffixIcon || (clearable && modelValue)"
        class="base-input__suffix"
      >
        <slot name="suffix">
          <BaseButton
            v-if="clearable && modelValue"
            variant="ghost"
            size="sm"
            icon="x"
            @click="clear"
          />
          <BaseIcon v-else-if="suffixIcon" :name="suffixIcon" size="sm" />
        </slot>
      </div>
    </div>
    
    <!-- Non-floating label -->
    <label
      v-if="!floatingLabel && label"
      :for="inputId"
      class="base-input__label"
    >
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>
    
    <div v-if="error || success || hint" class="base-input__message">
      <span
        v-if="error"
        :id="`${inputId}-error`"
        class="base-input__error"
        role="alert"
      >
        {{ error }}
      </span>
      <span
        v-else-if="success"
        class="base-input__success"
        role="status"
      >
        {{ success }}
      </span>
      <span
        v-else-if="hint"
        :id="`${inputId}-hint`"
        class="base-input__hint"
      >
        {{ hint }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
// Define all supported HTML input types
type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'search' 
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  | 'color'
  | 'range'
  | 'file'
  | 'hidden'
  | 'checkbox'
  | 'radio'
  | 'textarea' // Special case for textarea-like behavior

interface Props {
  type?: InputType
  label?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  floatingLabel?: boolean
  prefixIcon?: string
  suffixIcon?: string
  error?: string
  success?: string
  hint?: string
  autocomplete?: string
  // Additional HTML input attributes for type safety
  min?: string | number
  max?: string | number
  step?: string | number
  accept?: string
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  floatingLabel: true
})

// Define model value type based on input type
type ModelValue = string | number | File | File[] | null

const modelValue = defineModel<ModelValue>()

const emit = defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const slots = defineSlots<{
  prefix?: () => any
  suffix?: () => any
}>()

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const isFocused = ref(false)

const inputId = computed(() => `input-${Math.random().toString(36).substring(2, 11)}`)

const hasValue = computed(() => {
  if (modelValue.value === null || modelValue.value === undefined) return false
  
  // Handle different types
  if (props.type === 'file') {
    return Array.isArray(modelValue.value) 
      ? modelValue.value.length > 0 
      : modelValue.value instanceof File
  }
  
  return String(modelValue.value) !== ''
})

const inputClasses = computed(() => {
  const classes = ['base-input__field']
  
  // Add size modifier
  classes.push(`base-input__field--${props.size}`)
  
  // Add state modifiers
  if (props.error) classes.push('base-input__field--error')
  if (props.success) classes.push('base-input__field--success')
  if (props.disabled) classes.push('base-input__field--disabled')
  if (props.readonly) classes.push('base-input__field--readonly')
  if (props.prefixIcon || slots.prefix) classes.push('base-input__field--has-prefix')
  if (props.suffixIcon || slots.suffix || (props.clearable && hasValue.value)) classes.push('base-input__field--has-suffix')
  
  return classes
})

const labelClasses = computed(() => {
  const classes = ['base-input__floating-label']
  
  if (isFocused.value || hasValue.value) {
    classes.push('base-input__floating-label--active')
  }
  
  if (props.error) classes.push('base-input__floating-label--error')
  if (props.success) classes.push('base-input__floating-label--success')
  
  return classes
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  
  // Handle different input types appropriately
  switch (props.type) {
    case 'number':
    case 'range':
      modelValue.value = target.value === '' ? null : Number(target.value)
      break
    case 'file':
      const fileTarget = target as HTMLInputElement
      if (props.multiple) {
        modelValue.value = fileTarget.files ? Array.from(fileTarget.files) : null
      } else {
        modelValue.value = fileTarget.files?.[0] || null
      }
      break
    case 'checkbox':
      const checkboxTarget = target as HTMLInputElement
      modelValue.value = checkboxTarget.checked ? 'true' : 'false'
      break
    case 'textarea':
    default:
      modelValue.value = target.value
  }
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const clear = () => {
  if (props.type === 'number' || props.type === 'range') {
    modelValue.value = null
  } else if (props.type === 'file') {
    modelValue.value = null
    // Clear the file input
    if (inputRef.value && 'value' in inputRef.value) {
      inputRef.value.value = ''
    }
  } else {
    modelValue.value = ''
  }
  inputRef.value?.focus()
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-input {
  width: 100%;
}

.base-input__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input__field {
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-input;
  color: var(--text-primary);
  font-family: $font-primary;
  transition: $transition-base-ease;
  
  &::placeholder {
    color: var(--text-tertiary);
  }
  
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
  
  &--readonly {
    background-color: var(--bg-secondary);
    cursor: default;
  }
  
  &--has-prefix {
    padding-left: 2.5rem;
  }
  
  &--has-suffix {
    padding-right: 2.5rem;
  }
}

.base-input__prefix,
.base-input__suffix {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
  
  button {
    pointer-events: auto;
  }
}

.base-input__prefix {
  left: $space-3;
}

.base-input__suffix {
  right: $space-3;
}

.base-input__floating-label {
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
    
    &.base-input__floating-label--active {
      color: var(--color-error);
    }
  }
  
  &--success {
    color: var(--color-success);
    
    &.base-input__floating-label--active {
      color: var(--color-success);
    }
  }
}

.base-input__label {
  display: block;
  margin-bottom: $space-2;
  color: var(--text-primary);
  font-size: $text-sm;
  font-weight: $font-medium;
}

.base-input__required {
  color: var(--color-error);
  margin-left: $space-1;
}

.base-input__message {
  margin-top: $space-2;
  font-size: $text-sm;
}

.base-input__error {
  color: var(--color-error);
}

.base-input__success {
  color: var(--color-success);
}

.base-input__hint {
  color: var(--text-tertiary);
}
</style>