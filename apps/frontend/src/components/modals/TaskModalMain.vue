<template>
  <div class="tmm">
    <!-- Title -->
    <div class="tmm-section tmm-title-section" :class="{ editing: editingTitle }">
      <template v-if="!editingTitle">
        <h1 class="tmm-title" @click="prepareEditTitle">
          {{ task?.title }}
          <i class="mdi mdi-pencil-outline tmm-edit-icon"></i>
        </h1>
      </template>
      <template v-else>
        <div class="tmm-title-edit">
          <input
            ref="titleInput"
            v-model="newTitle"
            type="text"
            class="tmm-title-input"
            :placeholder="$t('TASK_NEW_TITLE')"
            @keydown.enter="submitTitle"
            @keydown.escape="editingTitle = false"
          />
          <div class="tmm-edit-actions">
            <button class="tmm-btn-save" :disabled="savingTitle" @click="submitTitle">
              <i :class="savingTitle ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-check'"></i>
            </button>
            <button class="tmm-btn-cancel" @click="editingTitle = false">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Quick Properties Bar -->
    <div class="tmm-props">
      <!-- Status -->
      <div v-if="wpSettings?.allowState !== false" class="tmm-prop tmm-prop--status" @click.stop>
        <button class="tmm-status-chip" @click="showStatusMenu = !showStatusMenu">
          <span class="tmm-status-dot" :style="{ background: currentStateColor }"></span>
          <span>{{ currentStateLabel }}</span>
          <i class="mdi mdi-chevron-down"></i>
        </button>
        <transition name="dropdown-fade">
          <div v-if="showStatusMenu" v-click-outside="() => showStatusMenu = false" class="tmm-status-dropdown">
            <button
              v-for="s in states"
              :key="s.value"
              class="tmm-status-option"
              :class="{ selected: task?.state === s.value }"
              @click="selectState(s.value)"
            >
              <span class="tmm-status-dot" :style="{ background: s.color }"></span>
              <span>{{ s.label }}</span>
              <i v-if="task?.state === s.value" class="mdi mdi-check"></i>
            </button>
          </div>
        </transition>
      </div>

      <!-- Assignees -->
      <button
        v-if="wpSettings?.allowMembers !== false"
        class="tmm-prop"
        @click="$emit('scroll-sidebar', 'members')"
      >
        <i class="mdi mdi-account-outline"></i>
        <template v-if="task?.members?.length">
          <span class="tmm-avatars-inline">
            <span
              v-for="m in task.members.slice(0, 4)"
              :key="m.id"
              class="tmm-avatar-sm"
              :title="helpers.resolveUserName((m as any).recordId || '')"
            >{{ helpers.resolveUserInitials((m as any).recordId || '') }}</span>
            <span v-if="task.members.length > 4" class="tmm-avatar-more">+{{ task.members.length - 4 }}</span>
          </span>
        </template>
        <span v-else class="tmm-prop-placeholder">{{ $t('TASK_MEMBERS') }}</span>
      </button>

      <!-- Labels -->
      <button
        v-if="wpSettings?.allowLabels !== false"
        class="tmm-prop"
        @click="$emit('scroll-sidebar', 'labels')"
      >
        <i class="mdi mdi-label-outline"></i>
        <template v-if="task?.labels?.length">
          <span class="tmm-labels-inline">
            <span
              v-for="l in task.labels.slice(0, 3)"
              :key="l.id"
              class="tmm-label-dot"
              :style="{ background: l.color }"
              :title="l.title"
            ></span>
            <span v-if="task.labels.length > 3" class="tmm-label-more">+{{ task.labels.length - 3 }}</span>
          </span>
        </template>
        <span v-else class="tmm-prop-placeholder">{{ $t('TASK_LABELS') }}</span>
      </button>

      <!-- Due Date -->
      <button
        v-if="wpSettings?.allowEndAt !== false"
        class="tmm-prop"
        :class="{ overdue: isOverdue }"
        @click="$emit('scroll-sidebar', 'dates')"
      >
        <i class="mdi mdi-calendar-outline"></i>
        <span v-if="task?.dueAt">{{ helpers.formatDate(task.dueAt) }}</span>
        <span v-else class="tmm-prop-placeholder">{{ $t('DUE_DATE') }}</span>
      </button>

      <!-- Time Spent / Estimated -->
      <button
        v-if="wpSettings?.allowTimeSpent !== false || wpSettings?.allowEstimatedTime !== false"
        class="tmm-prop"
        @click="$emit('scroll-sidebar', 'time')"
      >
        <i class="mdi mdi-timer-outline"></i>
        <span v-if="task?.timeSpent || task?.estimatedTime">
          {{ helpers.formatDuration((task?.timeSpent || 0) * 60000) }}
          <template v-if="task?.estimatedTime"> / {{ helpers.formatDuration((task.estimatedTime || 0) * 60000) }}</template>
        </span>
        <span v-else class="tmm-prop-placeholder">{{ $t('TASK_TIME_MANAGEMENT') }}</span>
      </button>
    </div>

    <!-- Description -->
    <div class="tmm-section tmm-desc-section">
      <template v-if="!editingDesc">
        <div class="tmm-desc" :class="{ empty: !task?.description }" @click="prepareEditDesc">
          <div v-if="task?.description" class="tmm-desc-html" v-html="task.description"></div>
          <span v-else class="tmm-placeholder">{{ $t('NO_DESCRIPTION_YET') }}</span>
          <i class="mdi mdi-pencil-outline tmm-edit-icon"></i>
        </div>
      </template>
      <template v-else>
        <div class="tmm-desc-edit">
          <TaskEditor
            :modelValue="newDescription"
            @update:modelValue="(v: string) => newDescription = v"
            :members="mentionMembers"
            :placeholder="$t('TASK_NEW_DESCRIPTION')"
            minHeight="120px"
          />
          <div class="tmm-edit-actions">
            <button class="tmm-btn-save" :disabled="savingDesc" @click="submitDescription">
              <i :class="savingDesc ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-check'"></i>
            </button>
            <button class="tmm-btn-cancel" @click="editingDesc = false">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Subtasks -->
    <div v-if="!task?.parentId" class="tmm-section">
      <div class="tmm-section-header">
        <i class="mdi mdi-file-tree-outline"></i>
        <span>{{ $t('TASK_SUB_TASK') }}</span>
        <span v-if="task?.subTasksCount" class="tmm-badge">{{ task.subTasksDone }}/{{ task.subTasksCount }}</span>
        <button class="tmm-add-btn" @click="showSubtaskInput = true">
          <i class="mdi mdi-plus"></i>
        </button>
      </div>
      <div v-if="task?.subTasksCount" class="tmm-progress-bar">
        <div
          class="tmm-progress-fill"
          :style="{ width: task.subTasksCount ? `${(task.subTasksDone / task.subTasksCount) * 100}%` : '0%' }"
        ></div>
      </div>
      <!-- Inline subtask creation -->
      <div v-if="showSubtaskInput" class="tmm-subtask-create">
        <input
          ref="subtaskInput"
          v-model="newSubtaskTitle"
          type="text"
          class="tmm-subtask-input"
          :placeholder="$t('TASK_NEW_SUB_TASK')"
          @keydown.enter="createSubtask"
          @keydown.escape="showSubtaskInput = false"
        />
        <button class="tmm-btn-save" :disabled="creatingSubtask" @click="createSubtask">
          <i :class="creatingSubtask ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-check'"></i>
        </button>
        <button class="tmm-btn-cancel" @click="showSubtaskInput = false">
          <i class="mdi mdi-close"></i>
        </button>
      </div>
      <div v-if="task?.subTasks?.length" class="tmm-subtasks">
        <div
          v-for="sub in task.subTasks"
          :key="sub.id"
          class="tmm-subtask"
          @click="emit('open-subtask', sub.id)"
        >
          <span class="tmm-subtask-bar" :class="`state-${sub.state}`"></span>
          <div class="tmm-subtask-info">
            <span class="tmm-subtask-title">{{ sub.title }}</span>
            <span v-if="sub.description" class="tmm-subtask-desc">{{ sub.description }}</span>
          </div>
          <span v-if="sub.dueAt" class="tmm-subtask-date">
            <i class="mdi mdi-calendar-outline"></i>
            {{ helpers.formatDate(sub.dueAt) }}
          </span>
          <button
            class="tmm-subtask-convert"
            :title="$t('TASK_CONVERT_TO_TASK')"
            @click.stop="convertSubtaskToTask(sub.id)"
          >
            <i class="mdi mdi-arrow-up-bold-box-outline"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Attachments -->
    <div v-if="wpSettings?.allowAttachment !== false" class="tmm-section">
      <div class="tmm-section-header">
        <i class="mdi mdi-paperclip"></i>
        <span>{{ $t('TASK_ATTACHMENTS') }}</span>
        <button class="tmm-add-btn" @click="triggerFileUpload">
          <i class="mdi mdi-plus"></i>
        </button>
      </div>

      <!-- Pending uploads -->
      <div v-if="pendingUploads.length" class="tmm-attachments">
        <div v-for="pu in pendingUploads" :key="pu.id" class="tmm-attachment tmm-attachment--pending">
          <div class="tmm-att-preview">
            <img v-if="pu.objectUrl" :src="pu.objectUrl" alt="" />
            <i v-else :class="getFileTypeIcon(pu.name)"></i>
          </div>
          <div class="tmm-att-info">
            <span class="tmm-att-name">{{ pu.name }}</span>
            <div class="tmm-att-progress">
              <div class="tmm-att-progress-bar" :style="{ width: pu.progress + '%' }"></div>
            </div>
          </div>
          <div class="tmm-att-status">
            <i v-if="pu.status === 'uploading'" class="mdi mdi-loading mdi-spin"></i>
            <i v-else-if="pu.status === 'done'" class="mdi mdi-check-circle" style="color: var(--success, #5eb258)"></i>
            <i v-else class="mdi mdi-alert-circle" style="color: var(--warn, #F44336)"></i>
          </div>
        </div>
      </div>

      <div v-if="!task?.attachments?.length && !pendingUploads.length" class="tmm-empty-state">
        {{ $t('TASK_NO_ATTACHMENTS') }}
      </div>
      <div v-if="task?.attachments?.length" class="tmm-attachments">
        <div
          v-for="(att, idx) in task.attachments"
          :key="att.id"
          class="tmm-attachment tmm-attachment--clickable"
          @click="openPreview(idx)"
        >
          <div class="tmm-att-preview">
            <img v-if="att.thumbnailPath" :src="resolveApiUrl(att.thumbnailPath)" alt="" />
            <i v-else :class="getFileTypeIcon(att.path || att.title)"></i>
          </div>
          <div class="tmm-att-info">
            <span class="tmm-att-name">{{ att.title }}</span>
            <span class="tmm-att-date">{{ helpers.formatDate(att.createdAt) }}</span>
          </div>
          <button class="tmm-att-action" @click.stop="$emit('remove-attachment', att)">
            <i class="mdi mdi-trash-can-outline"></i>
          </button>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        hidden
        @change="onFileSelected"
      />
    </div>

    <!-- Asset Preview Dialog -->
    <AssetPreviewDialog
      v-if="previewOpen && task?.attachments?.length"
      :attachments="task.attachments"
      :initial-index="previewIndex"
      @close="previewOpen = false"
    />

    <!-- Comments / Activity tabs -->
    <div class="tmm-section tmm-activity-section">
      <div class="tmm-tab-bar">
        <button
          v-if="wpSettings?.allowComments !== false"
          class="tmm-tab"
          :class="{ active: activeTab === 'comments' }"
          @click="activeTab = 'comments'"
        >
          <i class="mdi mdi-comment-outline"></i>
          {{ $t('COMMENTS') }}
          <span v-if="task?.comments?.length" class="tmm-tab-count">{{ task.comments.length }}</span>
        </button>
        <button
          class="tmm-tab"
          :class="{ active: activeTab === 'activity' }"
          @click="onActivityTab"
        >
          <i class="mdi mdi-history"></i>
          {{ $t('TASK_ACTIVITY') }}
        </button>
      </div>

      <!-- Comments -->
      <div v-if="activeTab === 'comments'" class="tmm-comments">
        <div class="tmm-comment-input">
          <span class="tmm-avatar">{{ helpers.profileInitials.value }}</span>
          <div class="tmm-comment-field">
            <TaskEditor
              ref="commentEditorRef"
              :modelValue="newComment"
              @update:modelValue="(v: string) => newComment = v"
              @submit="submitComment"
              :members="mentionMembers"
              :placeholder="$t('ENTER_YOUR_COMMENT')"
              compact
            />
          </div>
        </div>
        <div class="tmm-comment-list">
          <div v-for="c in task?.comments" :key="c.id" class="tmm-comment">
            <span class="tmm-avatar">{{ (c as any).member?.initials || '?' }}</span>
            <div class="tmm-comment-body">
              <div class="tmm-comment-meta">
                <span class="tmm-comment-name">{{ (c as any).member?.fullName }}</span>
                <span class="tmm-comment-time">{{ helpers.formatDate(c.createdAt) }}</span>
              </div>
              <div class="tmm-comment-text" v-html="c.message"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity -->
      <div v-if="activeTab === 'activity'" class="tmm-activity">
        <div v-if="loadingLogs" class="tmm-activity-loading">
          <i class="mdi mdi-loading mdi-spin"></i>
        </div>
        <div v-else-if="!activityLogs.length" class="tmm-empty-state">
          {{ $t('NO_ACTIVITY_LOG') }}
        </div>
        <div v-else class="tmm-activity-list">
          <div v-for="log in activityLogs" :key="log.id" class="tmm-activity-item">
            <span class="tmm-avatar sm">{{ helpers.resolveUserInitials(log.userId) }}</span>
            <div class="tmm-activity-body">
              <span class="tmm-activity-user">{{ helpers.resolveUserName(log.userId) }}</span>
              <span class="tmm-activity-desc">{{ getActivityLabel(log) }}</span>
              <span class="tmm-activity-date">{{ helpers.formatDate(log.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, nextTick, watch, type Ref, type ComputedRef } from 'vue';
import type { WorkPackageTaskViewModel, WorkPackageTaskAttachmentViewModel, ActivityLogViewModel } from '@asoode/shared';
import { WorkPackageTaskState, OperationResultStatus, ActivityType } from '@asoode/shared';
import TaskEditor from '@/components/core/TaskEditor.vue';
import AssetPreviewDialog from './AssetPreviewDialog.vue';
import { useTaskStore } from '@/stores/task.store';
import { resolveApiUrl } from '@/services/runtime-config.service';

const props = defineProps<{
  activityLogs: ActivityLogViewModel[];
  loadingLogs: boolean;
}>();

const emit = defineEmits<{
  'save-title': [title: string];
  'save-description': [description: string];
  'add-comment': [message: string];
  'upload-files': [files: File[]];
  'remove-attachment': [att: WorkPackageTaskAttachmentViewModel];
  'fetch-logs': [];
  'change-state': [state: WorkPackageTaskState];
  'scroll-sidebar': [section: string];
  'open-subtask': [taskId: string];
  close: [];
}>();

const task = inject<Ref<WorkPackageTaskViewModel | null>>('task')!;
const mentionMembers = inject<Ref<{ id: string; name: string; initials: string }[]>>('mentionMembers', ref([]));
const wpSettings = inject<Ref<Record<string, boolean> | null>>('wpSettings', ref(null));
const states = inject<{ value: WorkPackageTaskState; label: string; color: string }[]>('states')!;
const commentEditorRef = ref<InstanceType<typeof TaskEditor> | null>(null);
const helpers = inject<{
  resolveUserInitials: (id: string) => string;
  resolveUserName: (id: string) => string;
  profileInitials: ComputedRef<string>;
  formatDate: (date: any) => string;
  formatTime: (date: any) => string;
  formatDuration: (ms: number) => string;
  calcDiff: (log: any) => number;
  pad: (n: number) => string;
}>('helpers')!;

// Activity type labels
const activityLabels: Record<number, string> = {
  [ActivityType.WorkPackageTaskAdd]: 'Created this task',
  [ActivityType.WorkPackageTaskEdit]: 'Updated this task',
  [ActivityType.WorkPackageTaskDone]: 'Marked as done',
  [ActivityType.WorkPackageTaskRemove]: 'Removed this task',
  [ActivityType.WorkPackageTaskReposition]: 'Reordered this task',
  [ActivityType.WorkPackageTaskMove]: 'Moved this task',
  [ActivityType.WorkPackageTaskArchive]: 'Archived this task',
  [ActivityType.WorkPackageTaskRestore]: 'Restored this task',
  [ActivityType.WorkPackageTaskComment]: 'Added a comment',
  [ActivityType.WorkPackageTaskView]: 'Viewed this task',
  [ActivityType.WorkPackageTaskMemberRemove]: 'Removed a member',
  [ActivityType.WorkPackageTaskMemberAdd]: 'Added a member',
  [ActivityType.WorkPackageTaskLabelRemove]: 'Removed a label',
  [ActivityType.WorkPackageTaskLabelAdd]: 'Added a label',
  [ActivityType.WorkPackageTaskAttachmentRemove]: 'Removed an attachment',
  [ActivityType.WorkPackageTaskAttachmentAdd]: 'Added an attachment',
  [ActivityType.WorkPackageTaskAttachmentCover]: 'Changed cover image',
  [ActivityType.WorkPackageTaskAttachmentRename]: 'Renamed an attachment',
  [ActivityType.WorkPackageTaskWatch]: 'Toggled watch',
  [ActivityType.WorkPackageTaskTime]: 'Logged time',
  [ActivityType.WorkPackageTaskVote]: 'Voted',
  [ActivityType.WorkPackageTaskVoteReset]: 'Reset votes',
  [ActivityType.WorkPackageTaskUnBlock]: 'Unblocked this task',
  [ActivityType.WorkPackageTaskBlocked]: 'Blocked this task',
  [ActivityType.WorkPackageTaskBulkAdd]: 'Added multiple tasks',
  [ActivityType.WorkPackageTaskAttachmentBulkAdd]: 'Added multiple attachments',
  [ActivityType.WorkPackageCustomFieldValueSet]: 'Set a custom field value',
};

function getActivityLabel(log: ActivityLogViewModel): string {
  if (log.description) return log.description;
  return activityLabels[log.type] || 'Activity';
}

// Title
const editingTitle = ref(false);
const newTitle = ref('');
const savingTitle = ref(false);
const titleInput = ref<HTMLInputElement | null>(null);

// Description
const editingDesc = ref(false);
const newDescription = ref('');
const savingDesc = ref(false);

// Comments
const newComment = ref('');
const addingComment = ref(false);

// Tab
const activeTab = ref<'comments' | 'activity'>(
  wpSettings.value?.allowComments !== false ? 'comments' : 'activity'
);

// Attachments
const fileInput = ref<HTMLInputElement | null>(null);
const pendingUploads = inject<Ref<any[]>>('pendingUploads', ref([]));

// Preview
const previewOpen = ref(false);
const previewIndex = ref(0);

// Subtasks
const taskStore = useTaskStore();
const showSubtaskInput = ref(false);
const newSubtaskTitle = ref('');
const creatingSubtask = ref(false);
const subtaskInput = ref<HTMLInputElement | null>(null);

watch(showSubtaskInput, (v) => {
  if (v) nextTick(() => subtaskInput.value?.focus());
});

async function createSubtask() {
  const title = newSubtaskTitle.value.trim();
  if (!title || creatingSubtask.value || !task.value) return;
  creatingSubtask.value = true;
  const result = await taskStore.create(task.value.listId, {
    title,
    listId: task.value.listId,
    parentId: task.value.id,
  });
  if (result.status === OperationResultStatus.Success && result.data) {
    if (!task.value.subTasks) task.value.subTasks = [];
    task.value.subTasks.unshift(result.data);
    task.value.subTasksCount = (task.value.subTasksCount || 0) + 1;
    newSubtaskTitle.value = '';
  }
  creatingSubtask.value = false;
}

async function convertSubtaskToTask(subId: string) {
  if (!task.value) return;
  const result = await taskStore.convertToTask(subId);
  if (result.status === OperationResultStatus.Success) {
    task.value.subTasks = (task.value.subTasks || []).filter((s: any) => s.id !== subId);
    task.value.subTasksCount = Math.max(0, (task.value.subTasksCount || 1) - 1);
    const doneCount = (task.value.subTasks || []).filter((s: any) => s.state === 3).length;
    task.value.subTasksDone = doneCount;
  }
}

// Status
const showStatusMenu = ref(false);

const currentStateLabel = computed(() => {
  return states.find(s => s.value === task.value?.state)?.label || '';
});

const currentStateColor = computed(() => {
  return states.find(s => s.value === task.value?.state)?.color || '#ccc';
});

const isOverdue = computed(() => {
  if (!task.value?.dueAt) return false;
  return new Date(task.value.dueAt) < new Date();
});

function selectState(state: WorkPackageTaskState) {
  emit('change-state', state);
  showStatusMenu.value = false;
}

function prepareEditTitle() {
  newTitle.value = task.value?.title || '';
  editingTitle.value = true;
  nextTick(() => titleInput.value?.focus());
}

async function submitTitle() {
  if (!newTitle.value.trim() || savingTitle.value) return;
  savingTitle.value = true;
  emit('save-title', newTitle.value);
  editingTitle.value = false;
  savingTitle.value = false;
}

function prepareEditDesc() {
  newDescription.value = task.value?.description || '';
  editingDesc.value = true;
}

async function submitDescription() {
  if (savingDesc.value) return;
  savingDesc.value = true;
  emit('save-description', newDescription.value);
  editingDesc.value = false;
  savingDesc.value = false;
}

async function submitComment() {
  if (!newComment.value.trim() || addingComment.value) return;
  addingComment.value = true;
  emit('add-comment', newComment.value);
  newComment.value = '';
  commentEditorRef.value?.clear();
  addingComment.value = false;
}

function onActivityTab() {
  activeTab.value = 'activity';
  if (!props.activityLogs.length) {
    emit('fetch-logs');
  }
}

function triggerFileUpload() {
  fileInput.value?.click();
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  const files = Array.from(target.files);
  emit('upload-files', files);
  target.value = '';
}

function openPreview(index: number) {
  previewIndex.value = index;
  previewOpen.value = true;
}

function getFileTypeIcon(filename: string | undefined | null): string {
  if (!filename) return 'mdi mdi-file-outline';
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'mdi mdi-image-outline';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg'].includes(ext)) return 'mdi mdi-video-outline';
  if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) return 'mdi mdi-music-note';
  if (ext === 'pdf') return 'mdi mdi-file-pdf-box';
  if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)) return 'mdi mdi-file-document-outline';
  return 'mdi mdi-file-outline';
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.tmm {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px 40px;
  scrollbar-width: thin;
}

