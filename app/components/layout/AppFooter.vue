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
        <div class="flex flex-col items-center md:items-start">
          <AppText class="text-neutral-80 text-body-sm">
            © {{ currentYear }} {{ appName }}. All rights reserved.
          </AppText>
          
          <NuxtLink 
            v-if="showBranding"
            :to="brandingUrl"
            target="_blank"
            class="mt-2 flex items-center space-x-2 group transition-all duration-500"
          >
            <span class="text-[10px] uppercase tracking-[0.2em] text-neutral-80 group-hover:text-neutral-40 transition-colors">Made with</span>
            <div class="relative overflow-hidden">
               <span class="text-xs font-black tracking-tighter text-neutral-80 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#3b82f6] group-hover:to-[#22c55e] group-hover:bg-clip-text transition-all duration-500 transform group-hover:scale-110 inline-block">KATALOGA</span>
               <div class="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 blur-xl transition-all duration-500 rounded-full"></div>
            </div>
          </NuxtLink>
        </div>
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
import { useTenantStore } from '~/stores/tenant'
import AppText from '../base/AppText.vue'
import AppHeading from '../base/AppHeading.vue'

const tenantStore = useTenantStore()
const showBranding = computed(() => tenantStore.currentTenant?.showBranding !== false)
const brandingUrl = computed(() => tenantStore.currentTenant?.brandingUrl || 'https://kataloga.org')

// Computed properties
const appName = computed(() => useRuntimeConfig().public.appName)
const currentYear = computed(() => new Date().getFullYear())

// Navigation data
const quickLinks = [
  { path: '/', label: 'Menu' },
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
