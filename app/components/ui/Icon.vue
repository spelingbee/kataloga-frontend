<template>
  <svg
    :class="['icon', `icon--${name}`]"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- Shopping Bag -->
    <g v-if="name === 'shopping-bag'">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </g>

    <!-- Play Circle -->
    <g v-else-if="name === 'play-circle'">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </g>

    <!-- Bot -->
    <g v-else-if="name === 'bot'">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </g>

    <!-- X Circle -->
    <g v-else-if="name === 'x-circle'">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </g>

    <!-- Check Circle 2 -->
    <g v-else-if="name === 'check-circle-2'">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </g>

    <!-- Package -->
    <g v-else-if="name === 'package'">
      <path d="M16.5 9.4 7.5 4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </g>

    <!-- Shopping Cart -->
    <g v-else-if="name === 'shopping-cart'">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </g>

    <!-- Credit Card -->
    <g v-else-if="name === 'credit-card'">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </g>

    <!-- Plus -->
    <g v-else-if="name === 'plus'">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </g>

    <!-- Check (Simple) -->
    <path v-else-if="name === 'check'" d="M20 6 9 17l-5-5" />

    <!-- Default fallback -->
    <circle v-else cx="12" cy="12" r="10" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  name: string
  size?: number | string
}

withDefaults(defineProps<Props>(), {
  size: 24
})
</script>

<style scoped lang="scss">
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
