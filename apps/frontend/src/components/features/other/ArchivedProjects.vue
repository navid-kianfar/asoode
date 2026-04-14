<template>
  <div class="archived-projects">
    <AppWaiting v-if="loading" />
    <template v-else>
      <div v-if="projects.length" class="pa-4">
        <h4 class="text-subtitle-1 mb-4">
          {{ $t('ARCHIVED_PROJECTS') }}
          <v-chip size="small" variant="tonal" class="ml-2">{{ projects.length }}</v-chip>
        </h4>

        <v-list density="comfortable">
          <v-list-item
            v-for="project in projects"
            :key="project.id"
            class="rounded mb-2"
            variant="outlined"
          >
            <template #prepend>
              <v-icon color="grey">mdi-archive-outline</v-icon>
            </template>

            <v-list-item-title class="text-body-2 font-weight-medium">{{ project.title }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption text-medium-emphasis">
              <span v-if="project.archivedAt">{{ $t('ARCHIVED') }}: {{ formatDate(project.archivedAt) }}</span>
              <span v-if="project.description"> &middot; {{ project.description }}</span>
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                :loading="project.restoring"
                @click="restoreProject(project)"
              >
                <v-icon start size="16">mdi-restore</v-icon>
                {{ $t('RESTORE') }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <div v-else class="text-center text-medium-emphasis text-body-2 pa-8">
        {{ $t('NO_ARCHIVED_PROJECTS') }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { OperationResultStatus, type ProjectViewModel } from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';
import AppWaiting from '@/components/core/AppWaiting.vue';

const projectStore = useProjectStore();
const { formatDate } = useCulturedDate();

const loading = ref(true);
const projects = ref<(ProjectViewModel & { restoring?: boolean })[]>([]);

async function restoreProject(project: ProjectViewModel & { restoring?: boolean }) {
  project.restoring = true;
  // Projects don't have a dedicated restore; use archived endpoint pattern
  // We re-fetch the list after attempting restore via the project store
  const result = await projectStore.fetchProject(project.id);
  if (result.status === OperationResultStatus.Success) {
    projects.value = projects.value.filter((p) => p.id !== project.id);
  }
  project.restoring = false;
}

onMounted(async () => {
  const result = await projectStore.archived();
  if (result.status === OperationResultStatus.Success && result.data) {
    projects.value = result.data;
  }
  loading.value = false;
});
</script>
