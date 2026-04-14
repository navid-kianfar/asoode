<template>
  <Teleport to="body">
    <Transition name="cmd-palette-fade">
      <div v-if="visible" class="cmd-palette" @keydown="onKeydown">
        <div class="cmd-palette__backdrop" @click="close" />
        <div class="cmd-palette__container" ref="containerRef">
          <div class="cmd-palette__input-wrap">
            <i class="mdi mdi-magnify cmd-palette__input-icon" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="cmd-palette__input"
              :placeholder="$t('SEARCH_ANYWHERE')"
              autocomplete="off"
              spellcheck="false"
              @input="onInput"
            />
            <div v-if="loading" class="cmd-palette__spinner">
              <div class="cmd-palette__spinner-ring" />
            </div>
            <kbd class="cmd-palette__kbd">ESC</kbd>
          </div>

          <!-- Quick Access (default view when no query) -->
          <div v-if="!query.trim()" class="cmd-palette__results" ref="resultsRef">
            <template v-if="quickAccessItems.length">
              <template v-if="qaProjects.length">
                <div class="cmd-palette__section-title">
                  <i class="mdi mdi-briefcase" />
                  <span>{{ $t('PROJECTS') }}</span>
                  <span class="cmd-palette__count">{{ qaProjects.length }}</span>
                </div>
                <div
                  v-for="item in qaProjects"
                  :key="'qa-p-' + item.id"
                  class="cmd-palette__item"
                  :class="{ 'cmd-palette__item--selected': item._index === selectedIndex }"
                  :ref="el => setItemRef(el as HTMLElement, item._index)"
                  @click="selectItem(item)"
                  @mouseenter="selectedIndex = item._index"
                >
                  <div class="cmd-palette__item-icon cmd-palette__item-icon--project">
                    <i class="mdi" :class="item._raw?.complex ? 'mdi-sitemap' : 'mdi-briefcase-outline'" />
                  </div>
                  <div class="cmd-palette__item-info">
                    <span class="cmd-palette__item-title">{{ item.title }}</span>
                    <span v-if="item.subtitle" class="cmd-palette__item-subtitle">{{ item.subtitle }}</span>
                  </div>
                  <i class="mdi mdi-arrow-right cmd-palette__item-arrow" />
                </div>
              </template>

              <template v-if="qaGroups.length">
                <div class="cmd-palette__section-title">
                  <i class="mdi mdi-account-group" />
                  <span>{{ $t('GROUPS') }}</span>
                  <span class="cmd-palette__count">{{ qaGroups.length }}</span>
                </div>
                <div
                  v-for="item in qaGroups"
                  :key="'qa-g-' + item.id"
                  class="cmd-palette__item"
                  :class="{ 'cmd-palette__item--selected': item._index === selectedIndex }"
                  :ref="el => setItemRef(el as HTMLElement, item._index)"
                  @click="selectItem(item)"
                  @mouseenter="selectedIndex = item._index"
                >
                  <div class="cmd-palette__item-icon cmd-palette__item-icon--group">
                    <i class="mdi mdi-account-group-outline" />
                  </div>
                  <div class="cmd-palette__item-info">
                    <span class="cmd-palette__item-title">{{ item.title }}</span>
                    <span v-if="item.subtitle" class="cmd-palette__item-subtitle">{{ item.subtitle }}</span>
                  </div>
                  <i class="mdi mdi-arrow-right cmd-palette__item-arrow" />
                </div>
              </template>
            </template>

            <div v-else class="cmd-palette__empty">
              <i class="mdi mdi-lightning-bolt-outline" />
              <span>{{ $t('NO_DATA') }}</span>
            </div>
          </div>

          <!-- Search Results (when query is typed) -->
          <div v-else class="cmd-palette__results" ref="resultsRef">
            <!-- Loading shimmer -->
            <div v-if="loading && !flatResults.length" class="cmd-palette__shimmer">
              <div v-for="i in 4" :key="i" class="cmd-palette__shimmer-row">
                <div class="cmd-palette__shimmer-icon" />
                <div class="cmd-palette__shimmer-text" :style="{ width: 40 + i * 12 + '%' }" />
              </div>
            </div>

            <!-- Results sections -->
            <template v-else-if="flatResults.length">
              <template v-if="taskResults.length">
                <div class="cmd-palette__section-title">
                  <i class="mdi mdi-checkbox-marked-circle-outline" />
                  <span>{{ $t('TASKS') }}</span>
                  <span class="cmd-palette__count">{{ taskResults.length }}</span>
                </div>
                <div
                  v-for="item in taskResults"
                  :key="'t-' + item.id"
                  class="cmd-palette__item"
                  :class="{ 'cmd-palette__item--selected': item._index === selectedIndex }"
                  :ref="el => setItemRef(el as HTMLElement, item._index)"
                  @click="selectItem(item)"
                  @mouseenter="selectedIndex = item._index"
                >
                  <div class="cmd-palette__item-icon cmd-palette__item-icon--task">
                    <i class="mdi mdi-checkbox-marked-circle-outline" />
                  </div>
                  <div class="cmd-palette__item-info">
                    <span class="cmd-palette__item-title">{{ item.title }}</span>
                    <span v-if="item.subtitle" class="cmd-palette__item-subtitle">{{ item.subtitle }}</span>
                  </div>
                  <i class="mdi mdi-arrow-right cmd-palette__item-arrow" />
                </div>
              </template>

              <template v-if="projectResults.length">
                <div class="cmd-palette__section-title">
                  <i class="mdi mdi-briefcase" />
                  <span>{{ $t('PROJECTS') }}</span>
                  <span class="cmd-palette__count">{{ projectResults.length }}</span>
                </div>
                <div
                  v-for="item in projectResults"
                  :key="'p-' + item.id"
                  class="cmd-palette__item"
                  :class="{ 'cmd-palette__item--selected': item._index === selectedIndex }"
                  :ref="el => setItemRef(el as HTMLElement, item._index)"
                  @click="selectItem(item)"
                  @mouseenter="selectedIndex = item._index"
                >
                  <div class="cmd-palette__item-icon cmd-palette__item-icon--project">
                    <i class="mdi" :class="item._raw?.complex ? 'mdi-sitemap' : 'mdi-briefcase-outline'" />
                  </div>
                  <div class="cmd-palette__item-info">
                    <span class="cmd-palette__item-title">{{ item.title }}</span>
                    <span v-if="item.subtitle" class="cmd-palette__item-subtitle">{{ item.subtitle }}</span>
                  </div>
                  <i class="mdi mdi-arrow-right cmd-palette__item-arrow" />
                </div>
              </template>

              <template v-if="workPackageResults.length">
                <div class="cmd-palette__section-title">
                  <i class="mdi mdi-package-variant-closed" />
                  <span>{{ $t('WORK_PACKAGES') }}</span>
                  <span class="cmd-palette__count">{{ workPackageResults.length }}</span>
                </div>
                <div
                  v-for="item in workPackageResults"
                  :key="'wp-' + item.id"
                  class="cmd-palette__item"
                  :class="{ 'cmd-palette__item--selected': item._index === selectedIndex }"
                  :ref="el => setItemRef(el as HTMLElement, item._index)"
                  @click="selectItem(item)"
                  @mouseenter="selectedIndex = item._index"
                >
                  <div class="cmd-palette__item-icon cmd-palette__item-icon--project">
                    <i class="mdi mdi-package-variant-closed" />
                  </div>
                  <div class="cmd-palette__item-info">
                    <span class="cmd-palette__item-title">{{ item.title }}</span>
                    <span v-if="item.subtitle" class="cmd-palette__item-subtitle">{{ item.subtitle }}</span>
                  </div>
                  <i class="mdi mdi-arrow-right cmd-palette__item-arrow" />
                </div>
              </template>

              <template v-if="groupResults.length">
                <div class="cmd-palette__section-title">
                  <i class="mdi mdi-account-group" />
                  <span>{{ $t('GROUPS') }}</span>
                  <span class="cmd-palette__count">{{ groupResults.length }}</span>
                </div>
                <div
                  v-for="item in groupResults"
                  :key="'g-' + item.id"
                  class="cmd-palette__item"
                  :class="{ 'cmd-palette__item--selected': item._index === selectedIndex }"
                  :ref="el => setItemRef(el as HTMLElement, item._index)"
                  @click="selectItem(item)"
                  @mouseenter="selectedIndex = item._index"
                >
                  <div class="cmd-palette__item-icon cmd-palette__item-icon--group">
                    <i class="mdi mdi-account-group-outline" />
                  </div>
                  <div class="cmd-palette__item-info">
                    <span class="cmd-palette__item-title">{{ item.title }}</span>
                    <span v-if="item.subtitle" class="cmd-palette__item-subtitle">{{ item.subtitle }}</span>
                  </div>
                  <i class="mdi mdi-arrow-right cmd-palette__item-arrow" />
                </div>
              </template>
            </template>

            <!-- Empty state -->
            <div v-else-if="!loading" class="cmd-palette__empty">
              <i class="mdi mdi-magnify-close" />
              <span>{{ $t('NO_RESULT') }}</span>
            </div>
          </div>

          <!-- Footer hints -->
          <div class="cmd-palette__footer" v-if="activeItems.length">
            <span><kbd>&uarr;&darr;</kbd> navigate</span>
            <span><kbd>&crarr;</kbd> open</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { httpService } from '@/services/http.service';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import { useProjectNavigation } from '@/composables/useProjectNavigation';
