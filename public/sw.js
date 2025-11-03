// Service Worker for Menu Ordering App
const CACHE_NAME = 'menu-app-v1'
const API_CACHE_NAME = 'menu-api-v1'
const OFFLINE_URL = '/offline'

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/menu/,
  /\/api\/categories/,
  /\/api\/restaurants/,
  /\/api\/user\/profile/
]

// API endpoints that should not be cached
const NO_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/orders/,
  /\/api\/payments/,
  /\/api\/analytics/
]

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/menu',
        '/favourites',
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-512x512.png',
      ])
    })
  )
  
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Skip non-GET requests for caching (but allow POST for background sync)
  if (event.request.method !== 'GET' && !isApiRequest(url)) return

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return

  // Handle API requests differently
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(event.request))
    return
  }

  // Handle regular requests (pages, assets)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response
      }

      // Try to fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      }).catch(() => {
        // If network fails, try to return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL)
        }
        
        // For other requests, return a generic offline response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        })
      })
    })
  )
})

// Background sync for cart data and orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCartData())
  } else if (event.tag === 'order-sync') {
    event.waitUntil(syncPendingOrders())
  }
})

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  // Determine notification type and customize accordingly
  const notificationType = data.type || 'default'
  let actions = []
  let requireInteraction = false

  switch (notificationType) {
    case 'order':
      actions = [
        {
          action: 'view_order',
          title: 'View Order',
          icon: '/icon-192x192.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ]
      requireInteraction = true
      break
    case 'promotion':
      actions = [
        {
          action: 'view_promotion',
          title: 'View Offer',
          icon: '/icon-192x192.png',
        },
        {
          action: 'dismiss',
          title: 'Not Interested',
        },
      ]
      break
    default:
      actions = [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192x192.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ]
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    image: data.image,
    data: {
      ...data.data,
      type: notificationType,
      timestamp: new Date().toISOString(),
    },
    actions: data.actions || actions,
    tag: data.tag || notificationType,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : requireInteraction,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data
  const notificationType = data?.type || 'default'

  // Handle dismiss action
  if (action === 'dismiss') {
    // Track dismissal analytics if needed
    trackNotificationAction('dismiss', notificationType, data)
    return
  }

  // Determine URL based on action and notification type
  let url = '/'
  
  switch (action) {
    case 'view_order':
      url = data?.orderId ? `/orders/${data.orderId}` : '/orders'
      break
    case 'view_promotion':
      url = data?.promotionId ? `/promotions/${data.promotionId}` : '/promotions'
      break
    case 'view':
    default:
      if (data?.url) {
        url = data.url
      } else {
        switch (notificationType) {
          case 'order':
            url = data?.orderId ? `/orders/${data.orderId}` : '/orders'
            break
          case 'promotion':
            url = '/promotions'
            break
          case 'system':
            url = '/notifications'
            break
          default:
            url = '/'
        }
      }
  }

  // Track click analytics
  trackNotificationAction(action || 'click', notificationType, data)

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window with the same origin
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Send message to client to navigate to the URL
            return client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: url,
              data: data
            })
          })
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data
  const notificationType = data?.type || 'default'
  
  // Track close analytics
  trackNotificationAction('close', notificationType, data)
})

// Message handling for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Helper functions for API request handling
function isApiRequest(url) {
  return url.pathname.startsWith('/api/')
}

function shouldCacheApiRequest(url) {
  // Don't cache if it matches no-cache patterns
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return false
  }
  
  // Cache if it matches cache patterns
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // Handle POST requests for background sync
  if (request.method === 'POST' && url.pathname === '/api/orders') {
    return handleOrderSubmission(request)
  }
  
  // Handle GET requests with caching
  if (request.method === 'GET' && shouldCacheApiRequest(url)) {
    return handleCachedApiRequest(request)
  }
  
  // For other API requests, just try network
  try {
    return await fetch(request)
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Network error' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleCachedApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  try {
    // Try network first (cache-first strategy for menu data)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Update cache with fresh data
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    // If network fails but we have cache, return cached version
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw new Error('Network error and no cache available')
  } catch (error) {
    // Return cached version if available
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return error response
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Data not available offline' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleOrderSubmission(request) {
  try {
    // Try to submit order immediately
    const response = await fetch(request)
    
    if (response.ok) {
      return response
    }
    
    // If submission fails, store for background sync
    const orderData = await request.json()
    await storeOrderForSync(orderData)
    
    // Register background sync
    if ('serviceWorker' in self && 'sync' in self.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('order-sync')
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Order queued for submission',
      offline: true
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    // Store order for background sync
    try {
      const orderData = await request.json()
      await storeOrderForSync(orderData)
      
      // Register background sync
      if ('serviceWorker' in self && 'sync' in self.ServiceWorkerRegistration.prototype) {
        await self.registration.sync.register('order-sync')
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Order saved for later submission',
        offline: true
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (storeError) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to save order'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

// Sync cart data function
async function syncCartData() {
  try {
    // Get pending orders from IndexedDB or localStorage
    const pendingOrders = await getPendingOrders()
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        })

        if (response.ok) {
          // Remove successfully synced order
          await removePendingOrder(order.id)
          
          // Show success notification
          self.registration.showNotification('Order Submitted', {
            body: 'Your offline order has been successfully submitted!',
            icon: '/icon-192x192.png',
            tag: 'order-sync',
          })
        }
      } catch (error) {
        console.error('Failed to sync order:', error)
      }
    }
  } catch (error) {
    console.error('Failed to sync cart data:', error)
  }
}

// Sync pending orders function
async function syncPendingOrders() {
  try {
    const pendingOrders = await getPendingOrdersFromIDB()
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': order.authToken ? `Bearer ${order.authToken}` : '',
          },
          body: JSON.stringify(order.data),
        })

        if (response.ok) {
          await removeOrderFromIDB(order.id)
          
          // Show success notification
          self.registration.showNotification('Order Submitted', {
            body: 'Your offline order has been successfully submitted!',
            icon: '/icon-192x192.png',
            tag: 'order-sync',
          })
        } else {
          // Increment retry count
          await incrementOrderRetryCount(order.id)
        }
      } catch (error) {
        console.error('Failed to sync order:', order.id, error)
        await incrementOrderRetryCount(order.id)
      }
    }
  } catch (error) {
    console.error('Failed to sync pending orders:', error)
  }
}

