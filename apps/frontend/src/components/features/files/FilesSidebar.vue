<template>
  <div :class="['fs', { 'fs--collapsed': collapsed }]">
    <div class="fs-header">
      <i class="mdi mdi-folder-multiple fs-header__icon"></i>
      <span v-if="!collapsed" class="fs-header__text">{{ $t('FILES') }}</span>
    </div>

    <!-- STORAGE -->
    <div class="fs-section">
      <button class="fs-section__header" @click="storageOpen = !storageOpen">
        <span>{{ $t('STORAGE') }}</span>
        <i :class="['mdi', storageOpen ? 'mdi-chevron-down' : 'mdi-chevron-right']"></i>
      </button>
      <div v-if="storageOpen" class="fs-section__items">
        <button
          :class="['fs-item', { 'fs-item--active': isStorageActive }]"
          @click="$emit('navigate', { source: 'storage', path: '/' })"
        >
          <i class="mdi mdi-folder-lock fs-item__icon"></i>
          <span class="fs-item__label">{{ $t('MY_FILES') }}</span>
        </button>
      </div>
    </div>

    <!-- PROJECTS -->
    <div class="fs-section">
      <button class="fs-section__header" @click="projectsOpen = !projectsOpen">
        <span>{{ $t('PROJECTS') }}</span>
        <i :class="['mdi', projectsOpen ? 'mdi-chevron-down' : 'mdi-chevron-right']"></i>
      </button>
      <div v-if="projectsOpen" class="fs-section__items">
        <button
          :class="['fs-item', { 'fs-item--active': isProjectActive(p.id) }]"
          v-for="p in projects"
          :key="p.id"
          @click="$emit('navigate', { source: 'projects', level: 'project', projectId: p.id })"
        >
          <i class="mdi mdi-briefcase fs-item__icon"></i>
          <span class="fs-item__label">{{ p.title }}</span>
        </button>
        <div v-if="!projects.length" class="fs-item fs-item--empty">
          {{ $t('NO_ITEMS') }}
        </div>
      </div>
    </div>

    <!-- CHANNELS -->
    <div class="fs-section">
      <button class="fs-section__header" @click="channelsOpen = !channelsOpen">
        <span>{{ $t('CHANNELS') }}</span>
        <i :class="['mdi', channelsOpen ? 'mdi-chevron-down' : 'mdi-chevron-right']"></i>
      </button>
      <div v-if="channelsOpen" class="fs-section__items">
        <button
          :class="['fs-item', { 'fs-item--active': isChannelActive(ch.id) }]"
          v-for="ch in channels"
          :key="ch.id"
          @click="$emit('navigate', { source: 'channels', level: 'channel', channelId: ch.id })"
        >
          <i :class="['fs-item__icon', 'mdi', ch.type === 1 ? 'mdi-account' : 'mdi-pound']"></i>
          <span class="fs-item__label">{{ ch.title || 'Direct Message' }}</span>
        </button>
        <div v-if="!channels.length" class="fs-item fs-item--empty">
          {{ $t('NO_ITEMS') }}
        </div>
      </div>
    </div>

    <!-- Collapse toggle -->
    <div class="fs-footer">
      <button class="fs-collapse-btn" @click="$emit('toggle-sidebar')">
        <i :class="['mdi', collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left']"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { useMessengerStore } from '@/stores/messenger.store';
import type { FilesLocation } from '@/composables/useFilesNavigation';

const props = defineProps<{
  location: FilesLocation;
  collapsed: boolean;
}>();

defineEmits<{
  navigate: [location: FilesLocation];
  'toggle-sidebar': [];
}>();

const projectStore = useProjectStore();
const messengerStore = useMessengerStore();

const storageOpen = ref(true);
const projectsOpen = ref(true);
const channelsOpen = ref(true);

const projects = computed(() => projectStore.projects.filter((p) => !p.archivedAt));
const channels = computed(() => messengerStore.channels.directs);

const isStorageActive = computed(() => props.location.source === 'storage');

function isProjectActive(projectId: string) {
  const loc = props.location;
  return loc.source === 'projects' && 'projectId' in loc && loc.projectId === projectId;
}

function isChannelActive(channelId: string) {
  const loc = props.location;
  return loc.source === 'channels' && 'channelId' in loc && loc.channelId === channelId;
}

onMounted(async () => {
  if (!projectStore.projects.length) await projectStore.load();
  if (!messengerStore.channels.directs.length) await messengerStore.load();
});
</script>

<style lang="scss">
.fs {
  width: 260px;
  border-right: 1px solid #eee;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.2s ease;
  flex-shrink: 0;

  &--collapsed {
    width: 48px;
    .fs-header__text,
    .fs-section__header span,
    .fs-section__items,
    .fs-item__label {
      display: none;
    }
    .fs-section__header i { display: none; }
  }
}

.fs-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid #eee;

  &__icon {
    font-size: 1.2rem;
    color: #673AB7;
  }

  &__text {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
  }
}

.fs-section {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #999;
    transition: color 0.1s;

    &:hover { color: #666; }

    i {
      font-size: 0.9rem;
      transition: transform 0.15s;
    }
  }

  &__items {
    padding-bottom: 4px;
  }
}

.fs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 16px 7px 24px;
  background: none;
  border: none;
  border-left: 3px solid transparent;
  cursor: pointer;
  font-size: 0.84rem;
  color: #555;
  transition: all 0.1s;
  text-align: left;

  &:hover {
    background: rgba(103, 58, 183, 0.04);
    color: #333;
  }

  &--active {
    background: rgba(103, 58, 183, 0.08);
    border-left-color: #673AB7;
    color: #673AB7;
    font-weight: 500;
  }

  &--empty {
    font-size: 0.78rem;
    color: #bbb;
    cursor: default;
    &:hover { background: none; }
  }

  &__icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
}

.fs-footer {
  margin-top: auto;
  padding: 8px;
  border-top: 1px solid #eee;
}

.fs-collapse-btn {
  width: 100%;
  padding: 6px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #999;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;

  &:hover { background: #f0f0f0; color: #666; }
}

@media (max-width: 768px) {
  .fs {
    position: fixed;
    left: 0;
    top: 58px;
    height: calc(100vh - 58px);
    z-index: 50;
    box-shadow: 2px 0 16px rgba(0, 0, 0, 0.1);

    &--collapsed {
      width: 0;
      border: none;
      overflow: hidden;
    }
  }
}

body.dark-mode {
  .fs {
    background: #2b2b2b;
    border-right-color: #444;
  }
  .fs-header {
    border-bottom-color: #444;
    &__icon { color: #59a8ef; }
    &__text { color: #ccc; }
  }
  .fs-section__header {
    color: #666;
    &:hover { color: #999; }
  }
  .fs-item {
    color: #888;
    &:hover {
      background: rgba(89, 168, 239, 0.06);
      color: #ccc;
    }
    &--active {
      background: rgba(89, 168, 239, 0.1);
      border-left-color: #59a8ef;
      color: #59a8ef;
    }
    &--empty { color: #555; }
  }
  .fs-footer {
    border-top-color: #444;
  }
  .fs-collapse-btn {
    color: #666;
    &:hover { background: #3b3b3b; color: #999; }
  }
}
</style>
