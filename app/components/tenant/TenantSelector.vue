<template>
  <div class="tenant-selector">
    <!-- Search Bar -->
    <div class="tenant-selector__search">
      <BaseInput
        v-model="searchQuery"
        type="text"
        placeholder="Search restaurants..."
        class="tenant-selector__search-input"
      >
        <template #prefix>
          <BaseIcon name="search" size="sm" />
        </template>
      </BaseInput>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="tenant-selector__loading">
      <BaseLoader size="lg" />
      <AppText class="u-text-center u-mt-4">Loading restaurants...</AppText>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="tenant-selector__error">
      <ErrorMessage :message="error" />
      <BaseButton @click="retryLoad" variant="primary" class="u-mt-4">
        Retry
      </BaseButton>
    </div>

    <!-- Tenant List -->
    <div v-else-if="filteredTenants.length > 0" class="tenant-selector__list">
      <TenantCard
        v-for="tenant in filteredTenants"
        :key="tenant.id"
        :tenant="tenant"
        :selected="selectedTenantId === tenant.id"
        @select="handleSelectTenant"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="tenant-selector__empty">
      <EmptyState
        icon="store"
        title="No restaurants found"
        :description="searchQuery ? 'Try adjusting your search' : 'No restaurants available'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { TenantInfo } from '~/types/tenant'

interface Props {
  selectedTenantId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [tenant: TenantInfo]
}>()

// State
const searchQuery = ref('')
const tenants = ref<TenantInfo[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed
const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value

  const query = searchQuery.value.toLowerCase()
  return tenants.value.filter(tenant =>
    tenant.name.toLowerCase().includes(query) ||
    tenant.slug.toLowerCase().includes(query)
  )
})

// Methods
const loadTenants = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { $api } = useNuxtApp()
    const response = await $api.get<TenantInfo[]>('/tenants', {
      bypassTenant: true
    })

    if (response.success) {
      tenants.value = response.data.filter(t => t.isActive)
    } else {
      throw new Error('Failed to load restaurants')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load restaurants'
  } finally {
    isLoading.value = false
  }
}

const retryLoad = () => {
  loadTenants()
}

const handleSelectTenant = (tenant: TenantInfo) => {
  emit('select', tenant)
}

// Lifecycle
onMounted(() => {
  loadTenants()
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;

.tenant-selector {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;

  &__search {
    margin-bottom: $space-6;
  }

  &__search-input {
    width: 100%;
  }

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $space-8;
    min-height: 300px;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $space-6;
    padding: $space-4 0;
  }
}
</style>
