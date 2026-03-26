<template>
  <div class="modifier-selector">
    <AppText size="body-md" color="white" class="font-semibold mb-4">
      Customize Your Order
    </AppText>
    
    <div class="modifier-selector__groups">
      <div
        v-for="group in modifierGroups"
        :key="group.id"
        class="modifier-selector__group"
      >
        <!-- Group Header -->
        <div class="modifier-selector__group-header">
          <div class="modifier-selector__group-title">
            <AppText size="body-sm" color="white" class="font-medium">
              {{ group.name }}
            </AppText>
            <BaseBadge
              v-if="group.required"
              variant="error"
              size="sm"
            >
              Required
            </BaseBadge>
            <BaseBadge
              v-else
              variant="secondary"
              size="sm"
            >
              Optional
            </BaseBadge>
          </div>
          
          <AppText size="caption" color="muted">
            <template v-if="group.required">
              Select {{ group.minSelection }}
              <template v-if="group.maxSelection > group.minSelection">
                - {{ group.maxSelection }}
              </template>
            </template>
            <template v-else>
              Select up to {{ group.maxSelection }}
            </template>
          </AppText>
        </div>
        
        <!-- Modifiers List -->
        <div class="modifier-selector__modifiers">
          <label
            v-for="modifier in group.modifiers"
            :key="modifier.id"
            :class="[
              'modifier-selector__modifier',
              {
                'modifier-selector__modifier--selected': isModifierSelected(modifier.id),
                'modifier-selector__modifier--disabled': isModifierDisabled(group, modifier),
                'modifier-selector__modifier--error': hasValidationErrors && group.required && !hasGroupSelection(group)
              }
            ]"
          >
            <input
              :type="group.maxSelection === 1 ? 'radio' : 'checkbox'"
              :name="`modifier-group-${group.id}`"
              :value="modifier.id"
              :checked="isModifierSelected(modifier.id)"
              :disabled="isModifierDisabled(group, modifier)"
              class="modifier-selector__input"
              @change="handleModifierToggle(group, modifier)"
            />
            
            <div class="modifier-selector__modifier-content">
              <div class="modifier-selector__modifier-info">
                <AppText size="body-sm" color="white">
                  {{ modifier.name }}
                </AppText>
                <AppText
                  v-if="modifier.priceAdjustment !== 0"
                  size="caption"
                  :color="modifier.priceAdjustment > 0 ? 'primary-green' : 'muted'"
                >
                  {{ formatPriceAdjustment(modifier.priceAdjustment) }}
                </AppText>
              </div>
              
              <div class="modifier-selector__modifier-indicator">
                <BaseIcon
                  v-if="isModifierSelected(modifier.id)"
                  name="check"
                  size="sm"
                  class="text-primary-green"
                />
              </div>
            </div>
          </label>
        </div>
        
        <!-- Group Validation Error -->
        <div
          v-if="hasValidationErrors && group.required && !hasGroupSelection(group)"
          class="modifier-selector__group-error"
        >
          <AppText size="caption" color="red">
            Please select at least {{ group.minSelection }} option(s)
          </AppText>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModifierGroup, Modifier } from '~/types'

interface Props {
  modifierGroups: ModifierGroup[]
  selectedModifiers: Modifier[]
  hasValidationErrors?: boolean
  validationErrors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  hasValidationErrors: false,
  validationErrors: () => []
})

const emit = defineEmits<{
  'update:selectedModifiers': [modifiers: Modifier[]]
}>()

// Methods
const isModifierSelected = (modifierId: string): boolean => {
  return props.selectedModifiers.some(mod => mod.id === modifierId)
}

const hasGroupSelection = (group: ModifierGroup): boolean => {
  const selectedCount = props.selectedModifiers.filter(
    mod => group.modifiers.some(gm => gm.id === mod.id)
  ).length
  return selectedCount >= group.minSelection
}

const isModifierDisabled = (group: ModifierGroup, modifier: Modifier): boolean => {
  // If modifier is already selected, it's not disabled
  if (isModifierSelected(modifier.id)) {
    return false
  }
  
  // Check if max selection is reached for this group
  const selectedInGroup = props.selectedModifiers.filter(
    mod => group.modifiers.some(gm => gm.id === mod.id)
  ).length
  
  return selectedInGroup >= group.maxSelection
}

const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
  const newSelectedModifiers = [...props.selectedModifiers]
  const modifierIndex = newSelectedModifiers.findIndex(mod => mod.id === modifier.id)
  
  if (modifierIndex >= 0) {
    // Remove modifier
    newSelectedModifiers.splice(modifierIndex, 1)
  } else {
    // Add modifier
    // If it's a radio group (maxSelection === 1), remove other selections from this group first
    if (group.maxSelection === 1) {
      const groupModifierIds = group.modifiers.map(m => m.id)
      const filteredModifiers = newSelectedModifiers.filter(
        mod => !groupModifierIds.includes(mod.id)
      )
      filteredModifiers.push(modifier)
      emit('update:selectedModifiers', filteredModifiers)
      return
    }
    
    // Check if we can add more modifiers to this group
    const selectedInGroup = newSelectedModifiers.filter(
      mod => group.modifiers.some(gm => gm.id === mod.id)
    ).length
    
    if (selectedInGroup < group.maxSelection) {
      newSelectedModifiers.push(modifier)
    }
  }
  
  emit('update:selectedModifiers', newSelectedModifiers)
}

const formatPriceAdjustment = (amount: number): string => {
  const sign = amount > 0 ? '+' : ''
  return `${sign}$${Math.abs(amount).toFixed(2)}`
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;

.modifier-selector {
  padding: $space-4;
  background: $color-background-sidebar;
  border-radius: $radius-md;
}

.modifier-selector__groups {
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

.modifier-selector__group {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.modifier-selector__group-header {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding-bottom: $space-2;
  border-bottom: 1px solid $color-border-subtle;
}

.modifier-selector__group-title {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.modifier-selector__modifiers {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.modifier-selector__modifier {
  display: flex;
  align-items: center;
  padding: $space-4;
  background: var(--bg-primary);
  border: 2px solid $color-border-subtle;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover:not(.modifier-selector__modifier--disabled) {
    border-color: var(--color-error);
    background: rgba(var(--color-error), 0.05);
  }
}

.modifier-selector__modifier--selected {
  border-color: var(--color-success);
  background: rgba(var(--color-success), 0.1);
  
  &:hover {
    border-color: var(--color-success);
    background: rgba(var(--color-success), 0.15);
  }
}

.modifier-selector__modifier--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modifier-selector__modifier--error {
  border-color: $color-error;
  background: rgba($color-error, 0.05);
}

.modifier-selector__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.modifier-selector__modifier-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: $space-4;
}

.modifier-selector__modifier-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  flex: 1;
}

.modifier-selector__modifier-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 2px solid $color-border-subtle;
  border-radius: $radius-sm;
  transition: all $transition-base;
  
  .modifier-selector__modifier--selected & {
    border-color: var(--color-success);
    background: var(--color-success);
  }
}

.modifier-selector__group-error {
  padding: $space-2 $space-4;
  background: rgba($color-error, 0.1);
  border: 1px solid rgba($color-error, 0.3);
  border-radius: $radius-sm;
}
</style>
