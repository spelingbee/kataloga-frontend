<template>
  <div class="landing-wrapper">
    <div class="bg-pattern"></div>

    <!-- Шапка -->
    <header class="landing-header">
      <div class="container landing-header__container">
        <div class="landing-logo">
          <img src="/images/logo-kataloga.png" alt="Kataloga" class="landing-logo__img" />
        </div>
        <div class="landing-header__actions">
          <LanguageSwitcher class="landing-header__lang" />
          <a :href="adminUrl + '/register'" class="btn ghost landing-header__login-btn">
            {{ $t('auth.login.submit') }}
          </a>
        </div>
      </div>
    </header>

    <main>
      <!-- Секция 1: HERO -->
      <section id="hero" class="hero">
        <div class="container hero-grid">
          <div class="hero-content">
            <h1 class="fade-up">
              {{ $t('landing.hero.title') }} <span class="text-accent">Telegram</span>
            </h1>
            <p class="fade-up delay-1">
              {{ $t('landing.hero.subtitle') }}
            </p>
            <div class="hero-actions fade-up delay-2">
              <a :href="adminUrl + '/register'" class="btn primary">
                {{ $t('landing.hero.startFree') }}
              </a>
              <a href="https://t.me/kataloga_test_bot" target="_blank" class="btn ghost">
                {{ $t('landing.hero.openDemo') }} <Icon name="play-circle" size="20"></Icon>
              </a>
            </div>
          </div>
          
          <div class="hero-mockup-container fade-up delay-3">
            <div class="mockup-frame">
              <div class="mockup-header">
                <div class="mockup-avatar"><Icon name="bot" size="24"></Icon></div>
                <div>
                  <div class="mockup-title">Kataloga Bot</div>
                  <div class="mockup-subtitle">bot</div>
                </div>
              </div>
              <div class="mockup-chat">
                <div class="chat-bubble bubble-user">/start</div>
                <div class="chat-bubble bubble-bot">
                  {{ $t('menu.browseSubtitle') }} 👋 {{ $t('menu.searchPlaceholder') }}
                  <div class="app-btn">{{ $t('menu.allItems') }}</div>
                </div>
                <div class="chat-bubble bubble-bot" style="margin-top: auto; font-size: 13px; color: #9ca3af; background: transparent; border: 1px solid #e5e7eb;">
                  🔔 <b>{{ $t('notifications.orderUpdate') }} #1024</b><br>
                  {{ $t('order.summary') }}: 2 500 {{ $t('currency.som') }}.<br>
                  {{ $t('order.payment') }}: {{ $t('payment.methods.STRIPE') }}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Секция 2: SOCIAL PROOF BAR -->
      <section id="social-proof" class="social-proof fade-up">
        <div class="container">
          <p>{{ $t('landing.socialProof') }}</p>
          <div class="logo-row">
            <div class="social-proof-stat">{{ $t('landing.categories.cafe') }}</div>
            <div class="social-proof-stat">{{ $t('landing.categories.confectioners') }}</div>
            <div class="social-proof-stat">{{ $t('landing.categories.flowers') }}</div>
            <div class="social-proof-stat">{{ $t('landing.categories.shops') }}</div>
            <div class="social-proof-stat">{{ $t('landing.categories.handmade') }}</div>
          </div>
        </div>
      </section>

      <!-- Секция 3: PROBLEM -> SOLUTION -->
      <section id="comparison" class="comparison">
        <div class="container comp-grid">
          <div class="comp-card fade-up">
            <h3>{{ $t('landing.comparison.before.title') }}</h3>
            <ul class="comp-list bad">
              <li><Icon name="x-circle"/> {{ $t('landing.comparison.before.item1') }}</li>
              <li><Icon name="x-circle"/> {{ $t('landing.comparison.before.item2') }}</li>
              <li><Icon name="x-circle"/> {{ $t('landing.comparison.before.item3') }}</li>
              <li><Icon name="x-circle"/> {{ $t('landing.comparison.before.item4') }}</li>
            </ul>
          </div>
          <div class="comp-card good fade-up delay-1">
            <h3>{{ $t('landing.comparison.after.title') }}</h3>
            <ul class="comp-list good">
              <li><Icon name="check-circle-2"/> {{ $t('landing.comparison.after.item1') }}</li>
              <li><Icon name="check-circle-2"/> {{ $t('landing.comparison.after.item2') }}</li>
              <li><Icon name="check-circle-2"/> {{ $t('landing.comparison.after.item3') }}</li>
              <li><Icon name="check-circle-2"/> {{ $t('landing.comparison.after.item4') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Секция 4: FEATURES -->
      <section id="features" class="features">
        <div class="container">
          <h2 class="fade-up">{{ $t('landing.features.title') }}</h2>
          <div class="bento-grid">
            <div class="feature-card fade-up">
              <div class="feature-icon"><Icon name="package" size="24"/></div>
              <h3>{{ $t('landing.features.twa.title') }}</h3>
              <p>{{ $t('landing.features.twa.desc') }}</p>
            </div>
            <div class="feature-card fade-up delay-1">
              <div class="feature-icon"><Icon name="settings" size="24"/></div>
              <h3>{{ $t('landing.features.admin.title') }}</h3>
              <p>{{ $t('landing.features.admin.desc') }}</p>
            </div>
            <div class="feature-card fade-up delay-2">
              <div class="feature-icon"><Icon name="credit-card" size="24"/></div>
              <h3>{{ $t('landing.features.payments.title') }}</h3>
              <p>{{ $t('landing.features.payments.desc') }}</p>
            </div>
            <div class="feature-card fade-up">
              <div class="feature-icon"><Icon name="bell" size="24"/></div>
              <h3>{{ $t('landing.features.notifications.title') }}</h3>
              <p>{{ $t('landing.features.notifications.desc') }}</p>
            </div>
            <div class="feature-card fade-up delay-1">
              <div class="feature-icon"><Icon name="globe" size="24"/></div>
              <h3>{{ $t('landing.features.multilingual.title') }}</h3>
              <p>{{ $t('landing.features.multilingual.desc') }}</p>
            </div>
            <div class="feature-card fade-up delay-2">
              <div class="feature-icon"><Icon name="layout-dashboard" size="24"/></div>
              <h3>{{ $t('landing.features.design.title') }}</h3>
              <p>{{ $t('landing.features.design.desc') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Секция 5: HOW IT WORKS -->
      <section id="how-it-works" class="how-it-works">
        <div class="container">
          <h2 class="fade-up">{{ $t('landing.howItWorks.title') }}</h2>
          <div id="steps-anim" class="steps-container fade-up delay-1">
          <div class="steps-line"><div id="steps-progress" class="steps-line-progress" :style="progressStyle"></div></div>
          
          <div class="step" :class="{ active: activeSteps.includes(1) }">
            <div class="step-number">1</div>
            <h3>{{ $t('landing.howItWorks.step1.title') }}</h3>
            <p>{{ $t('landing.howItWorks.step1.desc') }}</p>
          </div>
          <div class="step" :class="{ active: activeSteps.includes(2) }">
            <div class="step-number">2</div>
            <h3>{{ $t('landing.howItWorks.step2.title') }}</h3>
            <p>{{ $t('landing.howItWorks.step2.desc') }}</p>
          </div>
          <div class="step" :class="{ active: activeSteps.includes(3) }">
            <div class="step-number">3</div>
            <h3>{{ $t('landing.howItWorks.step3.title') }}</h3>
            <p>{{ $t('landing.howItWorks.step3.desc') }}</p>
          </div>
        </div>
      </div>
    </section>

      <!-- Секция 6: FAQ ACCORDION -->
      <section id="faq" class="faq">
        <div class="container">
          <h2 class="fade-up">{{ $t('landing.faq.title') }}</h2>
          <div class="faq-list fade-up delay-1">
          <div v-for="(item, index) in faq" :key="index" class="faq-item" :class="{ active: activeFaq === index }">
            <button class="faq-question" @click="toggleFaq(index)">
              {{ item.question }} <Icon name="plus"/>
            </button>
            <div class="faq-answer-wrapper">
              <div class="faq-answer-inner">
                <div class="faq-answer-content">
                  {{ item.answer }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      <!-- Секция 7: PRICING -->
      <section id="pricing" class="pricing">
        <div class="container">
          <h2 class="fade-up">{{ $t('landing.pricing.title') }}</h2>
          <p class="pricing-subtitle fade-up delay-1">{{ $t('landing.pricing.subtitle') }}</p>
          <div class="pricing-grid fade-up delay-2">
            <!-- FREE -->
            <div class="pricing-card">
              <h3>{{ $t('landing.pricing.free.title') }}</h3>
              <div class="price">0 <span>{{ $t('landing.pricing.perMonth') }}</span></div>
              <ul class="pricing-features">
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.free.items') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.free.orders') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.free.bot') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.free.notifications') }}</li>
                <li class="pricing-features__disabled"><Icon name="x" size="16"/> {{ $t('landing.pricing.free.photos') }}</li>
                <li class="pricing-features__disabled"><Icon name="x" size="16"/> {{ $t('landing.pricing.free.analytics') }}</li>
              </ul>
              <a :href="adminUrl + '/register'" class="btn ghost" style="width: 100%;">{{ $t('landing.hero.startFree') }}</a>
            </div>
            <!-- START -->
            <div class="pricing-card pricing-card--popular">
              <div class="pricing-badge">{{ $t('menu.popular') }}</div>
              <h3>{{ $t('landing.pricing.start.title') }}</h3>
              <div class="price">500 <span>{{ $t('landing.pricing.perMonth') }}</span></div>
              <ul class="pricing-features">
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.start.items') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.start.orders') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.start.bot') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('menu.dietary') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.start.qr') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.free.analytics') }}</li>
              </ul>
              <a :href="adminUrl + '/register'" class="btn primary" style="width: 100%;">{{ $t('landing.pricing.startTrial') }}</a>
            </div>
            <!-- PRO -->
            <div class="pricing-card">
              <h3>{{ $t('landing.pricing.pro.title') }}</h3>
              <div class="price">1 500 <span>{{ $t('landing.pricing.perMonth') }}</span></div>
              <ul class="pricing-features">
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.pro.items') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.pro.orders') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.pro.branding') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.pro.staff') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.free.analytics') }} + {{ $t('common.viewDetails') }}</li>
                <li><Icon name="check" size="16"/> {{ $t('landing.pricing.pro.priority') }}</li>
              </ul>
              <a :href="adminUrl + '/register'" class="btn ghost" style="width: 100%;">{{ $t('landing.pricing.startTrial') }}</a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- FOOTER -->
    <footer class="landing-footer">
      <div class="container footer-grid">
        <div class="landing-logo">
          <img src="/images/logo-kataloga.png" alt="Kataloga" class="landing-logo__img" />
        </div>
        <div class="footer-links">
          <a href="#hero">{{ $t('common.viewDetails') }}</a>
          <a href="#features">{{ $t('orders.statuses.confirmed') }}</a>
          <a href="#pricing">{{ $t('landing.pricing.title') }}</a>
          <a href="#">{{ $t('order.contactSupport') }}</a>
          <a href="#">Telegram</a>
        </div>
      </div>
      <div class="container footer-bottom">
        {{ $t('landing.footer.rights') }}
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '~/components/base/LanguageSwitcher.vue'
import Icon from '~/components/ui/Icon.vue'

