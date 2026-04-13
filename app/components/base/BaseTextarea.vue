<template>
  <div class="base-textarea">
    <div class="base-textarea__wrapper">
      <textarea
        :id="textareaId"
        ref="textareaRef"
        :value="modelValue"
        :placeholder="floatingLabel ? ' ' : placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :maxlength="maxlength"
        :aria-required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined"
        :class="textareaClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <label
        v-if="floatingLabel && label"
        :for="textareaId"
        :class="labelClasses"
      >
        {{ label }}
        <span v-if="required" class="base-textarea__required">*</span>
      </label>
    </div>
    
    <!-- Non-floating label -->
    <label
      v-if="!floatingLabel && label"
      :for="textareaId"
      class="base-textarea__label"
    >
      {{ label }}
      <span v-if="required" class="base-textarea__required">*</span>
    </label>
    
    <div v-if="error || success || hint || showCharCount" class="base-textarea__footer">
      <div v-if="error || success || hint" class="base-textarea__message">
        <span
          v-if="error"
          :id="`${textareaId}-error`"
          class="base-textarea__error"
          role="alert"
        >
          {{ error }}
        </span>
        <span
          v-else-if="success"
          class="base-textarea__success"
          role="status"
        >
          {{ success }}
        </span>
        <span
          v-else-if="hint"
          :id="`${textareaId}-hint`"
          class="base-textarea__hint"
        >
          {{ hint }}
        </span>
      </div>
      
      <div v-if="showCharCount" class="base-textarea__char-count">
        {{ characterCount }}{{ maxlength ? `/${maxlength}` : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  rows?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  floatingLabel?: boolean
  maxlength?: number
  showCharCount?: boolean
  autoResize?: boolean
  error?: string
  success?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  rows: 4,
  disabled: false,
  readonly: false,
  required: false,
  floatingLabel: true,
  showCharCount: false,
  autoResize: false
})

const modelValue = defineModel<string>()

const emit = defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const slots = defineSlots<{}>()

const textareaRef = ref<HTMLTextAreaElement>()
const isFocused = ref(false)

const textareaId = useId()

const hasValue = computed(() => {
  return modelValue.value !== undefined && modelValue.value !== null && modelValue.value !== ''
})

const characterCount = computed(() => {
  return modelValue.value?.length || 0
})

const textareaClasses = computed(() => {
  const classes = ['base-textarea__field']
  
  // Add size modifier
  classes.push(`base-textarea__field--${props.size}`)
  
  // Add state modifiers
  if (props.error) classes.push('base-textarea__field--error')
  if (props.success) classes.push('base-textarea__field--success')
  if (props.disabled) classes.push('base-textarea__field--disabled')
  if (props.readonly) classes.push('base-textarea__field--readonly')
  
  return classes
})

const labelClasses = computed(() => {
  const classes = ['base-textarea__floating-label']
  
  if (isFocused.value || hasValue.value) {
    classes.push('base-textarea__floating-label--active')
  }
  
  if (props.error) classes.push('base-textarea__floating-label--error')
  if (props.success) classes.push('base-textarea__floating-label--success')
  
  return classes
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  modelValue.value = target.value
  
  if (props.autoResize) {
    autoResizeTextarea(target)
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

const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

// Auto-resize on mount if enabled
onMounted(() => {
  if (props.autoResize && textareaRef.value) {
    autoResizeTextarea(textareaRef.value)
  }
})

// Watch for value changes to auto-resize
watch(() => modelValue.value, () => {
  if (props.autoResize && textareaRef.value) {
    nextTick(() => {
      autoResizeTextarea(textareaRef.value!)
    })
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-textarea {
  width: 100%;
}

.base-textarea__wrapper {
  position: relative;
  display: flex;
  align-items: flex-start;
}

.base-textarea__field {
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-input;
  color: var(--text-primary);
  font-family: $font-primary;
  transition: $transition-base-ease;
  resize: vertical;
  
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
    line-height: $leading-normal;
  }
  
  &--md {
    padding: $space-3 $space-4;
    font-size: $text-base;
    line-height: $leading-normal;
  }
  
  &--lg {
    padding: $space-4 $space-5;
    font-size: $text-lg;
    line-height: $leading-normal;
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
    resize: none;
  }
  
  &--readonly {
    background-color: var(--bg-secondary);
    cursor: default;
    resize: none;
  }
}

.base-textarea__floating-label {
  position: absolute;
  left: $space-4;
  top: $space-3;
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
    
    &.base-textarea__floating-label--active {
      color: var(--color-error);
    }
  }
  
  &--success {
    color: var(--color-success);
    
    &.base-textarea__floating-label--active {
      color: var(--color-success);
    }
  }
}

.base-textarea__label {
  display: block;
  margin-bottom: $space-2;
  color: var(--text-primary);
  font-size: $text-sm;
  font-weight: $font-medium;
}

.base-textarea__required {
  color: var(--color-error);
  margin-left: $space-1;
}

.base-textarea__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: $space-2;
  gap: $space-2;
}

.base-textarea__message {
  font-size: $text-sm;
  flex: 1;
}

.base-textarea__error {
  color: var(--color-error);
}

.base-textarea__success {
  color: var(--color-success);
}

.base-textarea__hint {
  color: var(--text-tertiary);
}

.base-textarea__char-count {
  font-size: $text-sm;
  color: var(--text-tertiary);
  white-space: nowrap;
}
</style>
