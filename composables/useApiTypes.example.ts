// Example integration of @kataloga/api-types in frontend
// This file demonstrates how to use generated types in a Nuxt/Vue application

import type { LoginDto, User, CreateMenuItemDto } from '@kataloga/api-types';

// Example 1: Composable with typed API calls
export function useAuthApi() {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl;

  async function login(credentials: LoginDto): Promise<User> {
    const response = await $fetch<User>(`${apiUrl}/auth/login`, {
      method: 'POST',
      body: credentials,
    });
    return response;
  }

  async function register(data: any) {
    return await $fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      body: data,
    });
  }

  return {
    login,
    register,
  };
}

// Example 2: Store with typed state
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  async function signIn(credentials: LoginDto) {
    const api = useAuthApi();
    const userData = await api.login(credentials);
    user.value = userData;
    // Store token logic here
  }

  function signOut() {
    user.value = null;
    token.value = null;
  }

  return {
    user,
    token,
    signIn,
    signOut,
  };
});

// Example 3: Component with typed props
// In a Vue component:
/*
<script setup lang="ts">
import type { User } from '@kataloga/api-types';

const props = defineProps<{
  user: User;
}>();

const authStore = useAuthStore();

async function handleLogin() {
  const credentials: LoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };
  
  await authStore.signIn(credentials);
}
</script>
*/