import { API, OperationResultStatus } from '@asoode/shared';
import type { SearchResultViewModel, ProjectViewModel } from '@asoode/shared';

interface FlatResult {
  type: 'task' | 'project' | 'group' | 'work-package';
  id: string;
  title: string;
  subtitle?: string;
  _index: number;
  _raw?: any;
}

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'close': [];
  'open-task': [taskId: string];
}>();

const router = useRouter();
const projectStore = useProjectStore();
const groupStore = useGroupStore();
const { navigateToProject } = useProjectNavigation();

const inputRef = ref<HTMLInputElement>();
const resultsRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();
const itemRefs = ref<Record<number, HTMLElement>>({});

const query = ref('');
const loading = ref(false);
const selectedIndex = ref(0);
const searchData = ref<SearchResultViewModel>({ tasks: [], projects: [], workPackages: [], groups: [], members: [], storage: { files: [], folders: [] } });

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

// ─── Quick Access (default view, no query) ───────────────────

const qaProjects = computed<FlatResult[]>(() => {
  let idx = 0;
  return projectStore.projects.slice(0, 8).map(p => ({
    type: 'project' as const,
    id: p.id,
    title: p.title,
    subtitle: p.description || undefined,
    _index: idx++,
    _raw: p,
  }));
});

const qaGroups = computed<FlatResult[]>(() => {
  let idx = qaProjects.value.length;
  return groupStore.groups.slice(0, 8).map(g => ({
    type: 'group' as const,
    id: g.id,
    title: g.title,
    subtitle: g.description || undefined,
    _index: idx++,
    _raw: g,
  }));
});

