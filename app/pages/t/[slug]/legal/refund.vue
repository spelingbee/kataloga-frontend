<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <header class="legal-page__header">
        <h1 class="legal-page__title">Правила возврата</h1>
        <p class="legal-page__subtitle">Правила и порядок возврата денежных средств торговой точки «{{ tenantName }}»</p>
      </header>

      <div class="legal-page__content card">
        <div class="agreement-text">
          <h2>ПРАВИЛА ВОЗВРАТА ДЕНЕЖНЫХ СРЕДСТВ И ТОВАРОВ</h2>
          <p>Настоящие правила регулируют порядок отмены заказов, возврата товаров и возврата уплаченных за них денежных средств в рамках покупок у торговой точки «{{ tenantName }}» (далее — «Продавец»).</p>

          <h3>1. Условия отмены заказа</h3>
          <p>1.1. Клиент имеет право отменить заказ в любой момент до начала его приготовления или отправки Продавцом. Для этого необходимо незамедлительно связаться с Продавцом по телефону поддержки.</p>
          <p>1.2. Если заказ уже приготовлен или передан курьеру, отмена заказа в одностороннем порядке со стороны Клиента невозможна, а оплаченные средства удержанию не подлежат, кроме случаев ненадлежащего качества товара.</p>

          <h3>2. Возврат товаров ненадлежащего качества</h3>
          <p>2.1. В случае обнаружения брака, несоответствия состава заказа, повреждения упаковки или ненадлежащего качества продуктов питания/напитков, Клиент обязан связаться с поддержкой Продавца в течение 1 часа с момента получения заказа.</p>
          <p>2.2. По требованию Продавца, Клиент предоставляет фотографию или видео некачественного товара.</p>
          <p>2.3. В случае признания претензии обоснованной, Продавец осуществляет повторную доставку товара надлежащего качества за свой счет либо производит полный/частичный возврат средств.</p>

          <h3>3. Порядок возврата денежных средств</h3>
          <p>3.1. Возврат денежных средств, оплаченных банковской картой через систему FreedomPay, осуществляется исключительно на ту же карту, с которой был совершен первоначальный платеж.</p>
          <p>3.2. Срок зачисления возвращенных средств на банковскую карту Клиента зависит от банка-эмитента и обычно составляет от 1 до 5 рабочих дней.</p>
          <p>3.3. Комиссия за эквайринг и обработку платежа, если это применимо и предусмотрено условиями банка-эмитента, может не возвращаться, о чем Клиент уведомляется заранее.</p>

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

  p {
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
