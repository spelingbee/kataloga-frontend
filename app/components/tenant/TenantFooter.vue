<template>
  <footer class="tenant-footer">
    <!-- Платёжные системы -->
    <div class="tenant-footer__payments">
      <span class="tenant-footer__payments-label">Принимаем к оплате:</span>
      <div class="tenant-footer__payment-logos">
        <!-- Visa Badge -->
        <div class="payment-logo payment-logo--visa">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 15" width="38" height="24">
            <rect width="24" height="15" fill="#1a1f71" rx="2"/>
            <text x="12" y="10" font-family="sans-serif" font-size="6" font-weight="900" fill="#f7b614" text-anchor="middle" letter-spacing="0.5">VISA</text>
          </svg>
        </div>
        <!-- Mastercard Badge -->
        <div class="payment-logo payment-logo--mc">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 15" width="38" height="24">
            <rect width="24" height="15" fill="#222" rx="2"/>
            <circle cx="10" cy="7.5" r="4.5" fill="#eb001b"/>
            <circle cx="14" cy="7.5" r="4.5" fill="#f79e1b" fill-opacity="0.8"/>
          </svg>
        </div>
        <!-- Элкарт Badge -->
        <div class="payment-logo payment-logo--elcart">
          <span class="elcart-text">ЭЛКАРТ</span>
        </div>
      </div>
    </div>

    <!-- Защита -->
    <p class="tenant-footer__security">
      🔒 Безопасность платежей гарантирована защищённым шлюзом FreedomPay (PCI DSS).
    </p>

    <!-- Юридические ссылки -->
    <nav class="tenant-footer__legal">
      <span class="tenant-footer__item">
        <NuxtLink :to="`/t/${tenantSlug}/legal/offer`" class="tenant-footer__link">Оферта</NuxtLink>
        <span class="tenant-footer__divider">·</span>
      </span>
      <span class="tenant-footer__item">
        <NuxtLink :to="`/t/${tenantSlug}/legal/privacy`" class="tenant-footer__link">Конфиденциальность</NuxtLink>
        <span class="tenant-footer__divider">·</span>
      </span>
      <span class="tenant-footer__item">
        <NuxtLink :to="`/t/${tenantSlug}/legal/refund`" class="tenant-footer__link">Возврат</NuxtLink>
        <span class="tenant-footer__divider">·</span>
      </span>
      <span class="tenant-footer__item">
        <a href="/legal/oferta" target="_blank" class="tenant-footer__link">Правила Kataloga</a>
      </span>
    </nav>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tenantSlug = computed(() => route.params.slug as string)
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/typography' as *;

.tenant-footer {
  margin-top: $space-10;
  padding: $space-6 $space-4;
  border-top: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  text-align: center;
}

.tenant-footer__payments {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
}

.tenant-footer__payments-label {
  font-size: $text-xs;
  font-weight: $font-medium;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tenant-footer__payment-logos {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.payment-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  border-radius: $radius-sm;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  &--elcart {
    background: #0284c7;
    color: white;
    font-weight: $font-bold;
    font-size: 8px;
    padding: 0 $space-2;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    letter-spacing: 0.5px;
  }
}

.tenant-footer__security {
  font-size: $text-xs;
  color: var(--text-secondary);
  margin: 0;
}

.tenant-footer__legal {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: $space-2;
  font-size: $text-xs;
}

.tenant-footer__link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }
}

.tenant-footer__divider {
  color: var(--border-primary);
  user-select: none;
  margin-left: $space-2;
}

.tenant-footer__item {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

@media (max-width: 576px) {
  .tenant-footer {
    gap: $space-5;
  }
}
</style>
