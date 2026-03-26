<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-4">
        <BaseIcon name="repeat" size="lg" class="text-primary-green" />
        <AppHeading level="h1" size="display-md" class="text-white">
          Repeat Order
        </AppHeading>
      </div>
      <AppText size="body-lg" class="text-neutral-20">
        Quickly reorder from your previous orders
      </AppText>
    </div>

    <!-- Quick Reorder Section -->
    <div class="px-6 mb-8">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        Recent Orders
      </AppHeading>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="order in recentOrders"
          :key="order.id"
          class="bg-background-card rounded-xl p-6 hover:bg-background-card/80 transition-colors cursor-pointer group"
          @click="selectOrder(order)"
        >
          <!-- Order Header -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <AppText size="body-sm" class="text-neutral-20 mb-1">
                Order #{{ order.id }}
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                {{ formatDate(order.createdAt) }}
              </AppText>
            </div>
            <StatusBadge :status="order.status" size="sm" />
          </div>

          <!-- Order Items Preview -->
          <div class="mb-4">
            <div class="space-y-2">
              <div
                v-for="item in order.items.slice(0, 3)"
                :key="item.id"
                class="flex items-center justify-between"
              >
                <AppText size="body-sm" class="text-white">
                  {{ item.quantity }}× {{ item.menuItem.name }}
                </AppText>
                <AppText size="body-sm" class="text-neutral-20">
                  {{ formatPrice(item.subtotal) }}
                </AppText>
              </div>
              <div v-if="order.items.length > 3" class="text-center">
                <AppText size="caption" class="text-neutral-20">
                  +{{ order.items.length - 3 }} more items
                </AppText>
              </div>
            </div>
          </div>

          <!-- Order Total -->
          <div class="flex items-center justify-between mb-4 pt-4 border-t border-neutral-80/20">
            <AppText size="body-md" class="text-white font-medium">
              Total
            </AppText>
            <AppPrice :price="order.total" size="md" />
          </div>

          <!-- Reorder Button -->
          <BaseButton 
            variant="primary"
            size="sm"
            class="w-full group-hover:scale-105 transition-transform"
            @click.stop="reorderExact(order)"
          >
            <BaseIcon name="repeat" size="sm" class="mr-2" />
            Reorder Exact
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Favorite Combinations -->
    <div class="px-6 mb-8">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        Favorite Combinations
      </AppHeading>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="combo in favoriteCombos"
          :key="combo.id"
          class="bg-background-card rounded-xl p-6"
        >
          <div class="flex items-start gap-4 mb-4">
            <div class="w-12 h-12 bg-primary-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
              <BaseIcon name="star" size="md" class="text-primary-orange" />
            </div>
            <div class="flex-1">
              <AppHeading level="h3" size="heading-md" class="text-white mb-2">
                {{ combo.name }}
              </AppHeading>
              <AppText size="body-sm" class="text-neutral-20 mb-3">
                Ordered {{ combo.orderCount }} times
              </AppText>
              <div class="space-y-1">
                <AppText
                  v-for="item in combo.items"
                  :key="item.id"
                  size="body-sm"
                  class="text-white"
                >
                  {{ item.quantity }}× {{ item.name }}
                </AppText>
              </div>
            </div>
            <div class="text-right">
              <AppPrice :price="combo.totalPrice" size="lg" />
              <AppText size="caption" class="text-neutral-20 mt-1">
                Avg. price
              </AppText>
            </div>
          </div>
          
          <BaseButton 
            variant="secondary"
            size="sm"
            class="w-full"
            @click="reorderCombo(combo)"
          >
            <BaseIcon name="plus" size="sm" class="mr-2" />
            Add to Cart
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Custom Reorder -->
    <div v-if="selectedOrder" class="px-6 mb-8">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        Customize Your Reorder
      </AppHeading>
      
      <div class="bg-background-card rounded-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <AppHeading level="h3" size="heading-md" class="text-white mb-1">
              Order #{{ selectedOrder.id }}
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20">
              {{ formatDate(selectedOrder.createdAt) }}
            </AppText>
          </div>
          <BaseButton 
            variant="ghost" 
            size="sm"
            @click="clearSelection"
          >
            <BaseIcon name="x" size="sm" />
          </BaseButton>
        </div>

        <!-- Customizable Items -->
        <div class="space-y-4 mb-6">
          <div
            v-for="(item, index) in customizableItems"
            :key="item.id"
            class="flex items-center gap-4 p-4 bg-neutral-80/10 rounded-lg"
          >
            <!-- Item Info -->
            <div class="flex-1">
              <AppHeading level="h4" size="heading-sm" class="text-white mb-1">
                {{ item.menuItem.name }}
              </AppHeading>
              <AppText size="body-sm" class="text-neutral-20 mb-2">
                {{ item.menuItem.description }}
              </AppText>
              <AppPrice :price="item.price" size="sm" />
            </div>

            <!-- Quantity Controls -->
            <div class="flex items-center gap-3">
              <BaseButton
                variant="ghost"
                size="sm"
                :disabled="item.quantity <= 0"
                @click="decreaseQuantity(index)"
              >
                <BaseIcon name="minus" size="sm" />
              </BaseButton>
              
              <AppText size="body-md" class="text-white font-semibold min-w-8 text-center">
                {{ item.quantity }}
              </AppText>
              
              <BaseButton
                variant="ghost"
                size="sm"
                @click="increaseQuantity(index)"
              >
                <BaseIcon name="plus" size="sm" />
              </BaseButton>
            </div>

            <!-- Remove Item -->
            <BaseButton
              variant="ghost"
              size="sm"
              class="text-primary-red hover:text-primary-red/80"
              @click="removeItem(index)"
            >
              <BaseIcon name="trash" size="sm" />
            </BaseButton>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="border-t border-neutral-80/20 pt-4 mb-6">
          <div class="flex items-center justify-between mb-2">
            <AppText class="text-neutral-20">Items ({{ totalItems }})</AppText>
            <AppText class="text-white">{{ formatPrice(subtotal) }}</AppText>
          </div>
          <div class="flex items-center justify-between mb-2">
            <AppText class="text-neutral-20">Delivery Fee</AppText>
            <AppText class="text-white">{{ formatPrice(deliveryFee) }}</AppText>
          </div>
          <div class="flex items-center justify-between mb-2">
            <AppText class="text-neutral-20">Tax</AppText>
            <AppText class="text-white">{{ formatPrice(tax) }}</AppText>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-neutral-80/20">
            <AppText size="body-lg" class="text-white font-semibold">Total</AppText>
            <AppPrice :price="customTotal" size="lg" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <BaseButton 
            variant="primary"
            class="flex-1"
            :disabled="totalItems === 0"
            @click="addCustomOrderToCart"
          >
            <BaseIcon name="shopping-cart" size="sm" class="mr-2" />
            Add to Cart ({{ formatPrice(customTotal) }})
          </BaseButton>
          <BaseButton 
            variant="secondary"
            @click="resetCustomization"
          >
            <BaseIcon name="refresh-cw" size="sm" class="mr-2" />
            Reset
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Suggestions -->
    <div class="px-6 mb-8">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        You Might Also Like
      </AppHeading>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="bg-background-card rounded-xl p-4 text-center hover:bg-background-card/80 transition-colors cursor-pointer"
          @click="addSuggestionToCart(suggestion)"
        >
          <div class="w-16 h-16 bg-neutral-80/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <BaseIcon name="utensils" size="lg" class="text-neutral-80" />
          </div>
          
          <AppHeading level="h4" size="heading-sm" class="text-white mb-2">
            {{ suggestion.name }}
          </AppHeading>
          
          <AppPrice :price="suggestion.price" size="md" class="mb-3" />
          
          <BaseButton variant="ghost" size="sm" class="w-full">
            <BaseIcon name="plus" size="sm" class="mr-2" />
            Add
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-6 py-8 border-t border-neutral-80/20">
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink to="/menu">
          <BaseButton variant="secondary">
            <BaseIcon name="search" size="sm" class="mr-2" />
            Browse Full Menu
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/favourites">
          <BaseButton variant="ghost">
            <BaseIcon name="heart" size="sm" class="mr-2" />
            View Favourites
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/orders">
          <BaseButton variant="ghost">
            <BaseIcon name="receipt" size="sm" class="mr-2" />
            Order History
          </BaseButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { OrderUI, MenuItemUI, OrderItemUI } from '~/types'
