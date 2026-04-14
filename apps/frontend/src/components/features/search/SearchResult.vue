<template>
  <div>
    <div v-if="!results.length && !loading" class="text-center text-medium-emphasis pa-8">
      {{ $t('NO_RESULTS') }}
    </div>
    <AppWaiting v-if="loading" />
    <v-list v-else density="compact">
      <v-list-item v-for="item in results" :key="item.id" @click="$emit('select', item)">
        <template #prepend>
          <v-icon>{{ getIcon(item.type) }}</v-icon>
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
        <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
        <template #append>
          <v-chip size="x-small">{{ item.type }}</v-chip>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import AppWaiting from '@/components/core/AppWaiting.vue';

defineProps<{
  results: any[];
  loading?: boolean;
}>();
defineEmits<{ select: [item: any] }>();

function getIcon(type: string): string {
  const map: Record<string, string> = {
    task: 'mdi-checkbox-marked-circle-outline',
    project: 'mdi-briefcase',
    group: 'mdi-account-group',
    file: 'mdi-file',
    channel: 'mdi-message',
  };
  return map[type] || 'mdi-magnify';
}
</script>
