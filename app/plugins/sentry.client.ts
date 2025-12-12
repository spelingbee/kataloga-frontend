import {
  init as sentryInit,
  browserTracingIntegration,
  replayIntegration,
  setContext,
  setUser,
  captureException,
} from '@sentry/vue'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useTenantStore } from '~/stores/tenant'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const router = useRouter()

  // Only initialize Sentry if DSN is configured
  if (!config.public.sentryDsn) {
    console.warn('Sentry DSN not configured, error tracking disabled')
    return
  }

  // Initialize Sentry
  sentryInit({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    integrations: [
      browserTracingIntegration(),
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('chrome-extension://') || 
                 frame.filename?.includes('moz-extension://')
      )) {
        return null
      }
      
      // Filter out network errors that are expected (e.g., user going offline)
      if (event.exception?.values?.[0]?.type === 'NetworkError' && 
          typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
        return null
      }
      
      // Add custom context
      if (hint.originalException) {
        const error = hint.originalException as any
        
        // Add tenant context if available
        const tenantStore = useTenantStore()
        if (tenantStore.currentTenant) {
          event.tags = {
            ...event.tags,
            tenant: tenantStore.currentTenant.slug,
          }
        }
        
        // Add user context if available
        const authStore = useAuthStore()
        if (authStore.user) {
          setUser({
            id: authStore.user.id,
            email: authStore.user.email,
          })
        }
        
        // Add cart context for order-related errors
        if (error.message?.includes('order') || error.message?.includes('cart')) {
          const cartStore = useCartStore()
          setContext('cart', {
            itemCount: cartStore.itemCount,
            total: cartStore.total,
          })
        }
      }
      
      return event
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      
      // Network errors that are expected
      'NetworkError when attempting to fetch resource',
      'Failed to fetch',
      'Load failed',
      
      // Telegram Web App specific errors that are expected
      'Telegram WebApp is not available',
      
      // ResizeObserver errors (benign)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
    
    // Breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null
      }
      
      return breadcrumb
    },
  })

  // Provide Sentry instance for manual error reporting
  nuxtApp.provide('sentry', {
    captureException,
    setContext,
    setUser,
  })
})
