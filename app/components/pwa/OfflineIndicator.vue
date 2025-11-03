<template>
  <NetworkStatusIndicator
    position="top"
    :persistent="!isOnline"
    :show-details="showDetails"
    :auto-hide="autoHide"
    :auto-hide-delay="autoHideDelay"
    @status-change="handleStatusChange"
    @dismiss="handleDismiss"
  />
</template>

<script setup lang="ts">
import NetworkStatusIndicator from '~/components/base/NetworkStatusIndicator.vue'
import { useNetworkStatus } from '~/composables/useNetworkStatus'

interface Props {
  showDetails?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  autoHide: true,
  autoHideDelay: 5000,
})

const emit = defineEmits<{
  statusChange: [status: string]
  dismiss: []
}>()

const { isOnline } = useNetworkStatus()

const handleStatusChange = (status: string) => {
  emit('statusChange', status)
}

const handleDismiss = () => {
  emit('dismiss')
}
</script>