// Section spacing
.tmm-section {
  margin-bottom: 28px;
}

.tmm-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-primary;

  > i {
    font-size: 1rem;
    color: $text-secondary;
  }
}

.tmm-badge {
  font-size: 0.7rem;
  font-weight: 500;
  color: $text-secondary;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 8px;
  border-radius: 10px;
  margin-inline-start: 4px;
}

.tmm-add-btn {
  margin-inline-start: auto;
  width: 24px;
  height: 24px;
  border: 1px dashed $text-disabled;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  transition: all $transition-fast;

  i { font-size: 0.8rem; }
  &:hover { border-color: $primary; color: $primary; }
}

.tmm-empty-state {
  text-align: center;
  padding: 20px 16px;
  font-size: 0.8rem;
  color: $text-disabled;
  background: rgba(0, 0, 0, 0.02);
  border-radius: $border-radius-md;
}

// --- Quick Properties Bar ---
.tmm-props {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid $divider;
}

.tmm-prop {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid $divider;
  border-radius: 20px;
  background: none;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  color: $text-primary;
  transition: all $transition-fast;
  font-family: inherit;

  > i:first-child {
    font-size: 0.85rem;
    color: $text-secondary;
  }

  &:hover {
    border-color: $primary;
    background: rgba($primary, 0.04);
  }

  &.overdue {
    border-color: $warn;
    color: $warn;
    > i:first-child { color: $warn; }
  }
}

