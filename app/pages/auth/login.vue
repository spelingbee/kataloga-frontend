<template>
  <div class="auth-page">
    <!-- Background Elements -->
    <div class="auth-page__bg-blob auth-page__bg-blob--1"/>
    <div class="auth-page__bg-blob auth-page__bg-blob--2"/>
    
    <div class="auth-page__container">
      <!-- Back Navigation -->
      <nav class="auth-page__nav">
        <BaseButton
          variant="ghost"
          size="sm"
          icon="arrow-left"
          @click="router.push('/')"
        >
          На главную
        </BaseButton>
      </nav>

      <main class="auth-page__card">
        <header class="auth-page__header">
          <h1 class="auth-page__title">Войти в аккаунт</h1>
          <p class="auth-page__subtitle">
            Нет аккаунта? 
            <NuxtLink to="/auth/register" class="auth-page__link">Создать новый</NuxtLink>
          </p>
        </header>
        
        <form class="auth-page__form" @submit.prevent="handleLogin">
          <BaseInput
            v-model="form.email"
            label="Email адрес"
            type="email"
            placeholder="example@mail.com"
            required
            :error="errors.email"
            autocomplete="email"
            prefix-icon="mail"
            class="auth-page__input"
          />
          
          <BaseInput
            v-model="form.password"
            label="Пароль"
            type="password"
            placeholder="••••••••"
            required
            show-password-toggle
            :error="errors.password"
            autocomplete="current-password"
            prefix-icon="lock"
            class="auth-page__input"
          />

          <div class="auth-page__form-options">
            <BaseCheckbox v-model="form.rememberMe">
              Запомнить меня
            </BaseCheckbox>

            <NuxtLink to="/auth/forgot-password" class="auth-page__link auth-page__link--small">
              Забыли пароль?
            </NuxtLink>
          </div>

          <!-- Error Message -->
          <Transition name="fade">
            <div v-if="error" class="auth-page__error">
              <BaseIcon name="alert-circle" size="sm" />
              <span>{{ error }}</span>
            </div>
          </Transition>

          <div class="auth-page__actions">
            <BaseButton
              type="submit"
              variant="primary"
              full-width
              :loading="isLoading"
            >
              {{ isLoading ? 'Вход...' : 'Войти' }}
            </BaseButton>
          </div>
        </form>
      </main>
      
      <footer class="auth-page__footer">
        © {{ new Date().getFullYear() }} Kataloga. Все права защищены.
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Composables
const authStore = useUserStore()
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
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  position: relative;
  overflow: hidden;
  padding: $space-4;
}

.auth-page__bg-blob {
  position: absolute;
  width: 500px;
  height: 500px;
  filter: blur(80px);
  opacity: 0.15;
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
  
  &--1 {
    background: var(--color-primary);
    top: -100px;
    right: -100px;
  }
  
  &--2 {
    background: var(--color-secondary);
    bottom: -100px;
    left: -100px;
  }
}

.auth-page__container {
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.auth-page__nav {
  display: flex;
  justify-content: flex-start;
}

.auth-page__card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: $radius-xl;
  padding: $space-8;
  box-shadow: $shadow-xl;
  transition: $transition-base-ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-xl;
  }
}

.auth-page__header {
  text-align: center;
  margin-bottom: $space-8;
}

.auth-page__title {
  font-family: $font-secondary;
  font-size: $text-3xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.auth-page__subtitle {
  color: var(--text-secondary);
  font-size: $text-sm;
}

.auth-page__link {
  color: var(--color-primary);
  font-weight: $font-semibold;
  text-decoration: none;
  transition: $transition-base-ease;
  
  &:hover {
    color: var(--color-primary-dark);
    text-decoration: underline;
  }

  &--small {
    font-size: $text-sm;
  }
}

.auth-page__form {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.auth-page__form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -$space-2;
}

.auth-page__error {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  background: rgba(var(--color-error-rgb), 0.1);
  border: 1px solid var(--color-error);
  border-radius: $radius-md;
  color: var(--color-error);
  font-size: $text-sm;
  font-weight: $font-medium;
}

.auth-page__actions {
  margin-top: $space-2;
}

.auth-page__footer {
  text-align: center;
  font-size: $text-xs;
  color: var(--text-tertiary);
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Deep overrides for glassmorphism
.auth-page__input {
  :deep(.base-input__field) {
    background: rgba(255, 255, 255, 0.45);
    border-color: rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(12px);
    color: #1a1a1a;
    
    &::placeholder {
      color: rgba(0, 0, 0, 0.45) !important;
    }
    
    &:focus {
      background: rgba(255, 255, 255, 0.6);
      border-color: var(--color-primary);
    }
  }

  :deep(.base-input__prefix),
  :deep(.base-input__suffix) {
    color: rgba(0, 0, 0, 0.6) !important;
  }

  :deep(.base-input__floating-label--active)::before {
    background-color: rgba(255, 255, 255, 0.9);
    height: 4px;
    border-radius: 2px;
  }
}

@media (max-width: 480px) {
  .auth-page__card {
    padding: $space-6 $space-5;
  }
}
</style>
