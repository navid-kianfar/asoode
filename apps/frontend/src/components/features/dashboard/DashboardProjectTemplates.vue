<template>
  <div class="d-flex flex-wrap ga-3">
    <v-card v-for="template in projectStore.templates" :key="template.id" class="pa-4 cursor-pointer template-card" width="200" @click="$emit('select', template)">
      <v-icon size="32" color="primary" class="mb-2">{{ template.icon || 'mdi-briefcase' }}</v-icon>
      <div class="font-weight-medium">{{ template.title }}</div>
      <div class="text-caption text-medium-emphasis mt-1">{{ template.description }}</div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '@/stores/project.store';
const projectStore = useProjectStore();
defineEmits<{ select: [template: any] }>();
</script>

<style scoped>
.template-card:hover { border-color: #673AB7; }
</style>