// IndexedDB helper functions
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MenuAppDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create pending orders store
      if (!db.objectStoreNames.contains('pendingOrders')) {
        const store = db.createObjectStore('pendingOrders', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
        store.createIndex('retryCount', 'retryCount')
      }
    }
  })
}

async function storeOrderForSync(orderData) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['pendingOrders'], 'readwrite')
    const store = transaction.objectStore('pendingOrders')
    
    const order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: orderData,
      timestamp: Date.now(),
      retryCount: 0,
      authToken: null // Will be set by the client if available
    }
    
    await store.add(order)
  } catch (error) {
    console.error('Failed to store order for sync:', error)
    throw error
  }
}

async function getPendingOrdersFromIDB() {
  try {
    const db = await openDB()
    const transaction = db.transaction(['pendingOrders'], 'readonly')
    const store = transaction.objectStore('pendingOrders')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        // Filter out orders with too many retry attempts or too old
        const maxRetries = 3
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        const now = Date.now()
        
        const validOrders = request.result.filter(order => 
          order.retryCount < maxRetries && (now - order.timestamp) < maxAge
        )
        
        resolve(validOrders)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get pending orders from IDB:', error)
    return []
  }
}

async function removeOrderFromIDB(orderId) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['pendingOrders'], 'readwrite')
    const store = transaction.objectStore('pendingOrders')
    
    await store.delete(orderId)
  } catch (error) {
    console.error('Failed to remove order from IDB:', error)
  }
}

async function incrementOrderRetryCount(orderId) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['pendingOrders'], 'readwrite')
    const store = transaction.objectStore('pendingOrders')
    
    const order = await store.get(orderId)
    if (order) {
      order.retryCount = (order.retryCount || 0) + 1
      
      // Remove if too many retries
      if (order.retryCount >= 3) {
        await store.delete(orderId)
      } else {
        await store.put(order)
      }
    }
  } catch (error) {
    console.error('Failed to increment retry count:', error)
  }
}

// Helper functions for pending orders (legacy localStorage support)
async function getPendingOrders() {
  // Try IndexedDB first, fallback to localStorage
  try {
    return await getPendingOrdersFromIDB()
  } catch (error) {
    console.error('IndexedDB failed, falling back to localStorage:', error)
    
    try {
      const stored = localStorage.getItem('pending_orders')
      if (!stored) return []
      
      const orders = JSON.parse(stored)
      const maxAge = 7 * 24 * 60 * 60 * 1000
      const validOrders = orders.filter(order => Date.now() - order.timestamp < maxAge)
      
      return validOrders
    } catch (localError) {
      console.error('localStorage fallback failed:', localError)
      return []
    }
  }
}

async function removePendingOrder(orderId) {
  // Remove from both IndexedDB and localStorage
  try {
    await removeOrderFromIDB(orderId)
  } catch (error) {
    console.error('Failed to remove from IndexedDB:', error)
  }
  
  try {
    const stored = localStorage.getItem('pending_orders')
    if (stored) {
      const orders = JSON.parse(stored)
      const filtered = orders.filter(order => order.id !== orderId)
      localStorage.setItem('pending_orders', JSON.stringify(filtered))
    }
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
  }
}

// Analytics tracking for notifications
function trackNotificationAction(action, type, data) {
  try {
    // Send analytics data to backend or analytics service
    fetch('/api/analytics/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        type: type,
        timestamp: new Date().toISOString(),
        data: data
      })
    }).catch(error => {
      console.log('Analytics tracking failed:', error)
    })
  } catch (error) {
    console.log('Analytics tracking error:', error)
  }
}

// Push subscription management
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed')
  
  event.waitUntil(
    // Re-subscribe to push notifications
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: getStoredVapidKey()
    }).then((subscription) => {
      // Send new subscription to backend
      return fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth')),
          }
        })
      })
    }).catch(error => {
      console.error('Failed to re-subscribe to push notifications:', error)
    })
  )
})

// Utility functions
function getStoredVapidKey() {
  // This should retrieve the stored VAPID key
  // For now, return null and let the main app handle it
  return null
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}