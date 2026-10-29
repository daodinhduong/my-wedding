<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/nha-trai', query: route.query, hash: route.hash }, { replace: true, redirectCode: 302 })
</script>

<template>
  <div />
</template>
