<template>
  <div class="app-schedule">
    <div v-for="(item, i) in items" :key="i" class="schedule-item d-flex align-center pa-2 mb-1 rounded">
      <div class="schedule-time text-caption text-medium-emphasis" style="min-width: 80px">
        {{ item.time }}
      </div>
      <div class="schedule-bar flex-grow-1 rounded" :style="{ backgroundColor: item.color || '#673AB7', height: '24px', opacity: 0.8 }">
        <span class="text-white text-caption px-2">{{ item.title }}</span>
      </div>
    </div>
    <div v-if="!items?.length" class="text-center pa-4 text-medium-emphasis">{{ $t('NO_SCHEDULE') }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items?: Array<{ time: string; title: string; color?: string }>;
  range?: { start: Date; end: Date };
}>();
</script>
