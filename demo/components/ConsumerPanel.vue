<template>
  <div class="panel">
    <section class="card">
      <h2>Theme</h2>
      <p>Current theme: <code>{{ theme }}</code></p>
      <p>Primary color: <span class="swatch" :style="{ background: primaryColor }"></span> <code>{{ primaryColor }}</code></p>
      <button @click="toggleTheme">Toggle Theme</button>
    </section>

    <section class="card">
      <h2>User</h2>
      <p v-if="isAuthenticated">Logged in as <strong>{{ user?.name }}</strong> ({{ user?.role }})</p>
      <p v-else>Not authenticated</p>
      <p>Locale: <code>{{ userLocale }}</code></p>
    </section>

    <section class="card">
      <h2>Feature Flags</h2>
      <ul>
        <li v-for="(val, key) in flags" :key="key">
          <code>{{ key }}</code>: <span :class="val ? 'on' : 'off'">{{ val ? '✓ enabled' : '✗ disabled' }}</span>
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>Cart ({{ items.length }} items — total: ${{ total.toFixed(2) }})</h2>
      <ul>
        <li v-for="item in items" :key="item.id">
          {{ item.name }} × {{ item.qty }} = ${{ (item.qty * item.price).toFixed(2) }}
          <button class="remove" @click="removeItem(item.id)">✕</button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import type { Ref } from 'vue'
import { THEME_KEY } from './ThemeProvider.vue'
import { USER_KEY, AUTH_KEY } from './UserProvider.vue'
import { FEATURE_FLAGS_KEY } from './FeatureFlagProvider.vue'
import { CART_KEY } from './CartProvider.vue'

const themeCtx = inject<{ theme: Ref<string>; toggleTheme: () => void }>(THEME_KEY)!
const theme = themeCtx.theme
const toggleTheme = themeCtx.toggleTheme

const primaryColor = inject<string>('primaryColor', '#999')
const userLocale = inject<string>('userLocale', 'en')

const user = inject<Ref<{ name: string; role: string }>>(USER_KEY)
const authCtx = inject<{ isAuthenticated: Ref<boolean>; logout: () => void }>(AUTH_KEY)!
const isAuthenticated = authCtx.isAuthenticated

const featureCtx = inject<{ flags: Record<string, boolean>; isEnabled: (k: string) => boolean }>(FEATURE_FLAGS_KEY)!
const flags = featureCtx.flags

const cartCtx = inject<{
  items: Ref<{ id: string; name: string; qty: number; price: number }[]>
  total: Ref<number>
  addItem: (item: { id: string; name: string; qty: number; price: number }) => void
  removeItem: (id: string) => void
}>(CART_KEY)!
const { items, total, removeItem } = cartCtx
</script>

<style scoped>
.panel { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
}
h2 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #41b883; }
p, li { font-size: 0.875rem; color: #cbd5e1; margin-bottom: 0.25rem; }
code { background: #0f172a; padding: 0.1em 0.3em; border-radius: 4px; font-size: 0.8em; }
button {
  margin-top: 0.5rem;
  background: #41b883;
  color: #0f172a;
  border: none;
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}
.remove { background: #ef4444; color: #fff; margin-left: 0.5rem; padding: 0.1rem 0.4rem; margin-top: 0; }
.swatch { display: inline-block; width: 12px; height: 12px; border-radius: 2px; vertical-align: middle; }
.on { color: #41b883; }
.off { color: #64748b; }
ul { padding-left: 1rem; }
</style>
