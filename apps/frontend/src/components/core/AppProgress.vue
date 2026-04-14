<template>
  <v-progress-linear :model-value="value" :color="color || 'primary'" :height="height || 4" rounded />
</template>

<script setup lang="ts">
defineProps<{ value?: number; color?: string; height?: number }>();
</script>
