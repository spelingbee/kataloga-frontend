import { computed } from 'vue'
import { useTenantStore } from '~/stores/tenant'

/**
 * Simple composable to get current tenant ID
 * Used for API calls and data filtering
 */
export function useTenantId() {
  const tenantStore = useTenantStore()

  const tenantId = computed(() => tenantStore.tenantId)
  const tenantSlug = computed(() => tenantStore.tenantSlug)
  const isMultiTenant = computed(() => tenantStore.isMultiTenant)

  return {
    tenantId,
    tenantSlug,
    isMultiTenant,
  }
}