const quickAccessItems = computed<FlatResult[]>(() => [
  ...qaProjects.value,
  ...qaGroups.value,
]);

// ─── Search Results (with query) ─────────────────────────────

const taskResults = computed<FlatResult[]>(() => {
  let idx = 0;
  return (searchData.value.tasks || []).map(t => ({
    type: 'task' as const,
    id: t.id,
    title: t.title,
    subtitle: [t.project, t.workPackage].filter(Boolean).join(' / ') || undefined,
    _index: idx++,
    _raw: t,
  }));
});

const projectResults = computed<FlatResult[]>(() => {
  let idx = taskResults.value.length;
  return (searchData.value.projects || []).map(p => ({
    type: 'project' as const,
    id: p.id,
    title: p.title,
    subtitle: p.description || undefined,
    _index: idx++,
    _raw: p,
  }));
});

const workPackageResults = computed<FlatResult[]>(() => {
  let idx = taskResults.value.length + projectResults.value.length;
  return (searchData.value.workPackages || []).map(wp => ({
    type: 'work-package' as const,
    id: wp.id,
    title: wp.title,
    subtitle: (wp as any).projectTitle || undefined,
    _index: idx++,
    _raw: wp,
  }));
});

const groupResults = computed<FlatResult[]>(() => {
  let idx = taskResults.value.length + projectResults.value.length + workPackageResults.value.length;
  return (searchData.value.groups || []).map(g => ({
    type: 'group' as const,
    id: g.id,
    title: g.title,
    subtitle: g.description || undefined,
    _index: idx++,
    _raw: g,
  }));
});

