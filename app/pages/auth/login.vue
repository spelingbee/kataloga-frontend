<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h2 class="auth-header__title">
          Войти в аккаунт
        </h2>
        <p class="auth-header__subtitle">
          Или
          <NuxtLink to="/auth/register" class="auth-header__link">
            создайте новый аккаунт
          </NuxtLink>
        </p>
      </div>
      
      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="auth-form__fields">
          <div class="auth-form__field">
            <label for="email" class="u-sr-only">Email адрес</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              :class="[
                'auth-form__input auth-form__input--top',
                { 'auth-form__input--error': errors.email }
              ]"
              placeholder="Email адрес"
            >
            <p v-if="errors.email" class="auth-form__error">{{ errors.email }}</p>
          </div>
          
          <div class="auth-form__field">
            <label for="password" class="u-sr-only">Пароль</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              :class="[
                'auth-form__input auth-form__input--bottom',
                { 'auth-form__input--error': errors.password }
              ]"
              placeholder="Пароль"
            >
            <p v-if="errors.password" class="auth-form__error">{{ errors.password }}</p>
          </div>
        </div>

        <div class="auth-form__options">
          <div class="auth-form__checkbox">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              name="remember-me"
              type="checkbox"
              class="auth-form__checkbox-input"
            >
            <label for="remember-me" class="auth-form__checkbox-label">
              Запомнить меня
            </label>
          </div>

          <div class="auth-form__forgot">
            <NuxtLink to="/auth/forgot-password" class="auth-form__forgot-link">
              Забыли пароль?
            </NuxtLink>
          </div>
        </div>

        <div v-if="error" class="auth-form__error-alert">
          <div class="auth-form__error-content">
            <div class="auth-form__error-icon">
              <svg class="u-h-5 u-w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="auth-form__error-message">
              <h3 class="auth-form__error-title">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>

        <div class="auth-form__submit">
          <button
            type="submit"
            :disabled="isLoading"
            class="auth-form__submit-btn"
          >
            <span v-if="isLoading" class="auth-form__submit-spinner">
              <svg class="auth-form__spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="auth-form__spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="auth-form__spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ isLoading ? 'Вход...' : 'Войти' }}
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
const route = useRoute()
const router = useRouter()

// Reactive data
const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

const error = ref('')
const isLoading = ref(false)

// Methods
const validateForm = () => {
  let isValid = true
  
  // Reset errors
  errors.email = ''
  errors.password = ''
  
  // Email validation
  if (!form.email) {
    errors.email = 'Email обязателен'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Введите корректный email'
    isValid = false
  }
  
  // Password validation
  if (!form.password) {
    errors.password = 'Пароль обязателен'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Пароль должен содержать минимум 6 символов'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    await authStore.login({
      email: form.email,
      password: form.password
    })
    
    // Redirect to intended page or home
    const redirectTo = (route.query.redirect as string) || '/'
    await router.push(redirectTo)
  } catch (err: any) {
    error.value = err.message || 'Произошла ошибка при входе'
  } finally {
    isLoading.value = false
  }
}

// Auto-focus email field
onMounted(() => {
  const emailInput = document.getElementById('email')
  if (emailInput) {
    emailInput.focus()
  }
})
</script>