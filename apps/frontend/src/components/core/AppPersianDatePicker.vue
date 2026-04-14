<template>
  <AppDatePicker v-bind="$attrs" />
</template>

<script setup lang="ts">
import AppDatePicker from './AppDatePicker.vue';
// Persian date picker uses the same component for now
// Full Jalali calendar integration can be added with date-fns-jalali
</script>
