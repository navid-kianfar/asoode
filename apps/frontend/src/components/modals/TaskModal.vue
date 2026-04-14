<template>
  <Teleport to="body">
    <transition name="task-modal">
      <div v-if="visible" class="tm-backdrop" @click.self="close">
        <div class="tm-panel" @click.stop>
          <!-- Loading -->
          <div v-if="loading" class="tm-loading">
            <TaskModalSkeleton />
          </div>

          <template v-if="!loading && task">
            <TaskModalHeader
              :toggling-watch="togglingWatch"
              :toggling-archive="togglingArchive"
              @close="close"
              @toggle-watch="onToggleWatch"
              @toggle-archive="onArchive"
            />

            <div class="tm-body">
              <TaskModalMain
                :activity-logs="activityLogs"
                :loading-logs="loadingLogs"
                @save-title="saveTitle"
                @save-description="saveDescription"
                @add-comment="addComment"
                @upload-files="onUploadFiles"
                @remove-attachment="removeAttachment"
                @fetch-logs="fetchLogs"
                @change-state="changeState"
                @scroll-sidebar="onScrollSidebar"
                @open-subtask="onOpenSubtask"
              />
              <TaskModalSidebar
                ref="sidebarRef"
                @toggle-label="toggleLabel"
                @toggle-member="toggleMember"
                @toggle-working="toggleWorking"
                @spend-time="onSpendTime"
                @invite-email="onInviteEmail"
                @open-task="onOpenSubtask"
              />
            </div>
          </template>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useTaskStore } from '@/stores/task.store';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import { useWorkPackageStore } from '@/stores/work-package.store';
import {
  OperationResultStatus,
  WorkPackageTaskState,
  ActivityType,
  AccessType,
  type WorkPackageTaskViewModel,
  type WorkPackageTaskAttachmentViewModel,
  type WorkPackageLabelViewModel,
  type ProjectMemberViewModel,
  type ActivityLogViewModel,
  type WorkPackageTaskTimeViewModel,
  type SpendTimeDto,
} from '@asoode/shared';
import TaskModalSkeleton from '@/components/core/skeletons/TaskModalSkeleton.vue';
import TaskModalHeader from './TaskModalHeader.vue';
import TaskModalMain from './TaskModalMain.vue';
import TaskModalSidebar from './TaskModalSidebar.vue';
import { useUserCache } from '@/composables/useUserCache';
import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { useViewContext } from '@/composables/useViewContext';

const props = defineProps<{
  taskId: string;
  projectId?: string;
  packageId?: string;
}>();

const emit = defineEmits<{ close: []; 'open-task': [taskId: string] }>();

const taskStore = useTaskStore();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const wpStore = useWorkPackageStore();
const { resolveUserInitials, resolveUserName } = useUserCache();
const { updateContext: updateFocusContext } = useViewContext('task-modal', props.taskId);
// --- State ---
const visible = ref(false);
const loading = ref(true);
const task = ref<WorkPackageTaskViewModel | null>(null);
const togglingWatch = ref(false);
const togglingArchive = ref(false);

// Labels & Members
const wpLabels = ref<WorkPackageLabelViewModel[]>([]);
const projectMembers = ref<ProjectMemberViewModel[]>([]);
const wpCustomFields = ref<any[]>([]);

// Activity
const activityLogs = ref<ActivityLogViewModel[]>([]);
const loadingLogs = ref(false);

// Reactive clock for running timers (ticks every second while a timer is active)
const now = ref(Date.now());
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null);

// WP settings (feature flags)
const wpSettings = ref<Record<string, boolean> | null>(null);

// Pending uploads (tracked with progress)
interface PendingUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  objectUrl?: string;
}
const pendingUploads = ref<PendingUpload[]>([]);

// Sidebar scroll target
const sidebarRef = ref<InstanceType<typeof TaskModalSidebar> | null>(null);

