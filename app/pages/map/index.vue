<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-4">
        <BaseIcon name="map" size="lg" class="text-primary-orange" />
        <AppHeading level="h1" size="display-md" class="text-white">
          Restaurant Locations
        </AppHeading>
      </div>
      <AppText size="body-lg" class="text-neutral-20">
        Find restaurants near you and check delivery availability
      </AppText>
    </div>

    <!-- Location Controls -->
    <div class="px-6 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Current Location -->
        <div class="flex-1">
          <div class="bg-background-card rounded-xl p-4">
            <div class="flex items-center gap-3">
              <BaseIcon 
                name="location" 
                size="md" 
                :class="userLocation ? 'text-primary-green' : 'text-neutral-80'"
              />
              <div class="flex-1">
                <AppText size="body-sm" class="text-neutral-20 mb-1">
                  Current Location
                </AppText>
                <AppText size="body-md" class="text-white">
                  {{ locationText }}
                </AppText>
              </div>
              <BaseButton 
                variant="ghost" 
                size="sm"
                :disabled="gettingLocation"
                @click="getCurrentLocation"
              >
                <BaseIcon 
                  :name="gettingLocation ? 'loader' : 'refresh'" 
                  size="sm"
                  :class="gettingLocation ? 'animate-spin' : ''"
                />
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex gap-2">
          <BaseButton 
            variant="secondary"
            :disabled="!userLocation"
            @click="findNearestRestaurant"
          >
            <BaseIcon name="navigation" size="sm" class="mr-2" />
            Find Nearest
          </BaseButton>
          <BaseButton 
            variant="ghost"
            @click="showFilters = !showFilters"
          >
            <BaseIcon name="filter" size="sm" />
          </BaseButton>
        </div>
      </div>

      <!-- Filters -->
      <div v-if="showFilters" class="mt-4 bg-background-card rounded-xl p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <input 
              id="delivery-available" 
              v-model="filters.deliveryAvailable"
              type="checkbox"
              class="rounded border-neutral-80"
            />
            <label for="delivery-available" class="text-white text-sm">
              Delivery Available
            </label>
          </div>
          <div class="flex items-center gap-2">
            <input 
              id="open-now" 
              v-model="filters.openNow"
              type="checkbox"
              class="rounded border-neutral-80"
            />
            <label for="open-now" class="text-white text-sm">
              Open Now
            </label>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-white text-sm">Max Distance:</label>
            <select 
              v-model="filters.maxDistance"
              class="bg-background-dark border border-neutral-80 rounded px-2 py-1 text-white text-sm"
            >
              <option value="">Any</option>
              <option value="1">1 km</option>
              <option value="3">3 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col lg:flex-row gap-6 px-6">
      <!-- Restaurant List -->
      <div class="lg:w-96 flex-shrink-0">
        <div class="bg-background-card rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <AppHeading level="h3" size="heading-md" class="text-white">
              Restaurants
            </AppHeading>
            <AppText size="caption" class="text-neutral-20">
              {{ filteredRestaurants.length }} found
            </AppText>
          </div>

          <!-- Loading State -->
          <div v-if="locationStore.loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green mx-auto mb-4"/>
            <AppText size="body-sm" class="text-neutral-20">Loading restaurants...</AppText>
          </div>

          <!-- Restaurant List -->
          <div v-else class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="restaurant in filteredRestaurants"
              :key="restaurant.id"
              class="p-3 rounded-lg border border-neutral-80/20 hover:border-primary-green/50 transition-colors cursor-pointer"
              :class="{ 'border-primary-green': selectedRestaurant?.id === restaurant.id }"
              @click="selectRestaurant(restaurant)"
            >
              <div class="flex items-start justify-between mb-2">
                <AppHeading level="h4" size="heading-sm" class="text-white">
                  {{ restaurant.name }}
                </AppHeading>
                <div class="flex items-center gap-1">
                  <BaseIcon name="clock" size="xs" class="text-neutral-20" />
                  <AppText size="caption" class="text-neutral-20">
                    {{ restaurant.deliveryTime || 30 }}min
                  </AppText>
                </div>
              </div>
              
              <AppText size="body-sm" class="text-neutral-20 mb-2">
                {{ restaurant.address }}
              </AppText>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <BaseIcon 
                    name="phone" 
                    size="xs" 
                    class="text-neutral-20"
                  />
                  <AppText size="caption" class="text-neutral-20">
                    {{ restaurant.phone || 'N/A' }}
                  </AppText>
                </div>
                <div class="flex items-center gap-1">
                  <div 
                    class="w-2 h-2 rounded-full"
                    :class="restaurant.isActive ? 'bg-primary-green' : 'bg-neutral-80'"
                  />
                  <AppText 
                    size="caption" 
                    :class="restaurant.isActive ? 'text-primary-green' : 'text-neutral-80'"
                  >
                    {{ restaurant.isActive ? 'Open' : 'Closed' }}
                  </AppText>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredRestaurants.length === 0" class="text-center py-8">
              <BaseIcon name="map" size="xl" class="text-neutral-80 mx-auto mb-4" />
              <AppText class="text-white mb-2">No restaurants found</AppText>
              <AppText size="body-sm" class="text-neutral-20">
                Try adjusting your filters or location
              </AppText>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Container -->
      <div class="flex-1">
        <div class="bg-background-card rounded-xl p-4 h-96 lg:h-[600px]">
          <div class="w-full h-full bg-neutral-80/20 rounded-lg flex items-center justify-center">
            <!-- Map will be rendered here -->
            <div class="text-center">
              <BaseIcon name="map" size="4xl" class="text-neutral-80 mx-auto mb-4" />
              <AppText class="text-white mb-2">Interactive Map</AppText>
              <AppText size="body-sm" class="text-neutral-20">
                Map integration will be implemented in the next phase
              </AppText>
            </div>
          </div>
        </div>

        <!-- Selected Restaurant Info -->
        <div v-if="selectedRestaurant" class="mt-4 bg-background-card rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <AppHeading level="h3" size="heading-md" class="text-white">
              {{ selectedRestaurant.name }}
            </AppHeading>
            <BaseButton 
              variant="primary"
              @click="orderFromRestaurant"
            >
              Order Now
            </BaseButton>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center gap-2">
              <BaseIcon name="location" size="sm" class="text-primary-orange" />
              <AppText size="body-sm" class="text-neutral-20">
                {{ selectedRestaurant.address }}
              </AppText>
            </div>
            <div class="flex items-center gap-2">
              <BaseIcon name="clock" size="sm" class="text-primary-green" />
              <AppText size="body-sm" class="text-neutral-20">
                {{ selectedRestaurant.deliveryTime || 30 }} min delivery
              </AppText>
            </div>
            <div class="flex items-center gap-2">
              <BaseIcon name="phone" size="sm" class="text-primary-red" />
              <AppText size="body-sm" class="text-neutral-20">
                {{ selectedRestaurant.phone || 'Contact available' }}
              </AppText>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Restaurant } from '~/types'
