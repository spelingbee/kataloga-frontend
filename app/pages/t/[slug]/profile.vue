<template>
  <AppLayout :title="t('profile.title')">
    <div class="profile-page">
      <ResponsiveContainer>
        <div class="profile-page__grid">
          <!-- Left Column: User Summary -->
          <aside class="profile-page__sidebar">
            <BaseCard class="profile-page__user-card" padding="lg">
              <div class="profile-page__avatar-wrapper">
                <div class="profile-page__avatar">
                  {{ userInitials }}
                </div>
                <div class="profile-page__role-badge">
                  {{ user.role }}
                </div>
              </div>
              <h1 class="profile-page__name">{{ userDisplayName }}</h1>
              <p class="profile-page__email">{{ user.email }}</p>

              <div class="profile-page__stats">
                <div class="profile-page__stat">
                  <span class="profile-page__stat-value">{{ orderCount }}</span>
                  <span class="profile-page__stat-label">{{ t('profile.orders') }}</span>
                </div>
                <div class="profile-page__stat">
                  <span class="profile-page__stat-value">{{ loyaltyPoints }}</span>
                  <span class="profile-page__stat-label">{{ t('profile.points') }}</span>
                </div>
              </div>

              <BaseButton block variant="outline" @click="handleLogout">
                <BaseIcon name="logout" size="sm" />
                {{ t('auth.logout') }}
              </BaseButton>
            </BaseCard>
          </aside>

          <!-- Right Column: Details and Settings -->
          <div class="profile-page__content">
            <!-- Personal Information -->
            <section class="profile-page__section">
              <h2 class="profile-page__section-title">{{ t('profile.personal_info') }}</h2>
              <BaseCard padding="lg">
                <form class="profile-page__form" @submit.prevent="handleUpdateProfile">
                  <div class="profile-page__form-grid">
                    <BaseInput
                      v-model="profileForm.firstName"
                      :label="t('common.first_name')"
                      placeholder="Имя"
                      required
                    />
                    <BaseInput
                      v-model="profileForm.lastName"
                      :label="t('common.last_name')"
                      placeholder="Фамилия"
                      required
                    />
                  </div>
                  <BaseInput
                    v-model="profileForm.email"
                    :label="t('common.email')"
                    type="email"
                    placeholder="email@example.com"
                    disabled
                  />
                  <div class="profile-page__form-actions">
                    <BaseButton type="submit" :loading="isUpdating">
                      {{ t('common.save_changes') }}
                    </BaseButton>
                  </div>
                </form>
              </BaseCard>
            </section>

            <!-- Delivery Settings -->
            <section class="profile-page__section">
              <h2 class="profile-page__section-title">{{ t('profile.delivery_settings') }}</h2>
              <BaseCard padding="lg">
                <div v-if="addresses.length > 0" class="profile-page__address-list">
                  <div v-for="addr in addresses" :key="addr.id" class="profile-page__address-item">
                    <BaseIcon name="location-on" class="profile-page__address-icon" />
                    <div class="profile-page__address-info">
                      <span class="profile-page__address-text">{{ addr.address }}</span>
                      <span class="profile-page__address-type">{{ addr.type }}</span>
                    </div>
                    <BaseButton variant="ghost" size="sm" icon-only>
                      <BaseIcon name="delete" />
                    </BaseButton>
                  </div>
                </div>
                <div v-else class="profile-page__empty-state">
                  <p>{{ t('profile.no_addresses') }}</p>
                </div>
                <BaseButton variant="outline" size="sm" class="profile-page__add-address">
                  <BaseIcon name="add" />
                  {{ t('profile.add_address') }}
                </BaseButton>
              </BaseCard>
            </section>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useI18n } from 'vue-i18n'
import AppLayout from '~/components/layout/AppLayout.vue'
import ResponsiveContainer from '~/components/layout/ResponsiveContainer.vue'

const { t } = useI18n()
const userStore = useUserStore()

// State
const user = computed(() => userStore.user || ({} as any))
const isUpdating = ref(false)
const orderCount = ref(0)
const loyaltyPoints = ref(0)
const addresses = ref([])

const profileForm = ref({
  firstName: user.value.firstName || '',
  lastName: user.value.lastName || '',
  email: user.value.email || '',
})

// Computed
const userDisplayName = computed(() => {
  if (!user.value.firstName && !user.value.lastName) return 'User'
  return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
})

const userInitials = computed(() => {
  const first = user.value.firstName?.[0] || ''
  const last = user.value.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'U'
})

// Methods
const handleUpdateProfile = async () => {
  isUpdating.value = true
  try {
    await userStore.updateProfile({
      firstName: profileForm.value.firstName,
      lastName: profileForm.value.lastName,
    })
    // Show success toast here if available
  } catch (error) {
    console.error('Failed to update profile:', error)
  } finally {
    isUpdating.value = false
  }
}

const handleLogout = async () => {
  await userStore.logout()
  await navigateTo('/auth/login')
}

onMounted(async () => {
  // Fetch additional profile data
  try {
    const [profile, locs] = await Promise.all([
      userStore.fetchProfile(),
      userStore.fetchAddresses().catch(() => []),
    ])

    if (locs) addresses.value = locs

    // In a real app, these would come from the profile/loyalty service
    loyaltyPoints.value = 150
    orderCount.value = 5
  } catch (error) {
    console.error('Error fetching profile data:', error)
  }
})

definePageMeta({
  middleware: ['auth'],
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
@use '~/assets/scss/abstracts/mixins' as *;

.profile-page {
  padding: var(--space-8) 0;
  min-height: calc(100vh - 200px);
  background: var(--bg-secondary);

  @include mobile-only {
    padding: var(--space-4) 0;
  }
}

.profile-page__grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-8);
  align-items: start;

  @include mobile-only {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
}

.profile-page__sidebar {
  @include tablet-up {
    position: sticky;
    top: 100px;
  }
}

.profile-page__user-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  background: rgba(var(--bg-primary-rgb), 0.8);
  backdrop-filter: blur(10px);
}

.profile-page__avatar-wrapper {
  position: relative;
  margin-bottom: var(--space-2);
}

.profile-page__avatar {
  width: 96px;
  height: 96px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  border-radius: 50%;
  box-shadow: 0 8px 16px rgba(var(--color-primary-rgb), 0.3);
}

.profile-page__role-badge {
  position: absolute;
  bottom: 0;
  right: -8px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border: 2px solid var(--bg-primary);
  text-transform: uppercase;
}

.profile-page__name {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0;
}

.profile-page__email {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin-top: calc(var(--space-1) * -1);
}

.profile-page__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  gap: var(--space-2);
  margin: var(--space-4) 0;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
}

.profile-page__stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile-page__stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-primary);
}

.profile-page__stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.profile-page__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.profile-page__section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-4);
  padding-left: var(--space-1);
  border-left: 4px solid var(--color-primary);
}

.profile-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile-page__form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);

  @include mobile-only {
    grid-template-columns: 1fr;
  }
}

.profile-page__form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-2);
}

.profile-page__address-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.profile-page__address-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);

  &:hover {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.02);
  }
}

.profile-page__address-icon {
  color: var(--color-primary);
}

.profile-page__address-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.profile-page__address-text {
  font-weight: var(--font-medium);
}

.profile-page__address-type {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: capitalize;
}

.profile-page__empty-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-tertiary);
}

.profile-page__add-address {
  width: auto;
}
</style>
