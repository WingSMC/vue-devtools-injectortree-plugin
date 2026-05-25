<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, ref, readonly } from 'vue'

export const THEME_KEY = Symbol('theme')

const theme = ref<'light' | 'dark'>('dark')
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

provide(THEME_KEY, {
  theme: readonly(theme),
  toggleTheme,
})

provide('primaryColor', '#41b883')
provide('borderRadius', '8px')
</script>
