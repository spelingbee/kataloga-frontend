import { MenuService } from '~/services/menu.service'
import { OrderService } from '~/services/order.service'
import { TenantResolverService } from '~/services/tenant-resolver.service'
import { CartValidationService } from '~/services/cart-validation.service'
import { UserService } from '~/services/user.service'
import { MapService } from '~/services/map.service'
import { NotificationService } from '~/services/notification.service'
import { TelegramAuthService } from '~/services/telegram-auth.service'
import { TelegramNotificationsService } from '~/services/telegram-notifications.service'

/**
 * Services Plugin
 * 
 * Centralizes service instantiation and dependency injection.
 * Provides services to components via useNuxtApp().$XXXService
 * and to Pinia stores via this.$services.XXX
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Wait for API client to be available
  const apiClient = (nuxtApp as any).$apiClient
  
  if (!apiClient) {
    console.warn('⚠️ API Client not found during services initialization. Stores might experience issues.')
  }

  const config = useRuntimeConfig()

  const services = {
    menu: new MenuService(apiClient),
    order: new OrderService(apiClient),
    tenantResolver: new TenantResolverService(apiClient, config),
    cartValidation: new CartValidationService(apiClient, config),
    user: new UserService(apiClient),
    map: new MapService(),
    notification: new NotificationService(config),
    telegramAuth: new TelegramAuthService(config.public.apiBaseUrl),
    telegramNotifications: new TelegramNotificationsService(config.public.apiBaseUrl)
  }

  // Inject services into Nuxt app context
  // Usage: const { $menuService } = useNuxtApp()
  nuxtApp.provide('menuService', services.menu)
  nuxtApp.provide('orderService', services.order)
  nuxtApp.provide('tenantResolverService', services.tenantResolver)
  nuxtApp.provide('cartValidationService', services.cartValidation)
  nuxtApp.provide('userService', services.user)
  nuxtApp.provide('mapService', services.map)
  nuxtApp.provide('notificationService', services.notification)
  nuxtApp.provide('telegramAuthService', services.telegramAuth)
  nuxtApp.provide('telegramNotificationsService', services.telegramNotifications)

  // Inject services into all Pinia stores
  // Usage: this.$services.menu.getCategories()
  if (nuxtApp.$pinia) {
    (nuxtApp.$pinia as any).use(({ store }: { store: any }) => {
      store.$services = services
    })
  }

  console.log('🚀 Services Plugin - Registered all services and injected into Pinia')
})
