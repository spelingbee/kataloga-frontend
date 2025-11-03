<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useUserStore } from './stores/user'
import { useMenuStore } from './stores/menu'
import { useCartStore } from '~/stores/cart'

// Initialize stores on app startup
const userStore = useUserStore()
const cartStore = useCartStore()
const menuStore = useMenuStore()

// Initialize user and restore cart on app start
onMounted(async () => {
  await userStore.initializeUser()
  cartStore.restoreCart()
  menuStore.initializeFavourites()
})
</script>