import { createMenuItemUI } from '~/types/utils/converters'

// Stores
import { useOrderStore } from '~/stores/order'
import { useCartStore } from '~/stores/cart'
import { OrderStatus } from '~/types'
import AppHeading from '../../components/base/AppHeading.vue'
import AppText from '../../components/base/AppText.vue'
import StatusBadge from '../../components/order/StatusBadge.vue'
import AppPrice from '../../components/base/AppPrice.vue'

// Page setup
definePageMeta({
  title: 'Repeat Order - Menu Ordering App'
})

const orderStore = useOrderStore()
const cartStore = useCartStore()
const router = useRouter()

// Reactive state
const selectedOrder = ref<OrderUI | null>(null)
const customizableItems = ref<OrderItemUI[]>([])

// Mock data
const recentOrders = ref<OrderUI[]>([
  {
    id: '12345',
    orderNumber: 'ORD-12345',
    status: OrderStatus.DELIVERED,
    total: 23.47,
    customerId: 'customer-123',
    orderType: 'delivery' as const,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    estimatedTime: 25,
    deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
    subtotal: 20.98,
    deliveryFee: 2.99,
    discount: 0,
    tax: 1.68,
    customerInfo: { name: 'John Doe', phone: '+1234567890' },
    items: [
      {
        id: '1',
        menuItemId: '1',
        menuItem: createMenuItemUI({
          id: '1',
          name: 'Delicious Burger',
          description: 'Tasty burger',
          price: 15.99,
          imageUrl: undefined,
          categoryId: 'fastfood',
          menuId: 'default-menu',
          isActive: true,
          isAvailable: true,
          stockQuantity: 100,
          calories: null,
          preparationTime: null,
          cookingTime: null,
          ingredients: [],
          allergens: [],
          nutritionInfo: null,
          dietary: [],
          badges: [],
          modifierGroups: [],
          isNew: false,
          isPopular: false,
          category: null
        }),
        quantity: 1,
        price: 15.99,
        subtotal: 15.99,
        customizations: null,
        selectedModifiers: []
      },
      {
        id: '2',
        menuItemId: '2',
        menuItem: createMenuItemUI({
          id: '2',
          name: 'Crispy Fries',
          description: 'Golden fries',
          price: 4.99,
          imageUrl: undefined,
          categoryId: 'fastfood',
          menuId: 'default-menu',
          isActive: true,
          isAvailable: true,
          stockQuantity: 100,
          calories: null,
          preparationTime: null,
          cookingTime: null,
          ingredients: [],
          allergens: [],
          nutritionInfo: null,
          dietary: [],
          badges: [],
          modifierGroups: [],
          isNew: false,
          isPopular: false,
          category: null
        }),
        quantity: 1,
        price: 4.99,
        subtotal: 4.99,
        customizations: null,
        selectedModifiers: []
      }
    ]
  },
  {
    id: '12344',
    orderNumber: 'ORD-12344',
    status: OrderStatus.DELIVERED,
    total: 18.99,
    customerId: 'customer-123',
    orderType: 'delivery' as const,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    estimatedTime: 25,
    deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
    subtotal: 18.98,
    deliveryFee: 2.99,
    discount: 0,
    tax: 1.52,
    customerInfo: { name: 'John Doe', phone: '+1234567890' },
    items: [
      {
        id: '3',
        menuItemId: '3',
        menuItem: createMenuItemUI({
          id: '3',
          name: 'Caesar Salad',
          description: 'Fresh salad',
          price: 12.99,
          imageUrl: undefined,
          categoryId: 'salads',
          menuId: 'default-menu',
          isActive: true,
          isAvailable: true,
          stockQuantity: 100,
          calories: null,
          preparationTime: null,
          cookingTime: null,
          ingredients: [],
          allergens: [],
          nutritionInfo: null,
          dietary: [],
          badges: [],
          modifierGroups: [],
          isNew: false,
          isPopular: false,
          category: null
        }),
        quantity: 1,
        price: 12.99,
        subtotal: 12.99,
        customizations: null,
        selectedModifiers: []
      },
      {
        id: '4',
        menuItemId: '4',
        menuItem: createMenuItemUI({
          id: '4',
          name: 'Garlic Bread',
          description: 'Crispy bread',
          price: 5.99,
          imageUrl: undefined,
          categoryId: 'appetizers',
          menuId: 'default-menu',
          isActive: true,
          isAvailable: true,
          stockQuantity: 100,
          calories: null,
          preparationTime: null,
          cookingTime: null,
          ingredients: [],
          allergens: [],
          nutritionInfo: null,
          dietary: [],
          badges: [],
          modifierGroups: [],
          isNew: false,
          isPopular: false,
          category: null
        }),
        quantity: 1,
        price: 5.99,
        subtotal: 5.99,
        customizations: null,
        selectedModifiers: []
      }
    ]
  }
])

