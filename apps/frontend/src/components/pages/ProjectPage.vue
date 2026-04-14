<template>
  <div class="project-page">
    <!-- Loading -->
    <ProjectSkeleton v-if="loading" />

    <template v-if="!loading && project">
      <div class="project-shell">
        <section class="project-overview">
          <div class="project-overview__main">
            <div class="project-overview__identity">
              <div class="project-overview__copy">
                <div class="project-overview__eyebrow">{{ $t('PROJECTS') }}</div>
                <div class="project-overview__title-row">
                  <h1>{{ project.title }}</h1>
                </div>
                <p class="project-overview__desc">
                  {{ project.description || $t('ROAD_MAP') }}
                </p>
              </div>
            </div>

            <div class="project-overview__side">
              <div class="project-overview__topbar">
                <button v-if="canAdmin" class="page-btn page-btn--subtle" @click="prepareEdit">
                  <i class="mdi mdi-pencil-outline"></i>
                  {{ $t('EDIT_PROJECT') }}
                </button>
              </div>
              <div class="project-overview__chips">
                <span class="project-overview__chip">
                  <i class="mdi mdi-account-group-outline"></i>
                  {{ individualMembersCount }} {{ $t('MEMBERS') }}
                </span>
                <span v-if="project.workPackages?.length" class="project-overview__chip">
                  <i class="mdi mdi-package-variant-closed"></i>
                  {{ project.workPackages.length }} {{ $t('WORK_PACKAGES') }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="!progressWaiting" class="project-metrics">
            <div class="project-metrics__card">
              <div class="project-metrics__meta">
                <span class="project-metrics__label">{{ $t('CREATED') }}</span>
                <span class="project-metrics__value">{{ report.created.total }}</span>
              </div>
              <svg class="project-metrics__chart" viewBox="0 0 170 18" preserveAspectRatio="none">
                <polyline
                  v-if="report.created.progress.length"
                  :points="getSparklinePoints(report.created.progress, 170, 18)"
                  fill="none"
                  stroke="#4f46e5"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="project-metrics__card">
              <div class="project-metrics__meta">
                <span class="project-metrics__label">{{ $t('BLOCKED') }}</span>
                <span class="project-metrics__value">{{ report.blocked.total }}</span>
              </div>
              <svg class="project-metrics__chart" viewBox="0 0 170 18" preserveAspectRatio="none">
                <polyline
                  v-if="report.blocked.progress.length"
                  :points="getSparklinePoints(report.blocked.progress, 170, 18)"
                  fill="none"
                  stroke="#f97316"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="project-metrics__card">
              <div class="project-metrics__meta">
                <span class="project-metrics__label">{{ $t('DONE') }}</span>
                <span class="project-metrics__value">{{ report.done.total }}</span>
              </div>
              <svg class="project-metrics__chart" viewBox="0 0 170 18" preserveAspectRatio="none">
                <polyline
                  v-if="report.done.progress.length"
                  :points="getSparklinePoints(report.done.progress, 170, 18)"
                  fill="none"
                  stroke="#16a34a"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </section>
      </div>

      <!-- Tab Navigation -->
      <div class="project-tabs">
        <div class="project-tabs__inner">
          <button
            v-for="tab in visibleTabs"
            :key="tab.value"
            class="project-tabs__tab"
            :class="{ 'project-tabs__tab--active': mode === tab.value }"
            @click="mode = tab.value as typeof mode"
          >
            <i :class="'mdi ' + tab.icon"></i>
            <span>{{ $t(tab.label) }}</span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="project-content">
        <ProjectRoadMap v-if="mode === 'roadmap'" :project="project" />
        <ProjectTree v-if="mode === 'tree' && project.template === ProjectTemplate.None" :project="project" />
        <ProjectSeason v-if="mode === 'seasons'" :project="project" />
        <ProjectObjective v-if="mode === 'objectives'" :project="project" />
        <ProjectSetting v-if="mode === 'settings'" :project="project" />
      </div>
    </template>

    <div v-if="!loading && !project" class="project-page__empty">
      <i class="mdi mdi-folder-alert-outline"></i>
      <span>{{ $t('NOT_FOUND') }}</span>
    </div>

    <AppModal
      v-model="showEditModal"
      :title="$t('EDIT_PROJECT')"
      :width="480"
      :loading="editSaving"
      @close="showEditModal = false"
    >
      <div class="project-modal-body">
        <AppInput
          v-model="editForm.title"
          :label="$t('TITLE')"
          :placeholder="$t('TITLE')"
          dense
          class="mb-4"
        />
        <AppInput
          v-model="editForm.description"
          textArea
          :rows="3"
          :label="$t('DESCRIPTION')"
          :placeholder="$t('DESCRIPTION')"
          dense
        />
      </div>

      <template #footer>
        <v-btn variant="text" @click="showEditModal = false">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          :loading="editSaving"
          @click="saveEdit"
        >
          {{ $t('SAVE_CHANGES') }}
        </v-btn>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import { useProjectNavigation } from '@/composables/useProjectNavigation';
import { usePermission } from '@/composables/usePermission';
import {
  OperationResultStatus, ProjectTemplate,
  type ProjectViewModel,
} from '@asoode/shared';
import ProjectTree from '@/components/features/project/ProjectTree.vue';
import ProjectRoadMap from '@/components/features/project/ProjectRoadMap.vue';
import ProjectSeason from '@/components/features/project/ProjectSeason.vue';
import ProjectObjective from '@/components/features/project/ProjectObjective.vue';
import ProjectSetting from '@/components/features/project/ProjectSetting.vue';
import ProjectSkeleton from '@/components/core/skeletons/ProjectSkeleton.vue';
import { useModal } from '@/composables/useModal';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const groupStore = useGroupStore();
const { canAdmin: canAdminFn } = usePermission();
const { navigateToProject } = useProjectNavigation();

const loading = ref(true);
const progressWaiting = ref(true);
const project = ref<ProjectViewModel | null>(null);
const mode = ref<'roadmap' | 'tree' | 'seasons' | 'objectives' | 'settings'>('roadmap');
const modal = useModal();

const report = reactive({
  done: { total: 0, progress: [] as number[] },
  created: { total: 0, progress: [] as number[] },
  blocked: { total: 0, progress: [] as number[] },
});

// Edit modal
const showEditModal = ref(false);
const editSaving = ref(false);
const editForm = reactive({ title: '', description: '' });

const canAdmin = computed(() => {
  if (!project.value) return false;
  const permission = projectStore.getPermission(project.value);
  return canAdminFn(permission);
});

const individualMembersCount = computed(() => {
  if (!project.value) return 0;
  const nonGroupMembers = (project.value.members || []).filter(m => !m.isGroup);
  return nonGroupMembers.length + (project.value.pending?.length || 0);
});

const allTabs = computed(() => {
  const tabs = [
    { value: 'roadmap', label: 'ROAD_MAP', icon: 'mdi-map-outline' },
  ];
  if (project.value?.template === ProjectTemplate.None) {
    tabs.push({ value: 'tree', label: 'TREE_VIEW', icon: 'mdi-file-tree' });
  }
  tabs.push(
    { value: 'seasons', label: 'SEASONS', icon: 'mdi-flag-outline' },
    { value: 'objectives', label: 'OBJECTIVES', icon: 'mdi-target' },
  );
  if (canAdmin.value) {
    tabs.push({ value: 'settings', label: 'SETTINGS', icon: 'mdi-cog-outline' });
  }
  return tabs;
});

const visibleTabs = computed(() => allTabs.value);

const displayMembers = computed(() => {
  if (!project.value) return [];
  return (project.value.members || []).filter(m => !m.isGroup).slice(0, 5);
});

const extraMembersCount = computed(() => {
  if (!project.value) return 0;
  const total = (project.value.members || []).filter(m => !m.isGroup).length;
  return Math.max(0, total - 5);
});

function memberInitials(m: any): string {
  const fn = m.member?.firstName || m.member?.fullName || '';
  const ln = m.member?.lastName || '';
  return ((fn.charAt(0) || '') + (ln.charAt(0) || '')).toUpperCase() || '?';
}

function getSparklinePoints(data: number[], width: number, height: number): string {
  if (!data.length) return '';
  const max = Math.max(...data, 1);
  const step = width / Math.max(data.length - 1, 1);
  return data.map((val, i) => {
    const x = i * step;
    const y = height - (val / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
}

function prepareEdit() {
  if (!project.value) return;
  editForm.title = project.value.title;
  editForm.description = project.value.description || '';
  showEditModal.value = true;
}

async function saveEdit() {
  if (!project.value) return;
  editSaving.value = true;
  const op = await projectStore.edit(project.value.id, {
    title: editForm.title,
    description: editForm.description,
  });
  editSaving.value = false;
  if (op.status === OperationResultStatus.Success) {
    project.value.title = editForm.title;
    project.value.description = editForm.description;
    showEditModal.value = false;
  }
}

async function loadProject() {
  loading.value = true;
  progressWaiting.value = true;
  const id = route.params.id as string;

  const cachedProject = projectStore.projects.find(g => g.id === id) || null;
  if (cachedProject) {
    project.value = cachedProject;
  }

  const op = await projectStore.fetchProject(id);
  if (op.status !== OperationResultStatus.Success || !op.data) {
    loading.value = false;
    progressWaiting.value = false;
    router.push('/dashboard');
    return;
  }
  const p = op.data;
  project.value = p;
  if (project.value && !project.value.complex) {
    loading.value = false;
    navigateToProject(project.value);
    return;
  }
  loading.value = false;

  if (p.complex && mode.value === 'roadmap') {
    mode.value = 'tree';
  }

  // Load progress
  const progressResult = await projectStore.progress(id);
  if (progressResult.status === OperationResultStatus.Success && progressResult.data) {
    let progressData = progressResult.data;
    if (progressData.length < 90) {
      for (let i = 0; i < 90 - progressData.length; i++) {
        progressData.push({ blocked: 0, created: 0, date: '', done: 0 });
      }
    }
    report.blocked.progress = progressData.map(d => d.blocked);
    report.blocked.total = progressData.reduce((prev, obj) => prev + obj.blocked, 0);
    report.done.progress = progressData.map(d => d.done);
    report.done.total = progressData.reduce((prev, obj) => prev + obj.done, 0);
    report.created.progress = progressData.map(d => d.created);
    report.created.total = progressData.reduce((prev, obj) => prev + obj.created, 0);
  }
  progressWaiting.value = false;
}

function newSubProject() {
  modal.prompt({
    icon: 'mdi-file-tree',
    title: 'NEW_SUB_PROJECT',
    form: [
      {
        elements: [
          { config: { field: 'title' }, params: { model: '', placeHolder: 'TITLE' }, validation: { required: { value: true, message: 'TITLE_REQUIRED' } } },
          { config: { field: 'description' }, params: { model: '', textArea: true, placeHolder: 'DESCRIPTION' } },
        ],
      },
    ],
    action: async (params: any) => {
      if (!project.value) return;
      const op = await projectStore.createSubProject(project.value.id, params);
      if (op.status === OperationResultStatus.Success) {
        loadProject();
      }
    },
    actionLabel: 'CREATE',
    actionColor: 'primary',
  });
}

function newWorkPackage() {
  modal.prompt({
    icon: 'mdi-package-variant',
    title: 'NEW_WORK_PACKAGE',
    form: [
      {
        elements: [
          { config: { field: 'title' }, params: { model: '', placeHolder: 'TITLE' }, validation: { required: { value: true, message: 'TITLE_REQUIRED' } } },
        ],
      },
    ],
    action: async (params: any) => {
      if (!project.value) return;
      params.boardTemplate = 1;
      const op = await projectStore.createWorkPackage(project.value.id, params);
      if (op.status === OperationResultStatus.Success) {
        loadProject();
      }
    },
    actionLabel: 'CREATE',
    actionColor: 'primary',
  });
}

onMounted(loadProject);
watch(() => route.params.id, loadProject);
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.project-page {
  min-height: calc(100vh - 48px);
  background: $background;
  display: flex;
  flex-direction: column;

  &__loader {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    .mdi { font-size: 32px; color: $primary; }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: $text-secondary;
    gap: 8px;
    .mdi { font-size: 48px; color: $text-disabled; }
  }
}

.project-shell {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 18px 32px 10px;

  @media (max-width: 600px) {
    padding: 14px 12px 8px;
  }
}

.project-overview {
  padding: 8px 0 0;

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__identity {
    min-width: 0;
    flex: 1;
  }

  &__copy {
    min-width: 0;

    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.15;
      color: $text-primary;
    }
  }

  &__eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $text-secondary;
    margin-bottom: 6px;
  }

  &__title-row {
    display: flex;
    align-items: center;
  }

  &__desc {
    margin: 6px 0 0;
    max-width: 640px;
    color: $text-secondary;
    line-height: 1.45;
    font-size: 13px;
  }

  &__side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;

    @media (max-width: 900px) {
      align-items: flex-start;
    }
  }

  &__topbar {
    display: flex;
    justify-content: flex-end;
    width: 100%;

    @media (max-width: 900px) {
      justify-content: flex-start;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;

    @media (max-width: 900px) {
      justify-content: flex-start;
    }
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
  }
}

.project-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }

  &__card {
    padding: 12px 14px 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    min-width: 0;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 6px;
  }

  &__label {
    color: $text-secondary;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__value {
    color: $text-primary;
    font-size: 16px;
    font-weight: 700;
  }

  &__chart {
    display: block;
    width: 100%;
    height: 18px;
  }
}

// ── Tab Navigation ──
.project-tabs {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
    padding: 6px 32px;
    display: flex;
    gap: 4px;

    @media (max-width: 600px) {
      padding: 6px 12px;
    }
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 11px;
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 9px;
    cursor: pointer;
    white-space: nowrap;
    transition: color 200ms, border-color 200ms, background 200ms, box-shadow 200ms;
    font-family: inherit;
    min-height: 34px;

    .mdi { font-size: 14px; }

    &:hover {
      color: $text-primary;
      background: rgba(248, 250, 252, 0.92);
      border-color: rgba(226, 232, 240, 0.82);
    }

    &--active {
      color: #4338ca;
      background: rgba(238, 242, 255, 0.76);
      border-color: rgba(199, 210, 254, 0.88);
      box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.05);
    }

    @media (max-width: 600px) {
      padding: 7px 9px;
      span { display: none; }
    }
  }
}

