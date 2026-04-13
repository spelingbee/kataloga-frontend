<template>
  <div class="base-toggle">
    <label
      v-if="label && labelPosition === 'left'"
      :for="toggleId"
      class="base-toggle__label base-toggle__label--left"
    >
      {{ label }}
    </label>
    
    <button
      :id="toggleId"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="base-toggle__btn"
      :class="[
        `base-toggle__btn--${size}`,
        { 'base-toggle__btn--active': modelValue }
      ]"
      @click="toggle"
    >
      <span class="base-toggle__thumb" />
    </button>
    
    <label
      v-if="label && labelPosition === 'right'"
      :for="toggleId"
      class="base-toggle__label base-toggle__label--right"
    >
      {{ label }}
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

const toggleId = useId()

const toggle = () => {
  if (!props.disabled) {
    const newValue = !modelValue.value
    modelValue.value = newValue
    emit('change', newValue)
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;

.base-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.base-toggle__label {
  font-size: $text-sm;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;

  &--left { margin-right: $space-3; }
  &--right { margin-left: $space-3; }
}

.base-toggle__btn {
  position: relative;
  border-radius: $radius-full;
  background: var(--bg-tertiary);
  border: none;
  padding: 0;
  transition: all $transition-base;
  cursor: pointer;
  display: flex;
  align-items: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--active {
    background: var(--color-success);
  }

  // Sizes
  &--sm {
    width: 32px;
    height: 18px;
    .base-toggle__thumb {
      width: 14px;
      height: 14px;
      transform: translateX(2px);
    }
    &.base-toggle__btn--active .base-toggle__thumb {
      transform: translateX(16px);
    }
  }

  &--md {
    width: 44px;
    height: 24px;
    .base-toggle__thumb {
      width: 20px;
      height: 20px;
      transform: translateX(2px);
    }
    &.base-toggle__btn--active .base-toggle__thumb {
      transform: translateX(22px);
    }
  }

  &--lg {
    width: 56px;
    height: 30px;
    .base-toggle__thumb {
      width: 26px;
      height: 26px;
      transform: translateX(2px);
    }
    &.base-toggle__btn--active .base-toggle__thumb {
      transform: translateX(28px);
    }
  }
}

.base-toggle__thumb {
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform $transition-base;
}
</style>
