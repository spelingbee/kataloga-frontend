<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-body-sm font-medium text-white mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-primary-red ml-1">*</span>
    </label>
    
    <div class="relative">
      <div
        v-if="$slots.prefix || prefixIcon"
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      >
        <slot name="prefix">
          <BaseIcon v-if="prefixIcon" :name="prefixIcon" size="sm" />
        </slot>
      </div>
      
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :class="[
          'w-full bg-background-card border border-border-subtle rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent',
          sizeClasses[size],
          {
            'pl-10': $slots.prefix || prefixIcon,
            'pr-10': $slots.suffix || suffixIcon || clearable,
            'border-red-500 focus:ring-red-500': error,
            'border-primary-green focus:ring-primary-green': success,
            'opacity-50 cursor-not-allowed': disabled,
          }
        ]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <div
        v-if="$slots.suffix || suffixIcon || (clearable && modelValue)"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
    
    <div v-if="error || success || hint" class="mt-2">
      <AppText
        v-if="error"
        size="caption"
        color="red"
      >
        {{ error }}
      </AppText>
      <AppText
        v-else-if="success"
        size="caption"
        color="green"
      >
        {{ success }}
      </AppText>
      <AppText
        v-else-if="hint"
        size="caption"
        color="muted"
      >
        {{ hint }}
      </AppText>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  prefixIcon?: string
  suffixIcon?: string
  error?: string
  success?: string
  hint?: string
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

const sizeClasses = {
  sm: 'px-3 py-2 text-body-sm',
  md: 'px-4 py-3 text-body-md',
  lg: 'px-5 py-4 text-body-lg'
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const clear = () => {
  emit('update:modelValue', '')
}
</script>