// ── Content ──
.project-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 40px;
  width: 100%;

  @media (max-width: 600px) {
    padding: 12px;
  }
}

// ── Edit Modal ──
.project-edit-modal {
  background: $surface;
  border-radius: 16px;
  width: min(480px, calc(100vw - 32px));
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  animation: proj-modal-in 200ms ease-out;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid $divider;

    h3 { font-size: 16px; font-weight: 600; margin: 0; }

    button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 20px;
      color: $text-secondary;
      padding: 4px;
      border-radius: 6px;

      &:hover { background: rgba(0, 0, 0, 0.06); }
    }
  }

  &__body {
    padding: 20px 24px;
  }

  &__field {
    margin-bottom: 16px;

    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: $text-secondary;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    input, textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $divider;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      color: $text-primary;
      background: transparent;
      outline: none;
      transition: border-color 200ms;
      &:focus { border-color: $primary; }
    }

    textarea { resize: vertical; }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 24px;
    border-top: 1px solid $divider;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: background 200ms;
  white-space: nowrap;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: $primary;
    color: #fff;
    &:hover:not(:disabled) { background: $primary-dark; }
  }

  &--ghost {
    background: transparent;
    color: $text-secondary;
    border: 1px solid $divider;
    &:hover:not(:disabled) { background: rgba(0, 0, 0, 0.04); }
  }
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 34px;
  border-radius: 10px;
  padding: 0 12px;
  border: 1px solid transparent;
  background: transparent;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;

  &:hover {
    transform: translateY(-1px);
  }

  &--primary {
    color: #fff;
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    box-shadow: 0 12px 24px rgba(67, 56, 202, 0.18);
  }

  &--ghost {
    background: #fff;
    border-color: #dbe3ee;
    color: $text-secondary;
  }

  &--subtle {
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    background: transparent;
    border-color: transparent;
    color: $text-secondary;

    &:hover {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: $text-primary;
    }
  }
}

