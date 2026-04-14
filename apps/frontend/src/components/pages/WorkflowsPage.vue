<template>
  <div class="wfp">
    <!-- Hero -->
    <div class="wfp-hero">
      <div class="wfp-hero__text">
        <h1 class="wfp-hero__title">{{ $t('WORKFLOWS') }}</h1>
        <p class="wfp-hero__sub">{{ $t('WORKFLOW_SUBTITLE') }}</p>
      </div>
      <button class="wfp-hero__btn" @click="showCreate = true">
        <i class="mdi mdi-plus"></i>
        {{ $t('WORKFLOW_CREATE') }}
      </button>
    </div>

    <!-- Loading -->
    <AppWaiting v-if="loading" />

    <!-- Empty -->
    <div v-if="!loading && !workflows.length" class="wfp-empty">
      <i class="mdi mdi-sitemap-outline"></i>
      <span>{{ $t('WORKFLOW_EMPTY') }}</span>
      <button class="wfp-empty__btn" @click="showCreate = true">
        {{ $t('WORKFLOW_CREATE_FIRST') }}
      </button>
    </div>

    <!-- List -->
    <div v-if="!loading && workflows.length" class="wfp-list">
      <div
        v-for="wf in workflows"
        :key="wf.id"
        class="wfp-card"
      >
        <div class="wfp-card__header">
          <div class="wfp-card__info">
            <span class="wfp-card__title">{{ wf.title }}</span>
            <span v-if="wf.description" class="wfp-card__desc">{{ wf.description }}</span>
          </div>
          <span
            class="wfp-card__badge"
            :class="{ 'wfp-card__badge--active': wf.active }"
          >{{ wf.active ? $t('ACTIVE') : $t('INACTIVE') }}</span>
        </div>

        <div class="wfp-card__meta">
          <span class="wfp-card__tag">
            <i class="mdi mdi-lightning-bolt-outline"></i>
            {{ triggerLabel(wf.trigger) }}
          </span>
          <span class="wfp-card__tag">
            <i class="mdi" :class="wf.projectId ? 'mdi-folder-outline' : 'mdi-earth'"></i>
            {{ wf.projectId ? projectName(wf.projectId) : $t('WORKFLOW_SCOPE_GLOBAL') }}
          </span>
          <span class="wfp-card__tag">
            <i class="mdi mdi-circle-slice-8"></i>
            {{ (wf.nodes || []).length }} {{ $t('WORKFLOW_NODES') }}
          </span>
          <span v-if="wf.executionCount" class="wfp-card__tag">
            <i class="mdi mdi-play-circle-outline"></i>
            {{ wf.executionCount }} {{ $t('WORKFLOW_RUNS') }}
          </span>
        </div>

        <div class="wfp-card__actions">
          <button class="wfp-card__action" @click="openDesigner(wf.id)" :title="$t('EDIT')">
            <i class="mdi mdi-pencil-outline"></i>
          </button>
          <button class="wfp-card__action" @click="toggleWorkflow(wf)" :title="wf.active ? $t('DEACTIVATE') : $t('ACTIVATE')">
            <i class="mdi" :class="wf.active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'"></i>
          </button>
          <button v-if="wf.trigger === 'manual'" class="wfp-card__action wfp-card__action--run" @click="runWorkflow(wf)" :title="$t('WORKFLOW_RUN')">
            <i class="mdi mdi-play"></i>
          </button>
          <button class="wfp-card__action" @click="viewExecutions(wf)" :title="$t('WORKFLOW_EXECUTIONS')">
            <i class="mdi mdi-history"></i>
          </button>
          <button class="wfp-card__action wfp-card__action--danger" @click="confirmRemove(wf)" :title="$t('DELETE')">
            <i class="mdi mdi-delete-outline"></i>
          </button>
        </div>
      </div>
    </div>

    <AppModal
      v-model="showCreate"
      :title="$t('WORKFLOW_CREATE')"
      :width="480"
      :loading="creating"
      @close="showCreate = false"
    >
      <div class="wfp-modal-body-content">
        <AppInput
          v-model="createForm.title"
          :label="$t('TITLE')"
          :placeholder="$t('WORKFLOW_TITLE_PLACEHOLDER')"
          dense
          class="mb-4"
        />
        <AppInput
          v-model="createForm.description"
          textArea
          :rows="3"
          :label="$t('DESCRIPTION')"
          :placeholder="$t('WORKFLOW_DESC_PLACEHOLDER')"
          dense
          class="mb-4"
        />
        <div class="wfp-field-label">{{ $t('PROJECT') }}</div>
        <AppSelect
          v-model="createForm.projectId"
          :items="[{ text: $t('WORKFLOW_SCOPE_GLOBAL'), value: '' }, ...projects.map(p => ({ text: p.title, value: p.id }))]"
          compact
          class="mb-4"
        />
        <div class="wfp-field-label">{{ $t('WORKFLOW_TRIGGER') }}</div>
        <AppSelect
          v-model="createForm.trigger"
          :items="[
            { text: $t('WORKFLOW_TRIGGER_MANUAL'), value: 'manual' },
            { text: $t('WORKFLOW_TRIGGER_TASK_CREATED'), value: 'task_created' },
            { text: $t('WORKFLOW_TRIGGER_STATE_CHANGED'), value: 'task_state_changed' },
            { text: $t('WORKFLOW_TRIGGER_TASK_ASSIGNED'), value: 'task_assigned' },
            { text: $t('WORKFLOW_TRIGGER_TASK_DUE'), value: 'task_due' },
            { text: $t('WORKFLOW_TRIGGER_MEMBER_ADDED'), value: 'member_added' },
            { text: $t('WORKFLOW_TRIGGER_COMMENT_ADDED'), value: 'comment_added' }
          ]"
          compact
        />
      </div>

      <template #footer>
        <v-btn variant="text" @click="showCreate = false">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          :loading="creating"
          :disabled="!createForm.title.trim()"
          @click="handleCreate"
        >
          {{ $t('CREATE') }}
        </v-btn>
      </template>
    </AppModal>

    <AppModal
      v-model="showExecutions"
      :title="$t('WORKFLOW_EXECUTIONS')"
      :width="640"
      @close="showExecutions = false"
    >
      <div v-if="loadingExecs" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else-if="!executionList.length" class="wfp-empty wfp-empty--inline">
        <span>{{ $t('WORKFLOW_NO_EXECUTIONS') }}</span>
      </div>
      <div v-else class="wfp-modal-body-scroll">
        <div v-for="exec in executionList" :key="exec.id" class="wfp-exec">
          <div class="wfp-exec__header">
            <span class="wfp-exec__status" :class="'wfp-exec__status--' + exec.status">
              {{ execStatusLabel(exec.status) }}
            </span>
            <span class="wfp-exec__time">
              {{ formatDate(exec.startedAt) }}
              <template v-if="exec.finishedAt">
                — {{ durationLabel(exec.startedAt, exec.finishedAt) }}
              </template>
            </span>
          </div>
          <div v-if="exec.error" class="wfp-exec__error">{{ exec.error }}</div>
          <div v-if="exec.logs?.length" class="wfp-exec__logs">
            <div
              v-for="(log, i) in exec.logs"
              :key="i"
              class="wfp-exec__log"
              :class="{ 'wfp-exec__log--expanded': expandedLogs.has(`${exec.id}-${i}`) }"
            >
              <div class="wfp-exec__log-row" @click="toggleLogExpand(exec.id, i)">
                <i class="mdi" :class="logIcon(log.status)"></i>
                <span class="wfp-exec__log-type">{{ log.nodeType }}</span>
                <span class="wfp-exec__log-label">{{ log.nodeLabel }}</span>
                <span class="wfp-exec__log-msg">{{ log.message }}</span>
                <i class="mdi wfp-exec__log-chevron" :class="expandedLogs.has(`${exec.id}-${i}`) ? 'mdi-chevron-up' : 'mdi-chevron-down'"></i>
              </div>
              <div v-if="expandedLogs.has(`${exec.id}-${i}`)" class="wfp-exec__log-detail">
                <div v-if="log.inputs && Object.keys(log.inputs).length" class="wfp-exec__log-section">
                  <span class="wfp-exec__log-section-title">{{ $t('WORKFLOW_INPUTS') }}</span>
                  <pre class="wfp-exec__log-json">{{ JSON.stringify(log.inputs, null, 2) }}</pre>
                </div>
                <div v-if="log.outputs && Object.keys(log.outputs).length" class="wfp-exec__log-section">
                  <span class="wfp-exec__log-section-title">{{ $t('WORKFLOW_OUTPUTS') }}</span>
                  <pre class="wfp-exec__log-json">{{ JSON.stringify(log.outputs, null, 2) }}</pre>
                </div>
                <div v-if="log.timestamp" class="wfp-exec__log-ts">{{ log.timestamp }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>

    <AppConfirm
      v-model="removeVisible"
      :title="$t('DELETE')"
      :message="$t('WORKFLOW_DELETE_CONFIRM')"
      :confirm-text="$t('DELETE')"
      :loading="removing"
      tone="danger"
      @confirm="handleRemove"
      @close="removeTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { OperationResultStatus, WorkflowExecutionStatus } from '@asoode/shared';
import type { WorkflowViewModel, WorkflowExecutionViewModel, WorkflowExecutionLogEntry, ProjectViewModel } from '@asoode/shared';
import { useWorkflowStore } from '@/stores/workflow.store';
import { useProjectStore } from '@/stores/project.store';
import AppWaiting from '@/components/core/AppWaiting.vue';

const router = useRouter();
const { t } = useI18n();
const workflowStore = useWorkflowStore();
const projectStore = useProjectStore();

const loading = ref(true);
const workflows = ref<WorkflowViewModel[]>([]);
const projects = ref<ProjectViewModel[]>([]);

// Create
const showCreate = ref(false);
const creating = ref(false);
const createForm = ref({ title: '', description: '', trigger: 'manual', projectId: '' });

// Executions
const showExecutions = ref(false);
const loadingExecs = ref(false);
const executionList = ref<WorkflowExecutionViewModel[]>([]);

// Remove
const removeTarget = ref<WorkflowViewModel | null>(null);
const removeVisible = computed({
  get: () => !!removeTarget.value,
  set: (v) => { if (!v) removeTarget.value = null; }
});
const removing = ref(false);

// Expanded log entries
const expandedLogs = ref<Set<string>>(new Set());

onMounted(async () => {
  await Promise.all([workflowStore.load(), projectStore.load()]);
  workflows.value = workflowStore.workflows;
  projects.value = projectStore.projects;
  loading.value = false;
});

function triggerLabel(trigger: string): string {
  const map: Record<string, string> = {
    manual: t('WORKFLOW_TRIGGER_MANUAL'),
    task_created: t('WORKFLOW_TRIGGER_TASK_CREATED'),
    task_state_changed: t('WORKFLOW_TRIGGER_STATE_CHANGED'),
    task_assigned: t('WORKFLOW_TRIGGER_TASK_ASSIGNED'),
    task_due: t('WORKFLOW_TRIGGER_TASK_DUE'),
    member_added: t('WORKFLOW_TRIGGER_MEMBER_ADDED'),
    comment_added: t('WORKFLOW_TRIGGER_COMMENT_ADDED'),
  };
  return map[trigger] || trigger;
}

function execStatusLabel(status: WorkflowExecutionStatus): string {
  const map: Record<number, string> = {
    [WorkflowExecutionStatus.Pending]: t('PENDING'),
    [WorkflowExecutionStatus.Running]: t('RUNNING'),
    [WorkflowExecutionStatus.Success]: t('SUCCESS'),
    [WorkflowExecutionStatus.Failed]: t('FAILED'),
    [WorkflowExecutionStatus.Cancelled]: t('CANCELLED'),
  };
  return map[status] || '';
}

function logIcon(status: string): string {
  if (status === 'success') return 'mdi-check-circle text-success';
  if (status === 'failed') return 'mdi-close-circle text-error';
  return 'mdi-minus-circle text-disabled';
}

function projectName(id: string): string {
  const p = projects.value.find((proj) => proj.id === id);
  return p?.title || id;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleString();
}

function durationLabel(start: Date | string, end: Date | string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function toggleLogExpand(execId: string, index: number) {
  const key = `${execId}-${index}`;
  if (expandedLogs.value.has(key)) {
    expandedLogs.value.delete(key);
  } else {
    expandedLogs.value.add(key);
  }
  // Trigger reactivity
  expandedLogs.value = new Set(expandedLogs.value);
}

function openDesigner(id: string) {
  router.push(`/workflows/${id}`);
}

async function handleCreate() {
  if (!createForm.value.title.trim() || creating.value) return;
  creating.value = true;
  const payload: any = {
    title: createForm.value.title,
    description: createForm.value.description,
    trigger: createForm.value.trigger,
  };
  if (createForm.value.projectId) payload.projectId = createForm.value.projectId;
  const op = await workflowStore.create(payload);
  creating.value = false;
  if (op.status === OperationResultStatus.Success) {
    workflows.value = workflowStore.workflows;
    showCreate.value = false;
    createForm.value = { title: '', description: '', trigger: 'manual', projectId: '' };
    if (op.data?.id) openDesigner(op.data.id);
  }
}

async function toggleWorkflow(wf: WorkflowViewModel) {
  await workflowStore.toggle(wf.id);
}

async function runWorkflow(wf: WorkflowViewModel) {
  await workflowStore.execute(wf.id);
}

async function viewExecutions(wf: WorkflowViewModel) {
  showExecutions.value = true;
  loadingExecs.value = true;
  const op = await workflowStore.executions(wf.id);
  loadingExecs.value = false;
  if (op.status === OperationResultStatus.Success) {
    executionList.value = op.data || [];
  }
}

function confirmRemove(wf: WorkflowViewModel) {
  removeTarget.value = wf;
}

async function handleRemove() {
  if (!removeTarget.value || removing.value) return;
  removing.value = true;
  const op = await workflowStore.remove(removeTarget.value.id);
  removing.value = false;
  if (op.status === OperationResultStatus.Success) {
    workflows.value = workflowStore.workflows;
    removeTarget.value = null;
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.wfp {
  min-height: 100vh;
  background: $background;
  padding: 0 $spacing-lg $spacing-lg;
}

.wfp-modal-body-content {
  padding: 4px;
}

.wfp-modal-body-scroll {
  max-height: 60vh;
  overflow-y: auto;
  padding: 4px;
}

.wfp-field-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 6px;
}

.wfp-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg 0;
  gap: $spacing-md;

  &__title {
    font-size: 1.4rem;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  &__sub {
    font-size: 0.82rem;
    color: $text-secondary;
    margin: 2px 0 0;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: $primary;
    color: #fff;
    border: none;
    border-radius: $border-radius-md;
    padding: 8px 16px;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;

    &:hover { opacity: 0.9; }
    i { font-size: 1.1rem; }
  }
}

// Empty
.wfp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 24px;
  color: $text-disabled;

  > i { font-size: 3rem; }
  > span { font-size: 0.88rem; }

  &--inline {
    padding: 24px;
  }

  &__btn {
    margin-top: 8px;
    background: $primary;
    color: #fff;
    border: none;
    border-radius: $border-radius-md;
    padding: 8px 20px;
    font-size: 0.82rem;
    cursor: pointer;

    &:hover { opacity: 0.9; }
  }
}

// List
.wfp-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: $spacing-md;
}

.wfp-card {
  background: $surface;
  border: 1px solid $divider;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__title {
    font-size: 0.92rem;
    font-weight: 600;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__desc {
    font-size: 0.75rem;
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    flex-shrink: 0;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
    background: rgba(0,0,0,0.06);
    color: $text-disabled;

    &--active {
      background: rgba($success, 0.12);
      color: $success;
    }
  }

  &__meta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    color: $text-secondary;

    i { font-size: 0.85rem; }
  }

  &__actions {
    display: flex;
    gap: 4px;
    border-top: 1px solid $divider;
    padding-top: 10px;
  }

  &__action {
    background: none;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: $border-radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $text-secondary;

    &:hover {
      background: rgba(0,0,0,0.05);
      color: $primary;
    }

    &--run:hover { color: $success; }
    &--danger:hover { color: $warn; }

    i { font-size: 1rem; }
  }
}

// Modal
.wfp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.wfp-modal {
  background: $surface;
  border-radius: $border-radius-lg;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-4;

  &--wide { max-width: 640px; }
  &--sm { max-width: 360px; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md;
    border-bottom: 1px solid $divider;
    font-weight: 600;
    font-size: 0.92rem;

    button {
      background: none;
      border: none;
      cursor: pointer;
      color: $text-secondary;
      font-size: 1.2rem;
    }
  }

  &__body {
    padding: $spacing-md;
    overflow-y: auto;
    flex: 1;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: $spacing-md;
    border-top: 1px solid $divider;
  }
}

.wfp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: $spacing-md;

  > span {
    font-size: 0.78rem;
    font-weight: 500;
    color: $text-primary;
  }

  input, textarea, select {
    border: 1px solid $divider;
    border-radius: $border-radius-sm;
    padding: 8px 12px;
    font-size: 0.82rem;
    outline: none;
    background: transparent;
    color: $text-primary;

    &:focus { border-color: $primary; }
  }
}

