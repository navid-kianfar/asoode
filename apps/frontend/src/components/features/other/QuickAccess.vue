<template>
  <v-menu v-model="open" :close-on-content-click="false" offset-y max-width="360" min-width="320">
    <template #activator="{ props: menuProps }">
      <slot name="activator" v-bind="{ props: menuProps }">
        <v-btn icon size="small" variant="text" v-bind="menuProps">
          <v-icon>mdi-lightning-bolt</v-icon>
        </v-btn>
      </slot>
    </template>

    <v-card>
      <div class="pa-3">
        <v-text-field
          v-model="query"
          density="compact"
          hide-details
          variant="outlined"
          :placeholder="$t('QUICK_SEARCH')"
          prepend-inner-icon="mdi-magnify"
          autofocus
          @keydown.enter="onEnter"
          @keydown.escape="open = false"
        />
      </div>

      <v-divider />

      <!-- Recent items -->
      <div v-if="!query.trim() && recentItems.length" class="pa-2">
        <div class="text-caption text-medium-emphasis px-2 mb-1">{{ $t('RECENT') }}</div>
        <v-list density="compact">
          <v-list-item
            v-for="item in recentItems"
            :key="item.id"
            class="rounded"
            @click="navigateTo(item)"
          >
            <template #prepend>
              <v-icon size="18" :color="item.color">{{ item.icon }}</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ item.subtitle }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Quick navigation links -->
      <div class="pa-2">
        <div class="text-caption text-medium-emphasis px-2 mb-1">{{ $t('NAVIGATION') }}</div>
        <v-list density="compact">
          <v-list-item
            v-for="link in filteredNavLinks"
            :key="link.route"
            class="rounded"
            @click="goToRoute(link.route)"
          >
            <template #prepend>
              <v-icon size="18" :color="link.color">{{ link.icon }}</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ link.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Groups -->
      <div v-if="filteredGroups.length" class="pa-2">
        <div class="text-caption text-medium-emphasis px-2 mb-1">{{ $t('GROUPS') }}</div>
        <v-list density="compact">
          <v-list-item
            v-for="group in filteredGroups.slice(0, 5)"
            :key="group.id"
            class="rounded"
            @click="goToRoute(`/group/${group.id}`)"
          >
            <template #prepend>
              <v-avatar size="24" color="primary">
                <v-img v-if="group.avatar" :src="group.avatar" />
                <v-icon v-else color="white" size="14">mdi-domain</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ group.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Projects -->
      <div v-if="filteredProjects.length" class="pa-2">
        <div class="text-caption text-medium-emphasis px-2 mb-1">{{ $t('PROJECTS') }}</div>
        <v-list density="compact">
          <v-list-item
            v-for="project in filteredProjects.slice(0, 5)"
            :key="project.id"
            class="rounded"
            @click="goToRoute(`/project/${project.id}`)"
          >
            <template #prepend>
              <v-icon size="18" color="blue">mdi-clipboard-text</v-icon>
            </template>
            <v-list-item-title class="text-body-2">{{ project.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupStore } from '@/stores/group.store';
import { useProjectStore } from '@/stores/project.store';
import { useI18n } from 'vue-i18n';

interface QuickNavItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  route: string;
}

const router = useRouter();
const groupStore = useGroupStore();
const projectStore = useProjectStore();
const { t } = useI18n();

const open = ref(false);
const query = ref('');

const recentItems = ref<QuickNavItem[]>([]);

const navLinks = computed<QuickNavItem[]>(() => [
  { id: 'dashboard', title: t('DASHBOARD'), icon: 'mdi-view-dashboard', color: 'purple', route: '/dashboard' },
  { id: 'kartabl', title: t('MY_TASKS'), icon: 'mdi-checkbox-marked-outline', color: 'blue', route: '/tasks' },
  { id: 'files', title: t('FILES'), icon: 'mdi-folder-outline', color: 'amber-darken-2', route: '/files' },
  { id: 'messenger', title: t('MESSENGER'), icon: 'mdi-chat-outline', color: 'green', route: '/messenger' },
  { id: 'calendar', title: t('CALENDAR'), icon: 'mdi-calendar', color: 'orange', route: '/calendar' },
  { id: 'profile', title: t('PROFILE'), icon: 'mdi-account-outline', color: 'teal', route: '/profile' },
]);

const filteredNavLinks = computed(() => {
  if (!query.value.trim()) return navLinks.value;
  const q = query.value.toLowerCase();
  return navLinks.value.filter((l) => l.title.toLowerCase().includes(q));
});

const filteredGroups = computed(() => {
  const groups = groupStore.groups || [];
  if (!query.value.trim()) return groups.slice(0, 3);
  const q = query.value.toLowerCase();
  return groups.filter((g) => g.title?.toLowerCase().includes(q));
});

const filteredProjects = computed(() => {
  const projects = projectStore.projects || [];
  if (!query.value.trim()) return projects.slice(0, 3);
  const q = query.value.toLowerCase();
  return projects.filter((p) => p.title?.toLowerCase().includes(q));
});

function navigateTo(item: QuickNavItem) {
  open.value = false;
  query.value = '';
  router.push(item.route);
}

function goToRoute(route: string) {
  open.value = false;
  query.value = '';
  router.push(route);
}

function onEnter() {
  // Navigate to first matching link, group, or project
  if (filteredNavLinks.value.length) {
    goToRoute(filteredNavLinks.value[0].route);
  } else if (filteredGroups.value.length) {
    goToRoute(`/group/${filteredGroups.value[0].id}`);
  } else if (filteredProjects.value.length) {
    goToRoute(`/project/${filteredProjects.value[0].id}`);
  }
}
</script>
