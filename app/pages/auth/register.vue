<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Создать аккаунт
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Или
          <NuxtLink to="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            войдите в существующий аккаунт
          </NuxtLink>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700">Имя</label>
              <input
                id="firstName"
                v-model="form.firstName"
                name="firstName"
                type="text"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :class="{ 'border-red-300': errors.firstName }"
                placeholder="Имя"
              />
              <p v-if="errors.firstName" class="mt-1 text-sm text-red-600">{{ errors.firstName }}</p>
            </div>
            
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700">Фамилия</label>
              <input
                id="lastName"
                v-model="form.lastName"
                name="lastName"
                type="text"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :class="{ 'border-red-300': errors.lastName }"
                placeholder="Фамилия"
              />
              <p v-if="errors.lastName" class="mt-1 text-sm text-red-600">{{ errors.lastName }}</p>
            </div>
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email адрес</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-300': errors.email }"
              placeholder="Email адрес"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
          </div>
          
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">Телефон (необязательно)</label>
            <input
              id="phone"
              v-model="form.phone"
              name="phone"
              type="tel"
              autocomplete="tel"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-300': errors.phone }"
              placeholder="+7 (999) 123-45-67"
            />
            <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Пароль</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-300': errors.password }"
              placeholder="Пароль"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-300': errors.confirmPassword }"
              placeholder="Подтвердите пароль"
            />
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="agree-terms"
            v-model="form.agreeTerms"
            name="agree-terms"
            type="checkbox"
            required
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="agree-terms" class="ml-2 block text-sm text-gray-900">
            Я согласен с 
            <a href="#" class="text-indigo-600 hover:text-indigo-500">условиями использования</a>
            и 
            <a href="#" class="text-indigo-600 hover:text-indigo-500">политикой конфиденциальности</a>
          </label>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !form.agreeTerms"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </span>
            {{ isLoading ? 'Создание аккаунта...' : 'Создать аккаунт' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Composables
const authStore = useAuthStore()
const router = useRouter()

// Reactive data
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')
const isLoading = ref(false)

// Methods
const validateForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
  
  // First name validation
  if (!form.firstName.trim()) {
    errors.firstName = 'Имя обязательно'
    isValid = false
  } else if (form.firstName.trim().length < 2) {
    errors.firstName = 'Имя должно содержать минимум 2 символа'
    isValid = false
  }
  
  // Last name validation
  if (!form.lastName.trim()) {
    errors.lastName = 'Фамилия обязательна'
    isValid = false
  } else if (form.lastName.trim().length < 2) {
    errors.lastName = 'Фамилия должна содержать минимум 2 символа'
    isValid = false
  }
  
  // Email validation
  if (!form.email) {
    errors.email = 'Email обязателен'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Введите корректный email'
    isValid = false
  }
  
  // Phone validation (optional)
  if (form.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(form.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.phone = 'Введите корректный номер телефона'
    isValid = false
  }
  
  // Password validation
  if (!form.password) {
    errors.password = 'Пароль обязателен'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Пароль должен содержать минимум 8 символов'
    isValid = false
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = 'Пароль должен содержать строчные и заглавные буквы, а также цифры'
    isValid = false
  }
  
  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Подтверждение пароля обязательно'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Пароли не совпадают'
    isValid = false
  }
  
  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    await authStore.register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined
    })
    
    // Redirect to home page after successful registration
    await router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Произошла ошибка при регистрации'
  } finally {
    isLoading.value = false
  }
}

// Auto-focus first name field
onMounted(() => {
  const firstNameInput = document.getElementById('firstName')
  if (firstNameInput) {
    firstNameInput.focus()
  }
})
</script>