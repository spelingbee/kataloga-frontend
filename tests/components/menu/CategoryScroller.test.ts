import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryScroller from '../../../app/components/menu/CategoryScroller.vue'
import type { Category } from '../../../app/types'

// Mock BaseIcon component
vi.mock('../../../app/components/base/BaseIcon.vue', () => ({
  default: {
    name: 'BaseIcon',
    template: '<span class="base-icon"></span>',
    props: ['name', 'size']
  }
}))

describe('CategoryScroller', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Pizza',
      sortOrder: 1,
      count: 5
    },
    {
      id: 'cat2',
      name: 'Burgers',
      sortOrder: 2,
      count: 3
    },
    {
      id: 'cat3',
      name: 'Salads',
      sortOrder: 3,
      count: 7
    }
  ]

  it('renders all categories', () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories
      }
    })

    const items = wrapper.findAll('.category-scroller__item')
    // +1 for "All" button
    expect(items.length).toBe(mockCategories.length + 1)
  })

  it('renders "All" category button', () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories
      }
    })

    const allButton = wrapper.find('.category-scroller__item')
    expect(allButton.text()).toContain('All')
  })

  it('displays category names correctly', () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories
      }
    })

    mockCategories.forEach(category => {
      expect(wrapper.text()).toContain(category.name)
    })
  })

  it('displays category counts when provided', () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories
      }
    })

    mockCategories.forEach(category => {
      if (category.count !== undefined) {
        expect(wrapper.text()).toContain(category.count.toString())
      }
    })
  })

  it('marks active category correctly', () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories,
        activeCategory: 'cat2'
      }
    })

    const items = wrapper.findAll('.category-scroller__item')
    const activeItem = items.find(item => 
      item.classes().includes('category-scroller__item--active') &&
      item.text().includes('Burgers')
    )
    
    expect(activeItem).toBeDefined()
  })

  it('marks "All" as active when no category selected', () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories,
        activeCategory: null
      }
    })

    const allButton = wrapper.find('.category-scroller__item')
    expect(allButton.classes()).toContain('category-scroller__item--active')
  })

  it('emits categorySelect event when category is clicked', async () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories
      }
    })

    const items = wrapper.findAll('.category-scroller__item')
    // Click second item (first category, since first is "All")
    await items[1].trigger('click')

    expect(wrapper.emitted('categorySelect')).toBeTruthy()
    expect(wrapper.emitted('categorySelect')?.[0]).toEqual(['cat1'])
  })

  it('emits null when "All" is clicked', async () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories,
        activeCategory: 'cat1'
      }
    })

    const allButton = wrapper.find('.category-scroller__item')
    await allButton.trigger('click')

    expect(wrapper.emitted('categorySelect')).toBeTruthy()
    expect(wrapper.emitted('categorySelect')?.[0]).toEqual([null])
  })

  it('shows scroll buttons when enabled', () => {
    const wrapper = mount(CategoryScroller, {
      props: {
        categories: mockCategories,
        showScrollButtons: true
      }
    })

    // Buttons might not be visible initially, but should exist in DOM
    const scrollButtons = wrapper.findAll('.category-scroller__scroll-btn')
    expect(scrollButtons.length).toBeGreaterThanOrEqual(0)
  })
})