.tmm-prop--status {
  position: relative;
  padding: 0;
  border: none;
  cursor: default;

  &:hover {
    border-color: transparent;
    background: none;
  }
}

.tmm-prop-placeholder {
  color: $text-disabled;
  font-weight: 400;
}

.tmm-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid $divider;
  border-radius: 20px;
  background: none;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  color: $text-primary;
  transition: all $transition-fast;
  font-family: inherit;

  i { font-size: 0.65rem; color: $text-secondary; }
  &:hover { background: rgba(0, 0, 0, 0.04); }
}

.tmm-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tmm-status-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 20;
  background: $surface;
  border: 1px solid $divider;
  border-radius: $border-radius-md;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
  min-width: 180px;
}

.tmm-status-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  font-size: 0.8rem;
  color: $text-primary;
  transition: background $transition-fast;
  font-family: inherit;

  &:hover { background: rgba(0, 0, 0, 0.04); }
  &.selected { background: rgba($primary, 0.06); }

  .mdi-check {
    margin-inline-start: auto;
    color: $success;
    font-size: 0.9rem;
  }
}

// Inline avatars
.tmm-avatars-inline {
  display: flex;
  align-items: center;
}

.tmm-avatar-sm {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba($primary, 0.12);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  font-weight: 700;
  margin-inline-start: -4px;
  border: 2px solid $surface;

  &:first-child { margin-inline-start: 0; }
}

