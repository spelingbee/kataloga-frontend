<template>
  <span :class="iconClasses">
    <!-- Category Icons (Emoji) -->
    <span v-if="categoryIcons[name]" class="icon__emoji">
      {{ categoryIcons[name] }}
    </span>
    
    <!-- Action Icons (SVG) -->
    <svg
      v-else-if="actionIcons[name]"
      class="icon__svg"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        :d="actionIcons[name]"
      />
    </svg>
    
    <!-- Fire Icon (Special) -->
    <span v-else-if="name === 'fire'" class="icon__emoji icon__emoji--fire">🔥</span>
    
    <!-- Fallback -->
    <span v-else class="icon__fallback">?</span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '4xl' | 'category-icon' | number
  color?: 'current' | 'primary' | 'secondary' | 'muted' | 'white' | 'red' | 'green' | 'orange' | 'primary-red'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'current'
})

const slots = defineSlots<{}>()

const iconClasses = computed(() => {
  const classes = ['icon']
  
  // Add size modifier
  classes.push(`icon--${props.size}`)
  
  // Add color modifier
  classes.push(`icon--${props.color}`)
  
  return classes
})

// Category icons using emoji
const categoryIcons: Record<string, string> = {
  all: '🍔',
  salad: '🥗',
  main: '🍽️',
  meat: '🥩',
  fastfood: '🍟',
  dessert: '🧁',
  drinks: '🥤',
  local_florist: '🌸',
  local_pizza: '🍕'
}

// Action icons using SVG paths
const actionIcons: Record<string, string> = {
  plus: 'M12 4v16m8-8H4',
  minus: 'M4 12h16',
  x: 'M18 6L6 18M6 6l12 12',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  grid: 'M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  'heart-filled': 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6m-9 0h10',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-up': 'M18 15l-6-6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'arrow-left': 'M19 12H5m7-7l-7 7 7 7',
  'arrow-right': 'M5 12h14m-7-7l7 7-7 7',
  check: 'M20 6L9 17l-5-5',
  leaf: 'M7 20l4-16m2 16l4-16M6 8h12M6 16h12',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'trending-down': 'M23 18l-6-6-4 4-6-6',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  refresh: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15',
  info: 'M12 16v-4M12 8h.01',
  share: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  spinner: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
  map: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  clock: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23L13 12.25V7z',
  // Error and loading icons
  'alert-circle': 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01',
  'wifi-off': 'M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01',
  'refresh-cw': 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  server: 'M20 8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h16zm0 2H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm0 6H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z',
  // Empty state icons
  inbox: 'M22 12h-6l-2-3h-4l-2 3H2M22 12v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6M22 12l-2-9H4l-2 9',
  utensils: 'M3 2v7c0 1.1.9 2 2 2h2V2H3zM7 10.5V21h2V10.5M19 2v1.5c0 1.38-1.12 2.5-2.5 2.5S14 4.88 14 3.5V2h-2v1.5C12 5.43 13.57 7 15.5 7H16v14h2V7h.5C20.43 7 22 5.43 22 3.5V2h-3z',
  'shopping-cart': 'M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6',
  'clipboard-list': 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0a2 2 0 00-2-2h-4a2 2 0 00-2 2m8 0a2 2 0 01-2 2H8a2 2 0 01-2-2m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2M9 12h6M9 16h6',
  'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
  location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  truck: 'M16 3h4a2 2 0 012 2v13a2 2 0 01-2 2h-2M16 3v18M16 3H1v18h15M1 7h15M1 11h15M1 15h15',
  store: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10',
  menu: 'M3 12h18M3 6h18M3 18h18',
  sidebar: 'M4 6h16v12H4V6zm4 0v12',
  logo: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
  'menu-book': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20v-12H6.5A2.5 2.5 0 0 0 4 7.5v12zm0 0a2.5 2.5 0 0 0 2.5 2.5H20',
  receipt: 'M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zm4 4h8m-8 4h8m-8 4h5',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  loader: 'M12 2v4m0 12v4m10-10h-4M6 12H2m16.24-7.24l-2.83 2.83M6.59 17.41l-2.83 2.83m16.24 0l-2.83-2.83M6.59 6.59L3.76 3.76',
  compare: 'M16 3h5v5M4 21h5v-5M21 3l-7 7M3 21l7-7',
  sliders: 'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6',
  flame: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 00-.5 2.5z',
  sparkles: 'M12 3l2 5h5l-4 4 1 5-4-3-4 3 1-5-4-4h5z',
  'search-x': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 13L9 9M9 13l4-4',
  globe: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10A15.3 15.3 0 018 12 15.3 15.3 0 0112 2z',
  'shopping-bag': 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6',
  'check-circle': 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  'eye-off': 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  'x-circle': 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM15.59 7L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z',
  'message-circle': 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z',
  table: 'M3 3h18v18H3V3zm0 6h18M3 15h18M9 3v18M15 3v18',
  message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10',
  alert: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  restaurant: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  'credit-card': 'M1 7.6h22M21 19H3a2 2 0 01-2-2V7a2 2 0 012-2h18a2 2 0 012 2v10a2 2 0 01-2 2zM17.6 14.8h.1v.1h-.1zM13.6 14.8h.1v.1h-.1z',
  wallet: 'M20 7V5c0-1.1-.9-2-2-2H5C3.34 3 2 4.34 2 6v12c0 1.66 1.34 3 3 3h13c1.1 0 2-.9 2-2v-2M2 8h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H2M14 11h.01',
  banknotes: 'M2 5h20v14H2z M2 9h20 M2 15h20 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
  'chef-hat': 'M6 18c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-1c-.55 0-1 .45-1 1v1c0 .55-.45 1-1 1s-1-.45-1-1V8c0-.55-.45-1-1-1h-1c-1.1 0-2 .9-2 2v9zm13-8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'
}

</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  // Size modifiers
  &--xs {
    width: 1rem;
    height: 1rem;
    font-size: 1rem;
  }
  
  &--sm {
    width: 1.25rem;
    height: 1.25rem;
    font-size: 1.25rem;
  }
  
  &--md {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.5rem;
  }
  
  &--lg {
    width: 2rem;
    height: 2rem;
    font-size: 2rem;
  }
  
  &--xl {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 2.5rem;
  }
  
  &--4xl {
    width: 4rem;
    height: 4rem;
    font-size: 4rem;
  }
  
  &--category-icon {
    width: 3rem;
    height: 3rem;
    font-size: 3rem;
  }
  
  // Color modifiers
  &--current {
    color: currentColor;
  }
  
  &--primary {
    color: var(--color-primary);
  }
  
  &--secondary {
    color: var(--text-secondary);
  }
  
  &--muted {
    color: var(--text-tertiary);
  }
  
  &--white {
    color: white;
  }
  
  &--red {
    color: var(--color-error);
  }
  
  &--green {
    color: var(--color-success);
  }
  
  &--orange {
    color: var(--color-warning);
  }
  
  &--primary-red {
    color: var(--color-error);
  }
}

.icon__emoji {
  display: inline-block;
  line-height: 1;
}

.icon__svg {
  width: 100%;
  height: 100%;
}

.icon__fallback {
  font-size: 0.875em;
  opacity: 0.5;
}
</style>
