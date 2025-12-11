import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MenuItemDetail from '~/components/menu/MenuItemDetail.vue'
import type { MenuItem } from '~/types'

// Mock menu item
const mockMenuItem: MenuItem = {
  id: '1',
  name: 'Test Burger',
  description: 'A delicious test burger',
  price: 10.99,
  imageUrl: '/test-image.jpg',
  categoryId: 'cat1',
  isActive: true,
  calories: 500,
  allergens: ['Gluten', 'Dairy'],
  nutritionInfo: {
    calories: 500,
    protein: 25,
    carbs: 45,
    fat: 20
  },
  badges: [
    { type: 'popular', label: 'Popular' }
  ],
  modifierGroups: []
}

describe('MenuItemDetail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders menu item details correctly', () => {
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: mockMenuItem
      },
      global: {
        stubs: {
          BaseModal: {
            template: '<div><slot /></div>'
          },
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: {
            template: '<h1><slot /></h1>',
            props: ['size', 'color']
          },
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          AppPrice: {
            template: '<span>{{ amount }}</span>',
            props: ['amount', 'size']
          },
          BaseButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'disabled']
          },
          BaseIcon: true,
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          QuantitySelector: {
            template: '<div></div>',
            props: ['modelValue', 'min', 'max', 'size']
          },
          ModifierSelector: true
        }
      }
    })

    expect(wrapper.text()).toContain('Test Burger')
    expect(wrapper.text()).toContain('A delicious test burger')
  })

  it('displays allergen information when present', () => {
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: mockMenuItem
      },
      global: {
        stubs: {
          BaseModal: {
            template: '<div><slot /></div>'
          },
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: {
            template: '<h1><slot /></h1>',
            props: ['size', 'color']
          },
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          AppPrice: {
            template: '<span>{{ amount }}</span>',
            props: ['amount', 'size']
          },
          BaseButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'disabled']
          },
          BaseIcon: true,
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          QuantitySelector: {
            template: '<div></div>',
            props: ['modelValue', 'min', 'max', 'size']
          },
          ModifierSelector: true
        }
      }
    })

    expect(wrapper.text()).toContain('Allergens')
    expect(wrapper.text()).toContain('Gluten')
    expect(wrapper.text()).toContain('Dairy')
  })

  it('does not display allergen section when no allergens', () => {
    const itemWithoutAllergens = { ...mockMenuItem, allergens: undefined }
    
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: itemWithoutAllergens
      },
      global: {
        stubs: {
          BaseModal: {
            template: '<div><slot /></div>'
          },
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: {
            template: '<h1><slot /></h1>',
            props: ['size', 'color']
          },
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          AppPrice: {
            template: '<span>{{ amount }}</span>',
            props: ['amount', 'size']
          },
          BaseButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'disabled']
          },
          BaseIcon: true,
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          QuantitySelector: {
            template: '<div></div>',
            props: ['modelValue', 'min', 'max', 'size']
          },
          ModifierSelector: true
        }
      }
    })

    expect(wrapper.text()).not.toContain('Allergens')
  })

  it('displays nutrition information when present', () => {
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: mockMenuItem
      },
      global: {
        stubs: {
          BaseModal: {
            template: '<div><slot /></div>'
          },
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: {
            template: '<h1><slot /></h1>',
            props: ['size', 'color']
          },
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          AppPrice: {
            template: '<span>{{ amount }}</span>',
            props: ['amount', 'size']
          },
          BaseButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'disabled']
          },
          BaseIcon: true,
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          QuantitySelector: {
            template: '<div></div>',
            props: ['modelValue', 'min', 'max', 'size']
          },
          ModifierSelector: true
        }
      }
    })

    expect(wrapper.text()).toContain('Nutrition Information')
    expect(wrapper.text()).toContain('500')
    expect(wrapper.text()).toContain('25')
    expect(wrapper.text()).toContain('45')
    expect(wrapper.text()).toContain('20')
  })

  it('does not display nutrition section when no nutrition info', () => {
    const itemWithoutNutrition = { ...mockMenuItem, nutritionInfo: undefined }
    
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: itemWithoutNutrition
      },
      global: {
        stubs: {
          BaseModal: {
            template: '<div><slot /></div>'
          },
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: {
            template: '<h1><slot /></h1>',
            props: ['size', 'color']
          },
          AppText: {
            template: '<p><slot /></p>',
            props: ['size', 'color']
          },
          AppPrice: {
            template: '<span>{{ amount }}</span>',
            props: ['amount', 'size']
          },
          BaseButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'disabled']
          },
          BaseIcon: true,
          BaseBadge: {
            template: '<span><slot /></span>',
            props: ['variant', 'size']
          },
          QuantitySelector: {
            template: '<div></div>',
            props: ['modelValue', 'min', 'max', 'size']
          },
          ModifierSelector: true
        }
      }
    })

    expect(wrapper.text()).not.toContain('Nutrition Information')
  })

  it('calculates total price correctly with quantity', async () => {
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: mockMenuItem
      },
      global: {
        stubs: {
          BaseModal: true,
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: true,
          AppText: true,
          AppPrice: true,
          BaseButton: true,
          BaseIcon: true,
          BaseBadge: true,
          QuantitySelector: {
            template: '<div><input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', parseInt($event.target.value))" /></div>',
            props: ['modelValue'],
            emits: ['update:modelValue']
          },
          ModifierSelector: true
        }
      }
    })

    // Initial price should be base price * 1
    const vm = wrapper.vm as any
    expect(vm.totalPrice).toBe(10.99)
  })

  it('disables add to cart button when item is not active', () => {
    const inactiveItem = { ...mockMenuItem, isActive: false }
    
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: inactiveItem
      },
      global: {
        stubs: {
          BaseModal: true,
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: true,
          AppText: true,
          AppPrice: true,
          BaseButton: {
            template: '<button :disabled="disabled"><slot /></button>',
            props: ['disabled']
          },
          BaseIcon: true,
          BaseBadge: true,
          QuantitySelector: true,
          ModifierSelector: true
        }
      }
    })

    const vm = wrapper.vm as any
    expect(vm.canAddToCart).toBe(false)
  })

  it('emits close event when modal is closed', async () => {
    const wrapper = mount(MenuItemDetail, {
      props: {
        modelValue: true,
        menuItem: mockMenuItem
      },
      global: {
        stubs: {
          BaseModal: {
            template: '<div><slot /></div>',
            props: ['modelValue'],
            emits: ['close']
          },
          LazyImage: true,
          MenuItemBadge: true,
          AppHeading: true,
          AppText: true,
          AppPrice: true,
          BaseButton: true,
          BaseIcon: true,
          BaseBadge: true,
          QuantitySelector: true,
          ModifierSelector: true
        }
      }
    })

    const vm = wrapper.vm as any
    vm.handleClose()

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
