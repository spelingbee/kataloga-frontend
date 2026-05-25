<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <header class="legal-page__header">
        <h1 class="legal-page__title">Правила возврата</h1>
        <p class="legal-page__subtitle">Правила возврата денежных средств на платформе «Kataloga»</p>
      </header>

      <div class="legal-page__content card">
        <div class="agreement-text">
          <h2>ПРАВИЛА ВОЗВРАТА ДЕНЕЖНЫХ СРЕДСТВ</h2>
          <p>Настоящие Правила определяют порядок и условия возврата денежных средств Пользователям (Мерчантам) платформы «Kataloga» (далее — «Платформа»), а также конечным Клиентам, совершающим покупки у Мерчантов через IT-инфраструктуру Платформы.</p>

          <p>Правила составлены в соответствии с Законом Кыргызской Республики «О защите прав потребителей» и Гражданским кодексом Кыргызской Республики.</p>

          <h3>1. Общие положения</h3>
          <p>1.1. Платформа «Kataloga» предоставляет IT-решения для создания электронного каталога и автоматизации приёма заказов. Платформа не является продавцом товаров Мерчантов и не несёт ответственности за качество, состав и комплектность товаров, реализуемых Мерчантами конечным Клиентам.</p>
          <p>1.2. Оплата на Платформе может осуществляться банковскими картами через защищённый платёжный шлюз FreedomPay.</p>

          <h3>2. Условия возврата средств для Мерчантов (B2B)</h3>
          <p>2.1. Использование Платформы осуществляется по лицензионной подписке на условиях 100% предоплаты согласно тарифам.</p>
          <p>2.2. В соответствии с п. 7.2 Публичной оферты Платформы, в случае досрочного отказа Мерчанта от использования Платформы по любым причинам, возврат средств за текущий расчетный период (месяц/год) не производится.</p>
          <p>2.3. В случае технической невозможности предоставления услуг Платформы по вине Исполнителя на срок более 72 часов подряд, Мерчант имеет право потребовать соразмерный возврат за неиспользованные дни подписки.</p>

          <h3>3. Условия возврата средств для Клиентов (B2C)</h3>
          <p>3.1. Клиент совершает покупку непосредственно у Мерчанта (магазина/ресторана). Все претензии по качеству товаров, задержке доставки, пересортице и возврату средств направляются напрямую Мерчанту по контактам, указанным в чеке или в футере сайта магазина.</p>
          <p>3.2. В случае технической ошибки при транзакции (двойное списание, списание средств при отмене заказа магазином до начала приготовления/доставки) возврат денежных средств инициируется Мерчантом или Платформой через платёжную систему FreedomPay.</p>
          <p>3.3. При подтверждении возврата банком-эквайером денежные средства возвращаются исключительно на ту же банковскую карту, с которой была произведена оплата.</p>

          <h3>4. Сроки и процедура возврата</h3>
          <p>4.1. Для оформления возврата при технической ошибке Пользователь/Клиент должен направить обращение на электронную почту: <a href="mailto:info@kataloga.org">info@kataloga.org</a>, указав:</p>
          <ul>
            <li>Уникальный ID заказа (Order ID)</li>
            <li>Дату и время транзакции</li>
            <li>Сумму списания</li>
            <li>Причину возврата</li>
            <li>Скриншот чека из банковского приложения или платежной системы</li>
          </ul>
          <p>4.2. Срок рассмотрения заявления на возврат составляет до 14 рабочих дней с момента получения обращения.</p>
          <p>4.3. Срок фактического зачисления денежных средств на карту зависит от банка-эмитента и может составлять от 3 до 30 рабочих дней.</p>

          <h3>5. Форс-мажор</h3>
          <p>Платформа не несёт ответственности за задержки возврата средств, вызванные техническими сбоями на стороне банков, платёжного шлюза FreedomPay или вследствие введения ограничений государственными органами.</p>

          <div class="legal-page__footer-details">
            <h3>Реквизиты Исполнителя:</h3>
            <p><strong>Наименование:</strong> ОсОО «KATALOGA» (в процессе регистрации)</p>
            <p><strong>Адрес:</strong> г. Бишкек, Кыргызская Республика</p>
            <p><strong>Email:</strong> <a href="mailto:info@kataloga.org">info@kataloga.org</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Правила возврата — Kataloga',
  description: 'Правила возврата денежных средств на платформе Kataloga'
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/typography' as *;

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

  ul {
    margin-bottom: $space-6;
    padding-left: $space-6;
    
    li {
      margin-bottom: $space-2;
    }
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
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
</style>
