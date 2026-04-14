<template>
  <div class="feature-row">
    <div class="feature-row__content">
      <h2 class="site-h2 mb-4">{{ title }}</h2>
      <p class="site-body mb-6">{{ description }}</p>
      <ul class="feature-points">
        <li v-for="point in points" :key="point" class="d-flex align-start ga-2 mb-3">
          <v-icon color="primary" size="20" class="mt-1 flex-shrink-0">mdi-check-circle</v-icon>
          <span class="site-body">{{ point }}</span>
        </li>
      </ul>
    </div>
    <div class="feature-row__image">
      <v-icon size="48" color="grey-lighten-1">mdi-image-outline</v-icon>
      <span class="text-caption text-medium-emphasis mt-2">{{ screenshotAlt }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  points: string[]
  screenshotAlt: string
}>()
</script>

<style scoped>
.feature-points {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
