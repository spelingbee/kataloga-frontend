<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <header class="legal-page__header">
        <h1 class="legal-page__title">Политика конфиденциальности</h1>
        <p class="legal-page__subtitle">Защита персональных данных пользователей торговой точки «{{ tenantName }}»</p>
      </header>

      <div class="legal-page__content card">
        <div class="agreement-text">
          <h2>ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ И ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ</h2>
          <p>Настоящая Политика определяет порядок обработки и защиты персональной информации, предоставляемой Клиентами торговой точке «{{ tenantName }}» (далее — «Мерчант») при использовании сервиса для заказа товаров/услуг.</p>

          <h3>1. Собираемая персональная информация</h3>
          <p>1.1. Мы собираем только те персональные данные, которые необходимы для выполнения заказа и осуществления доставки:</p>
          <ul>
            <li>Имя и фамилия Клиента</li>
            <li>Контактный номер телефона</li>
            <li>Адрес доставки (если применимо)</li>
            <li>Электронный адрес (email)</li>
            <li>Идентификатор Telegram (в случае оформления заказа через Telegram Mini App)</li>
          </ul>

          <h3>2. Цели обработки персональных данных</h3>
          <p>2.1. Мы используем ваши данные исключительно для:</p>
          <ul>
            <li>Оформления, подтверждения и исполнения вашего заказа.</li>
            <li>Организации доставки товаров по указанному адресу.</li>
            <li>Связи с вами для уточнения деталей заказа, информирования о готовности или задержках.</li>
            <li>Интеграции с платежным сервисом FreedomPay для безопасного проведения оплаты.</li>
          </ul>

          <h3>3. Безопасность и передача третьим лицам</h3>
          <p>3.1. Ваши персональные данные не передаются третьим лицам за исключением случаев:</p>
          <ul>
            <li>Необходимости передачи данных курьерским службам (например, Yandex Delivery) для выполнения доставки.</li>
            <li>Передачи платежных параметров шлюзу FreedomPay (PayBox.money) для совершения банковской транзакции (Продавец не хранит данные вашей платежной карты).</li>
            <li>Требований законодательства Кыргызской Республики.</li>
          </ul>

          <h3>4. Права Клиента</h3>
          <p>4.1. Клиент имеет право в любой момент запросить удаление или изменение своих персональных данных, обратившись к Продавцу по указанным ниже каналам связи.</p>

          <div class="legal-page__footer-details">
            <h3>Контакты Продавца:</h3>
            <p><strong>Наименование:</strong> {{ legalNameText }}</p>
            <p v-if="tenant?.inn"><strong>ИНН:</strong> {{ tenant.inn }}</p>
            <p v-if="legalAddressText"><strong>Адрес:</strong> {{ legalAddressText }}</p>
            <p v-if="supportPhoneText"><strong>Телефон поддержки:</strong> {{ supportPhoneText }}</p>
            <p v-if="supportEmailText"><strong>Email поддержки:</strong> <a :href="`mailto:${supportEmailText}`">{{ supportEmailText }}</a></p>
          </div>
        </div>
      </div>
      
      <div class="legal-page__back">
        <NuxtLink :to="`/t/${tenantSlug}/checkout`" class="back-link">Вернуться к оформлению заказа</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenantStore } from '~/stores/tenant'
import { useTelegram } from '~/composables/useTelegram'

const route = useRoute()
const router = useRouter()
const tenantStore = useTenantStore()
const telegram = useTelegram()

const tenantSlug = computed(() => route.params.slug as string)
const tenant = computed(() => tenantStore.currentTenant)

const tenantName = computed(() => tenant.value?.name || 'Магазин')
const legalNameText = computed(() => (tenant.value as any)?.legalName || `ИП/ОсОО "${tenantName.value}"`)
const legalAddressText = computed(() => (tenant.value as any)?.legalAddress || tenant.value?.settings?.contactInfo?.address || '')
const supportPhoneText = computed(() => (tenant.value as any)?.supportPhone || tenant.value?.settings?.contactInfo?.phone || '')
const supportEmailText = computed(() => (tenant.value as any)?.supportEmail || tenant.value?.settings?.contactInfo?.email || 'info@kataloga.org')

let cleanupBackBtn: (() => void) | null = null

onMounted(() => {
  if (telegram.isTelegram.value) {
    cleanupBackBtn = telegram.showBackButton(() => {
      router.back()
    })
  }
})

onUnmounted(() => {
  if (telegram.isTelegram.value) {
    if (cleanupBackBtn) cleanupBackBtn()
    telegram.hideBackButton()
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;
@use '~/assets/scss/tokens/typography' as *;

.legal-page {
  min-height: 100vh;
  padding: $space-12 $space-4;
  background-color: var(--bg-secondary);
}

.legal-page__container {
  max-width: 800px;
  margin: 0 auto;
}

.legal-page__header {
  text-align: center;
  margin-bottom: $space-8;
}

.legal-page__title {
  font-family: $font-secondary;
  font-size: $text-4xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.legal-page__subtitle {
  color: var(--text-secondary);
  font-size: $text-lg;
}

.legal-page__content {
  background: var(--bg-primary);
  padding: $space-10;
  border-radius: $radius-xl;
  box-shadow: $shadow-lg;
}

.agreement-text {
  color: var(--text-primary);
  line-height: 1.6;

  h2 {
    font-size: $text-xl;
    margin-bottom: $space-6;
    text-align: center;
  }

  h3 {
    font-size: $text-lg;
    margin-top: $space-8;
    margin-bottom: $space-4;
    color: var(--color-primary);
  }

  p, li {
    margin-bottom: $space-3;
  }

  ul {
    padding-left: $space-6;
    list-style-type: disc;
    margin-bottom: $space-4;
  }

  .legal-page__footer-details {
    margin-top: $space-12;
    padding-top: $space-8;
    border-top: 1px solid var(--border-color);
    
    h3 {
      margin-top: 0;
    }
    
    p {
      margin-bottom: $space-1;
    }
  }
}

.legal-page__back {
  text-align: center;
  margin-top: $space-6;

  .back-link {
    color: var(--color-primary);
    text-decoration: underline;
    font-weight: 500;

    &:hover {
      text-decoration: none;
    }
  }
}
</style>
