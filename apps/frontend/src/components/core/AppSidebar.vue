<template>
  <v-navigation-drawer v-model="drawer" :rail="rail" permanent>
    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        :title="$t('DASHBOARD')"
        to="/dashboard"
        :active="$route.path === '/dashboard'"
      />

      <v-list-item
        prepend-icon="mdi-checkbox-marked-outline"
        :title="$t('TASKS')"
        to="/tasks"
        :active="$route.path === '/tasks'"
      />

      <v-list-item
        prepend-icon="mdi-folder"
        :title="$t('FILES')"
        to="/files"
        :active="$route.path === '/files'"
      />

      <v-list-item
        prepend-icon="mdi-message"
        :title="$t('MESSENGER')"
        to="/messenger"
        :active="$route.path === '/messenger'"
      />

      <v-divider class="my-2" />

      <!-- Groups -->
      <v-list-subheader v-if="!rail">{{ $t('GROUPS') }}</v-list-subheader>
      <v-list-item
        v-for="group in groupStore.groups"
        :key="group.id"
        :title="group.title"
        :to="`/group/${group.id}`"
        :active="$route.params.id === group.id && $route.path.startsWith('/group')"
      >
        <template #prepend>
          <v-avatar size="24" color="primary" class="mr-2">
            <v-img v-if="group.avatar" :src="group.avatar" />
            <span v-else class="text-white text-caption">{{ group.title.charAt(0) }}</span>
          </v-avatar>
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-item
        v-for="project in projectStore.projects"
        :key="project.id"
        :title="project.title"
        :active="$route.params.id === project.id && $route.path.startsWith('/project')"
        prepend-icon="mdi-briefcase"
        @click="navigateToProject(project)"
      />
    </v-list>

    <template #append>
      <div class="pa-2">
        <v-btn
          block
          variant="text"
          :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          @click="rail = !rail"
        />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { useProjectStore } from '@/stores/project.store';
import { useProjectNavigation } from '@/composables/useProjectNavigation';

const groupStore = useGroupStore();
const projectStore = useProjectStore();
const { navigateToProject } = useProjectNavigation();
const drawer = ref(true);
const rail = ref(false);
</script>
