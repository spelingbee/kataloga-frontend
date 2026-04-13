<template>
  <div
    :class="[
      'flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer',
      stateClasses[currentState],
      {
        'opacity-50 cursor-not-allowed': disabled,
      }
    ]"
    @click="toggle"
  >
    <div class="flex items-center gap-3">
      <div
        v-if="icon"
        class="w-8 h-8 rounded-full bg-background-dark flex items-center justify-center"
      >
        <span class="text-lg">{{ icon }}</span>
      </div>
      
      <div>
        <AppText
          size="body-md"
          :color="textColor"
          class="font-medium"
        >
          {{ label }}
        </AppText>
        <AppText
          v-if="description"
          size="caption"
          color="muted"
        >
          {{ description }}
        </AppText>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <AppText
        v-if="currentState === 'lower'"
        size="caption"
        color="orange"
        class="font-medium"
      >
        Меньше
      </AppText>
      
      <div
        :class="[
          'w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
          toggleClasses[currentState]
        ]"
      >
        <BaseIcon
          v-if="currentState !== 'default'"
          :name="currentState === 'pressed' ? 'check' : 'minus'"
          size="xs"
          color="white"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type IngredientState = 'default' | 'lower' | 'pressed'

interface Props {
  modelValue: IngredientState
  label: string
  description?: string
  icon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: IngredientState]
  change: [value: IngredientState]
}>()

const currentState = computed(() => props.modelValue)

const stateClasses = {
  default: 'bg-background-card border-border-subtle hover:border-gray-400',
  lower: 'bg-primary-orange bg-opacity-10 border-primary-orange',
  pressed: 'bg-primary-green bg-opacity-10 border-primary-green'
}

const toggleClasses = {
  default: 'border-gray-400 bg-transparent',
  lower: 'border-primary-orange bg-primary-orange',
  pressed: 'border-primary-green bg-primary-green'
}

const textColor = computed(() => {
  switch (currentState.value) {
    case 'lower':
      return 'orange'
    case 'pressed':
      return 'green'
    default:
      return 'white'
  }
})

const toggle = () => {
  if (props.disabled) return
  
  let nextState: IngredientState
  
  switch (currentState.value) {
    case 'default':
      nextState = 'lower'
      break
    case 'lower':
      nextState = 'pressed'
      break
    case 'pressed':
      nextState = 'default'
      break
    default:
      nextState = 'default'
  }
  
  emit('update:modelValue', nextState)
  emit('change', nextState)
}
</script>
