<template>
  <div class="network-status-indicator">
    <!-- Main status bar -->
    <Transition name="slide-down">
      <div
        v-if="showIndicator"
        :class="[
          'status-bar',
          `status-${statusColor}`,
          { 'status-persistent': isPersistent }
        ]"
        @click="toggleDetails"
      >
        <div class="status-content">
          <div class="status-icon">
            <BaseIcon
              :name="statusIcon"
              :class="{ 'animate-spin': syncInProgress }"
            />
          </div>
          <div class="status-text">
            <span class="status-message">{{ statusMessage }}</span>
            <span v-if="showDetails" class="status-details">
              {{ connectionDetails }}
            </span>
          </div>
          <button
            v-if="isDismissible"
            class="dismiss-btn"
            @click.stop="dismissStatus"
            aria-label="Dismiss notification"
          >
            <BaseIcon name="x" />
          </button>
        </div>
        
        <!-- Progress bar for sync -->
        <div
          v-if="syncInProgress"
          class="sync-progress"
        >
          <div class="progress-bar"></div>
        </div>
      </div>
    </Transition>

    <!-- Floating status indicator (minimal) -->
    <Transition name="fade">
      <div
        v-if="showFloatingIndicator"
        :class="[
          'floating-indicator',
          `indicator-${statusColor}`
        ]"
        @click="showIndicator = true"
        :title="statusMessage"
      >
        <BaseIcon
          :name="statusIcon"
          :class="{ 'animate-spin': syncInProgress }"
        />
        <span v-if="hasPendingOrders" class="pending-badge">
          {{ pendingCount }}
        </span>
      </div>
    </Transition>

    <!-- Offline notification modal -->
    <Transition name="modal">
      <div
        v-if="showOfflineModal"
        class="offline-modal-overlay"
        @click="closeOfflineModal"
      >
        <div class="offline-modal" @click.stop>
          <div class="modal-header">
            <BaseIcon name="wifi-off" class="modal-icon" />
            <h3>You're Offline</h3>
          </div>
          <div class="modal-content">
            <p>
              Don't worry! You can still browse the menu and add items to your cart.
              Your order will be saved and submitted when your connection is restored.
            </p>
            <div v-if="hasPendingOrders" class="pending-info">
              <BaseIcon name="clock" />
              <span>{{ pendingCount }} order(s) waiting to sync</span>
            </div>
          </div>
          <div class="modal-actions">
            <button
              class="btn btn-primary"
              @click="closeOfflineModal"
            >
              Continue Browsing
            </button>
            <button
              v-if="hasPendingOrders"
              class="btn btn-secondary"
              @click="viewPendingOrders"
            >
              View Pending Orders
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '~/composables/useNetworkStatus'
import { useOfflineCart } from '~/composables/useOfflineCart'
import BaseIcon from './BaseIcon.vue'

interface Props {
  position?: 'top' | 'bottom' | 'floating'
  persistent?: boolean
  showDetails?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  persistent: false,
  showDetails: false,
  autoHide: true,
  autoHideDelay: 5000
})

const emit = defineEmits<{
  statusChange: [status: string]
  dismiss: []
}>()

const {
  isOnline,
  getStatusMessage,
  getStatusColor,
  getConnectionQuality,
  showOfflineNotification,
  dismissOfflineNotification,
  effectiveType,
  downlink
} = useNetworkStatus()

const {
  hasPendingOrders,
  syncInProgress,
  getPendingOrders
} = useOfflineCart()

// Local state
const showIndicator = ref(false)
const showFloatingIndicator = ref(false)
const showOfflineModal = ref(false)
const detailsExpanded = ref(false)

// Computed properties
const statusMessage = computed(() => getStatusMessage())
const statusColor = computed(() => getStatusColor())
const isPersistent = computed(() => props.persistent || !isOnline.value)
const isDismissible = computed(() => !isPersistent.value)

const statusIcon = computed(() => {
  if (syncInProgress.value) return 'refresh-cw'
  if (!isOnline.value) return 'wifi-off'
  if (hasPendingOrders.value) return 'clock'
  
  const quality = getConnectionQuality()
  switch (quality) {
    case 'excellent':
      return 'wifi'
    case 'good':
      return 'wifi'
    case 'fair':
      return 'signal'
    case 'poor':
      return 'signal'
    default:
      return 'wifi'
  }
})

const connectionDetails = computed(() => {
  if (!isOnline.value) return 'Offline mode active'
  return `${effectiveType.value.toUpperCase()} • ${downlink.value.toFixed(1)} Mbps`
})

const pendingCount = computed(() => {
  return getPendingOrders().length
})

// Methods
const toggleDetails = () => {
  detailsExpanded.value = !detailsExpanded.value
}

const dismissStatus = () => {
  showIndicator.value = false
  showFloatingIndicator.value = true
  dismissOfflineNotification()
  emit('dismiss')
}

