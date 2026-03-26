<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <div class="auth-header__back">
          <BaseButton
            variant="ghost"
            size="sm"
            class="auth-header__back-btn"
            @click="router.push('/')"
          >
            <BaseIcon name="arrow-left" size="sm" />
            Back to Home
          </BaseButton>
        </div>
        <h2 class="auth-header__title">Создать аккаунт</h2>
        <p class="auth-header__subtitle">
          Или
          <NuxtLink to="/auth/login" class="auth-header__link">
            войдите в существующий аккаунт
          </NuxtLink>
        </p>
      </div>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="auth-form__fields">
          <!-- Name Row -->
          <div class="auth-form__row">
            <div class="auth-form__field">
              <label for="firstName" class="auth-form__label">Имя</label>
              <input
                id="firstName"
                v-model="form.firstName"
                name="firstName"
                type="text"
                required
                class="auth-form__input"
                :class="{ 'auth-form__input--error': errors.firstName }"
                placeholder="Имя"
                autocomplete="given-name"
              />
              <p v-if="errors.firstName" class="auth-form__error-text">{{ errors.firstName }}</p>
            </div>

            <div class="auth-form__field">
              <label for="lastName" class="auth-form__label">Фамилия</label>
              <input
                id="lastName"
                v-model="form.lastName"
                name="lastName"
                type="text"
                required
                class="auth-form__input"
                :class="{ 'auth-form__input--error': errors.lastName }"
                placeholder="Фамилия"
                autocomplete="family-name"
              />
              <p v-if="errors.lastName" class="auth-form__error-text">{{ errors.lastName }}</p>
            </div>
          </div>

          <div class="auth-form__field">
            <label for="email" class="auth-form__label">Email адрес</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="auth-form__input"
              :class="{ 'auth-form__input--error': errors.email }"
              placeholder="Email адрес"
            />
            <p v-if="errors.email" class="auth-form__error-text">{{ errors.email }}</p>
          </div>

          <div class="auth-form__field">
            <label for="phone" class="auth-form__label">Телефон (необязательно)</label>
            <input
              id="phone"
              v-model="form.phone"
              name="phone"
              type="tel"
              autocomplete="tel"
              class="auth-form__input"
              :class="{ 'auth-form__input--error': errors.phone }"
              placeholder="+996 555 123 456"
            />
            <p v-if="errors.phone" class="auth-form__error-text">{{ errors.phone }}</p>
          </div>

          <div class="auth-form__field">
            <label for="password" class="auth-form__label">Пароль</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="auth-form__input"
              :class="{ 'auth-form__input--error': errors.password }"
              placeholder="Пароль"
            />
            <p v-if="errors.password" class="auth-form__error-text">{{ errors.password }}</p>
          </div>

          <div class="auth-form__field">
            <label for="confirmPassword" class="auth-form__label">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="auth-form__input"
              :class="{ 'auth-form__input--error': errors.confirmPassword }"
              placeholder="Подтвердите пароль"
            />
            <p v-if="errors.confirmPassword" class="auth-form__error-text">
              {{ errors.confirmPassword }}
            </p>
          </div>
        </div>

        <div class="auth-form__options">
          <div class="auth-form__checkbox-group">
            <input
              id="agree-terms"
              v-model="form.agreeTerms"
              name="agree-terms"
              type="checkbox"
              required
              class="auth-form__checkbox"
            />
            <label for="agree-terms" class="auth-form__checkbox-label">
              Я согласен с
              <a href="#" class="auth-form__link">условиями использования</a>
              и
              <a href="#" class="auth-form__link">политикой конфиденциальности</a>
            </label>
          </div>
        </div>

        <div v-if="error" class="auth-form__error-alert">
          <div class="auth-form__error-content">
            <BaseIcon name="alert-circle" size="sm" class="auth-form__error-icon" />
            <span class="auth-form__error-message">{{ error }}</span>
          </div>
        </div>

        <div class="auth-form__submit">
          <BaseButton
            type="submit"
            :disabled="isLoading || !form.agreeTerms"
            :loading="isLoading"
            class="auth-form__submit-btn"
            variant="primary"
            full-width
          >
            Создать аккаунт
          </BaseButton>
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
  middleware: 'guest',
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
  agreeTerms: false,
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
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
  if (form.phone && !/^[+]?[0-9\s-]{7,15}$/.test(form.phone)) {
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
      phone: form.phone || undefined,
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

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/typography' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6 $space-4;
  background-color: var(--bg-secondary); // Dark background

  @media (min-width: 640px) {
    padding: $space-12 $space-6;
  }
}

.auth-container {
  width: 100%;
  max-width: 480px; // Slightly wider for grid
  background-color: var(--bg-primary); // Card background
  padding: $space-8;
  border-radius: $radius-xl;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-primary);
}

.auth-header {
  text-align: center;
  margin-bottom: $space-8;

  &__back {
    margin-bottom: $space-4;
    display: flex;
    justify-content: flex-start;
  }

  &__back-btn {
    padding-left: 0;
    gap: $space-2;
    color: var(--text-secondary);
  }
  // ...
  &__title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: $space-2;
  }
}
// ...
.auth-form {
  &__fields {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-4;

    @media (min-width: 500px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }
  // ...
  &__options {
    margin-top: $space-6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__checkbox-group {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
  }
  // ...
  &__error-alert {
    margin-top: $space-6;
    padding: $space-3;
    background-color: rgba(var(--color-error-rgb), 0.1);
    border-radius: $radius-md;
    border: 1px solid rgba(var(--color-error-rgb), 0.2);
  }

  &__error-content {
    display: flex;
    align-items: center;
    gap: $space-2;
    color: var(--color-error);
    font-size: 14px;
  }

  &__submit {
    margin-top: $space-6;
  }

  &__submit-btn {
    width: 100%;
  }
}
</style>