definePageMeta({
  layout: false
})

// FAQ State
const activeFaq = ref<number | null>(null)
const { t } = useI18n()

const faq = computed(() => [
  {
    question: t('landing.faq.q1'),
    answer: t('landing.faq.a1')
  },
  {
    question: t('landing.faq.q2'),
    answer: t('landing.faq.a2')
  },
  {
    question: t('landing.faq.q3'),
    answer: t('landing.faq.a3')
  },
  {
    question: t('landing.faq.q4'),
    answer: t('landing.faq.a4')
  },
  {
    question: t('landing.faq.q5'),
    answer: t('landing.faq.a5')
  }
])

// Steps State
const activeSteps = ref<number[]>([])
const progressVal = ref(0)
const progressStyle = computed(() => {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
  return isDesktop ? { width: `${progressVal.value}%` } : { height: `${progressVal.value}%` }
})

const toggleFaq = (index: number) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

const adminUrl = computed(() => {
  if (process.client) {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001'
    }
    // For production, point to admin subdomain
    const domainParts = host.split('.')
    if (domainParts.length >= 2) {
      const baseDomain = domainParts.slice(-2).join('.')
      return `https://admin.${baseDomain}`
    }
  }
  return 'https://admin.kataloga.org'
})

const scrollToPricing = () => {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  // 1. Intersection Observer (fade-up)
  const fadeElements = document.querySelectorAll('.fade-up')
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        fadeObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

  fadeElements.forEach(el => fadeObserver.observe(el))

  // 3. How it works animation
  const stepsAnim = document.getElementById('steps-anim')
  const stepsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      progressVal.value = 100
      setTimeout(() => activeSteps.value.push(1), 300)
      setTimeout(() => activeSteps.value.push(2), 800)
      setTimeout(() => activeSteps.value.push(3), 1300)
      stepsObserver.unobserve(stepsAnim!)
    }
  }, { threshold: 0.4 })
  
  if (stepsAnim) stepsObserver.observe(stepsAnim)
})
</script>