// --- States list ---
const states = [
  { value: WorkPackageTaskState.ToDo, label: 'To Do', color: '#cccccc' },
  { value: WorkPackageTaskState.InProgress, label: 'In Progress', color: '#59a8ef' },
  { value: WorkPackageTaskState.Done, label: 'Done', color: '#5eb258' },
  { value: WorkPackageTaskState.Paused, label: 'Paused', color: '#666666' },
  { value: WorkPackageTaskState.Blocked, label: 'Blocked', color: '#b33634' },
  { value: WorkPackageTaskState.Cancelled, label: 'Cancelled', color: '#666666' },
  { value: WorkPackageTaskState.Duplicate, label: 'Duplicate', color: '#808080' },
  { value: WorkPackageTaskState.Incomplete, label: 'Incomplete', color: '#b3b3b3' },
  { value: WorkPackageTaskState.Blocker, label: 'Blocker', color: '#eb973e' },
];

// --- Watch for subtask navigation (taskId prop change) ---
watch(() => props.taskId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    updateFocusContext(newId);
    loading.value = true;
    task.value = null;
    activityLogs.value = [];
    const result = await taskStore.fetchTask(newId);
    if (result.status === OperationResultStatus.Success) {
      task.value = result.data;
      await loadWorkPackageData();
    }
    loading.value = false;
  }
});

// --- Computed helpers ---
const profileInitials = computed(() => {
  const p = authStore.profile;
  if (!p) return '?';
  return ((p.firstName?.charAt(0) || '') + (p.lastName?.charAt(0) || '')).toUpperCase() || '?';
});

const isWorking = computed(() => {
  return authStore.profile?.workingTaskId === task.value?.id;
});

const isAdmin = computed(() => {
  const userId = authStore.profile?.id;
  if (!userId) return false;
  const member = projectMembers.value.find(m => m.recordId === userId);
  if (!member) return false;
  return (member as any).access === AccessType.Owner || (member as any).access === AccessType.Admin;
});

const mentionMembers = computed(() => {
  return projectMembers.value.map(m => ({
    id: m.recordId,
    name: resolveUserName(m.recordId) || (m as any).member?.fullName || m.recordId,
    initials: resolveUserInitials(m.recordId),
  }));
});

// --- Provide to children ---
provide('task', task);
provide('wpLabels', wpLabels);
provide('projectMembers', projectMembers);
provide('wpCustomFields', wpCustomFields);
provide('wpSettings', wpSettings);
provide('pendingUploads', pendingUploads);
provide('states', states);
provide('isWorking', isWorking);
provide('isAdmin', isAdmin);
provide('mentionMembers', mentionMembers);
provide('helpers', {
  resolveUserInitials,
  resolveUserName,
  profileInitials,
  formatDate,
  formatTime,
  formatDuration,
  calcDiff,
  pad,
});

// --- Helpers ---
function formatDate(date: any): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