.tmm-avatar-more {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  font-weight: 600;
  margin-inline-start: -4px;
  border: 2px solid $surface;
}

// Inline labels
.tmm-labels-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tmm-label-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tmm-label-more {
  font-size: 0.65rem;
  color: $text-secondary;
}

// --- Title ---
.tmm-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.4;
  padding: 4px 0;

  .tmm-edit-icon {
    opacity: 0;
    font-size: 0.85rem;
    color: $text-disabled;
    transition: opacity $transition-fast;
  }

  &:hover .tmm-edit-icon { opacity: 1; }
}

.tmm-title-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tmm-title-input {
  font-size: 1.25rem;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid $primary;
  background: none;
  outline: none;
  padding: 4px 0;
  width: 100%;
  color: $text-primary;
}

.tmm-edit-actions {
  display: flex;
  gap: 4px;
}

.tmm-btn-save,
.tmm-btn-cancel {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all $transition-fast;
}

.tmm-btn-save {
  background: $primary;
  color: #fff;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.4; }
}

.tmm-btn-cancel {
  background: rgba(0, 0, 0, 0.06);
  color: $text-secondary;
  &:hover { background: rgba(0, 0, 0, 0.1); }
}

// --- Description ---
.tmm-desc {
  font-size: 0.875rem;
  color: $text-primary;
  line-height: 1.6;
  cursor: pointer;
  padding: 8px 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  word-break: break-word;

  .tmm-desc-html {
    flex: 1;
    min-width: 0;
  }

  .tmm-edit-icon {
    opacity: 0;
    font-size: 0.8rem;
    color: $text-disabled;
    margin-top: 2px;
    flex-shrink: 0;
    transition: opacity $transition-fast;
  }

  &:hover .tmm-edit-icon { opacity: 1; }

  &.empty {
    color: $text-disabled;
    font-style: italic;
  }
}

