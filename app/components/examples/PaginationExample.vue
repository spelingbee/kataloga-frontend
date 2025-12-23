<template>
  <div class="pagination-example">
    <h2>Pagination Component Example</h2>
    
    <!-- Example with menu items -->
    <div class="example-section">
      <h3>Menu Items with Pagination</h3>
      
      <LoadingWrapper
        :is-loading="loading"
        :error="error"
        :is-empty="items.length === 0"
        @retry="fetchItems"
      >
        <!-- Items Grid -->
        <div class="items-grid">
          <div
            v-for="item in items"
            :key="item.id"
            class="item-card"
          >
            <h4>{{ item.name }}</h4>
            <p>{{ item.description }}</p>
            <span class="price">${{ item.price }}</span>
          </div>
        </div>

        <!-- Pagination -->
        <BasePagination
          v-if="pagination && pagination.totalPages > 1"
          :pagination="pagination"
          :show-page-size="true"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </LoadingWrapper>
    </div>

    <!-- Example with custom data -->
    <div class="example-section">
      <h3>Custom Data with Pagination</h3>
      
      <div class="custom-items">
        <div
          v-for="item in customItems"
          :key="item.id"
          class="custom-item"
        >
          {{ item.name }}
        </div>
      </div>

      <BasePagination
        :pagination="customPagination"
        :max-visible-pages="3"
        @page-change="handleCustomPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem, PaginationMeta, ApiError } from '~/types'
import { useMenuService } from '~/services/menu.service'

// Menu items example
const menuService = useMenuService()
const loading = ref(false)
const error = ref<ApiError | null>(null)
const items = ref<MenuItem[]>([])
const pagination = ref<PaginationMeta | null>(null)

const fetchItems = async (page: number = 1, limit: number = 10) => {
  loading.value = true
  error.value = null
  
  try {
    const result = await menuService.getMenuItems({ page, limit })
    items.value = result.items
    pagination.value = result.pagination
  } catch (err) {
    error.value = err as ApiError
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  fetchItems(page, pagination.value?.limit || 10)
}

const handlePageSizeChange = (pageSize: number) => {
  fetchItems(1, pageSize)
}

// Custom data example
const customItems = ref([
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
])

const customPagination = ref<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 25,
  totalPages: 3
})

const handleCustomPageChange = (page: number) => {
  customPagination.value.page = page
  // In a real app, you would fetch new data here
  console.log('Custom page changed to:', page)
}

// Initialize
onMounted(() => {
  fetchItems()
})
</script>

<style lang="scss" scoped>
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/radius' as *;

.pagination-example {
  padding: $space-8;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: $space-12;
  padding: $space-6;
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $space-4;
  margin-bottom: $space-6;
}

.item-card {
  padding: $space-4;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  border: 1px solid var(--border-primary);

  h4 {
    margin: 0 0 $space-2 0;
    color: var(--text-primary);
  }

  p {
    margin: 0 0 $space-2 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .price {
    font-weight: 600;
    color: var(--color-primary);
  }
}

.custom-items {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-6;
}

.custom-item {
  padding: $space-2 $space-4;
  background: var(--color-primary);
  color: white;
  border-radius: $radius-md;
  font-size: 0.875rem;
}
</style>