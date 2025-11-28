<template>
  <div>
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Menu Management</h1>
        <p class="mt-1 text-sm text-gray-600">
          Manage your restaurant's menu items and categories
        </p>
      </div>
      <div class="flex space-x-3">
        <NuxtLink
          to="/admin/menu/categories"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <BaseIcon name="folder" class="mr-2 h-4 w-4" />
          Manage Categories
        </NuxtLink>
        <NuxtLink
          to="/admin/menu/create"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <BaseIcon name="plus" class="mr-2 h-4 w-4" />
          Add Menu Item
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <BaseInput
              v-model="filters.search"
              placeholder="Search menu items..."
              @input="debouncedSearch"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              v-model="filters.categoryId"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              @change="loadMenuItems"
            >
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              v-model="filters.isActive"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              @change="loadMenuItems"
            >
              <option value="">All Items</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              @click="resetFilters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu Items Table -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <LoadingWrapper :loading="loading">
          <div v-if="menuItems.length === 0" class="text-center py-12">
            <BaseIcon name="clipboard-list" class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">No menu items</h3>
            <p class="mt-1 text-sm text-gray-500">
              Get started by creating a new menu item.
            </p>
            <div class="mt-6">
              <NuxtLink
                to="/admin/menu/create"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <BaseIcon name="plus" class="mr-2 h-4 w-4" />
                Add Menu Item
              </NuxtLink>
            </div>
          </div>

          <div v-else class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in menuItems" :key="item.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12">
                        <img
                          v-if="item.imageUrl"
                          :src="item.imageUrl"
                          :alt="item.name"
                          class="h-12 w-12 rounded-lg object-cover"
                        />
                        <div
                          v-else
                          class="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center"
                        >
                          <BaseIcon name="photograph" class="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ item.name }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ truncateText(item.description, 50) }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.category?.name || 'No Category' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${{ item.price.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      :class="item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      {{ item.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <NuxtLink
                        :to="`/admin/menu/${item.id}`"
                        class="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </NuxtLink>
                      <button
                        class="text-gray-600 hover:text-gray-900"
                        @click="toggleItemStatus(item)"
                      >
                        {{ item.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button
                        class="text-red-600 hover:text-red-900"
                        @click="confirmDelete(item)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (pagination.currentPage - 1) * pagination.limit + 1 }} to 
              {{ Math.min(pagination.currentPage * pagination.limit, pagination.total) }} of 
              {{ pagination.total }} results
            </div>
            <div class="flex space-x-2">
              <button
                :disabled="pagination.currentPage === 1"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="changePage(pagination.currentPage - 1)"
              >
                Previous
              </button>
              <button
                v-for="page in visiblePages"
                :key="page"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  page === pagination.currentPage
                    ? 'text-white bg-indigo-600'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                ]"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
              <button
                :disabled="pagination.currentPage === pagination.totalPages"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="changePage(pagination.currentPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </LoadingWrapper>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <BaseModal v-if="showDeleteModal" @close="showDeleteModal = false">
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Delete Menu Item
        </h3>
        <p class="text-sm text-gray-500 mb-6">
          Are you sure you want to delete "{{ itemToDelete?.name }}"? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            @click="showDeleteModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            @click="deleteItem"
          >
            Delete
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { debounce } from '~/utils/debounce'
import type { MenuItem, Category } from '~/types'

// Define page meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Reactive state
const menuItems = ref<MenuItem[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const showDeleteModal = ref(false)
const itemToDelete = ref<MenuItem | null>(null)

const filters = ref({
  search: '',
  categoryId: '',
  isActive: ''
})

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 10
})

// Computed
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, pagination.value.currentPage - 2)
  const end = Math.min(pagination.value.totalPages, pagination.value.currentPage + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadMenuItems = async () => {
  try {
    loading.value = true
    const { $apiClient } = useNuxtApp()
    
    const params: any = {
      page: pagination.value.currentPage,
      limit: pagination.value.limit
    }
    
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.categoryId) params.categoryId = filters.value.categoryId
    if (filters.value.isActive !== '') params.isActive = filters.value.isActive === 'true'
    
    const response = await $apiClient.get('/admin/menu-items', { params })
    
    if (response.success) {
      menuItems.value = response.data.items || []
      pagination.value = {
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        limit: response.data.limit || 10
      }
    }
  } catch (error) {
    console.error('Failed to load menu items:', error)
    // Use mock data for development
    menuItems.value = [
      {
        id: '1',
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        price: 18.99,
        imageUrl: '/images/pizza-margherita.jpg',
        categoryId: '1',
        category: { id: '1', name: 'Pizza', description: '', sortOrder: 1 },
        isActive: true,
        calories: 280,
        preparationTime: 15,
        ingredients: ['Tomato sauce', 'Mozzarella', 'Basil']
      },
      {
        id: '2',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
        price: 12.99,
        imageUrl: '/images/caesar-salad.jpg',
        categoryId: '2',
        category: { id: '2', name: 'Salads', description: '', sortOrder: 2 },
        isActive: true,
        calories: 180,
        preparationTime: 5,
        ingredients: ['Romaine lettuce', 'Caesar dressing', 'Croutons', 'Parmesan']
      }
    ]
    
    pagination.value = {
      currentPage: 1,
      totalPages: 1,
      total: 2,
      limit: 10
    }
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const { $apiClient } = useNuxtApp()
    const response = await $apiClient.get('/admin/categories')
    
    if (response.success) {
      categories.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
    // Use mock data for development
    categories.value = [
      { id: '1', name: 'Pizza', description: '', sortOrder: 1 },
      { id: '2', name: 'Salads', description: '', sortOrder: 2 },
      { id: '3', name: 'Beverages', description: '', sortOrder: 3 }
    ]
  }
}

const debouncedSearch = debounce(() => {
  pagination.value.currentPage = 1
  loadMenuItems()
}, 300)

const resetFilters = () => {
  filters.value = {
    search: '',
    categoryId: '',
    isActive: ''
  }
  pagination.value.currentPage = 1
  loadMenuItems()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.currentPage = page
    loadMenuItems()
  }
}

const toggleItemStatus = async (item: MenuItem) => {
  try {
    const { $apiClient } = useNuxtApp()
    const response = await $apiClient.patch(`/admin/menu-items/${item.id}`, {
      isActive: !item.isActive
    })
    
    if (response.success) {
      item.isActive = !item.isActive
    }
  } catch (error) {
    console.error('Failed to toggle item status:', error)
    // For development, just toggle locally
    item.isActive = !item.isActive
  }
}

const confirmDelete = (item: MenuItem) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const deleteItem = async () => {
  if (!itemToDelete.value) return
  
  try {
    const { $apiClient } = useNuxtApp()
    const response = await $apiClient.delete(`/admin/menu-items/${itemToDelete.value.id}`)
    
    if (response.success) {
      menuItems.value = menuItems.value.filter(item => item.id !== itemToDelete.value!.id)
    }
  } catch (error) {
    console.error('Failed to delete item:', error)
    // For development, just remove locally
    menuItems.value = menuItems.value.filter(item => item.id !== itemToDelete.value!.id)
  } finally {
    showDeleteModal.value = false
    itemToDelete.value = null
  }
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Lifecycle
onMounted(() => {
  Promise.all([loadCategories(), loadMenuItems()])
})
</script>