<template>
  <div class="base-checkbox" :class="checkboxClasses">
    <label class="base-checkbox__container">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        class="base-checkbox__input"
        @change="handleChange"
      />
      
      <div class="base-checkbox__box">
        <Transition name="check">
          <BaseIcon
            v-if="modelValue"
            name="check"
            size="xs"
            class="base-checkbox__icon"
          />
        </Transition>
      </div>
      
      <span v-if="label || $slots.default" class="base-checkbox__label">
        <slot>{{ label }}</slot>
        <span v-if="required" class="base-checkbox__required">*</span>
      </span>
    </label>
    
    <span v-if="error" class="base-checkbox__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean
  label?: string
  disabled?: boolean
  required?: boolean
  error?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  required: false,
  size: 'md',
  color: 'primary'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const checkboxClasses = computed(() => {
  return [
    `base-checkbox--${props.size}`,
    `base-checkbox--${props.color}`,
    {
      'base-checkbox--disabled': props.disabled,
      'base-checkbox--error': props.error,
      'base-checkbox--checked': props.modelValue
    }
  ]
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('change', target.checked)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-checkbox {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.base-checkbox__container {
  display: inline-flex;
  align-items: flex-start;
  gap: $space-3;
  cursor: pointer;
  position: relative;
  user-select: none;
  padding: $space-1 0;
}

.base-checkbox__input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.base-checkbox__box {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  background-color: var(--bg-primary);
  border: 2px solid var(--border-primary);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-base-ease;
  margin-top: 2px; // Align with first line of text
  
  .base-checkbox--checked & {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
  }
  
  .base-checkbox--error & {
    border-color: var(--color-error);
  }
  
  .base-checkbox--disabled & {
    background-color: var(--bg-secondary);
    border-color: var(--border-secondary);
    cursor: not-allowed;
  }
}

.base-checkbox__icon {
  color: white;
  stroke-width: 3px;
}

.base-checkbox__label {
  font-size: $text-sm;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  transition: color $transition-base-ease;
  
  .base-checkbox--checked & {
    color: var(--text-primary);
  }
  
  .base-checkbox--disabled & {
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
}

.base-checkbox__required {
  color: var(--color-error);
  margin-left: $space-1;
}

.base-checkbox__error {
  font-size: $text-xs;
  color: var(--color-error);
  margin-left: 28px; // Align with text
}

// Hover effects
.base-checkbox__container:hover .base-checkbox__box {
  border-color: var(--color-primary);
}

.base-checkbox--disabled .base-checkbox__container:hover .base-checkbox__box {
  border-color: var(--border-secondary);
}

// Sizes
.base-checkbox--sm {
  .base-checkbox__box {
    width: 16px;
    height: 16px;
  }
  .base-checkbox__label {
    font-size: $text-xs;
  }
}

.base-checkbox--lg {
  .base-checkbox__box {
    width: 24px;
    height: 24px;
  }
  .base-checkbox__label {
    font-size: $text-base;
  }
}

// Transitions
.check-enter-active,
.check-leave-active {
  transition: transform 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46), opacity 0.2s;
}

.check-enter-from,
.check-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
