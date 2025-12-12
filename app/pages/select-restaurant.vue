<template>
  <div class="select-restaurant-page">
    <div class="select-restaurant-page__container">
      <!-- Header -->
      <div class="select-restaurant-page__header">
        <AppHeading level="h1" size="heading-xl" class="select-restaurant-page__title">
          Select a Restaurant
        </AppHeading>
        <AppText size="body-lg" class="select-restaurant-page__subtitle">
          Choose a restaurant to view their menu and place orders
        </AppText>
      </div>

      <!-- Tenant Selector -->
      <TenantSelector
        :selected-tenant-id="currentTenant?.id"
        @select="handleTenantSelect"
      />

      <!-- Back Button (if coming from another page) -->
      <div v-if="canGoBack" class="select-restaurant-page__actions">
        <BaseButton
          variant="ghost"
          @click="goBack"
          class="select-restaurant-page__back-btn"
        >
          <BaseIcon name="arrow-left" size="sm" />
          Go Back
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TenantInfo } from '~/types/tenant'
import { useTenant } from '~/composables/useTenant'
import { useNuxtApp } from '#app'
import { useNuxtApp } from '#app'

// Composables
const { currentTenant, setTenant } = useTenant()
const route = useRoute()
const router = useRouter()
const error = ref<string | null>(null)
const error = ref<string | null>(null)

// Computed
const canGoBack = computed(() => {
  return route.query.redirect || window.history.length > 1
})

// Methods
const handleTenantSelect = async (tenant: TenantInfo) => {
  try {
    const success = await setTenant(tenant.slug)
    
    if (success) {
      // Redirect to the specified page or home
      const redirectTo = (route.query.redirect as string) || '/'
      await router.push(redirectTo)
    } else {
      // Show error notification
      const { $toast } = useNuxtApp()
      $toast?.error('Failed to select restaurant. Please try again.')
    }
  } catch (error) {
    console.error('Error selecting tenant:', error)
    const { $toast } = useNuxtApp()
    $toast?.error('An error occurred while selecting the restaurant.')
  }
}

const goBack = () => {
  if (route.query.redirect) {
    router.push(route.query.redirect as string)
  } else {
    router.back()
  }
}

// Meta
definePageMeta({
  layout: 'default',
  middleware: []
})

// SEO
useHead({
  title: 'Select Restaurant',
  meta: [
    {
      name: 'description',
      content: 'Choose a restaurant to view their menu and place orders'
    }
  ]
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;
@use '~/assets/scss/abstracts/functions' as *;

.select-restaurant-page {
  min-height: 100vh;
  padding: $space-8 $space-6;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-neutral-400) 100%);

  &__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__header {
    text-align: center;
    margin-bottom: $space-12;
  }

  &__title {
    color: var(--text-primary);
    margin-bottom: $space-4;
  }

  &__subtitle {
    color: var(--text-secondary);
  }

  &__actions {
    display: flex;
    justify-content: center;
    margin-top: $space-12;
  }

  &__back-btn {
    display: flex;
    align-items: center;
    gap: $space-2;
  }
}
</style>