<style scoped lang="scss">
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap');

.landing-wrapper {
  --bg-color: #fafaf8;
  --surface-color: #ffffff;
  --border-color: #e5e7eb;
  --border-hover: #d1d5db;
  --text-main: #111827;
  --text-muted: #4b5563;
  --text-light: #9ca3af;
  --accent-primary: #0d9488;
  --accent-hover: #0f766e;
  --accent-light: #f0fdfa;
  --accent-border: #ccfbf1;
  --bezier: cubic-bezier(0.16, 1, 0.3, 1);
  --transition: 300ms var(--bezier);

  font-family: 'Satoshi', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.6;
  overflow-x: hidden;
  min-height: 100vh;
}

.bg-pattern {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.5;
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  position: relative;
  z-index: 2;

  @media (max-width: 640px) {
    padding: 0 20px;
  }
}

/* Typography */
h1, h2, h3 { font-weight: 700; line-height: 1.2; color: var(--text-main); }
h1 { font-size: 2.5rem; letter-spacing: -0.03em; margin-bottom: 1.25rem; }
h2 { font-size: 2rem; letter-spacing: -0.02em; margin-bottom: 3rem; text-align: center; }
h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }

@media (min-width: 768px) {
  h1 { font-size: 3.5rem; }
  h2 { font-size: 2.5rem; }
}