function formatTime(date: any): string {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  if (!ms) return '0m';
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function calcDiff(log: WorkPackageTaskTimeViewModel): number {
  const begin = new Date(log.begin).getTime();
  const end = log.end ? new Date(log.end).getTime() : now.value;
  return end - begin;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// --- Actions ---
function close() {
  visible.value = false;
  setTimeout(() => emit('close'), 250);
}

function onOpenSubtask(taskId: string) {
  emit('open-task', taskId);
}

async function saveTitle(title: string) {
  if (!task.value) return;
  const prev = task.value.title;
  task.value.title = title;
  const op = await taskStore.changeTitle(task.value.id, { title });
  if (op.status !== OperationResultStatus.Success) task.value.title = prev;
}

async function saveDescription(description: string) {
  if (!task.value) return;
  const prev = task.value.description;
  task.value.description = description;
  const op = await taskStore.changeDescription(task.value.id, { description });
  if (op.status !== OperationResultStatus.Success) task.value.description = prev;
}

async function changeState(state: WorkPackageTaskState) {
  if (!task.value) return;
  const prev = task.value.state;
  task.value.state = state;
  const op = await taskStore.changeState(task.value.id, { state });
  if (op.status !== OperationResultStatus.Success) task.value.state = prev;
}

async function addComment(message: string) {
  if (!task.value) return;
  await taskStore.comment(task.value.id, { message });
  const result = await taskStore.fetchTask(props.taskId);
  if (result.status === OperationResultStatus.Success) task.value = result.data;
}

async function onToggleWatch() {
  if (!task.value) return;
  togglingWatch.value = true;
  const prev = task.value.watching;
  task.value.watching = !prev;
  const op = await taskStore.toggleWatch(task.value.id);
  if (op.status !== OperationResultStatus.Success) task.value.watching = prev;
  togglingWatch.value = false;
}

async function onArchive() {
  if (!task.value) return;
  togglingArchive.value = true;
  await taskStore.toggleArchive(task.value.id);
  togglingArchive.value = false;
  close();
}

async function toggleLabel(label: WorkPackageLabelViewModel) {
  if (!task.value) return;
  const isSelected = task.value.labels?.some(l => l.labelId === label.id);
  if (isSelected) {
    const prev = [...task.value.labels];
    task.value.labels = task.value.labels.filter(l => l.labelId !== label.id);
    const op = await taskStore.removeLabel(task.value.id, label.id);
    if (op.status !== OperationResultStatus.Success) task.value.labels = prev;
  } else {
    const op = await taskStore.addLabel(task.value.id, label.id);
    if (op.status === OperationResultStatus.Success && op.data) {
      if (!task.value.labels.some(l => l.labelId === label.id)) {
        task.value.labels.push(op.data);
      }
    }
  }
}

async function toggleMember(member: ProjectMemberViewModel) {
  if (!task.value || (member as any).waiting) return;
  (member as any).waiting = true;
  const isSelected = task.value.members?.some(m => m.recordId === member.recordId);
  if (isSelected) {
    const prev = [...task.value.members];
    task.value.members = task.value.members.filter(m => m.recordId !== member.recordId);
    const op = await taskStore.removeMember(task.value.id, member.recordId);
    if (op.status !== OperationResultStatus.Success) task.value.members = prev;
  } else {
    const op = await taskStore.addMember(task.value.id, {
      isGroup: member.isGroup,
      recordId: member.recordId,
    });
    if (op.status === OperationResultStatus.Success && op.data) {
      if (!task.value.members.some(m => m.recordId === member.recordId)) {
        task.value.members.push(op.data);
      }
    }
  }
  (member as any).waiting = false;
}

async function onInviteEmail(email: string) {
  if (!task.value) return;
  const projId = task.value.projectId;
  if (!projId) return;
  await projectStore.addAccess(projId, {
    members: [{ id: email, access: 3, isGroup: false }],
  });
  const projResult = await projectStore.fetchProject(projId);
  if (projResult.status === OperationResultStatus.Success && projResult.data) {
    projectMembers.value = ((projResult.data as any).members || []).filter((m: any) => !m.isGroup);
  }
}

async function onUploadFiles(files: File[]) {
  if (!task.value) return;
  const taskId = task.value.id;

  for (const file of files) {
    const isImage = file.type.startsWith('image/');
    const entry: PendingUpload = {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
      objectUrl: isImage ? URL.createObjectURL(file) : undefined,
    };
    pendingUploads.value.push(entry);

    taskStore.uploadAttachment(taskId, file, (p: number) => {
      entry.progress = p;
    }).then((result) => {
      if (result.status === OperationResultStatus.Success) {
        entry.status = 'done';
        entry.progress = 100;
        // Attachment data arrives via socket event (WorkPackageTaskAttachmentAdd)
        // which adds it to task.attachments — no refetch needed
        setTimeout(() => {
          pendingUploads.value = pendingUploads.value.filter(u => u.id !== entry.id);
          if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
        }, 1500);
      } else {
        entry.status = 'error';
      }
    });
  }
}

async function removeAttachment(att: WorkPackageTaskAttachmentViewModel) {
  if (!task.value) return;
  const prev = [...task.value.attachments];
  task.value.attachments = task.value.attachments.filter(a => a.id !== att.id);
  const op = await taskStore.removeAttachment(att.id);
  if (op.status !== OperationResultStatus.Success) task.value.attachments = prev;
}

async function toggleWorking() {
  if (!task.value) return;
  await taskStore.toggleTimer(task.value.id);
  // Refresh profile so workingTaskId updates (controls play/stop button)
  await authStore.loadProfile();
  const result = await taskStore.fetchTask(props.taskId);
  if (result.status === OperationResultStatus.Success) task.value = result.data;
}

async function onSpendTime(model: SpendTimeDto) {
  if (!task.value) return;
  await taskStore.spendTime(task.value.id, model);
  const result = await taskStore.fetchTask(props.taskId);
  if (result.status === OperationResultStatus.Success) task.value = result.data;
}

function onScrollSidebar(section: string) {
  sidebarRef.value?.scrollToSection(section);
}

async function fetchLogs() {
  if (!task.value) return;
  loadingLogs.value = true;
  const op = await taskStore.logs(task.value.id);
  if (op.status === OperationResultStatus.Success && op.data) {
    activityLogs.value = op.data;
  }
  loadingLogs.value = false;
}

// --- Load WP data ---
async function loadWorkPackageData() {
  if (!task.value) return;
  const pkgId = props.packageId || task.value.packageId;
  const projId = props.projectId || task.value.projectId;

  if (pkgId) {
    const wpResult = await wpStore.fetch(pkgId);
    if (wpResult.status === OperationResultStatus.Success && wpResult.data) {
      wpLabels.value = wpResult.data.labels || [];
      wpCustomFields.value = wpResult.data.customFields || [];
      const wp = wpResult.data;
      wpSettings.value = {
        allowAttachment: wp.allowAttachment ?? true,
        allowComments: wp.allowComments ?? true,
        allowCustomField: wp.allowCustomField ?? true,
        allowEndAt: wp.allowEndAt ?? true,
        allowEstimatedTime: wp.allowEstimatedTime ?? true,
        allowGeoLocation: wp.allowGeoLocation ?? true,
        allowLabels: wp.allowLabels ?? true,
        allowMembers: wp.allowMembers ?? true,
        allowPoll: wp.allowPoll ?? true,
        allowState: wp.allowState ?? true,
        allowTimeSpent: wp.allowTimeSpent ?? true,
        allowBlockingBoardTasks: wp.allowBlockingBoardTasks ?? true,
      };
    }
  }

  if (projId) {
    const proj = projectStore.projects.find(p => p.id === projId);
    if (proj && (proj as any).members) {
      projectMembers.value = (proj as any).members.filter((m: any) => !m.isGroup);
    } else {
      const projResult = await projectStore.fetchProject(projId);
      if (projResult.status === OperationResultStatus.Success && projResult.data) {
        projectMembers.value = ((projResult.data as any).members || []).filter((m: any) => !m.isGroup);
      }
    }
  }
}

// --- Keyboard ---
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

// --- Socket Notifications ---
useSocketNotifications({
  [ActivityType.WorkPackageTaskEdit]: (data: any) => {
    if (!task.value || task.value.id !== data.id) return;
    const updates: Record<string, any> = {};
    for (const key of ['state', 'title', 'description', 'dueAt', 'beginAt', 'endAt', 'coverId', 'listId', 'listName', 'timeSpent', 'archivedAt']) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    Object.assign(task.value, updates);
  },
  [ActivityType.WorkPackageTaskDone]: (data: any) => {
    if (task.value && task.value.id === data.id) task.value.state = data.state;
  },
  [ActivityType.WorkPackageTaskBlocked]: (data: any) => {
    if (task.value && task.value.id === data.id) task.value.state = data.state;
  },
  [ActivityType.WorkPackageTaskComment]: (data: any) => {
    if (task.value && task.value.id === data.taskId) task.value.comments.unshift(data);
  },
  [ActivityType.WorkPackageTaskLabelAdd]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    if (!task.value.labels.find(l => l.labelId === data.labelId)) task.value.labels.push(data);
  },
  [ActivityType.WorkPackageTaskLabelRemove]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    task.value.labels = task.value.labels.filter(l => l.labelId !== data.labelId);
  },
  [ActivityType.WorkPackageTaskMemberAdd]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    if (!task.value.members.find(m => m.recordId === data.recordId)) task.value.members.push(data);
  },
  [ActivityType.WorkPackageTaskMemberRemove]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    task.value.members = task.value.members.filter(m => m.recordId !== data.recordId);
  },
  [ActivityType.WorkPackageTaskAttachmentAdd]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    const att = data.attachment || data;
    if (att.id && !task.value.attachments.find((a: any) => a.id === att.id)) {
      task.value.attachments.unshift(att);
      task.value.attachmentCount = task.value.attachments.length;
    }
  },
  [ActivityType.WorkPackageTaskAttachmentRemove]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    task.value.attachments = task.value.attachments.filter(a => a.id !== data.id);
  },
  [ActivityType.WorkPackageTaskAttachmentRename]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    const found = task.value.attachments.find(a => a.id === data.id);
    if (found) Object.assign(found, data);
  },
  [ActivityType.WorkPackageTaskWatch]: (data: any) => {
    if (task.value && task.value.id === data.taskId) task.value.watching = data.watching;
  },
  [ActivityType.WorkPackageTaskVote]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    const found = (task.value.votes || []).find((v: any) => v.id === data.id);
    if (found) Object.assign(found, data);
    else task.value.votes?.push(data);
    task.value.upVotes = (task.value.votes || []).filter((v: any) => v.vote).length;
    task.value.downVotes = (task.value.votes || []).filter((v: any) => !v.vote).length;
  },
  [ActivityType.WorkPackageTaskArchive]: (data: any) => {
    if (task.value && task.value.id === data.id) task.value.archivedAt = data.archivedAt;
  },
  [ActivityType.WorkPackageTaskTime]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    if (task.value.timeSpents) {
      const existing = task.value.timeSpents.find((ts: any) => ts.id === data.id);
      if (existing) Object.assign(existing, data);
      else task.value.timeSpents.push(data);
    }
  },
  [ActivityType.WorkPackageTaskAdd]: (data: any) => {
    if (!task.value || task.value.id !== data.parentId) return;
    if (!task.value.subTasks?.find((s: any) => s.id === data.id)) {
      task.value.subTasks?.unshift(data);
    }
  },
  [ActivityType.WorkPackageTaskRemove]: (data: any) => {
    if (task.value && task.value.id === data.id) close();
  },
  [ActivityType.WorkPackageCustomFieldValueSet]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    const cfv = (task.value.customFieldValues || []).find((v: any) => v.fieldId === data.fieldId);
    if (cfv) {
      cfv.value = data.value;
    } else {
      task.value.customFieldValues = [...(task.value.customFieldValues || []), data];
    }
  },
  [ActivityType.WorkPackageTaskAttachmentCover]: (data: any) => {
    if (!task.value || task.value.id !== data.taskId) return;
    task.value.coverId = data.isCover ? data.attachmentId : '';
    task.value.attachments.forEach((a: any) => {
      a.isCover = a.id === data.attachmentId ? data.isCover : false;
    });
  },
});

