<template>
  <AppDatePicker v-bind="$attrs" />
</template>

<script setup lang="ts">
import AppDatePicker from './AppDatePicker.vue';
// Hijri date picker uses the same component for now
// Full Hijri calendar integration can be added later
</script>
