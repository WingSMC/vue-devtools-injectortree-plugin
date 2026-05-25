<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, reactive } from 'vue'

export const FEATURE_FLAGS_KEY = Symbol('featureFlags')

const flags = reactive({
  newDashboard: true,
  betaCheckout: false,
  darkModeV2: true,
  aiSearch: false,
})

function isEnabled(flag: keyof typeof flags): boolean {
  return flags[flag] ?? false
}

provide(FEATURE_FLAGS_KEY, { flags, isEnabled })

// Override primaryColor to show key-override detection in the Injector Tree
provide('primaryColor', '#6366f1')
</script>