.tmm-desc-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

// --- Subtasks ---
.tmm-progress-bar {
  height: 4px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  margin-bottom: 12px;
  overflow: hidden;
}

.tmm-progress-fill {
  height: 100%;
  background: $success;
  border-radius: 2px;
  transition: width 300ms ease;
}

.tmm-subtasks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tmm-subtask {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover { background: rgba(0, 0, 0, 0.03); }
}

.tmm-subtask-bar {
  width: 3px;
  height: 28px;
  border-radius: 2px;
  flex-shrink: 0;

  &.state-1 { background: #cccccc; }
  &.state-2 { background: #59a8ef; }
  &.state-3 { background: #5eb258; }
  &.state-4 { background: #666666; }
  &.state-5 { background: #b33634; }
  &.state-6 { background: #666666; }
  &.state-7 { background: #808080; }
  &.state-8 { background: #b3b3b3; }
  &.state-9 { background: #eb973e; }
}

.tmm-subtask-info {
  flex: 1;
  min-width: 0;

  .tmm-subtask-title {
    display: block;
    font-size: 0.82rem;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tmm-subtask-desc {
    display: block;
    font-size: 0.72rem;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.tmm-subtask-date {
  font-size: 0.7rem;
  color: $text-secondary;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;

  i { font-size: 0.75rem; }
}

.tmm-subtask-convert {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  color: $text-secondary;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  flex-shrink: 0;

  &:hover { color: $primary; }

  i { font-size: 0.85rem; }
}

.tmm-subtask:hover .tmm-subtask-convert {
  opacity: 1;
}

.tmm-subtask-create {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.tmm-subtask-input {
  flex: 1;
  border: 1px solid $divider;
  border-radius: $border-radius-sm;
  padding: 6px 10px;
  font-size: 0.82rem;
  background: transparent;
  color: $text-primary;
  outline: none;

  &:focus {
    border-color: $primary;
  }
}

// --- Attachments ---
.tmm-attachments {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.tmm-attachment {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: $border-radius-sm;
  transition: background $transition-fast;

  &--clickable {
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.03);
      .tmm-att-action { opacity: 1; }
    }
  }

  &--pending {
    opacity: 0.85;
  }
}

.tmm-att-preview {
  width: 40px;
  height: 40px;
  border-radius: $border-radius-sm;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  i {
    font-size: 1.3rem;
    color: $text-disabled;
  }
}

.tmm-att-info {
  flex: 1;
  min-width: 0;

  .tmm-att-name {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tmm-att-date {
    font-size: 0.7rem;
    color: $text-secondary;
  }
}

.tmm-att-progress {
  height: 4px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.tmm-att-progress-bar {
  height: 100%;
  background: $primary;
  border-radius: 2px;
  transition: width 150ms ease;
}

.tmm-att-status {
  flex-shrink: 0;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  i { font-size: 1rem; color: $text-secondary; }
}

.tmm-att-action {
  opacity: 0;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  transition: all $transition-fast;
  flex-shrink: 0;

  &:hover { color: $warn; background: rgba($warn, 0.08); }
}

// --- Comments/Activity Tabs ---
.tmm-tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid $divider;
}

.tmm-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: $text-secondary;
  border-bottom: 2px solid transparent;
  transition: all $transition-fast;
  margin-bottom: -1px;
  font-family: inherit;

  i { font-size: 0.9rem; }

  &:hover { color: $text-primary; }

  &.active {
    color: $primary;
    border-bottom-color: $primary;
  }
}

.tmm-tab-count {
  font-size: 0.65rem;
  background: rgba(0, 0, 0, 0.08);
  padding: 1px 6px;
  border-radius: 8px;
  color: $text-secondary;
}

// --- Comments ---
.tmm-comment-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tmm-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba($primary, 0.12);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;

  &.sm {
    width: 24px;
    height: 24px;
    font-size: 0.5rem;
  }
}

.tmm-comment-field {
  flex: 1;
  min-width: 0;
}

.tmm-comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tmm-comment {
  display: flex;
  gap: 10px;
}

.tmm-comment-body {
  flex: 1;
  min-width: 0;
}

.tmm-comment-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.tmm-comment-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: $text-primary;
}

.tmm-comment-time {
  font-size: 0.68rem;
  color: $text-disabled;
}

.tmm-comment-text {
  font-size: 0.82rem;
  color: $text-primary;
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

// --- Activity ---
.tmm-activity-loading {
  display: flex;
  justify-content: center;
  padding: 24px;
  i { font-size: 1.4rem; color: $text-disabled; }
}

.tmm-activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tmm-activity-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: $border-radius-sm;
}

.tmm-activity-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;

  .tmm-activity-user {
    font-size: 0.78rem;
    font-weight: 600;
    color: $text-primary;
  }

  .tmm-activity-desc {
    font-size: 0.75rem;
    color: $text-secondary;
    word-break: break-word;
  }

  .tmm-activity-date {
    font-size: 0.65rem;
    color: $text-disabled;
  }
}

// Dropdown transition
.dropdown-fade-enter-active { transition: all 150ms ease; }
.dropdown-fade-leave-active { transition: all 100ms ease; }
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

// Responsive
@media (max-width: 600px) {
  .tmm {
    padding: 16px;
  }

  .tmm-title {
    font-size: 1.1rem;
  }

  .tmm-props {
    gap: 6px;
  }

  .tmm-prop {
    font-size: 0.72rem;
    padding: 4px 10px;
  }

  .tmm-attachments {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Dark mode -->
<style lang="scss">
@import '@/styles/variables';

body.dark-mode {
  .tmm {
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }

  .tmm-title { color: #e0e0e0; }
  .tmm-title-input { color: #e0e0e0; border-bottom-color: #9575CD; }
  .tmm-desc { color: #ccc; &.empty { color: #666; } }

  .tmm-section-header { color: #ddd; > i { color: #888; } }
  .tmm-badge { background: rgba(255, 255, 255, 0.08); color: #aaa; }
  .tmm-add-btn { border-color: #666; color: #888; &:hover { border-color: #9575CD; color: #9575CD; } }
  .tmm-empty-state { background: rgba(255, 255, 255, 0.03); color: #666; }

  // Quick Properties Bar
  .tmm-props { border-color: #444; }
  .tmm-prop {
    border-color: #555;
    color: #ddd;
    > i:first-child { color: #888; }
    &:hover { border-color: #9575CD; background: rgba(#9575CD, 0.08); }
    &.overdue { border-color: #ef5350; color: #ef5350; > i:first-child { color: #ef5350; } }
  }
  .tmm-prop-placeholder { color: #666; }
  .tmm-status-chip {
    border-color: #555;
    color: #ddd;
    i { color: #888; }
    &:hover { background: rgba(255, 255, 255, 0.06); }
  }
  .tmm-status-dropdown {
    background: #3b3b3b;
    border-color: #555;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
  .tmm-status-option {
    color: #ddd;
    &:hover { background: rgba(255, 255, 255, 0.06); }
    &.selected { background: rgba(103, 58, 183, 0.15); }
  }
  .tmm-avatar-sm { background: rgba(#9575CD, 0.2); color: #B39DDB; border-color: #2d2d2d; }
  .tmm-avatar-more { background: rgba(255, 255, 255, 0.08); color: #999; border-color: #2d2d2d; }

  .tmm-progress-bar { background: rgba(255, 255, 255, 0.08); }

  .tmm-subtask {
    &:hover { background: rgba(255, 255, 255, 0.04); }
    .tmm-subtask-title { color: #ddd; }
    .tmm-subtask-desc { color: #888; }
  }

  .tmm-subtask-date { color: #888; }

  .tmm-subtask-input {
    color: #ddd;
    border-color: rgba(255, 255, 255, 0.12);
    &:focus { border-color: $primary; }
  }

  .tmm-att-preview { background: rgba(255, 255, 255, 0.06); i { color: #666; } }
  .tmm-att-name { color: #ddd; }
  .tmm-att-date { color: #888; }
  .tmm-attachment--clickable:hover { background: rgba(255, 255, 255, 0.04); }
  .tmm-att-action { color: #888; }
  .tmm-att-progress { background: rgba(255, 255, 255, 0.08); }
  .tmm-att-progress-bar { background: #9575CD; }
  .tmm-att-status i { color: #888; }

  .tmm-tab-bar { border-color: #444; }
  .tmm-tab { color: #888; &:hover { color: #ccc; } &.active { color: #9575CD; border-bottom-color: #9575CD; } }
  .tmm-tab-count { background: rgba(255, 255, 255, 0.08); color: #888; }

  .tmm-avatar { background: rgba(#9575CD, 0.2); color: #B39DDB; }

  .tmm-comment-name { color: #ddd; }
  .tmm-comment-time { color: #666; }
  .tmm-comment-text { color: #ccc; }

  .tmm-activity-item { background: transparent; }
  .tmm-activity-user { color: #ddd; }
  .tmm-activity-desc { color: #999; }
  .tmm-activity-date { color: #666; }

  .tmm-btn-save { background: #9575CD; }
  .tmm-btn-cancel { background: rgba(255, 255, 255, 0.08); color: #999; &:hover { background: rgba(255, 255, 255, 0.12); } }

}
</style>