@keyframes proj-modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>

<!-- Dark mode (unscoped) -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .project-page {
    background: #1e1e1e;
  }

  .project-overview {
    background: linear-gradient(180deg, rgba(31, 41, 55, 0.92), rgba(17, 24, 39, 0.96));
    border-color: rgba(71, 85, 105, 0.55);

    &__badge {
      background: rgba(79, 70, 229, 0.16);
      box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.16);
    }

    &__copy h1 {
      color: $dark-text-light;
    }

    &__eyebrow,
    &__desc,
    &__chip {
      color: $dark-text-muted;
    }

    &__chip {
      background: rgba(30, 41, 59, 0.85);
      border-color: rgba(71, 85, 105, 0.7);
    }

    &__avatar {
      background: rgba(79, 70, 229, 0.18);
      color: #c7d2fe;
      border-color: #111827;
    }
  }

  .project-metrics__card {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(71, 85, 105, 0.7);
  }

  .project-metrics__label {
    color: $dark-text-muted;
  }

  .project-metrics__value {
    color: $dark-text-light;
  }

  .project-tabs {
    background: $dark-card;
    border-color: $dark-border;

    &__tab {
      color: $dark-text-muted;

      &:hover {
        color: $dark-text-light;
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(71, 85, 105, 0.7);
      }

      &--active {
        color: $primary-light;
        border-color: rgba(129, 140, 248, 0.45);
        background: rgba(79, 70, 229, 0.15);
      }
    }
  }

  .project-edit-modal {
    background: $dark-card;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);

    &__header {
      border-color: $dark-border;
      h3 { color: $dark-text-light; }
      button { color: $dark-text-muted; &:hover { background: rgba(255, 255, 255, 0.08); } }
    }

    &__field {
      label { color: $dark-text-muted; }
      input, textarea {
        border-color: $dark-border;
        color: $dark-text-light;
        &:focus { border-color: $primary-light; }
      }
    }

    &__footer { border-color: $dark-border; }
  }

  .project-page .btn {
    &--primary { background: $primary-light; &:hover:not(:disabled) { background: lighten($primary-light, 5%); } }
    &--ghost {
      color: $dark-text-muted;
      border-color: $dark-border;
      &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.06); }
    }
  }

  .project-page .page-btn {
    &--primary {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
    }

    &--ghost {
      background: rgba(30, 41, 59, 0.9);
      color: $dark-text-muted;
      border-color: rgba(71, 85, 105, 0.8);
    }

    &--subtle {
      color: $dark-text-muted;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(71, 85, 105, 0.7);
        color: $dark-text-light;
      }
    }
  }
}
</style>
