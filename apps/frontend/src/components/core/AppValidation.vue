<template>
  <div v-if="errors?.length" class="app-validation">
    <div v-for="(error, i) in errors" :key="i" class="text-error text-caption">
      {{ $t(error) || error }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ errors?: string[] }>();
</script>
