<template>
  <div class="search-results">
    <AppWaiting v-if="searchStore.searching" />
    <template v-else-if="results">
      <!-- Tasks -->
      <div v-if="results.tasks?.length" class="result-section mb-6">
        <h4 class="text-subtitle-2 d-flex align-center mb-2">
          <v-icon size="18" class="mr-2">mdi-checkbox-marked-outline</v-icon>
          {{ $t('TASKS') }}
          <v-chip size="x-small" class="ml-2" variant="tonal">{{ results.tasks.length }}</v-chip>
        </h4>
        <v-list density="compact">
          <v-list-item
            v-for="task in results.tasks"
            :key="task.id"
            class="rounded mb-1"
            @click="$emit('openTask', task)"
          >
            <template #prepend>
              <v-icon size="16" :color="getTaskStateColor(task.state)">mdi-circle</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ task.title }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ task.project }} / {{ task.workPackage }} / {{ task.list }}
            </v-list-item-subtitle>
            <template #append>
              <div v-if="task.labels?.length" class="d-flex ga-1">
                <div
                  v-for="label in task.labels.slice(0, 3)"
                  :key="label.title"
                  class="rounded-pill"
                  style="width: 8px; height: 8px"
                  :style="{ backgroundColor: label.color }"
                />
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Projects -->
      <div v-if="results.projects?.length" class="result-section mb-6">
        <h4 class="text-subtitle-2 d-flex align-center mb-2">
          <v-icon size="18" class="mr-2">mdi-clipboard-text-outline</v-icon>
          {{ $t('PROJECTS') }}
          <v-chip size="x-small" class="ml-2" variant="tonal">{{ results.projects.length }}</v-chip>
        </h4>
        <v-list density="compact">
          <v-list-item
            v-for="project in results.projects"
            :key="project.id"
            class="rounded mb-1"
            @click="$emit('openProject', project)"
          >
            <template #prepend>
              <v-icon size="16" color="blue">mdi-clipboard-text</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ project.title }}</v-list-item-title>
            <v-list-item-subtitle v-if="project.description" class="text-caption text-truncate">
              {{ project.description }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Groups -->
      <div v-if="results.groups?.length" class="result-section mb-6">
        <h4 class="text-subtitle-2 d-flex align-center mb-2">
          <v-icon size="18" class="mr-2">mdi-account-group-outline</v-icon>
          {{ $t('GROUPS') }}
          <v-chip size="x-small" class="ml-2" variant="tonal">{{ results.groups.length }}</v-chip>
        </h4>
        <v-list density="compact">
          <v-list-item
            v-for="group in results.groups"
            :key="group.id"
            class="rounded mb-1"
            @click="$emit('openGroup', group)"
          >
            <template #prepend>
              <v-avatar size="28" color="primary">
                <v-img v-if="group.avatar" :src="group.avatar" />
                <v-icon v-else color="white" size="16">mdi-domain</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ group.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Work Packages -->
      <div v-if="results.workPackages?.length" class="result-section mb-6">
        <h4 class="text-subtitle-2 d-flex align-center mb-2">
          <v-icon size="18" class="mr-2">mdi-package-variant-closed</v-icon>
          {{ $t('WORK_PACKAGES') }}
          <v-chip size="x-small" class="ml-2" variant="tonal">{{ results.workPackages.length }}</v-chip>
        </h4>
        <v-list density="compact">
          <v-list-item
            v-for="wp in results.workPackages"
            :key="wp.id"
            class="rounded mb-1"
            @click="$emit('openWorkPackage', wp)"
          >
            <template #prepend>
              <v-icon size="16" :color="wp.color || 'primary'">mdi-package-variant-closed</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ wp.title }}</v-list-item-title>
            <v-list-item-subtitle v-if="(wp as any).projectTitle" class="text-caption">
              {{ (wp as any).projectTitle }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Members -->
      <div v-if="results.members?.length" class="result-section mb-6">
        <h4 class="text-subtitle-2 d-flex align-center mb-2">
          <v-icon size="18" class="mr-2">mdi-account-outline</v-icon>
          {{ $t('MEMBERS') }}
          <v-chip size="x-small" class="ml-2" variant="tonal">{{ results.members.length }}</v-chip>
        </h4>
        <v-list density="compact">
          <v-list-item
            v-for="member in results.members"
            :key="member.id"
            class="rounded mb-1"
            @click="$emit('openMember', member)"
          >
            <template #prepend>
              <v-avatar size="28" color="primary">
                <v-img v-if="member.avatar" :src="member.avatar" />
                <span v-else class="text-white text-caption">{{ member.initials || '?' }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ member.fullName }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ member.email }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Storage (Files & Folders) -->
      <div v-if="results.storage?.files?.length || results.storage?.folders?.length" class="result-section mb-6">
        <h4 class="text-subtitle-2 d-flex align-center mb-2">
          <v-icon size="18" class="mr-2">mdi-folder-outline</v-icon>
          {{ $t('FILES') }}
          <v-chip size="x-small" class="ml-2" variant="tonal">
            {{ (results.storage.files?.length || 0) + (results.storage.folders?.length || 0) }}
          </v-chip>
        </h4>
        <v-list density="compact">
          <v-list-item
            v-for="folder in results.storage.folders"
            :key="'folder-' + folder.path"
            class="rounded mb-1"
          >
            <template #prepend>
              <v-icon size="16" color="amber-darken-2">mdi-folder</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ folder.name }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-for="file in results.storage.files"
            :key="'file-' + file.path"
            class="rounded mb-1"
          >
            <template #prepend>
              <v-icon size="16" color="grey">mdi-file-outline</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ file.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ formatSize(file.size) }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- No results -->
      <div v-if="isEmpty" class="text-center text-medium-emphasis text-body-2 pa-8">
        {{ $t('NO_RESULTS') }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSearchStore } from '@/stores/search.store';
import { WorkPackageTaskState, type SearchResultViewModel } from '@asoode/shared';
import AppWaiting from '@/components/core/AppWaiting.vue';

defineEmits<{
  openTask: [task: any];
  openProject: [project: any];
  openWorkPackage: [wp: any];
  openGroup: [group: any];
  openMember: [member: any];
}>();

const searchStore = useSearchStore();

const results = computed<SearchResultViewModel | null>(() => searchStore.results);

const isEmpty = computed(() => {
  if (!results.value) return true;
  const r = results.value;
  return (
    !r.tasks?.length &&
    !r.projects?.length &&
    !r.workPackages?.length &&
    !r.groups?.length &&
    !r.members?.length &&
    !r.storage?.files?.length &&
    !r.storage?.folders?.length
  );
});

function getTaskStateColor(state: WorkPackageTaskState): string {
  switch (state) {
    case WorkPackageTaskState.Done: return 'success';
    case WorkPackageTaskState.InProgress: return 'info';
    case WorkPackageTaskState.Blocked:
    case WorkPackageTaskState.Blocker: return 'error';
    case WorkPackageTaskState.Paused: return 'warning';
    default: return 'primary';
  }
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}
</script>
