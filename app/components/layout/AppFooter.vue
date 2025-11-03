<template>
  <!-- Web-only footer -->
  <footer class="bg-background-card border-t border-border-subtle mt-auto">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand Section -->
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <BaseIcon name="logo" size="lg" class="text-primary-red" />
            <AppHeading level="h3" size="heading-lg">
              {{ appName }}
            </AppHeading>
          </div>
          <AppText class="text-neutral-80 mb-4 max-w-md">
            Universal menu ordering system for web and mobile. 
            Order your favorite dishes with ease.
          </AppText>
          <div class="flex space-x-4">
            <BaseButton
              v-for="social in socialLinks"
              :key="social.name"
              variant="ghost"
              size="sm"
              :href="social.url"
              :aria-label="social.name"
              class="text-neutral-80 hover:text-primary-green"
            >
              <BaseIcon :name="social.icon" size="md" />
            </BaseButton>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <AppHeading level="h4" size="heading-sm" class="mb-4">
            Quick Links
          </AppHeading>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.path">
              <NuxtLink
                :to="link.path"
                class="text-neutral-80 hover:text-neutral-20 transition-colors text-body-sm"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <AppHeading level="h4" size="heading-sm" class="mb-4">
            Support
          </AppHeading>
          <ul class="space-y-2">
            <li v-for="link in supportLinks" :key="link.path">
              <NuxtLink
                :to="link.path"
                class="text-neutral-80 hover:text-neutral-20 transition-colors text-body-sm"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="border-t border-border-subtle mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
        <AppText class="text-neutral-80 text-body-sm">
          © {{ currentYear }} {{ appName }}. All rights reserved.
        </AppText>
        <div class="flex space-x-6 mt-4 md:mt-0">
          <NuxtLink
            v-for="legal in legalLinks"
            :key="legal.path"
            :to="legal.path"
            class="text-neutral-80 hover:text-neutral-20 transition-colors text-body-sm"
          >
            {{ legal.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Computed properties
const appName = computed(() => useRuntimeConfig().public.appName)
const currentYear = computed(() => new Date().getFullYear())

// Navigation data
const quickLinks = [
  { path: '/menu', label: 'Menu' },
  { path: '/favourites', label: 'Favourites' },
  { path: '/orders', label: 'Order History' },
  { path: '/map', label: 'Locations' },
  { path: '/delivery', label: 'Delivery Info' }
]

const supportLinks = [
  { path: '/support', label: 'Help Center' },
  { path: '/support/faq', label: 'FAQ' },
  { path: '/support/contact', label: 'Contact Us' },
  { path: '/support/jobs', label: 'Careers' }
]

const legalLinks = [
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms of Service' },
  { path: '/cookies', label: 'Cookie Policy' }
]

const socialLinks = [
  { name: 'Facebook', icon: 'facebook', url: '#' },
  { name: 'Twitter', icon: 'twitter', url: '#' },
  { name: 'Instagram', icon: 'instagram', url: '#' },
  { name: 'LinkedIn', icon: 'linkedin', url: '#' }
]
</script>