const closeOfflineModal = () => {
  showOfflineModal.value = false
}

const viewPendingOrders = () => {
  closeOfflineModal()
  navigateTo('/orders?filter=pending')
}

// Auto-hide logic
let autoHideTimer: NodeJS.Timeout | null = null

const startAutoHide = () => {
  if (!props.autoHide || isPersistent.value) return
  
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
  }
  
  autoHideTimer = setTimeout(() => {
    if (!isPersistent.value) {
      dismissStatus()
    }
  }, props.autoHideDelay)
}

const stopAutoHide = () => {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
    autoHideTimer = null
  }
}

// Watchers
watch(isOnline, (online, wasOnline) => {
  if (online !== wasOnline) {
    showIndicator.value = true
    showFloatingIndicator.value = false
    
    if (!online) {
      // Show offline modal after a delay
      setTimeout(() => {
        showOfflineModal.value = true
      }, 2000)
    } else {
      showOfflineModal.value = false
    }
    
    emit('statusChange', online ? 'online' : 'offline')
    startAutoHide()
  }
})

watch(syncInProgress, (syncing) => {
  if (syncing) {
    showIndicator.value = true
    showFloatingIndicator.value = false
    stopAutoHide()
  } else {
    startAutoHide()
  }
})

watch(hasPendingOrders, (pending) => {
  if (pending && isOnline.value) {
    showIndicator.value = true
    showFloatingIndicator.value = false
    startAutoHide()
  }
})

watch(showOfflineNotification, (show) => {
  if (show) {
    showIndicator.value = true
    showFloatingIndicator.value = false
  }
})

// Initialize
onMounted(() => {
  // Show indicator if offline or has pending orders
  if (!isOnline.value || hasPendingOrders.value) {
    showIndicator.value = true
  } else {
    showFloatingIndicator.value = true
  }
  
  startAutoHide()
})

onUnmounted(() => {
  stopAutoHide()
})
</script>

<style scoped>
.network-status-indicator {
  position: relative;
  z-index: 1000;
}

/* Status Bar */
.status-bar {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border-bottom: 1px solid;
  border-opacity: 0.2;
}

.status-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.status-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.status-green {
  background-color: #10b981;
  color: white;
  border-color: #059669;
}

.status-yellow {
  background-color: #f59e0b;
  color: white;
  border-color: #d97706;
}

.status-orange {
  background-color: #f97316;
  color: white;
  border-color: #ea580c;
}

.status-red {
  background-color: #ef4444;
  color: white;
  border-color: #dc2626;
}

.status-gray {
  background-color: #6b7280;
  color: white;
  border-color: #4b5563;
}

.status-persistent {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-icon {
  flex-shrink: 0;
  margin-right: 0.75rem;
}

.status-text {
  flex: 1;
  min-width: 0;
}

.status-message {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-details {
  display: block;
  font-size: 0.75rem;
  opacity: 0.75;
  margin-top: 0.25rem;
}

.dismiss-btn {
  flex-shrink: 0;
  margin-left: 0.75rem;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.dismiss-btn:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

/* Sync Progress */
.sync-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0.25rem;
  background-color: rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  animation: progress 2s ease-in-out infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

/* Floating Indicator */
.floating-indicator {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.floating-indicator:hover {
  transform: scale(1.1);
}

.indicator-green {
  background-color: #10b981;
  color: white;
}

.indicator-yellow {
  background-color: #f59e0b;
  color: white;
}

.indicator-orange {
  background-color: #f97316;
  color: white;
}

.indicator-red {
  background-color: #ef4444;
  color: white;
}

.indicator-gray {
  background-color: #6b7280;
  color: white;
}

.pending-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: #ef4444;
  color: white;
  font-size: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* Offline Modal */
.offline-modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.offline-modal {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 28rem;
  width: 100%;
  padding: 1.5rem;
}

.dark .offline-modal {
  background-color: #1f2937;
  color: white;
}

.modal-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-icon {
  width: 2rem;
  height: 2rem;
  color: #ef4444;
  margin-right: 0.75rem;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.modal-content p {
  color: #4b5563;
  margin-bottom: 1rem;
}

.dark .modal-content p {
  color: #d1d5db;
}

.pending-info {
  display: flex;
  align-items: center;
  color: #d97706;
  background-color: #fef3c7;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.dark .pending-info {
  color: #fbbf24;
  background-color: rgba(146, 64, 14, 0.2);
}

.pending-info svg {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-primary:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #1f2937;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-secondary:focus {
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.5);
}

.dark .btn-secondary {
  background-color: #374151;
  color: #e5e7eb;
}

.dark .btn-secondary:hover {
  background-color: #4b5563;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .offline-modal,
.modal-leave-to .offline-modal {
  transform: scale(0.8);
}

/* Animations */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>