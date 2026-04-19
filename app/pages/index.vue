<template>
  <div class="landing-page">
    <div class="landing-page__content">
      <div class="landing-page__logo">
        <BaseIcon name="kataloga" size="xl" />
      </div>
      <h1 class="landing-page__title">Kataloga</h1>
      <p class="landing-page__subtitle">
        {{ $t('common.platform_coming_soon', 'Платформа для заказа еды в Telegram и Web.') }}
      </p>
      
      <div class="landing-page__actions">
        <NuxtLink to="/select-restaurant" class="btn btn--primary">
          {{ $t('common.browse_restaurants', 'Выбрать заведение') }}
          <BaseIcon name="arrow-right" size="sm" />
        </NuxtLink>
      </div>
    </div>
    
    <div class="landing-page__bg">
      <div class="blob blob--1"></div>
      <div class="blob blob--2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/typography' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;

.landing-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
  color: white;
  font-family: 'Inter', sans-serif;
}

.landing-page__content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: $space-10;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $radius-2xl;
  box-shadow: $shadow-2xl;
  
  @media (max-width: 640px) {
    margin: $space-4;
    padding: $space-6;
  }
}

.landing-page__logo {
  margin-bottom: $space-6;
  color: #ce52ff;
  display: flex;
  justify-content: center;
}

.landing-page__title {
  font-size: $text-4xl;
  font-weight: 800;
  margin-bottom: $space-4;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}

.landing-page__subtitle {
  font-size: $text-lg;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: $space-10;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-8;
  border-radius: $radius-full;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &--primary {
    background: linear-gradient(135deg, #ce52ff 0%, #9e00ff 100%);
    color: white;
    box-shadow: 0 10px 20px rgba(158, 0, 255, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(158, 0, 255, 0.4);
    }
  }
}

.landing-page__bg {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.blob {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.2;
  animation: float 20s infinite alternate;
  
  &--1 {
    top: -100px;
    right: -100px;
    background: #ce52ff;
  }
  
  &--2 {
    bottom: -100px;
    left: -100px;
    background: #00ccff;
    animation-delay: -5s;
  }
}

@keyframes float {
  from { transform: translate(0, 0) rotate(0deg); }
  to { transform: translate(100px, 100px) rotate(360deg); }
}
</style>