const favoriteCombos = ref([
  {
    id: '1',
    name: 'The Classic',
    orderCount: 8,
    totalPrice: 21.98,
    items: [
      { id: '1', name: 'Delicious Burger', quantity: 1 },
      { id: '2', name: 'Crispy Fries', quantity: 1 },
      { id: '3', name: 'Soft Drink', quantity: 1 }
    ]
  },
  {
    id: '2',
    name: 'Healthy Choice',
    orderCount: 5,
    totalPrice: 16.98,
    items: [
      { id: '4', name: 'Caesar Salad', quantity: 1 },
      { id: '5', name: 'Grilled Chicken', quantity: 1 },
      { id: '6', name: 'Sparkling Water', quantity: 1 }
    ]
  }
])

const suggestions = ref<MenuItemUI[]>([
  createMenuItemUI({
    id: '7',
    name: 'Chocolate Cake',
    description: 'Rich dessert',
    price: 6.99,
    imageUrl: undefined,
    categoryId: 'desserts',
    menuId: 'default-menu',
    isActive: true,
    isAvailable: true,
    stockQuantity: 100,
    calories: null,
    preparationTime: null,
    cookingTime: null,
    ingredients: [],
    allergens: [],
    nutritionInfo: null,
    dietary: [],
    badges: [],
    modifierGroups: [],
    isNew: false,
    isPopular: false,
    category: null
  }),
  createMenuItemUI({
    id: '8',
    name: 'Ice Cream',
    description: 'Vanilla ice cream',
    price: 4.99,
    imageUrl: undefined,
    categoryId: 'desserts',
    menuId: 'default-menu',
    isActive: true,
    isAvailable: true,
    stockQuantity: 100,
    calories: null,
    preparationTime: null,
    cookingTime: null,
    ingredients: [],
    allergens: [],
    nutritionInfo: null,
    dietary: [],
    badges: [],
    modifierGroups: [],
    isNew: false,
    isPopular: false,
    category: null
  }),
  createMenuItemUI({
    id: '9',
    name: 'Coffee',
    description: 'Fresh coffee',
    price: 2.99,
    imageUrl: undefined,
    categoryId: 'drinks',
    menuId: 'default-menu',
    isActive: true,
    isAvailable: true,
    stockQuantity: 100,
    calories: null,
    preparationTime: null,
    cookingTime: null,
    ingredients: [],
    allergens: [],
    nutritionInfo: null,
    dietary: [],
    badges: [],
    modifierGroups: [],
    isNew: false,
    isPopular: false,
    category: null
  }),
  createMenuItemUI({
    id: '10',
    name: 'Smoothie',
    description: 'Fruit smoothie',
    price: 5.99,
    imageUrl: undefined,
    categoryId: 'drinks',
    menuId: 'default-menu',
    isActive: true,
    isAvailable: true,
    stockQuantity: 100,
    calories: null,
    preparationTime: null,
    cookingTime: null,
    ingredients: [],
    allergens: [],
    nutritionInfo: null,
    dietary: [],
    badges: [],
    modifierGroups: [],
    isNew: false,
    isPopular: false,
    category: null
  })
])

