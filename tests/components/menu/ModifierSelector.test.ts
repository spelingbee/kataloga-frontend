import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModifierSelector from '~/components/menu/ModifierSelector.vue'
import type { ModifierGroup, Modifier } from '~/types'

// Mock modifier groups
const mockModifierGroups: ModifierGroup[] = [
  {
    id: 'size',
    name: 'Size',
    required: true,
    minSelection: 1,
    maxSelection: 1,
    modifiers: [
      { id: 'small', name: 'Small', priceAdjustment: 0, isDefault: true },
      { id: 'medium', name: 'Medium', priceAdjustment: 2, isDefault: false },
      { id: 'large', name: 'Large', priceAdjustment: 4, isDefault: false }
    ]
  },
  {
    id: 'toppings',
    name: 'Toppings',
    required: false,
    minSelection: 0,
    maxSelection: 3,
    modifiers: [
      { id: 'cheese', name: 'Extra Cheese', priceAdjustment: 1.5, isDefault: false },
      { id: 'bacon', name: 'Bacon', priceAdjustment: 2, isDefault: false },
      { id: 'mushrooms', name: 'Mushrooms', priceAdjustment: 1, isDefault: false }
    ]
  }
]

describe('ModifierSelector', () => {
  it('renders modifier groups correctly', () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          BaseIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Size')
    expect(wrapper.text()).toContain('Toppings')
  })

  it('displays required badge for required groups', () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: true,
          BaseBadge: {
            template: '<span :class="variant"><slot /></span>',
            props: ['variant']
          },
          BaseIcon: true
        }
      }
    })

    const badges = wrapper.findAll('[class*="danger"]')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('displays optional badge for optional groups', () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: true,
          BaseBadge: {
            template: '<span :class="variant"><slot /></span>',
            props: ['variant']
          },
          BaseIcon: true
        }
      }
    })

    const badges = wrapper.findAll('[class*="secondary"]')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows all modifiers in each group', () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          BaseIcon: true
        }
      }
    })

    // Check size modifiers
    expect(wrapper.text()).toContain('Small')
    expect(wrapper.text()).toContain('Medium')
    expect(wrapper.text()).toContain('Large')

    // Check topping modifiers
    expect(wrapper.text()).toContain('Extra Cheese')
    expect(wrapper.text()).toContain('Bacon')
    expect(wrapper.text()).toContain('Mushrooms')
  })

  it('displays price adjustments correctly', () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          BaseIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('+$2.00')
    expect(wrapper.text()).toContain('+$4.00')
    expect(wrapper.text()).toContain('+$1.50')
  })

  it('emits update when modifier is selected', async () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: true,
          BaseBadge: true,
          BaseIcon: true
        }
      }
    })

    const inputs = wrapper.findAll('input[type="radio"]')
    if (inputs.length > 0) {
      await inputs[0].trigger('change')
      expect(wrapper.emitted('update:selectedModifiers')).toBeTruthy()
    }
  })

  it('marks selected modifiers correctly', () => {
    const selectedModifiers: Modifier[] = [
      { id: 'medium', name: 'Medium', priceAdjustment: 2, isDefault: false }
    ]

    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers
      },
      global: {
        stubs: {
          AppText: true,
          BaseBadge: true,
          BaseIcon: true
        }
      }
    })

    const vm = wrapper.vm as any
    expect(vm.isModifierSelected('medium')).toBe(true)
    expect(vm.isModifierSelected('small')).toBe(false)
  })

  it('shows validation error for required groups without selection', () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: [],
        hasValidationErrors: true
      },
      global: {
        stubs: {
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          BaseIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Please select at least 1 option(s)')
  })

  it('handles radio group selection (maxSelection = 1)', async () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: true,
          BaseBadge: true,
          BaseIcon: true
        }
      }
    })

    const vm = wrapper.vm as any
    const sizeGroup = mockModifierGroups[0]
    const mediumModifier = sizeGroup.modifiers[1]

    // Simulate selecting medium
    vm.handleModifierToggle(sizeGroup, mediumModifier)

    const emitted = wrapper.emitted('update:selectedModifiers')
    expect(emitted).toBeTruthy()
    if (emitted) {
      const lastEmit = emitted[emitted.length - 1][0] as Modifier[]
      expect(lastEmit).toHaveLength(1)
      expect(lastEmit[0].id).toBe('medium')
    }
  })

  it('handles checkbox group selection (maxSelection > 1)', async () => {
    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers: []
      },
      global: {
        stubs: {
          AppText: true,
          BaseBadge: true,
          BaseIcon: true
        }
      }
    })

    const vm = wrapper.vm as any
    const toppingsGroup = mockModifierGroups[1]
    const cheeseModifier = toppingsGroup.modifiers[0]
    const baconModifier = toppingsGroup.modifiers[1]

    // Select cheese
    vm.handleModifierToggle(toppingsGroup, cheeseModifier)
    let emitted = wrapper.emitted('update:selectedModifiers')
    expect(emitted).toBeTruthy()

    // Select bacon
    vm.handleModifierToggle(toppingsGroup, baconModifier)
    emitted = wrapper.emitted('update:selectedModifiers')
    if (emitted) {
      const lastEmit = emitted[emitted.length - 1][0] as Modifier[]
      expect(lastEmit.length).toBeGreaterThan(0)
    }
  })

  it('prevents selection beyond maxSelection', () => {
    const selectedModifiers: Modifier[] = [
      { id: 'cheese', name: 'Extra Cheese', priceAdjustment: 1.5, isDefault: false },
      { id: 'bacon', name: 'Bacon', priceAdjustment: 2, isDefault: false },
      { id: 'mushrooms', name: 'Mushrooms', priceAdjustment: 1, isDefault: false }
    ]

    const wrapper = mount(ModifierSelector, {
      props: {
        modifierGroups: mockModifierGroups,
        selectedModifiers
      },
      global: {
        stubs: {
          AppText: true,
          BaseBadge: true,
          BaseIcon: true
        }
      }
    })

    const vm = wrapper.vm as any
    const toppingsGroup = mockModifierGroups[1]
    
    // All toppings should be selected, so any new one should be disabled
    // (except the ones already selected)
    const newModifier = { id: 'onions', name: 'Onions', priceAdjustment: 0.5, isDefault: false }
    expect(vm.isModifierDisabled(toppingsGroup, newModifier)).toBe(true)
  })
})
