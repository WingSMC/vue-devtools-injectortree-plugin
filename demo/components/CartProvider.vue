<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, ref, computed } from 'vue'

export const CART_KEY = Symbol('cart')

const items = ref<{ id: string; name: string; qty: number; price: number }[]>([
  { id: 'p1', name: 'Vue T-Shirt', qty: 2, price: 29.99 },
  { id: 'p2', name: 'DevTools Sticker Pack', qty: 1, price: 9.99 },
])

const total = computed(() =>
  items.value.reduce((sum, item) => sum + item.qty * item.price, 0),
)

function addItem(item: { id: string; name: string; qty: number; price: number }) {
  const existing = items.value.find((i) => i.id === item.id)
  if (existing) existing.qty += item.qty
  else items.value.push(item)
}

function removeItem(id: string) {
  items.value = items.value.filter((i) => i.id !== id)
}

provide(CART_KEY, { items, total, addItem, removeItem })
</script>