// Computed
const totalItems = computed(() => {
  return customizableItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const subtotal = computed(() => {
  return customizableItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const deliveryFee = computed(() => 2.99)
const tax = computed(() => subtotal.value * 0.08)
const customTotal = computed(() => subtotal.value + deliveryFee.value + tax.value)

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

const selectOrder = (order: OrderUI) => {
  selectedOrder.value = order
  // Create mutable copies of the items
  customizableItems.value = order.items.map(item => ({
    ...item,
    menuItem: { ...item.menuItem },
    selectedModifiers: [...item.selectedModifiers]
  }))
}

const clearSelection = () => {
  selectedOrder.value = null
  customizableItems.value = []
}

const reorderExact = (order: OrderUI) => {
  // Add all items from the order to cart with exact quantities
  order.items.forEach(item => {
    cartStore.addItem(item.menuItem, item.quantity)
  })
  
  router.push('/cart')
}

const reorderCombo = (combo: any) => {
  // Mock adding combo items to cart
  combo.items.forEach((item: any) => {
    const menuItem: MenuItemUI = createMenuItemUI({
      id: item.id,
      name: item.name,
      description: `${item.name} from favorite combo`,
      price: combo.totalPrice / combo.items.length, // Approximate price
      imageUrl: undefined,
      categoryId: 'combo',
      menuId: 'default-menu',
      isActive: true,
      isAvailable: true,
      stockQuantity: 100,
      calories: null,
      preparationTime: null,
      cookingTime: null,
      ingredients: [],
      allergens: [],
      nutritionInfo: null,
      dietary: [],
      badges: [],
      modifierGroups: [],
      isNew: false,
      isPopular: false,
      category: null
    })
    cartStore.addItem(menuItem, item.quantity)
  })
  
  router.push('/cart')
}

const increaseQuantity = (index: number) => {
  const item = customizableItems.value[index]
  if (item) {
    // Create a new object to avoid readonly issues
    customizableItems.value[index] = {
      ...item,
      quantity: item.quantity + 1,
      subtotal: item.price * (item.quantity + 1)
    }
  }
}

const decreaseQuantity = (index: number) => {
  const item = customizableItems.value[index]
  if (item && item.quantity > 0) {
    // Create a new object to avoid readonly issues
    customizableItems.value[index] = {
      ...item,
      quantity: item.quantity - 1,
      subtotal: item.price * (item.quantity - 1)
    }
  }
}

const removeItem = (index: number) => {
  customizableItems.value.splice(index, 1)
}

const resetCustomization = () => {
  if (selectedOrder.value) {
    // Create mutable copies of the items
    customizableItems.value = selectedOrder.value.items.map(item => ({
      ...item,
      menuItem: { ...item.menuItem },
      selectedModifiers: [...item.selectedModifiers]
    }))
  }
}

const addCustomOrderToCart = () => {
  customizableItems.value.forEach(item => {
    if (item.quantity > 0) {
      cartStore.addItem(item.menuItem, item.quantity)
    }
  })
  
  router.push('/cart')
}

const addSuggestionToCart = (item: MenuItemUI) => {
  cartStore.addItem(item, 1)
  // Show brief success message or animation
}

// Initialize
onMounted(() => {
  // Load recent orders
  orderStore.fetchOrderHistory()
})
</script>