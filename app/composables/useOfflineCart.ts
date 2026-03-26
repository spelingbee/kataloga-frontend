import { useOrderService } from '~/services/order.service'
import { usePWAFeatures } from './usePWA'
import { useAuthStore } from '~/stores/auth'
import type { CartItem } from '~/types'

interface OfflineCartData {
  items: CartItem[]
  timestamp: number
  version: number
  userId?: string
  syncStatus: 'synced' | 'pending' | 'conflict'
}

interface PendingOrder {
  id: string
  items: CartItem[]
  customerInfo: any
  timestamp: number
  retryCount: number
  authToken?: string
  userId?: string
}



export const useOfflineCart = () => {
  const CART_STORAGE_KEY = 'offline_cart'
  const PENDING_ORDERS_KEY = 'pending_orders'
  const CART_VERSION = 2

  const authStore = useAuthStore()
  const isOnline = ref(typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true)
  const hasPendingOrders = ref(false)
  const syncInProgress = ref(false)
  const hasConflicts = ref(false)
  const lastSyncTime = ref<Date | null>(null)

  // Save cart to local storage with user context
  const saveCartOffline = (items: CartItem[], syncStatus: 'synced' | 'pending' | 'conflict' = 'pending'): void => {
    try {
      const cartData: OfflineCartData = {
        items,
        timestamp: Date.now(),
        version: CART_VERSION,
        userId: authStore.user?.id,
        syncStatus,
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData))
      
      // Also save to IndexedDB for better reliability
      saveCartToIDB(cartData)
    } catch (error) {
      console.error('Failed to save cart offline:', error)
    }
  }

  // Load cart from local storage with user context
  const loadCartOffline = async (): Promise<CartItem[]> => {
    try {
      // Try IndexedDB first
      const idbCart = await loadCartFromIDB()
      if (idbCart.length > 0) {
        return idbCart
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (!stored) return []

      const cartData: OfflineCartData = JSON.parse(stored)
      
      // Check version compatibility
      if (cartData.version !== CART_VERSION) {
        localStorage.removeItem(CART_STORAGE_KEY)
        return []
      }

      // Check user context - only load cart for current user
      if (cartData.userId && authStore.user?.id && cartData.userId !== authStore.user.id) {
        return []
      }

      // Check if cart is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000
      if (Date.now() - cartData.timestamp > maxAge) {
        localStorage.removeItem(CART_STORAGE_KEY)
        return []
      }

      // Check sync status
      if (cartData.syncStatus === 'conflict') {
        hasConflicts.value = true
      }

      return cartData.items || []
    } catch (error) {
      console.error('Failed to load cart offline:', error)
      return []
    }
  }

  // Clear offline cart
  const clearCartOffline = (): void => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear offline cart:', error)
    }
  }

  // IndexedDB operations
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MenuAppDB', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores
        if (!db.objectStoreNames.contains('offlineCart')) {
          const cartStore = db.createObjectStore('offlineCart', { keyPath: 'userId' })
          cartStore.createIndex('timestamp', 'timestamp')
        }
        
        if (!db.objectStoreNames.contains('offlineData')) {
          const dataStore = db.createObjectStore('offlineData', { keyPath: 'key' })
          dataStore.createIndex('lastSync', 'lastSync')
        }
        
        if (!db.objectStoreNames.contains('pendingOrders')) {
          const ordersStore = db.createObjectStore('pendingOrders', { keyPath: 'id' })
          ordersStore.createIndex('timestamp', 'timestamp')
          ordersStore.createIndex('userId', 'userId')
        }
      }
    })
  }

  const saveCartToIDB = async (cartData: OfflineCartData): Promise<void> => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['offlineCart'], 'readwrite')
      const store = transaction.objectStore('offlineCart')
      
      const plainCartData = JSON.parse(JSON.stringify(cartData))
      
      const record = {
        userId: plainCartData.userId || 'anonymous',
        ...plainCartData
      }
      
      await store.put(record)
    } catch (error) {
      console.error('Failed to save cart to IndexedDB:', error)
    }
  }

  const loadCartFromIDB = async (): Promise<CartItem[]> => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['offlineCart'], 'readonly')
      const store = transaction.objectStore('offlineCart')
      
      const userId = authStore.user?.id || 'anonymous'
      const request = store.get(userId)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result
          if (result && result.items) {
            // Check if not too old
            const maxAge = 24 * 60 * 60 * 1000
            if (Date.now() - result.timestamp < maxAge) {
              resolve(result.items)
              return
            }
          }
          resolve([])
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to load cart from IndexedDB:', error)
      return []
    }
  }

  // Save offline data (menu, categories, etc.)
  const saveOfflineData = async (key: string, data: any): Promise<void> => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['offlineData'], 'readwrite')
      const store = transaction.objectStore('offlineData')
      
      const plainData = JSON.parse(JSON.stringify(data))
      
      const record = {
        key,
        data: plainData,
        lastSync: Date.now()
      }
      
      await store.put(record)
      
      // Also save to localStorage as fallback
      localStorage.setItem(`offline_${key}`, JSON.stringify(record))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  const loadOfflineData = async (key: string): Promise<any> => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['offlineData'], 'readonly')
      const store = transaction.objectStore('offlineData')
      
      const request = store.get(key)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result
          // Check if not too old (1 hour for menu data)
          const maxAge = 60 * 60 * 1000
          if (result && result.data) {
            if (Date.now() - result.lastSync < maxAge) {
              resolve(result.data)
              return
            }
          }
          
          // Fallback to localStorage
          try {
            const stored = localStorage.getItem(`offline_${key}`)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (Date.now() - parsed.lastSync < maxAge) {
                resolve(parsed.data)
                return
              }
            }
          } catch (localError) {
            console.error('localStorage fallback failed:', localError)
          }
          
          resolve(null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to load offline data:', error)
      return null
    }
  }

  // Save pending order with enhanced data
  const savePendingOrder = async (orderData: Omit<PendingOrder, 'id' | 'timestamp' | 'retryCount'>): Promise<void> => {
    try {
      const plainOrderData = JSON.parse(JSON.stringify(orderData))
      
      const pendingOrder: PendingOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: Date.now(),
        retryCount: 0,
        authToken: authStore.accessToken || undefined,
        userId: authStore.user?.id,
        ...plainOrderData,
      }

      // Save to IndexedDB
      const db = await openDB()
      const transaction = db.transaction(['pendingOrders'], 'readwrite')
      const store = transaction.objectStore('pendingOrders')
      await store.add(pendingOrder)

      // Also save to localStorage as fallback
      const existing = getPendingOrders()
      existing.push(pendingOrder)
      localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(existing))
      
      hasPendingOrders.value = true
      
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        if ('sync' in registration) {
          await (registration as any).sync.register('order-sync')
        }
      }
    } catch (error) {
      console.error('Failed to save pending order:', error)
    }
  }

  // Get pending orders
  const getPendingOrders = (): PendingOrder[] => {
    try {
      const stored = localStorage.getItem(PENDING_ORDERS_KEY)
      if (!stored) return []

      const orders: PendingOrder[] = JSON.parse(stored)
      
      // Filter out orders older than 7 days
      const maxAge = 7 * 24 * 60 * 60 * 1000
      const validOrders = orders.filter(order => Date.now() - order.timestamp < maxAge)
      
      if (validOrders.length !== orders.length) {
        localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(validOrders))
      }

      hasPendingOrders.value = validOrders.length > 0
      return validOrders
    } catch (error) {
      console.error('Failed to get pending orders:', error)
      return []
    }
  }

  // Remove pending order
  const removePendingOrder = (orderId: string): void => {
    try {
      const orders = getPendingOrders()
      const filtered = orders.filter(order => order.id !== orderId)
      
      localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(filtered))
      hasPendingOrders.value = filtered.length > 0
    } catch (error) {
      console.error('Failed to remove pending order:', error)
    }
  }

  // Conflict resolution strategies
  const resolveConflict = (strategy: 'local' | 'server' | 'merge', localData: CartItem[], serverData: CartItem[]): CartItem[] => {
    switch (strategy) {
      case 'local':
        return localData
      case 'server':
        return serverData
      case 'merge':
        // Merge strategy: combine items, preferring higher quantities
        const merged = new Map<string, CartItem>()
        
        // Add local items
        localData.forEach(item => {
          merged.set(item.menuItem.id, item)
        })
        
        // Add server items, merging quantities
        serverData.forEach(serverItem => {
          const existing = merged.get(serverItem.menuItem.id)
          if (existing) {
            // Keep the item with higher quantity
            if (serverItem.quantity > existing.quantity) {
              merged.set(serverItem.menuItem.id, serverItem)
            }
          } else {
            merged.set(serverItem.menuItem.id, serverItem)
          }
        })
        
        return Array.from(merged.values())
      default:
        return localData
    }
  }

  // Sync cart with server
  const syncCartWithServer = async (): Promise<void> => {
    if (!isOnline.value || !authStore.isAuthenticated) return

    try {
      // Skip server sync for now - will be implemented when cart API is ready
      const localCart = await loadCartOffline()
      
      if (localCart.length > 0) {
        // Mark as synced for now
        saveCartOffline(localCart, 'synced')
      }
      
      lastSyncTime.value = new Date()
    } catch (error) {
      console.error('Failed to sync cart with server:', error)
    }
  }

  const areCartsEqual = (cart1: CartItem[], cart2: CartItem[]): boolean => {
    if (cart1.length !== cart2.length) return false
    
    const map1 = new Map(cart1.map(item => [item.menuItem.id, item.quantity]))
    const map2 = new Map(cart2.map(item => [item.menuItem.id, item.quantity]))
    
    for (const [id, quantity] of map1) {
      if (map2.get(id) !== quantity) return false
    }
    
    return true
  }

  // Sync pending orders when online
  const syncPendingOrders = async (): Promise<void> => {
    if (!isOnline.value || syncInProgress.value) return

    syncInProgress.value = true
    
    try {
      const orders = getPendingOrders()

      for (const order of orders) {
        try {
          // Attempt to submit the order
          const orderService = useOrderService()
          const response = await orderService.createOrder({
            items: order.items.map(item => ({
              productId: item.menuItem.id,
              quantity: item.quantity,
              price: item.menuItem.price,
            })),
            customerInfo: order.customerInfo,
            paymentMethod: 'CASH', // Default payment method for offline orders
          })

          if (response) {
            await removePendingOrder(order.id)
            
            // Show success notification
            const { showNotification } = usePWAFeatures()
            showNotification('Order Submitted', {
              body: 'Your offline order has been successfully submitted!',
              tag: 'order-sync',
            })
          } else {
            // Increment retry count
            order.retryCount++
            if (order.retryCount >= 3) {
              // Remove after 3 failed attempts
              await removePendingOrder(order.id)
            }
          }
        } catch (error) {
          console.error('Failed to sync order:', order.id, error)
          order.retryCount++
          if (order.retryCount >= 3) {
            await removePendingOrder(order.id)
          }
        }
      }
    } finally {
      syncInProgress.value = false
    }
  }

  // Sync all offline data
  const syncAllData = async (): Promise<void> => {
    if (!isOnline.value) return

    try {
      // Validate cart against current menu data
      await validateCartOnReconnection()
      
      // Sync cart
      await syncCartWithServer()
      
      // Sync pending orders
      await syncPendingOrders()
      
      // Cache fresh menu data
      await cacheMenuData()
      
      lastSyncTime.value = new Date()
    } catch (error) {
      console.error('Failed to sync all data:', error)
    }
  }

  // Validate cart when coming back online
  const validateCartOnReconnection = async (): Promise<void> => {
    try {
      // Skip validation for now - will be implemented when needed
      console.log('Cart validation skipped - not implemented yet')
    } catch (error) {
      console.error('Failed to validate cart on reconnection:', error)
    }
  }

  // Cache menu data for offline use
  const cacheMenuData = async (): Promise<void> => {
    try {
      // Skip menu caching for now - will be implemented when menu API is stable
      console.log('Menu caching skipped - not implemented yet')
    } catch (error) {
      console.error('Failed to cache menu data:', error)
    }
  }

  // Handle online/offline status
  const handleOnlineStatus = () => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      isOnline.value = navigator.onLine
    }
    
    if (isOnline.value) {
      // Sync all data when coming back online
      nextTick(() => {
        syncAllData()
      })
    }
  }

  // Register service worker for background sync
  const registerBackgroundSync = async (): Promise<void> => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        if ('sync' in registration) {
          await (registration as any).sync.register('cart-sync')
          await (registration as any).sync.register('order-sync')
        }
      } catch (error) {
        console.error('Failed to register background sync:', error)
      }
    }
  }

  // Initialize offline functionality
  const initializeOfflineCart = (): void => {
    if (typeof window === 'undefined') return

    handleOnlineStatus()
    getPendingOrders() // Initialize pending orders state

    // Event listeners
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    // Register background sync
    registerBackgroundSync()

    // Periodic sync when online
    const syncInterval = setInterval(() => {
      if (isOnline.value) {
        if (hasPendingOrders.value) {
          syncPendingOrders()
        }
        
        // Periodic full sync every 5 minutes
        const now = Date.now()
        const lastSync = lastSyncTime.value?.getTime() || 0
        if (now - lastSync > 5 * 60 * 1000) {
          syncAllData()
        }
      }
    }, 30000) // Every 30 seconds

    // Initial sync if online
    if (isOnline.value) {
      nextTick(() => {
        syncAllData()
      })
    }

    // Cleanup on unmount
    onUnmounted(() => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
      clearInterval(syncInterval)
    })
  }

  onMounted(() => {
    initializeOfflineCart()
  })

  return {
    // State
    isOnline: readonly(isOnline),
    hasPendingOrders: readonly(hasPendingOrders),
    syncInProgress: readonly(syncInProgress),
    hasConflicts: readonly(hasConflicts),
    lastSyncTime: readonly(lastSyncTime),
    
    // Cart operations
    saveCartOffline,
    loadCartOffline,
    clearCartOffline,
    
    // Order operations
    savePendingOrder,
    getPendingOrders,
    removePendingOrder,
    
    // Sync operations
    syncPendingOrders,
    syncCartWithServer,
    syncAllData,
    
    // Offline data operations
    saveOfflineData,
    loadOfflineData,
    cacheMenuData,



    initializeOfflineCart,
    // Conflict resolution
    resolveConflict,
  }
}