<template>
  <div class="tenant-selector">
    <!-- Search Bar -->
    <div class="tenant-selector__search">
      <BaseInput
        v-model="searchQuery"
        type="text"
        :placeholder="$t('tenant.search')"
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
      <AppText class="u-text-center u-mt-4">{{ $t('tenant.loading') }}</AppText>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="tenant-selector__error">
      <ErrorMessage :message="error" />
      <BaseButton variant="primary" class="u-mt-4" @click="retryLoad">
        {{ $t('common.retry') || 'Retry' }}
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
        :title="$t('tenant.noFound')"
        :description="searchQuery ? $t('tenant.tryAdjusting') : $t('tenant.noneAvailable')"
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
const { t } = useI18n()

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
    const { $apiClient } = useNuxtApp()
    const response = await ($apiClient as any).get<TenantInfo[]>('/tenants', {
      bypassTenant: true
    })

    if (Array.isArray(response)) {
      tenants.value = response.filter(t => t.isActive)
    } else {
      throw new Error('Failed to load restaurants: Invalid response format')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('tenant.failedToLoad')
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