import { useGeolocation } from '~/composables/useGeolocation'

// Stores
import { useLocationStore } from '~/stores/location'
import AppText from '../../components/base/AppText.vue'
import AppHeading from '../../components/base/AppHeading.vue'

// Page setup
definePageMeta({
  title: 'Restaurant Map - Menu Ordering App'
})

const locationStore = useLocationStore()
const router = useRouter()

// Composables
const { getCurrentPosition } = useGeolocation()

// Reactive state
const showFilters = ref(false)
const gettingLocation = ref(false)
const selectedRestaurant = ref<Restaurant | null>(null)

const filters = ref({
  deliveryAvailable: false,
  openNow: false,
  maxDistance: ''
})

// Computed
const userLocation = computed(() => locationStore.userLocation)
const restaurants = computed(() => locationStore.restaurants)

const locationText = computed(() => {
  if (!userLocation.value) return 'Location not available'
  if (userLocation.value.address) return userLocation.value.address
  return `${userLocation.value.latitude.toFixed(4)}, ${userLocation.value.longitude.toFixed(4)}`
})

const filteredRestaurants = computed(() => {
  let filtered = restaurants.value

  if (filters.value.deliveryAvailable) {
    // Filter restaurants that deliver to user location
    filtered = filtered.filter(restaurant => 
      locationStore.checkDeliveryAvailability(userLocation.value!)
    )
  }

  if (filters.value.openNow) {
    filtered = filtered.filter(restaurant => restaurant.isActive)
  }

  if (filters.value.maxDistance && userLocation.value) {
    const maxDist = parseFloat(filters.value.maxDistance)
    filtered = filtered.filter(restaurant => {
      // Calculate distance (simplified)
      const distance = calculateDistance(
        userLocation.value!,
        restaurant.location
      )
      return distance <= maxDist
    })
  }

  return filtered
})

// Methods
const getCurrentLocation = async () => {
  gettingLocation.value = true
  try {
    const position = await getCurrentPosition()
    await locationStore.getCurrentLocation()
  } catch (error) {
    console.error('Failed to get location:', error)
  } finally {
    gettingLocation.value = false
  }
}

const findNearestRestaurant = async () => {
  if (!userLocation.value) return
  
  const nearest = await locationStore.findNearestRestaurants()
  if (nearest.length > 0) {
    selectedRestaurant.value = nearest[0] || null
  }
}

const selectRestaurant = (restaurant: Restaurant) => {
  selectedRestaurant.value = restaurant
  locationStore.selectRestaurant(restaurant.id)
}

const orderFromRestaurant = () => {
  if (selectedRestaurant.value) {
    router.push('/menu')
  }
}

const calculateDistance = (pos1: { latitude: number; longitude: number }, pos2: { latitude: number; longitude: number }) => {
  // Simplified distance calculation (Haversine formula would be more accurate)
  const R = 6371 // Earth's radius in km
  const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180
  const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Initialize
onMounted(async () => {
  // Get user location
  await getCurrentLocation()
  
  // Fetch restaurants
  await locationStore.findNearestRestaurants()
})
</script>