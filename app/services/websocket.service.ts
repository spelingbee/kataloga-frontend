import type { Order, OrderStatus, Notification } from '~/types'

export interface WebSocketMessage {
  type: 'order_update' | 'notification' | 'promotion' | 'system' | 'auth' | 'track_order' | 'stop_tracking' | 'connection_status'
  data: any
  timestamp: string
  userId?: string
  tenantId?: string
}

export interface OrderUpdateMessage {
  orderId: string
  status: OrderStatus
  estimatedTime?: number
  message?: string
  courierLocation?: {
    latitude: number
    longitude: number
  }
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private authStore: any = null

  constructor() {
    // Initialize listeners map
    this.listeners.set('order_update', new Set())
    this.listeners.set('notification', new Set())
    this.listeners.set('promotion', new Set())
    this.listeners.set('system', new Set())
    this.listeners.set('connection_status', new Set())
  }

  setAuthStore(authStore: any) {
    this.authStore = authStore
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        // Wait for current connection attempt
        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            resolve()
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'))
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
        return
      }

      this.isConnecting = true
      const config = useRuntimeConfig()
      const wsUrl = config.public.apiBaseUrl.replace(/^http/, 'ws') + '/ws'

      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          
          // Send authentication if available
          if (this.authStore?.accessToken) {
            this.send({
              type: 'auth',
              data: { 
                token: this.authStore.accessToken,
                tenantId: this.authStore.user?.tenantId 
              },
              timestamp: new Date().toISOString(),
            })
          }
          
          // Notify connection status listeners
          this.handleMessage({
            type: 'connection_status',
            data: { status: 'connected' },
            timestamp: new Date().toISOString()
          })
          
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          this.ws = null
          
          // Notify connection status listeners
          this.handleMessage({
            type: 'connection_status',
            data: { status: 'disconnected', code: event.code, reason: event.reason },
            timestamp: new Date().toISOString()
          })
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message.data)
        } catch (error) {
          console.error('Error in WebSocket message handler:', error)
        }
      })
    }
  }

  private send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  subscribe(type: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.add(callback)
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        listeners.delete(callback)
      }
    }
  }

  subscribeToOrderUpdates(callback: (update: OrderUpdateMessage) => void) {
    return this.subscribe('order_update', callback)
  }

  subscribeToNotifications(callback: (notification: any) => void) {
    return this.subscribe('notification', callback)
  }

  subscribeToPromotions(callback: (promotion: any) => void) {
    return this.subscribe('promotion', callback)
  }

  subscribeToSystemMessages(callback: (message: any) => void) {
    return this.subscribe('system', callback)
  }

  subscribeToConnectionStatus(callback: (status: { status: string, code?: number, reason?: string }) => void) {
    return this.subscribe('connection_status', callback)
  }

  trackOrder(orderId: string) {
    this.send({
      type: 'track_order',
      data: { orderId },
      timestamp: new Date().toISOString(),
    })
  }

  stopTrackingOrder(orderId: string) {
    this.send({
      type: 'stop_tracking',
      data: { orderId },
      timestamp: new Date().toISOString(),
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }
}

// Create singleton instance
let webSocketService: WebSocketService | null = null

export function useWebSocketService(): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService()
  }
  return webSocketService
}

// Composable for easier usage in components
export function useWebSocket() {
  const wsService = useWebSocketService()
  const isConnected = ref(false)
  const connectionState = ref('disconnected')

  const connect = async () => {
    try {
      await wsService.connect()
      isConnected.value = true
      connectionState.value = wsService.getConnectionState()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      isConnected.value = false
      connectionState.value = 'disconnected'
    }
  }

  const disconnect = () => {
    wsService.disconnect()
    isConnected.value = false
    connectionState.value = 'disconnected'
  }

  // Update connection state periodically
  const updateConnectionState = () => {
    const state = wsService.getConnectionState()
    connectionState.value = state
    isConnected.value = state === 'connected'
  }

  onMounted(() => {
    // Check connection state periodically
    const interval = setInterval(updateConnectionState, 1000)
    
    onUnmounted(() => {
      clearInterval(interval)
    })
  })

  return {
    isConnected: readonly(isConnected),
    connectionState: readonly(connectionState),
    connect,
    disconnect,
    subscribe: wsService.subscribe.bind(wsService),
    subscribeToOrderUpdates: wsService.subscribeToOrderUpdates.bind(wsService),
    subscribeToNotifications: wsService.subscribeToNotifications.bind(wsService),
    subscribeToPromotions: wsService.subscribeToPromotions.bind(wsService),
    subscribeToSystemMessages: wsService.subscribeToSystemMessages.bind(wsService),
    subscribeToConnectionStatus: wsService.subscribeToConnectionStatus.bind(wsService),
    trackOrder: wsService.trackOrder.bind(wsService),
    stopTrackingOrder: wsService.stopTrackingOrder.bind(wsService),
  }
}