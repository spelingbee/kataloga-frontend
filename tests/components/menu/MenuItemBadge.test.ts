import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuItemBadge from '../../../app/components/menu/MenuItemBadge.vue'

// Mock BaseIcon component
vi.mock('../../../app/components/base/BaseIcon.vue', () => ({
  default: {
    name: 'BaseIcon',
    template: '<span class="base-icon"></span>',
    props: ['name', 'size']
  }
}))

describe('MenuItemBadge', () => {
  it('renders badge with correct type class', () => {
    const wrapper = mount(MenuItemBadge, {
      props: {
        type: 'new'
      }
    })

    expect(wrapper.classes()).toContain('menu-item-badge--new')
  })

  it('renders badge with correct size class', () => {
    const wrapper = mount(MenuItemBadge, {
      props: {
        type: 'popular',
        size: 'md'
      }
    })

    expect(wrapper.classes()).toContain('menu-item-badge--md')
  })

  it('displays default label for badge type', () => {
    const wrapper = mount(MenuItemBadge, {
      props: {
        type: 'vegetarian'
      }
    })

    expect(wrapper.text()).toContain('Vegetarian')
  })

  it('displays custom label when provided', () => {
    const wrapper = mount(MenuItemBadge, {
      props: {
        type: 'new',
        label: 'Just Added'
      }
    })

    expect(wrapper.text()).toContain('Just Added')
  })

  it('renders icon for badge', () => {
    const wrapper = mount(MenuItemBadge, {
      props: {
        type: 'spicy'
      }
    })

    const icon = wrapper.find('.menu-item-badge__icon')
    expect(icon.exists()).toBe(true)
  })

  it('applies correct styling for different badge types', () => {
    const types: Array<'new' | 'popular' | 'spicy' | 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free'> = [
      'new',
      'popular',
      'spicy',
      'vegetarian',
      'vegan',
      'gluten-free',
      'dairy-free'
    ]

    types.forEach(type => {
      const wrapper = mount(MenuItemBadge, {
        props: { type }
      })

      expect(wrapper.classes()).toContain(`menu-item-badge--${type}`)
    })
  })

  it('defaults to small size when not specified', () => {
    const wrapper = mount(MenuItemBadge, {
      props: {
        type: 'new'
      }
    })

    expect(wrapper.classes()).toContain('menu-item-badge--sm')
  })
})
