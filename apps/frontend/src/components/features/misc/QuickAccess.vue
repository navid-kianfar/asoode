<template>
  <v-card variant="flat" class="pa-3">
    <h4 class="text-subtitle-2 mb-2">{{ $t('QUICK_ACCESS') }}</h4>
    <v-list density="compact" nav>
      <v-list-item v-for="item in items" :key="item.id" :to="item.route" :prepend-icon="item.icon">
        <v-list-item-title class="text-body-2">{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';

const projectStore = useProjectStore();
const groupStore = useGroupStore();

const items = computed(() => {
  const result: { id: string; title: string; icon: string; route: string }[] = [];
  if (projectStore.projects) {
    projectStore.projects.slice(0, 3).forEach((p: any) => {
      result.push({ id: p.id, title: p.title, icon: 'mdi-briefcase', route: `/project/${p.id}` });
    });
  }
  if (groupStore.groups) {
    groupStore.groups.slice(0, 3).forEach((g: any) => {
      result.push({ id: g.id, title: g.title, icon: 'mdi-account-group', route: `/group/${g.id}` });
    });
  }
  return result;
});
</script>
