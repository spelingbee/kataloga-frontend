<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <header class="legal-page__header">
        <h1 class="legal-page__title">Публичная оферта</h1>
        <p class="legal-page__subtitle">Соглашение об оказании услуг и продаже товаров торговой точки «{{ tenantName }}»</p>
      </header>

      <div class="legal-page__content card">
        <div class="agreement-text">
          <h2>ПУБЛИЧНАЯ ОФЕРТА (ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ)</h2>
          <p>Настоящий документ является официальным предложением (Публичной офертой) Продавца (далее — «Мерчант» или «Исполнитель») в лице торговой точки «{{ tenantName }}» заключить договор купли-продажи товаров и/или оказания услуг на изложенных ниже условиях с любым физическим лицом (далее — «Покупатель» или «Клиент»).</p>
          
          <p>Оформление заказа на сайте/в боте или оплата заказа означает полное и безоговорочное принятие (акцепт) Клиентом условий настоящей Оферты.</p>

          <h3>1. Термины и определения</h3>
          <p>1.1. Продавец (Мерчант) — {{ legalNameText }}, осуществляющий продажу товаров или услуг Клиентам.</p>
          <p>1.2. Клиент — физическое лицо, оформляющее заказ товаров или услуг у Продавца.</p>
          <p>1.3. Платформа — информационная система «Kataloga», используемая Продавцом для приема заказов и обработки платежей.</p>

          <h3>2. Предмет договора</h3>
          <p>2.1. Продавец обязуется передать Клиенту товар и/или оказать услуги согласно оформленному заказу, а Клиент обязуется оплатить и принять их на условиях настоящей Оферты.</p>
          <p>2.2. Качество товаров и услуг полностью обеспечивается Продавцом. Платформа «Kataloga» не является стороной по данной сделке, не несет ответственности за качество товаров, задержки доставки или иные неисполнения обязательств Продавцом.</p>

          <h3>3. Порядок оплаты банковской картой</h3>
          <p>3.1. Все расчеты производятся в национальной валюте Кыргызской Республики — сом (KGS).</p>
          <p>3.2. Прием платежей банковскими картами Visa, Mastercard и Элкарт обеспечивается безопасным шлюзом FreedomPay (PayBox.money) платформы «Kataloga» (ИП/ОсОО «Каталога»).</p>
          <p>3.3. При совершении платежа данные вашей карты обрабатываются в защищенном режиме согласно международным стандартам безопасности данных индустрии платежных карт PCI DSS.</p>
          <p>3.4. При возврате денежных средств, они перечисляются исключительно на ту же банковскую карту, с которой была произведена оплата.</p>

          <h3>4. Доставка и выдача заказов</h3>
          <p>4.1. Доставка или выдача товаров производится на условиях, выбранных Клиентом при оформлении заказа (самовывоз, доставка курьером, обслуживание за столом).</p>
          <p>4.2. Время доставки является ориентировочным и зависит от загруженности службы доставки Продавца.</p>

          <div class="legal-page__footer-details">
            <h3>Реквизиты Продавца:</h3>
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
