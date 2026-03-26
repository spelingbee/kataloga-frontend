/**
 * Nuxt App Type Declarations
 * 
 * Extends the Nuxt app context with properly typed plugins and services.
 * This ensures type safety when accessing injected dependencies.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4
 */

import type { ApiClient } from '../app/types/api-client'
import type { TenantResolverService } from '../app/services/tenant-resolver.service'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'

declare module '#app' {
  interface NuxtApp {
    $apiClient: ApiClient
    $tenantResolver: TenantResolverService
    $router: Router
    $route: RouteLocationNormalizedLoaded
    $reportError: (error: unknown, context?: Record<string, unknown>) => void
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $apiClient: ApiClient
    $tenantResolver: TenantResolverService
    $router: Router
    $route: RouteLocationNormalizedLoaded
    $reportError: (error: unknown, context?: Record<string, unknown>) => void
  }
}

declare global {
  function gtag(type: string, action: string, data?: Record<string, unknown>): void
}

export { }