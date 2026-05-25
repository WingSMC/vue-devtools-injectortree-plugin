<template>
  <div class="app">
    <h1>Vue Injector Tree — Demo</h1>
    <p class="subtitle"
      >Open Vue DevTools →
      <strong>Injector Tree</strong> tab to
      explore the provider hierarchy.</p
    >
    <ThemeProvider>
      <UserProvider>
        <FeatureFlagProvider>
          <CartProvider>
            <ConsumerPanel />
          </CartProvider>
        </FeatureFlagProvider>
      </UserProvider>
    </ThemeProvider>
  </div>
</template>

<script setup lang="ts">
import ThemeProvider from './components/ThemeProvider.vue';
import UserProvider from './components/UserProvider.vue';
import FeatureFlagProvider from './components/FeatureFlagProvider.vue';
import CartProvider from './components/CartProvider.vue';
import ConsumerPanel from './components/ConsumerPanel.vue';
</script>

<style>
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #41b883;
}
.subtitle {
  color: #94a3b8;
  margin-bottom: 2rem;
}
strong {
  color: #e2e8f0;
}
</style>
