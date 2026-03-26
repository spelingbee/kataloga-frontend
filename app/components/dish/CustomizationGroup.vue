<template>
  <div class="space-y-3">
    <div class="flex items-center space-x-2">
      <AppHeading level="h5" size="heading-sm" class="text-white">
        {{ group.name }}
      </AppHeading>
      <BaseBadge
        v-if="group.required"
        variant="warning"
        size="sm"
      >
        Required
      </BaseBadge>
    </div>

    <div class="space-y-2">
      <CustomizationOption
        v-for="option in group.options"
        :key="option.id"
        :option="option"
        :selected="isOptionSelected(option.id)"
        :selection-type="group.type"
        @select="handleOptionSelect(option)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface CustomizationOption {
  id: string
  name: string
  price: number
  description?: string
}

interface CustomizationGroup {
  id: string
  name: string
  type: 'single' | 'multiple'
  required: boolean
  options: CustomizationOption[]
}

interface Props {
  group: CustomizationGroup
  selected: any
}

interface Emits {
  (e: 'select', groupId: string, optionId: string, option: CustomizationOption): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOptionSelected = (optionId: string) => {
  if (!props.selected) return false
  
  if (props.group.type === 'single') {
    return props.selected.optionId === optionId
  } else {
    return Array.isArray(props.selected) && 
           props.selected.some((item: any) => item.optionId === optionId)
  }
}

const handleOptionSelect = (option: CustomizationOption) => {
  emit('select', props.group.id, option.id, option)
}
</script>