p { color: var(--text-muted); }
.text-accent { color: var(--accent-primary); }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 1rem;
  transition: all var(--transition);
  min-height: 48px;
  cursor: pointer;
  border: none;
  outline: none;
  text-decoration: none;
}

.btn.primary {
  background-color: var(--accent-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
}

.btn.primary:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(13, 148, 136, 0.25);
}

.btn.ghost {
  background-color: var(--surface-color);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn.ghost:hover {
  border-color: var(--border-hover);
  background-color: #f9fafb;
}

/* Animations */
.fade-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 800ms var(--bezier), transform 800ms var(--bezier);
}
.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}
.delay-1 { transition-delay: 100ms; }
.delay-2 { transition-delay: 200ms; }
.delay-3 { transition-delay: 300ms; }

/* Header */
.landing-header {
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 250, 248, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}
.landing-header__container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.landing-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.landing-header__lang {
  :deep(.language-switcher__button) {
    background: transparent;
    border-color: rgba(229, 231, 235, 0.5);
    height: 40px;
    padding: 0 12px;
    
    &:hover {
      background: rgba(13, 148, 136, 0.05);
      border-color: var(--accent-primary);
    }
  }
}
.landing-logo {
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
}
.landing-logo__img {
  height: 32px;
  width: auto;
}
.landing-logo__icon { color: var(--accent-primary); }
.landing-header__login-btn { padding: 8px 20px; min-height: 40px; border-radius: 10px; }

/* Hero */
.hero {
  position: relative;
  padding: 80px 0 120px;
  min-height: 80vh;
  display: flex;
  align-items: center;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 60px;
  align-items: center;
}
@media (min-width: 1024px) {
  .hero-grid { grid-template-columns: 1fr 1fr; }
}
.hero-content {
  text-align: center;
  @media (min-width: 1024px) {
    text-align: left;
  }
}
.hero-content p { 
  font-size: 1.125rem; 
  margin-bottom: 2.5rem; 
  max-width: 540px; 
  margin-left: auto;
  margin-right: auto;
  
  @media (min-width: 1024px) {
    margin-left: 0;
    margin-right: 0;
  }
}
.hero-actions { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 16px; 
  justify-content: center;

  @media (min-width: 1024px) {
    justify-content: flex-start;
  }
}

