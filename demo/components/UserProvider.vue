<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, ref, readonly } from 'vue'

export const USER_KEY = Symbol('user')
export const AUTH_KEY = Symbol('auth')

const user = ref({
  id: 'u-001',
  name: 'Alice Dev',
  email: 'alice@example.com',
  role: 'admin',
})

const isAuthenticated = ref(true)

function logout() {
  isAuthenticated.value = false
  user.value = { id: '', name: '', email: '', role: '' }
}

provide(USER_KEY, readonly(user))
provide(AUTH_KEY, { isAuthenticated: readonly(isAuthenticated), logout })
// Also provide a plain string so the tree has mixed key types
provide('userLocale', 'en-US')
</script>