.wfp-btn {
  border: none;
  border-radius: $border-radius-sm;
  padding: 8px 20px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;

  &--primary {
    background: $primary;
    color: #fff;
    &:hover { opacity: 0.9; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &--secondary {
    background: transparent;
    color: $text-secondary;
    &:hover { background: rgba(0,0,0,0.04); }
  }

  &--danger {
    background: $warn;
    color: #fff;
    &:hover { opacity: 0.9; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

// Executions
.wfp-exec {
  border: 1px solid $divider;
  border-radius: $border-radius-md;
  padding: 12px;
  margin-bottom: 10px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__status {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 10px;

    &--0 { background: rgba(0,0,0,0.06); color: $text-disabled; }
    &--1 { background: rgba($info, 0.12); color: $info; }
    &--2 { background: rgba($success, 0.12); color: $success; }
    &--3 { background: rgba($warn, 0.12); color: $warn; }
    &--4 { background: rgba(0,0,0,0.06); color: $text-disabled; }
  }

  &__time {
    font-size: 0.7rem;
    color: $text-disabled;
  }

  &__error {
    background: rgba($warn, 0.08);
    color: $warn;
    font-size: 0.75rem;
    padding: 8px;
    border-radius: $border-radius-sm;
    margin-bottom: 8px;
  }

  &__logs {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__log {
    border: 1px solid transparent;
    border-radius: 4px;
    transition: all 0.15s ease;

    &--expanded {
      border-color: $divider;
      background: rgba(0,0,0,0.02);
    }
  }

  &__log-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    padding: 4px 6px;
    cursor: pointer;
    border-radius: 4px;

    &:hover { background: rgba(0,0,0,0.03); }

    > i:first-child { font-size: 0.85rem; }
  }

  &__log-type {
    font-size: 0.62rem;
    font-weight: 600;
    color: $text-disabled;
    background: rgba(0,0,0,0.04);
    padding: 1px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    flex-shrink: 0;
  }

  &__log-label {
    font-weight: 500;
    color: $text-primary;
    flex-shrink: 0;
  }

  &__log-msg {
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  &__log-chevron {
    font-size: 0.85rem;
    color: $text-disabled;
    flex-shrink: 0;
  }

  &__log-detail {
    padding: 8px 10px;
    border-top: 1px solid $divider;
  }

  &__log-section {
    margin-bottom: 8px;
  }

  &__log-section-title {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $text-disabled;
    display: block;
    margin-bottom: 4px;
  }

  &__log-json {
    font-family: monospace;
    font-size: 0.68rem;
    color: $text-secondary;
    background: rgba(0,0,0,0.03);
    padding: 6px 8px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &__log-ts {
    font-size: 0.62rem;
    color: $text-disabled;
    text-align: end;
  }
}
</style>

<!-- Dark mode -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .wfp { background: $dark-background; }
  .wfp-hero__title { color: $dark-text-bright; }
  .wfp-hero__sub { color: $dark-text-muted; }
  .wfp-empty { color: #555; }

  .wfp-card {
    background: $dark-card;
    border-color: $dark-border;

    &__title { color: $dark-text-bright; }
    &__desc { color: $dark-text-muted; }
    &__badge { background: rgba(255,255,255,0.06); color: #888; }
    &__badge--active { background: rgba($success, 0.15); color: $success; }
    &__tag { color: $dark-text-muted; }
    &__actions { border-color: $dark-border; }
    &__action {
      color: #888;
      &:hover { background: rgba(255,255,255,0.06); color: $primary-light; }
    }
  }

  .wfp-modal {
    background: $dark-card;

    &__header { border-color: $dark-border; color: $dark-text-bright; }
    &__footer { border-color: $dark-border; }
  }

  .wfp-field {
    > span { color: $dark-text-bright; }
    input, textarea, select {
      border-color: $dark-border;
      color: $dark-text-bright;
      background: $dark-card-inner;
    }
  }

  .wfp-exec {
    border-color: $dark-border;

    &__log--expanded { border-color: $dark-border; background: rgba(255,255,255,0.02); }
    &__log-row:hover { background: rgba(255,255,255,0.03); }
    &__log-type { color: #666; background: rgba(255,255,255,0.04); }
    &__log-label { color: $dark-text-bright; }
    &__log-msg { color: $dark-text-muted; }
    &__log-detail { border-color: $dark-border; }
    &__log-json { color: $dark-text-muted; background: rgba(255,255,255,0.03); }
  }
}
</style>
