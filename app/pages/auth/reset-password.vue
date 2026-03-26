<template>
  <div class="auth-page">
    <div class="auth-page__container">
      <BaseCard class="p-6 md:p-8">
        <div class="text-center mb-8">
          <AppHeading level="h1" size="heading-xl" class="text-white mb-2">
            Reset Password
          </AppHeading>
          <AppText class="text-neutral-20">
            Enter your email to receive a password reset link
          </AppText>
        </div>

        <form @submit.prevent="handleReset" class="space-y-6">
          <BaseInput
            id="email"
            v-model="email"
            type="email"
            label="Email Address"
            placeholder="Ex: mail@example.com"
            required
            :error="error"
          />

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            class="w-full"
            :loading="loading"
          >
            Send Reset Link
          </BaseButton>

          <p v-if="successMsg" class="mt-4 text-primary-green text-sm text-center">
            {{ successMsg }}
          </p>

          <div class="text-center mt-6">
            <NuxtLink to="/auth/login" class="text-primary-green hover:underline text-sm font-medium">
              Back to Login
            </NuxtLink>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const loading = ref(false)
const error = ref('')
const successMsg = ref('')

const handleReset = async () => {
  if (!email.value) return
  
  loading.value = true
  error.value = ''
  successMsg.value = ''
  
  try {
    // API Call goes here
    await new Promise(resolve => setTimeout(resolve, 1000))
    successMsg.value = 'Password reset link has been sent to your email.'
    email.value = ''
  } catch (e: any) {
    error.value = e.message || 'Failed to send reset link.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/spacing' as *;

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6;
  background: var(--bg-secondary);
}

.auth-page__container {
  width: 100%;
  max-width: 480px;
}
</style>
