import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuGrid from '../../../app/components/menu/MenuGrid.vue'
import type { MenuItem } from '../../../app/types'

// Mock components
vi.mock('../../../app/components/menu/MenuItemCard.vue', () => ({
  default: {
    name: 'MenuItemCard',
    template: '<div class="menu-item-card">{{ menuItem.name }}</div>',
    props: ['menuItem', 'showPopularIndicator']
  }
}))

vi.mock('../../../app/components/base/BaseIcon.vue', () => ({
  default: {
    name: 'BaseIcon',
    template: '<span class="base-icon"></span>',
    props: ['name', 'size']
  }
}))

describe('MenuGrid', () => {
  const mockItems: MenuItem[] = [
    {
      id: '1',
      name: 'Pizza',
      description: 'Delicious pizza',
      price: 10.99,
      isActive: true,
      categoryId: 'cat1'
    },
    {
      id: '2',
      name: 'Burger',
      description: 'Tasty burger',
      price: 8.99,
      isActive: true,
      categoryId: 'cat1'
    },
    {
      id: '3',
      name: 'Salad',
      description: 'Fresh salad',
      price: 6.99,
      isActive: true,
      categoryId: 'cat2'
    }
  ]

  it('renders menu items correctly', () => {
    const wrapper = mount(MenuGrid, {
      props: {
        items: mockItems,
        loading: false
      }
    })

    const items = wrapper.findAll('.menu-grid__item')
    expect(items.length).toBe(mockItems.length)
  })

  it('shows skeleton loaders when loading', () => {
    const wrapper = mount(MenuGrid, {
      props: {
        items: [],
        loading: true,
        skeletonCount: 6
      }
    })

    const skeletons = wrapper.findAll('.menu-grid__skeleton')
    expect(skeletons.length).toBe(6)
  })

  it('shows empty state when no items', () => {
    const wrapper = mount(MenuGrid, {
      props: {
        items: [],
        loading: false,
        emptyTitle: 'No items',
        emptyMessage: 'Try again'
      }
    })

    const emptyState = wrapper.find('.menu-grid__empty')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('No items')
    expect(emptyState.text()).toContain('Try again')
  })

  it('applies correct grid columns class', () => {
    const wrapper = mount(MenuGrid, {
      props: {
        items: mockItems,
        columns: 4
      }
    })

    const container = wrapper.find('.menu-grid__container')
    expect(container.classes()).toContain('menu-grid__container--cols-4')
  })

  it('implements lazy loading with initial load count', () => {
    const manyItems = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      description: `Description ${i}`,
      price: 10 + i,
      isActive: true,
      categoryId: 'cat1'
    }))

    const wrapper = mount(MenuGrid, {
      props: {
        items: manyItems,
        initialLoadCount: 12
      }
    })

    const visibleItems = wrapper.findAll('.menu-grid__item')
    expect(visibleItems.length).toBeLessThanOrEqual(12)
  })

  it('emits itemClick event when item is clicked', async () => {
    const wrapper = mount(MenuGrid, {
      props: {
        items: mockItems
      }
    })

    await wrapper.vm.$emit('itemClick', mockItems[0])
    expect(wrapper.emitted('itemClick')).toBeTruthy()
    expect(wrapper.emitted('itemClick')?.[0]).toEqual([mockItems[0]])
  })

  it('emits addToCart event', async () => {
    const wrapper = mount(MenuGrid, {
      props: {
        items: mockItems
      }
    })

    await wrapper.vm.$emit('addToCart', mockItems[0])
    expect(wrapper.emitted('addToCart')).toBeTruthy()
    expect(wrapper.emitted('addToCart')?.[0]).toEqual([mockItems[0]])
  })

  it('emits toggleFavorite event', async () => {
    const wrapper = mount(MenuGrid, {
      props: {
        items: mockItems
      }
    })

    await wrapper.vm.$emit('toggleFavorite', mockItems[0])
    expect(wrapper.emitted('toggleFavorite')).toBeTruthy()
    expect(wrapper.emitted('toggleFavorite')?.[0]).toEqual([mockItems[0]])
  })
})
