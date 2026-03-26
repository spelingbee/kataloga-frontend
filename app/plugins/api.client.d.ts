/**
 * Type declarations for API Client Plugin
 * 
 * This file ensures that the API client plugin is properly typed
 * and that $apiClient is recognized with the correct type.
 */

import type { ApiClient } from '~/types/api-client'

declare module '#app' {
  interface NuxtApp {
    $apiClient: ApiClient
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $apiClient: ApiClient
  }
}

export {}