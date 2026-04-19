<template>
  <div class="cart-redirect">
    Redirecting to checkout...
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

import { useTenant } from '~/composables/useTenant'

const router = useRouter()
const { tPath } = useTenant()

onMounted(() => {
  router.replace(tPath('/checkout'))
})
</script>
