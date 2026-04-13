import { defineStore } from 'pinia'
import type { Delivery, DeliveryZone, CourierInfo, TrackingUpdate } from '~/types'

interface DeliveryState {
  activeDeliveries: Delivery[]
  deliveryZones: DeliveryZone[]
  currentDelivery: Delivery | null
  courierInfo: CourierInfo | null
  trackingUpdates: TrackingUpdate[]
  loading: boolean
  error: string | null
}

export const useDeliveryStore = defineStore('delivery', {
  state: (): DeliveryState => ({
    activeDeliveries: [],
    deliveryZones: [],
    currentDelivery: null,
    courierInfo: null,
    trackingUpdates: [],
    loading: false,
    error: null,
  }),

  getters: {
    hasActiveDelivery: (state) => state.currentDelivery !== null,
    isDeliveryInProgress: (state) => {
      return state.currentDelivery?.status === 'in_transit'
    },
  },

  actions: {
    setCurrentDelivery(delivery: Delivery) {
      this.currentDelivery = delivery
    },

    setCourierInfo(courier: CourierInfo) {
      this.courierInfo = courier
    },

    addTrackingUpdate(update: TrackingUpdate) {
      this.trackingUpdates.unshift(update)
    },

    updateDeliveryStatus(deliveryId: string, status: Delivery['status']) {
      if (this.currentDelivery?.id === deliveryId) {
        this.currentDelivery.status = status
      }

      const delivery = this.activeDeliveries.find(d => d.id === deliveryId)
      if (delivery) {
        delivery.status = status
      }
    },

    clearCurrentDelivery() {
      this.currentDelivery = null
      this.courierInfo = null
      this.trackingUpdates = []
    },
  },
})