/* Mockup */
.hero-mockup-container { display: flex; justify-content: center; perspective: 1000px; }
.mockup-frame {
  width: 320px; height: 640px;
  background: #ffffff;
  border-radius: 40px;
  border: 8px solid #f3f4f6;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--border-color);
  position: relative;
  overflow: hidden;
  animation: float-soft 6s ease-in-out infinite;
}
@keyframes float-soft { 
  0%, 100% { transform: translateY(0px); } 
  50% { transform: translateY(-10px); } 
}
.mockup-header { background: #f9fafb; padding: 40px 16px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border-color); }
.mockup-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-light); display: flex; align-items: center; justify-content: center; color: var(--accent-primary); }
.mockup-title { font-weight: 600; font-size: 15px; color: var(--text-main); }
.mockup-subtitle { font-size: 13px; color: var(--text-light); }
.mockup-chat { padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #ffffff; height: 100%; }
.chat-bubble { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.4; }
.bubble-user { background: var(--accent-primary); color: #ffffff; align-self: flex-end; border-bottom-right-radius: 4px; }
.bubble-bot { background: #f3f4f6; color: var(--text-main); align-self: flex-start; border-bottom-left-radius: 4px; }
.app-btn { background: #ffffff; color: var(--accent-primary); text-align: center; padding: 10px; border-radius: 10px; font-size: 14px; font-weight: 500; margin-top: 10px; width: 100%; display: block; border: 1px solid var(--border-color); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

/* Social Proof */
.social-proof { padding: 60px 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); background: var(--surface-color); text-align: center; }
.social-proof p { margin-bottom: 24px; font-weight: 500; color: var(--text-muted); font-size: 0.95rem; }
.logo-row { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
.social-proof-stat { display: flex; align-items: center; justify-content: center; padding: 8px 20px; border-radius: 12px; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-muted); font-weight: 500; font-size: 0.9rem; transition: all var(--transition); box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.social-proof-stat:hover { transform: translateY(-2px); border-color: var(--accent-primary); color: var(--accent-primary); box-shadow: 0 4px 6px rgba(13, 148, 136, 0.1); }
.logo-circle { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-muted); font-weight: 600; font-size: 14px; transition: all var(--transition); box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.logo-circle:hover { transform: translateY(-2px); border-color: var(--accent-primary); color: var(--accent-primary); box-shadow: 0 4px 6px rgba(13, 148, 136, 0.1); }

/* Comparison */
.comparison { padding: 120px 0; }
.comp-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
@media (min-width: 768px) { .comp-grid { grid-template-columns: 1fr 1fr; } }
.comp-card { background: var(--surface-color); padding: 48px 40px; border-radius: 24px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.comp-card.good { border: 2px solid var(--accent-border); background: var(--accent-light); }
.comp-card h3 { margin-bottom: 32px; font-size: 1.5rem; }
.comp-list { list-style: none; padding: 0; }
.comp-list li { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; font-size: 1.05rem; color: var(--text-muted); text-align: left; }
.comp-card.good .comp-list li { color: var(--text-main); }
.comp-list i { flex-shrink: 0; margin-top: 2px; }
.comp-list.bad i { color: #ef4444; }
.comp-list.good i { color: var(--accent-primary); }

/* Bento Features */
.features { padding: 80px 0; background: var(--surface-color); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
.bento-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 1024px) { .bento-grid { grid-template-columns: repeat(3, 1fr); } }
.feature-card { background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 24px; padding: 40px 32px; transition: all var(--transition); text-align: left; }
.feature-card:hover { background: var(--surface-color); border-color: var(--border-hover); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); transform: translateY(-2px); }
.feature-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

/* How it works */
.how-it-works { padding: 120px 0; }
.steps-container { max-width: 900px; margin: 0 auto; position: relative; }
.steps-line { position: absolute; left: 24px; top: 0; bottom: 0; width: 2px; background: var(--border-color); z-index: 1; }
.steps-line-progress { position: absolute; top: 0; left: 0; width: 100%; background: var(--accent-primary); height: 0%; transition: height 1.5s cubic-bezier(0.22, 1, 0.36, 1), width 1.5s cubic-bezier(0.22, 1, 0.36, 1); }
@media (min-width: 768px) {
  .steps-container { display: flex; justify-content: space-between; gap: 40px; }
  .steps-line { left: 0; right: 0; top: 24px; height: 2px; width: 100%; bottom: auto; }
  .step { text-align: center; flex: 1; padding-top: 64px; padding-left: 0 !important; }
  .step-number { left: 50% !important; transform: translateX(-50%); top: 0 !important; }
}
.step { position: relative; padding-left: 72px; margin-bottom: 48px; z-index: 2; text-align: left; }
.step-number { position: absolute; left: 0; top: 0; width: 50px; height: 50px; border-radius: 50%; background: var(--surface-color); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.125rem; color: var(--text-muted); transition: all var(--transition); }
.step.active .step-number { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--accent-light); }

/* FAQ */
.faq { padding: 120px 0; max-width: 768px; margin: 0 auto; }
.faq-list { display: flex; flex-direction: column; gap: 12px; }
.faq-item { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; transition: border-color var(--transition); }
.faq-question { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 24px; background: transparent; color: var(--text-main); font-size: 1.125rem; font-weight: 500; text-align: left; border: none; cursor: pointer; }
.faq-question i { transition: transform var(--transition); color: var(--text-light); flex-shrink: 0; margin-left: 16px; }
.faq-answer-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--transition); }
.faq-item.active { border-color: var(--accent-border); }
.faq-item.active .faq-answer-wrapper { grid-template-rows: 1fr; }
.faq-item.active .faq-question i { transform: rotate(45deg); color: var(--accent-primary); }
.faq-answer-inner { overflow: hidden; }
.faq-answer-content { padding: 0 24px 24px; color: var(--text-muted); }

/* Pricing */
.pricing { padding: 80px 0 120px; text-align: center; }
.pricing-subtitle { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 48px; }
.pricing-grid { display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 1100px; margin: 0 auto; }
@media (min-width: 768px) { .pricing-grid { grid-template-columns: repeat(3, 1fr); } }
.pricing-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 24px; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); position: relative; text-align: left; transition: all var(--transition); }
.pricing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1); }
.pricing-card--popular { border: 2px solid var(--accent-primary); box-shadow: 0 20px 40px -10px rgba(13, 148, 136, 0.15); }
.pricing-card--popular:hover { box-shadow: 0 25px 50px -10px rgba(13, 148, 136, 0.2); }
.pricing-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--accent-light); color: var(--accent-primary); border: 1px solid var(--accent-border); padding: 4px 16px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; white-space: nowrap; }
.pricing-card h3 { font-size: 1.5rem; margin-bottom: 8px; color: var(--text-main); }
.price { font-size: 3rem; font-weight: 700; margin: 16px 0 24px; color: var(--text-main); }
.price span { font-size: 1rem; color: var(--text-muted); font-weight: 500; }
.pricing-features { list-style: none; padding: 0; margin: 0 0 32px; }
.pricing-features li { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.95rem; color: var(--text-main); }
.pricing-features li i, .pricing-features li svg { flex-shrink: 0; color: var(--accent-primary); }
.pricing-features__disabled { color: var(--text-light) !important; }
.pricing-features__disabled i, .pricing-features__disabled svg { color: var(--text-light) !important; }

/* Footer */
.landing-footer { border-top: 1px solid var(--border-color); padding: 60px 0 40px; background: var(--surface-color); }
.footer-grid { display: flex; flex-direction: column; gap: 32px; align-items: center; text-align: center; }
@media (min-width: 768px) { .footer-grid { flex-direction: row; justify-content: space-between; text-align: left; } }
.footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; }
.footer-links a { color: var(--text-muted); transition: color var(--transition); font-weight: 500; text-decoration: none; }
.footer-links a:hover { color: var(--text-main); }
.footer-bottom { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border-color); text-align: center; color: var(--text-light); font-size: 0.875rem; }
</style>
