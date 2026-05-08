<template>
  <div class="register-page">
    <!-- Background Elements -->
    <div class="register-page__bg-blob register-page__bg-blob--1" />
    <div class="register-page__bg-blob register-page__bg-blob--2" />

    <div class="register-page__container">
      <!-- Back Navigation -->
      <nav class="register-page__nav">
        <BaseButton variant="ghost" size="sm" icon="arrow-left" @click="router.push('/')">
          {{ t('common.back') }}
        </BaseButton>
      </nav>

      <main class="register-page__card">
        <header class="register-page__header">
          <h1 class="register-page__title">{{ t('auth.register.title') }}</h1>
          <p class="register-page__subtitle">
            {{ t('auth.register.hasAccount') }}
            <NuxtLink to="/auth/login" class="register-page__link">{{ t('auth.register.login') }}</NuxtLink>
          </p>
        </header>

        <form class="register-page__form" @submit.prevent="handleRegister">
          <div class="register-page__form-grid">
            <BaseInput
              v-model="form.firstName"
              :label="t('auth.register.firstName')"
              placeholder="Иван"
              required
              :error="errors.firstName"
              autocomplete="given-name"
              class="register-page__input"
            />

            <BaseInput
              v-model="form.lastName"
              :label="t('auth.register.lastName')"
              placeholder="Иванов"
              required
              :error="errors.lastName"
              autocomplete="family-name"
              class="register-page__input"
            />
          </div>

          <BaseInput
            v-model="form.email"
            :label="t('auth.login.emailLabel')"
            type="email"
            placeholder="example@mail.com"
            required
            :error="errors.email"
            autocomplete="email"
            prefix-icon="mail"
            class="register-page__input"
          />

          <BaseInput
            v-model="form.phone"
            :label="t('auth.register.phone')"
            type="tel"
            placeholder="+7 (999) 123-4567"
            :error="errors.phone"
            autocomplete="tel"
            prefix-icon="phone"
            class="register-page__input"
          />

          <div class="register-page__form-grid">
            <BaseInput
              v-model="form.password"
              :label="t('auth.register.password')"
              type="password"
              placeholder="••••••••"
              required
              show-password-toggle
              :error="errors.password"
              autocomplete="new-password"
              prefix-icon="lock"
              class="register-page__input"
            />

            <BaseInput
              v-model="form.confirmPassword"
              :label="t('auth.register.confirmPassword')"
              type="password"
              placeholder="••••••••"
              required
              show-password-toggle
              :error="errors.confirmPassword"
              autocomplete="new-password"
              prefix-icon="check-circle"
              class="register-page__input"
            />
          </div>

          <div class="register-page__checkbox-container">
            <BaseCheckbox
              v-model="form.agreeTerms"
              required
              :error="error && !form.agreeTerms ? t('auth.register.agreeTermsError') : ''"
            >
              {{ t('auth.register.agreeTerms') }}
            </BaseCheckbox>
          </div>

          <!-- Error Message -->
          <Transition name="fade">
            <div v-if="error" class="register-page__error">
              <BaseIcon name="alert-circle" size="sm" />
              <span>{{ error }}</span>
            </div>
          </Transition>

          <div class="register-page__actions">
            <BaseButton
              type="submit"
              variant="primary"
              full-width
              :loading="isLoading"
              :disabled="!form.agreeTerms"
            >
              {{ isLoading ? t('common.loading') : t('auth.register.submit') }}
            </BaseButton>
          </div>
        </form>
      </main>

      <BrandingFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useI18n } from 'vue-i18n'
import BrandingFooter from '~/components/layout/BrandingFooter.vue'

// Meta
definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const authStore = useUserStore()
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
    errors.firstName = t('auth.register.firstNameRequired')
    isValid = false
  } else if (form.firstName.trim().length < 2) {
    errors.firstName = t('auth.register.firstNameRequired')
    isValid = false
  }

  // Last name validation
  if (!form.lastName.trim()) {
    errors.lastName = t('auth.register.lastNameRequired')
    isValid = false
  } else if (form.lastName.trim().length < 2) {
    errors.lastName = t('auth.register.lastNameRequired')
    isValid = false
  }

  // Email validation
  if (!form.email) {
    errors.email = t('auth.login.emailRequired')
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = t('auth.login.emailInvalid')
    isValid = false
  }

  // Phone validation (optional)
  if (form.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(form.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.phone = t('auth.login.emailInvalid') // Reuse invalid error or add phoneInvalid
    isValid = false
  }

  // Password validation
  if (!form.password) {
    errors.password = t('auth.login.passwordRequired')
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = t('auth.register.passwordMin')
    isValid = false
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = t('auth.register.passwordComplex')
    isValid = false
  }

  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = t('auth.register.passwordsDontMatch')
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = t('auth.register.passwordsDontMatch')
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
    error.value = err.message || t('auth.register.error')
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

.register-page {
  min-height: calc(100vh - 64px); // Adjust for header
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  position: relative;
  overflow: hidden;
  padding: $space-4;
}

.register-page__bg-blob {
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

.register-page__container {
  width: 100%;
  max-width: 540px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.register-page__nav {
  display: flex;
  justify-content: flex-start;
  margin-top: $space-4;
}

.register-page__card {
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

.register-page__header {
  text-align: center;
  margin-bottom: $space-8;
}

.register-page__title {
  font-family: $font-secondary;
  font-size: $text-3xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.register-page__subtitle {
  color: var(--text-secondary);
  font-size: $text-sm;
}

.register-page__link {
  color: var(--color-primary);
  font-weight: $font-semibold;
  text-decoration: none;
  transition: $transition-base-ease;

  &:hover {
    color: var(--color-primary-dark);
    text-decoration: underline;
  }
}

.register-page__form {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.register-page__form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
}

.register-page__checkbox-container {
  margin-top: $space-2;
}

.register-page__error {
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

.register-page__actions {
  margin-top: $space-4;
}

// Footer styles moved to BrandingFooter component

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Deep overrides for glassmorphism inputs
.register-page__input {
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

// Accessibility
@media (prefers-reduced-motion: reduce) {
  .register-page__card:hover {
    transform: none;
  }
}
</style>
