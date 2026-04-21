<template>
  <div class="auth-page">
    <div class="auth-page__bg-blob auth-page__bg-blob--1"/>
    <div class="auth-page__bg-blob auth-page__bg-blob--2"/>
    
    <div class="auth-page__container">
      <main class="auth-page__card">
        <header class="auth-page__header">
          <div class="auth-page__icon-wrapper" :class="{ 'auth-page__icon-wrapper--error': status === 'error' }">
            <BaseIcon :name="iconName" size="xl" />
          </div>
          <h1 class="auth-page__title">{{ title }}</h1>
          <p class="auth-page__subtitle">{{ subtitle }}</p>
        </header>

        <div class="auth-page__content">
          <div v-if="status === 'loading'" class="auth-page__loading">
            <BaseSpinner />
            <p>Проверяем ваш токен...</p>
          </div>

          <div v-if="status === 'success'" class="auth-page__actions">
            <BaseButton
              variant="primary"
              full-width
              @click="handleContinue"
            >
              Перейти к покупкам
            </BaseButton>
          </div>

          <div v-if="status === 'error'" class="auth-page__actions">
            <BaseButton
              variant="outline"
              full-width
              class="u-mb-4"
              @click="handleRetry"
            >
              Вернуться назад
            </BaseButton>
            <BaseButton
              variant="ghost"
              full-width
              @click="handleManualHome"
            >
              На главную
            </BaseButton>
          </div>
        </div>
      </main>
      
      <BrandingFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useTenant } from '~/composables/useTenant'
import BrandingFooter from '~/components/layout/BrandingFooter.vue'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { tPath } = useTenant()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMsg = ref('')

const title = computed(() => {
  if (status.value === 'loading') return 'Верификация...'
  if (status.value === 'success') return 'Email подтвержден!'
  return 'Ошибка верификации'
})

const subtitle = computed(() => {
  if (status.value === 'loading') return 'Пожалуйста, подождите, пока мы проверяем ваш адрес.'
  if (status.value === 'success') return 'Ваш аккаунт успешно активирован. Теперь вы можете пользоваться всеми функциями магазина.'
  return errorMsg.value || 'Токен недействителен или срок его действия истек. Пожалуйста, запросите новую ссылку для подтверждения.'
})

const iconName = computed(() => {
  if (status.value === 'loading') return 'loader'
  if (status.value === 'success') return 'check-circle'
  return 'x-circle'
})

const handleContinue = () => {
  router.push(tPath('/'))
}

const handleRetry = () => {
  router.back()
}

const handleManualHome = () => {
  router.push('/')
}

onMounted(async () => {
  const token = route.query.token as string
  const email = route.query.email as string
  const tenantSlug = route.params.slug as string

  if (!token || !email) {
    status.value = 'error'
    errorMsg.value = 'Отсутствуют необходимые параметры верификации.'
    return
  }

  try {
    await userStore.verifyEmail({ token, email, tenantSlug })
    status.value = 'success'
  } catch (err: any) {
    status.value = 'error'
    errorMsg.value = err.message || 'Не удалось подтвердить email.'
  }
})

definePageMeta({
  layout: false,
  middleware: ['tenant']
})
</script>

<style scoped lang="scss">
@use '../../../assets/scss/tokens/spacing' as *;
@use '../../../assets/scss/tokens/radius' as *;
@use '../../../assets/scss/tokens/shadows' as *;
@use '../../../assets/scss/tokens/typography' as *;

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

.auth-page__card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: $radius-xl;
  padding: $space-8;
  box-shadow: $shadow-xl;
  text-align: center;
}

.auth-page__header {
  margin-bottom: $space-8;
}

.auth-page__icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(var(--color-success-rgb), 0.1);
  color: var(--color-success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto $space-6;
  
  &--error {
    background: rgba(var(--color-error-rgb), 0.1);
    color: var(--color-error);
  }
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
  font-size: $text-base;
  line-height: 1.5;
}

.auth-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  color: var(--text-secondary);
}

// Footer styles moved to BrandingFooter component

.u-mb-4 {
  margin-bottom: $space-4;
}
</style>