const flatResults = computed<FlatResult[]>(() => [
  ...taskResults.value,
  ...projectResults.value,
  ...workPackageResults.value,
  ...groupResults.value,
]);

// Unified list for keyboard navigation (works in both modes)
const activeItems = computed(() => query.value.trim() ? flatResults.value : quickAccessItems.value);

function setItemRef(el: HTMLElement | null, index: number) {
  if (el) itemRefs.value[index] = el;
}

function close() {
  emit('update:visible', false);
  emit('close');
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  selectedIndex.value = 0;

  const term = query.value.trim();
  if (!term) {
    searchData.value = { tasks: [], projects: [], workPackages: [], groups: [], members: [], storage: { files: [], folders: [] } };
    loading.value = false;
    return;
  }

  loading.value = true;
  const currentId = ++requestId;

  debounceTimer = setTimeout(async () => {
    const op = await httpService.post<SearchResultViewModel>(API.SEARCH, { query: term });
    if (currentId !== requestId) return;
    if (op.status === OperationResultStatus.Success) {
      searchData.value = op.data;
    }
    loading.value = false;
  }, 300);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  const items = activeItems.value;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (items.length) {
      selectedIndex.value = (selectedIndex.value + 1) % items.length;
      scrollSelectedIntoView();
    }
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (items.length) {
      selectedIndex.value = (selectedIndex.value - 1 + items.length) % items.length;
      scrollSelectedIntoView();
    }
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const item = items.find(r => r._index === selectedIndex.value);
    if (item) selectItem(item);
    return;
  }
}

function scrollSelectedIntoView() {
  nextTick(() => {
    const el = itemRefs.value[selectedIndex.value];
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function selectItem(item: FlatResult) {
  close();
  if (item.type === 'task') {
    emit('open-task', item.id);
  } else if (item.type === 'project') {
    const project = item._raw as ProjectViewModel;
    navigateToProject(project);
  } else if (item.type === 'work-package') {
    router.push(`/work-package/${item.id}`);
  } else if (item.type === 'group') {
    router.push(`/group/${item.id}`);
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    emit('update:visible', !props.visible);
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    query.value = '';
    searchData.value = { tasks: [], projects: [], workPackages: [], groups: [], members: [], storage: { files: [], folders: [] } };
    selectedIndex.value = 0;
    loading.value = false;
    nextTick(() => inputRef.value?.focus());
  }
});

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown);
});
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.cmd-palette {
  position: fixed;
  inset: 0;
  z-index: 9999;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  &__container {
    position: relative;
    top: 20vh;
    margin: 0 auto;
    width: 90vw;
    max-width: 640px;
    background: $surface;
    border-radius: $border-radius-lg;
    box-shadow: 0 16px 70px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  &__input-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    height: 56px;
    border-bottom: 1px solid $divider;
  }

  &__input-icon {
    font-size: 22px;
    color: $text-disabled;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 16px;
    color: $text-primary;
    font-family: inherit;

    &::placeholder {
      color: $text-disabled;
    }
  }

  &__spinner {
    flex-shrink: 0;

    &-ring {
      width: 20px;
      height: 20px;
      border: 2px solid $divider;
      border-top-color: $primary;
      border-radius: 50%;
      animation: cmd-palette-spin 0.6s linear infinite;
    }
  }

  &__kbd {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.06);
    color: $text-disabled;
    font-family: inherit;
    border: none;
    flex-shrink: 0;
  }

  &__results {
    max-height: 50vh;
    overflow-y: auto;
    padding: $spacing-sm 0;

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.12);
      border-radius: 4px;
    }
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: $spacing-sm 20px 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $text-disabled;

    .mdi {
      font-size: 14px;
    }
  }

  &__count {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 8px;
    background: rgba($primary, 0.1);
    color: $primary;
    margin-left: 4px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 20px;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover,
    &--selected {
      background: rgba($primary, 0.06);
    }

    &--selected {
      .cmd-palette__item-arrow {
        opacity: 1;
      }
    }
  }

  &__item-icon {
    width: 32px;
    height: 32px;
    border-radius: $border-radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .mdi {
      font-size: 16px;
    }

    &--task {
      background: rgba($primary, 0.1);
      color: $primary;
    }
    &--project {
      background: rgba($info, 0.1);
      color: $info;
    }
    &--group {
      background: rgba($success, 0.1);
      color: $success;
    }
  }

  &__item-info {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    display: block;
    font-size: 14px;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-subtitle {
    display: block;
    font-size: 11px;
    color: $text-disabled;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  }

  &__item-arrow {
    font-size: 16px;
    color: $text-disabled;
    opacity: 0;
    transition: opacity $transition-fast;
    flex-shrink: 0;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xl;
    color: $text-disabled;

    .mdi {
      font-size: 36px;
    }

    span {
      font-size: 13px;
    }
  }

  &__shimmer {
    padding: $spacing-sm 20px;
  }

  &__shimmer-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
  }

  &__shimmer-icon {
    width: 32px;
    height: 32px;
    border-radius: $border-radius-sm;
    background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
    background-size: 200% 100%;
    animation: cmd-palette-shimmer 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  &__shimmer-text {
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
    background-size: 200% 100%;
    animation: cmd-palette-shimmer 1.5s ease-in-out infinite;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 20px;
    border-top: 1px solid $divider;
    background: rgba(0, 0, 0, 0.02);
    font-size: 11px;
    color: $text-disabled;

    kbd {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.06);
      color: $text-disabled;
      font-family: inherit;
      border: none;
      margin-right: 4px;
    }
  }
}

