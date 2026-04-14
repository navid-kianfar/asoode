<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('ARCHIVED_PROJECTS') }}</h4>
    <AppWaiting v-if="loading" />
    <div v-else>
      <v-card v-for="project in projects" :key="project.id" variant="outlined" class="pa-3 mb-2">
        <div class="d-flex align-center">
          <div>
            <div class="font-weight-medium">{{ project.title }}</div>
            <div class="text-caption text-medium-emphasis">{{ project.archivedAt }}</div>
          </div>
          <v-spacer />
          <v-btn size="small" variant="outlined" @click="onRestore(project)">{{ $t('RESTORE') }}</v-btn>
        </div>
      </v-card>
      <div v-if="!projects.length" class="text-medium-emphasis text-body-2">{{ $t('NO_DATA') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { OperationResultStatus } from '@asoode/shared';
import AppWaiting from '@/components/core/AppWaiting.vue';

const projectStore = useProjectStore();
const loading = ref(true);
const projects = ref<any[]>([]);

onMounted(async () => {
  const result = await projectStore.archived();
  if (result.status === OperationResultStatus.Success) {
    projects.value = result.data || [];
  }
  loading.value = false;
});

async function onRestore(project: any) {
  await projectStore.archiveProject(project.id);
  projects.value = projects.value.filter(p => p.id !== project.id);
}
</script>
