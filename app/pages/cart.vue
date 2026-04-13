<template>
  <div class="cart-redirect">
    Redirecting to checkout...
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  router.replace('/checkout')
})
</script>