@keyframes cmd-palette-spin {
  to { transform: rotate(360deg); }
}

@keyframes cmd-palette-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Transitions
.cmd-palette-fade-enter-active {
  transition: opacity 200ms ease;
  .cmd-palette__container {
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
  }
}
.cmd-palette-fade-leave-active {
  transition: opacity 150ms ease;
  .cmd-palette__container {
    transition: transform 150ms ease, opacity 150ms ease;
  }
}
.cmd-palette-fade-enter-from,
.cmd-palette-fade-leave-to {
  opacity: 0;
  .cmd-palette__container {
    transform: scale(0.95) translateY(-8px);
    opacity: 0;
  }
}

// Dark mode
body.dark-mode {
  .cmd-palette {
    &__backdrop {
      background: rgba(0, 0, 0, 0.7);
    }

    &__container {
      background: $dark-card;
      box-shadow: 0 16px 70px rgba(0, 0, 0, 0.4), 0 0 0 1px $dark-border;
    }

    &__input-wrap {
      border-bottom-color: $dark-border;
    }

    &__input-icon {
      color: $dark-text-muted;
    }

    &__input {
      color: $dark-text-light;

      &::placeholder {
        color: $dark-text-muted;
      }
    }

    &__spinner-ring {
      border-color: $dark-border;
      border-top-color: $primary-light;
    }

    &__kbd {
      background: rgba(255, 255, 255, 0.08);
      color: $dark-text-muted;
    }

    &__results {
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
      }
    }

    &__section-title {
      color: $dark-text-muted;
    }

    &__count {
      background: rgba($primary-light, 0.15);
      color: $primary-light;
    }

    &__item {
      &:hover,
      &--selected {
        background: rgba(255, 255, 255, 0.06);
      }
    }

    &__item-icon {
      &--task {
        background: rgba($primary-light, 0.15);
        color: $primary-light;
      }
      &--project {
        background: rgba($info, 0.15);
        color: lighten($info, 15%);
      }
      &--group {
        background: rgba($success, 0.15);
        color: lighten($success, 15%);
      }
    }

    &__item-title {
      color: $dark-text-light;
    }

    &__item-subtitle {
      color: $dark-text-muted;
    }

    &__item-arrow {
      color: $dark-text-muted;
    }

    &__empty {
      color: $dark-text-muted;
    }

    &__shimmer-icon,
    &__shimmer-text {
      background: linear-gradient(90deg, $dark-card 25%, $dark-card-inner 50%, $dark-card 75%);
      background-size: 200% 100%;
    }

    &__footer {
      border-top-color: $dark-border;
      background: rgba(0, 0, 0, 0.15);
      color: $dark-text-muted;

      kbd {
        background: rgba(255, 255, 255, 0.08);
        color: $dark-text-muted;
      }
    }
  }
}
</style>
