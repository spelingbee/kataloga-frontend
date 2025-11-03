<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <NuxtLink
          to="/admin/menu"
          class="text-gray-400 hover:text-gray-600"
        >
          <BaseIcon name="arrow-left" class="h-6 w-6" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Create Menu Item</h1>
          <p class="mt-1 text-sm text-gray-600">
            Add a new item to your menu
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Basic Information -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Basic Information
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <BaseInput
                v-model="form.name"
                :error="errors.name"
                placeholder="Enter item name"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                v-model="form.categoryId"
                :class="[
                  'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500',
                  errors.categoryId ? 'border-red-300' : 'border-gray-300'
                ]"
                required
              >
                <option value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
              <p v-if="errors.categoryId" class="mt-1 text-sm text-red-600">
                {{ errors.categoryId }}
              </p>
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                v-model="form.description"
                :class="[
                  'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500',
                  errors.description ? 'border-red-300' : 'border-gray-300'
                ]"
                rows="3"
                placeholder="Describe the menu item"
                required
              ></textarea>
              <p v-if="errors.description" class="mt-1 text-sm text-red-600">
                {{ errors.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing & Details -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Pricing & Details
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <BaseInput
                v-model.number="form.price"
                :error="errors.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <BaseInput
                v-model.number="form.calories"
                type="number"
                min="0"
                placeholder="Optional"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Preparation Time (minutes)
              </label>
              <BaseInput
                v-model.number="form.preparationTime"
                type="number"
                min="0"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Image Upload -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Image
          </h3>
          
          <div class="space-y-4">
            <div v-if="form.imageUrl || imagePreview" class="flex items-center space-x-4">
              <img
                :src="imagePreview || form.imageUrl"
                alt="Menu item image"
                class="h-24 w-24 rounded-lg object-cover"
              />
              <button
                @click="removeImage"
                type="button"
                class="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove Image
              </button>
            </div>
            
            <div class="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div class="space-y-1 text-center">
                <BaseIcon name="photograph" class="mx-auto h-12 w-12 text-gray-400" />
                <div class="flex text-sm text-gray-600">
                  <label
                    for="image-upload"
                    class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload an image</span>
                    <input
                      id="image-upload"
                      ref="imageInput"
                      type="file"
                      accept="image/*"
                      @change="handleImageUpload"
                      class="sr-only"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ingredients -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Ingredients
          </h3>
          
          <div class="space-y-3">
            <div v-for="(ingredient, index) in form.ingredients" :key="index" class="flex items-center space-x-2">
              <BaseInput
                v-model="form.ingredients[index]"
                placeholder="Enter ingredient"
                class="flex-1"
              />
              <button
                @click="removeIngredient(index)"
                type="button"
                class="p-2 text-red-600 hover:text-red-800"
              >
                <BaseIcon name="trash" class="h-4 w-4" />
              </button>
            </div>
            
            <button
              @click="addIngredient"
              type="button"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <BaseIcon name="plus" class="mr-2 h-4 w-4" />
              Add Ingredient
            </button>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Status
          </h3>
          
          <div class="flex items-center">
            <input
              id="is-active"
              v-model="form.isActive"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="is-active" class="ml-2 block text-sm text-gray-900">
              Active (visible to customers)
            </label>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3">
        <NuxtLink
          to="/admin/menu"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </NuxtLink>
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BaseLoader v-if="loading" class="mr-2 h-4 w-4" />
          Create Menu Item
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Category } from '~/types'

// Define page meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Reactive state
const loading = ref(false)
const categories = ref<Category[]>([])
const imageInput = ref<HTMLInputElement>()
const imagePreview = ref<string>('')

const form = ref({
  name: '',
  description: '',
  price: 0,
  categoryId: '',
  calories: null as number | null,
  preparationTime: null as number | null,
  imageUrl: '',
  ingredients: [''],
  isActive: true
})

const errors = ref<Record<string, string>>({})

// Methods
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

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    // In a real app, you would upload the file to a server here
    // For now, we'll just use the preview URL
    form.value.imageUrl = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  form.value.imageUrl = ''
  imagePreview.value = ''
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const addIngredient = () => {
  form.value.ingredients.push('')
}

const removeIngredient = (index: number) => {
  form.value.ingredients.splice(index, 1)
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  
  if (!form.value.description.trim()) {
    errors.value.description = 'Description is required'
  }
  
  if (!form.value.categoryId) {
    errors.value.categoryId = 'Category is required'
  }
  
  if (form.value.price <= 0) {
    errors.value.price = 'Price must be greater than 0'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const { $apiClient } = useNuxtApp()
    
    // Filter out empty ingredients
    const ingredients = form.value.ingredients.filter(ingredient => ingredient.trim())
    
    const menuItemData = {
      ...form.value,
      ingredients,
      calories: form.value.calories || undefined,
      preparationTime: form.value.preparationTime || undefined
    }
    
    const response = await $apiClient.post('/admin/menu-items', menuItemData)
    
    if (response.success) {
      await navigateTo('/admin/menu')
    } else {
      throw new Error(response.message || 'Failed to create menu item')
    }
  } catch (error: any) {
    console.error('Failed to create menu item:', error)
    
    // Handle validation errors from server
    if (error.status === 400 && error.data?.errors) {
      errors.value = error.data.errors
    } else {
      alert('Failed to create menu item. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadCategories()
})
</script>