// --- Lifecycle ---
onMounted(async () => {
  document.addEventListener('keydown', onKeydown);
  await nextTick();
  visible.value = true;

  const result = await taskStore.fetchTask(props.taskId);
  if (result.status === OperationResultStatus.Success) {
    task.value = result.data;
    await loadWorkPackageData();
  }
  loading.value = false;

  timerInterval.value = setInterval(() => {
    if (task.value?.timeSpents?.some(t => !t.end)) {
      now.value = Date.now();
    }
  }, 1000);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  if (timerInterval.value) clearInterval(timerInterval.value);
  pendingUploads.value.forEach(u => { if (u.objectUrl) URL.revokeObjectURL(u.objectUrl); });
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.tm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.tm-panel {
  width: min(92vw, 1100px);
  max-height: 90vh;
  background: $surface;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.tm-loading {
  display: flex;
  flex: 1;
  min-height: 400px;
}

.tm-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// Scale+fade transition
.task-modal-enter-active {
  transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1);
  .tm-panel { transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1); }
}
.task-modal-leave-active {
  transition: opacity 200ms ease;
  .tm-panel { transition: transform 200ms ease; }
}
.task-modal-enter-from,
.task-modal-leave-to {
  opacity: 0;
  .tm-panel { transform: scale(0.95); }
}

// Responsive — tablet
@media (max-width: $breakpoint-md) {
  .tm-backdrop {
    padding: 0;
  }
  .tm-panel {
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
  .tm-body {
    flex-direction: column;
  }
}

// Responsive — mobile
@media (max-width: 600px) {
  .tm-backdrop {
    padding: 0;
  }
  .tm-panel {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  .tm-body {
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>

<!-- Dark mode (unscoped) -->
<style lang="scss">
body.dark-mode {
  .tm-panel {
    background: #2d2d2d;
  }
}
</style>
