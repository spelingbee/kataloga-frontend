<template>
  <div class="menu-search">
    <BaseInput
      v-model="searchQuery"
      type="text"
      placeholder="Search menu items..."
      class="menu-search__input"
      @input="handleSearch"
    >
      <template #prefix>
        <BaseIcon name="search" size="sm" />
      </template>
      <template #suffix>
        <button
          v-if="searchQuery"
          class="menu-search__clear"
          @click="clearSearch"
        >
          <BaseIcon name="x" size="sm" />
        </button>
      </template>
    </BaseInput>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMenuStore } from '~/stores/menu'

const menuStore = useMenuStore()
const searchQuery = ref('')
let debounceTimer: NodeJS.Timeout | null = null

// Simple debounce function
const handleSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  debounceTimer = setTimeout(() => {
    menuStore.searchItems(searchQuery.value)
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  menuStore.clearSearch()
}

// Watch for external search query changes
watch(() => menuStore.searchQuery, (newQuery) => {
  if (newQuery !== searchQuery.value) {
    searchQuery.value = newQuery
  }
})
</script>

<style scoped lang="scss">
.menu-search {
  width: 100%;
}

.menu-search__input {
  width: 100%;
}

.menu-search__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
}
</style>