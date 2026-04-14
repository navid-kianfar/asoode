<template>
  <div class="work-package-page">
    <WpBoardSkeleton v-if="preWaiting && viewMode === 'board'" />
    <WpListSkeleton v-if="preWaiting && viewMode !== 'board'" />

    <template v-if="!preWaiting && workPackage && projectData">
      <!-- Header: breadcrumb, view tabs, settings gear -->
      <WpHeader
        :view-mode="viewMode"
        @switch-mode="viewMode = $event"
        @open-settings="showSettings = true"
        @open-rename="openRename"
      />

      <!-- Toolbar: filters, members strip, progress, objectives -->
      <WpToolbar
        :filters-mine="filtersMine"
        :filters-archived="filtersArchived"
        :filters-active="filtersActive"
        :filters-labels="filtersLabels"
        @toggle-mine="filtersMine = !filtersMine; refetch()"
        @toggle-archived="filtersArchived = !filtersArchived; refetch()"
        @toggle-active="filtersActive = !filtersActive; refetch()"
        @toggle-label="toggleLabel($event)"
        @open-objectives="showObjectiveModal = true; editingObjective = undefined"
        @open-members="showMembersPopover = true"
        @open-invite="showInviteModal = true"
      />

      <!-- Loading bar -->
      <div v-if="waiting" class="work-package-page__loading">
        <div class="work-package-page__loading-bar"></div>
      </div>

      <!-- Content area: switches by viewMode -->
      <div class="work-package-page__content">
        <WpBoard
          v-if="viewMode === 'board'"
          :work-package="workPackage"
          :permission="permission"
          @open-task="openTask($event)"
          @refetch="refetch"
        />
        <WpListView
          v-if="viewMode === 'list'"
          @open-task="openTask"
          @create-task="onCreateTask"
        />
        <WpCalendarView
          v-if="viewMode === 'calendar'"
          :work-package="workPackage"
          @open-task="openTask"
        />
        <WpGanttView
          v-if="viewMode === 'timespan'"
          :work-package="workPackage"
          @open-task="openTask"
        />
      </div>

      <!-- Settings slide-out panel -->
      <WpSettingsPanel
        :visible="showSettings"
        @close="showSettings = false"
        @open-permissions="showPermissionsModal = true"
        @open-sort-orders="showSortOrderModal = true"
        @open-invite="showInviteModal = true"
        @leave="leaveWorkPackage"
        @archive="archiveWorkPackage"
        @remove="removeWorkPackage"
      />

      <!-- Members popover -->
      <WpMembersPopover
        v-if="showMembersPopover"
        @close="showMembersPopover = false"
        @change-access="changeAccess"
        @remove-member="removeMember"
        @change-pending="changePendingAccess"
        @remove-pending="removePending"
        @invite="showMembersPopover = false; showInviteModal = true"
      />

      <!-- Modals -->
      <WpRenameModal
        v-if="showRenameModal"
        :work-package="workPackage"
        @close="showRenameModal = false"
        @saved="onRenameSaved"
      />

      <WpObjectiveModal
        v-if="showObjectiveModal"
        :work-package="workPackage"
        :objective="editingObjective"
        @close="showObjectiveModal = false"
        @saved="onObjectiveSaved"
      />

      <WpSortOrderModal
        v-if="showSortOrderModal"
        :work-package="workPackage"
        @close="showSortOrderModal = false"
        @saved="onSortOrdersSaved"
      />

      <WpInviteModal
        v-if="showInviteModal"
        :work-package="workPackage"
        @close="showInviteModal = false"
        @invited="refetch"
      />

      <WorkPackagePermissionModal
        v-if="showPermissionsModal && workPackage"
        :work-package="workPackage"
        @close="showPermissionsModal = false"
        @saved="refetch"
      />

      <!-- Task detail modal -->
      <TaskModal
        v-if="openedTaskId"
        :task-id="openedTaskId"
        @close="openedTaskId = ''"
        @open-task="openedTaskId = $event"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { useProjectStore } from '@/stores/project.store';
import { useTaskStore } from '@/stores/task.store';
import { usePermission } from '@/composables/usePermission';
import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { useViewContext } from '@/composables/useViewContext';
import { useModal } from '@/composables/useModal';
import {
  OperationResultStatus, AccessType, ActivityType,
  type WorkPackageViewModel, type ProjectViewModel,
  type WorkPackageMemberViewModel, type WorkPackageObjectiveViewModel,
  type WorkPackageTaskViewModel,
} from '@asoode/shared';

import WpBoardSkeleton from '@/components/core/skeletons/WpBoardSkeleton.vue';
import WpListSkeleton from '@/components/core/skeletons/WpListSkeleton.vue';
import WpHeader from '@/components/features/work-package/WpHeader.vue';
import WpToolbar from '@/components/features/work-package/WpToolbar.vue';
import WpBoard from '@/components/features/work-package/WpBoard.vue';
import WpListView from '@/components/features/work-package/WpListView.vue';
import WpCalendarView from '@/components/features/work-package/WpCalendarView.vue';
import WpGanttView from '@/components/features/work-package/WpGanttView.vue';
import WpSettingsPanel from '@/components/features/work-package/WpSettingsPanel.vue';
import WpMembersPopover from '@/components/features/work-package/WpMembersPopover.vue';
import WpRenameModal from '@/components/modals/WpRenameModal.vue';
import WpObjectiveModal from '@/components/modals/WpObjectiveModal.vue';
import WpSortOrderModal from '@/components/modals/WpSortOrderModal.vue';
import WpInviteModal from '@/components/modals/WpInviteModal.vue';
import WorkPackagePermissionModal from '@/components/modals/WorkPackagePermissionModal.vue';
import TaskModal from '@/components/modals/TaskModal.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const wpStore = useWorkPackageStore();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const { canAdmin: canAdminFn, isOwner: isOwnerFn } = usePermission();
const modal = useModal();

// ── Focus context for smart push suppression ─────────────────────────────
const packageId = computed(() => route.params.packageId as string || '');
const { updateContext: updateFocusContext } = useViewContext('work-package', packageId.value);
watch(packageId, (id) => updateFocusContext(id));

// ── Core state ──────────────────────────────────────────────────────────
const preWaiting = ref(true);
const waiting = ref(false);
const workPackage = ref<WorkPackageViewModel | null>(null);
const projectData = ref<ProjectViewModel | null>(null);
const viewMode = ref<'board' | 'list' | 'timespan' | 'calendar'>('board');

// ── Modal/panel visibility ──────────────────────────────────────────────
const showSettings = ref(false);
const showMembersPopover = ref(false);
const showRenameModal = ref(false);
const showObjectiveModal = ref(false);
const showSortOrderModal = ref(false);
const showInviteModal = ref(false);
const showPermissionsModal = ref(false);
const openedTaskId = ref('');

// ── Objective editing ───────────────────────────────────────────────────
const editingObjective = ref<WorkPackageObjectiveViewModel | undefined>(undefined);

// ── Filters ─────────────────────────────────────────────────────────────
const filtersMine = ref(false);
const filtersArchived = ref(false);
const filtersActive = ref(false);
const filtersLabels = ref<Record<string, boolean>>({});

// ── Computed ────────────────────────────────────────────────────────────
const permission = computed(() => {
  if (!projectData.value || !workPackage.value) return AccessType.Visitor;
  return projectStore.getWorkPackagePermission(projectData.value, workPackage.value);
});

const canAdmin = computed(() => canAdminFn(permission.value));
const isOwner = computed(() => isOwnerFn(permission.value));

// ── Provide to children ─────────────────────────────────────────────────
provide('workPackage', workPackage);
provide('projectData', projectData);
provide('permission', permission);

// ── Data loading ────────────────────────────────────────────────────────
async function loadWorkPackage() {
  preWaiting.value = true;
  const id = route.params.id as string;
  const archived = route.meta.archived;

  const result = archived
    ? await wpStore.fetchArchived(id)
    : await wpStore.fetch(id);

  if (result.status !== OperationResultStatus.Success || !result.data) {
    preWaiting.value = false;
    return;
  }

  workPackage.value = result.data;

  if (result.data.projectId) {
    const projResult = await projectStore.fetchProject(result.data.projectId);
    if (projResult.status === OperationResultStatus.Success) {
      projectData.value = projResult.data;
    }
  }

  preWaiting.value = false;
}

async function refetch() {
  if (!workPackage.value) return;
  waiting.value = true;
  const result = await wpStore.fetch(workPackage.value.id);
  if (result.status === OperationResultStatus.Success && result.data) {
    workPackage.value = result.data;
  }
  waiting.value = false;
}

onMounted(loadWorkPackage);
watch(() => route.params.id, loadWorkPackage);

// ── Event handlers ──────────────────────────────────────────────────────
function openTask(taskOrId: WorkPackageTaskViewModel | string) {
  openedTaskId.value = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
}

function openRename() {
  showRenameModal.value = true;
}

function onRenameSaved(title: string, description: string) {
  if (workPackage.value) {
    workPackage.value.title = title;
    workPackage.value.description = description;
  }
}

function toggleLabel(labelId: string) {
  filtersLabels.value[labelId] = !filtersLabels.value[labelId];
  refetch();
}

async function onCreateTask(payload: { listId: string; title: string; metadata?: any }) {
  const op = await taskStore.create(payload.listId, { 
    title: payload.title,
    ...(payload.metadata || {}),
  } as any);
  if (op.status === OperationResultStatus.Success) {
    refetch();
  }
}

function onObjectiveSaved(_data: any) {
  refetch();
}

function onSortOrdersSaved() {
  refetch();
}

// ── Member management ───────────────────────────────────────────────────
async function changeAccess(member: WorkPackageMemberViewModel, access: number) {
  member.waiting = true;
  const op = await wpStore.changeAccess(member.id, { access });
  member.waiting = false;
  if (op.status === OperationResultStatus.Success) {
    member.access = access as AccessType;
  }
}

async function removeMember(member: WorkPackageMemberViewModel) {
  if (!workPackage.value) return;
  modal.confirm({
    title: 'REMOVE_ACCESS',
    message: 'REMOVE_MEMBER_CONFIRM',
    actionLabel: 'REMOVE_ACCESS',
    cancelLabel: 'CANCEL',
    action: async () => {
      member.waiting = true;
      const op = await wpStore.removeAccess(member.id);
      member.waiting = false;
      if (op.status === OperationResultStatus.Success && workPackage.value) {
        workPackage.value.members = workPackage.value.members.filter(m => m.id !== member.id);
      }
    },
  });
}

async function changePendingAccess(pending: any, access: number) {
  pending.waiting = true;
  const op = await wpStore.changePendingAccess(pending.id, { access });
  pending.waiting = false;
  if (op.status === OperationResultStatus.Success) {
    pending.access = access;
  }
}

async function removePending(pending: any) {
  if (!workPackage.value) return;
  modal.confirm({
    title: 'REMOVE_ACCESS',
    message: 'REMOVE_MEMBER_CONFIRM',
    actionLabel: 'REMOVE_ACCESS',
    cancelLabel: 'CANCEL',
    action: async () => {
      pending.waiting = true;
      const op = await wpStore.removePendingAccess(pending.id);
      pending.waiting = false;
      if (op.status === OperationResultStatus.Success && workPackage.value) {
        workPackage.value.pending = workPackage.value.pending.filter((p: any) => p.id !== pending.id);
      }
    },
  });
}

// ── Work package actions ────────────────────────────────────────────────
async function leaveWorkPackage() {
  if (!workPackage.value) return;
  modal.confirm({
    title: 'LEAVE_WORK_PACKAGE',
    message: 'LEAVE_WORK_PACKAGE_CONFIRM',
    actionLabel: 'LEAVE',
    cancelLabel: 'CANCEL',
    action: async () => {
      const op = await wpStore.leave(workPackage.value!.id);
      if (op.status === OperationResultStatus.Success) {
        router.push('/dashboard');
      }
    },
  });
}

async function archiveWorkPackage() {
  if (!workPackage.value) return;
  modal.confirm({
    title: 'ARCHIVE_WORK_PACKAGE',
    message: 'ARCHIVE_WORK_PACKAGE_CONFIRM',
    actionLabel: 'ARCHIVE',
    cancelLabel: 'CANCEL',
    action: async () => {
      const op = await wpStore.archive(workPackage.value!.id);
      if (op.status === OperationResultStatus.Success) {
        router.push('/dashboard');
      }
    },
  });
}

async function removeWorkPackage() {
  if (!workPackage.value) return;
  modal.confirm({
    title: 'REMOVE_WORK_PACKAGE',
    message: 'REMOVE_WORK_PACKAGE_CONFIRM',
    actionLabel: 'REMOVE',
    cancelLabel: 'CANCEL',
    action: async () => {
      const op = await wpStore.remove(workPackage.value!.id);
      if (op.status === OperationResultStatus.Success) {
        router.push('/dashboard');
      }
    },
  });
}

// ── Socket helper ───────────────────────────────────────────────────────
function findTask(taskId: string): WorkPackageTaskViewModel | null {
  if (!workPackage.value) return null;
  for (const list of workPackage.value.lists) {
    const task = (list.tasks || []).find(t => t.id === taskId);
    if (task) return task;
  }
  return null;
}

// ── Socket event handlers ───────────────────────────────────────────────
useSocketNotifications({
  [ActivityType.ProjectArchive]: (data: any) => {
    if (workPackage.value?.projectId === data.id) router.push('/dashboard');
  },
  [ActivityType.WorkPackageListAdd]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    data.tasks = data.tasks || [];
    wp.lists.push(data);
  },
  [ActivityType.WorkPackageListEdit]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    const found = wp.lists.find(l => l.id === data.id);
    if (found) Object.assign(found, data);
  },
  [ActivityType.WorkPackageListRemove]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    wp.lists = wp.lists.filter(l => l.id !== data.id);
  },
  [ActivityType.WorkPackageListArchive]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    wp.lists = wp.lists.filter(l => l.id !== data.id);
  },
  [ActivityType.WorkPackageListClone]: () => refetch(),
  [ActivityType.WorkPackageListOrder]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    const found = wp.lists.find(l => l.id === data.id);
    if (found) {
      found.order = data.order;
      wp.lists.sort((a, b) => a.order - b.order);
    }
  },
  [ActivityType.WorkPackageListTasksDelete]: (data: any) => {
    const wp = workPackage.value;
    if (!wp) return;
    const found = wp.lists.find(l => l.id === data.id);
    if (found) found.tasks = [];
  },
  [ActivityType.WorkPackageListTasksArchive]: (data: any) => {
    const wp = workPackage.value;
    if (!wp) return;
    const found = wp.lists.find(l => l.id === data.id);
    if (found) found.tasks = [];
  },
  [ActivityType.WorkPackageMemberAdd]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.id) return;
    wp.members = [...wp.members, ...(data.members || [])];
    wp.pending = [...wp.pending, ...(data.pending || [])];
  },
  [ActivityType.WorkPackageMemberRemove]: (data: any) => {
    const wp = workPackage.value;
    if (!wp) return;
    if (data.packageId === wp.id) {
      wp.members = wp.members.filter(m => m.id !== data.id);
    }
    if (data.recordId === wp.id) {
      wp.pending = wp.pending.filter(m => m.id !== data.id);
    }
  },
  [ActivityType.WorkPackageMemberPermission]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || data.packageId !== wp.id) return;
    const found = wp.members.find(m => m.id === data.id);
    if (found) found.access = data.access;
  },
  [ActivityType.WorkPackageObjectiveAdd]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    wp.objectives.push(data);
  },
  [ActivityType.WorkPackageObjectiveEdit]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    const found = wp.objectives.find(o => o.id === data.id);
    if (found) Object.assign(found, data);
  },
  [ActivityType.WorkPackageObjectiveRemove]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    wp.objectives = wp.objectives.filter(o => o.id !== data.id);
  },
  [ActivityType.WorkPackageTaskAdd]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId || data.parentId) return;
    const list = wp.lists.find(l => l.id === data.listId);
    if (list && !(list.tasks || []).find(t => t.id === data.id)) {
      list.tasks = [data, ...(list.tasks || [])];
    }
  },
  [ActivityType.WorkPackageTaskEdit]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    const task = findTask(data.id);
    if (task) {
      Object.assign(task, {
        state: data.state, title: data.title, description: data.description,
        dueAt: data.dueAt, beginAt: data.beginAt, endAt: data.endAt,
        coverId: data.coverId, listId: data.listId, listName: data.listName,
        timeSpent: data.timeSpent, archivedAt: data.archivedAt,
        hasDescription: !!(data.description && data.description.length > 0),
      });
    }
  },
  [ActivityType.WorkPackageTaskDone]: (data: any) => {
    if (workPackage.value?.id !== data.packageId) return;
    const task = findTask(data.id);
    if (task) task.state = data.state;
  },
  [ActivityType.WorkPackageTaskBlocked]: (data: any) => {
    if (workPackage.value?.id !== data.packageId) return;
    const task = findTask(data.id);
    if (task) task.state = data.state;
  },
  [ActivityType.WorkPackageTaskArchive]: (data: any) => {
    if (workPackage.value?.id !== data.packageId) return;
    const task = findTask(data.id);
    if (task) task.archivedAt = data.archivedAt;
  },
  [ActivityType.WorkPackageTaskRemove]: (data: any) => {
    if (!workPackage.value) return;
    for (const list of workPackage.value.lists) {
      list.tasks = (list.tasks || []).filter(t => t.id !== data.id);
    }
  },
  [ActivityType.WorkPackageTaskMemberAdd]: (data: any) => {
    const task = findTask(data.taskId);
    if (task && !(task.members || []).find(m => m.recordId === data.recordId)) {
      task.members.push(data);
    }
  },
  [ActivityType.WorkPackageTaskMemberRemove]: (data: any) => {
    const task = findTask(data.taskId);
    if (task) task.members = task.members.filter(m => m.recordId !== data.recordId);
  },
  [ActivityType.WorkPackageTaskLabelAdd]: (data: any) => {
    const task = findTask(data.taskId);
    if (task && !(task.labels || []).find(l => l.labelId === data.labelId)) {
      task.labels.push(data);
    }
  },
  [ActivityType.WorkPackageTaskLabelRemove]: (data: any) => {
    const task = findTask(data.taskId);
    if (task) task.labels = task.labels.filter(l => l.labelId !== data.labelId);
  },
  [ActivityType.WorkPackageTaskComment]: (data: any) => {
    const task = findTask(data.taskId);
    if (task) task.commentCount = (task.commentCount || 0) + 1;
  },
  [ActivityType.WorkPackageTaskAttachmentAdd]: (data: any) => {
    const task = findTask(data.taskId);
    if (task) task.attachmentCount = (task.attachmentCount || 0) + 1;
  },
  [ActivityType.WorkPackageTaskAttachmentRemove]: (data: any) => {
    const task = findTask(data.taskId);
    if (task && task.attachmentCount > 0) task.attachmentCount--;
  },
  [ActivityType.WorkPackageTaskTime]: (data: any) => {
    const task = findTask(data.taskId);
    if (task) task.timeSpent = data.timeSpent ?? task.timeSpent;
  },
  // Custom field socket events
  [ActivityType.WorkPackageCustomFieldAdd]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    if ((wp.customFields || []).some((f: any) => f.id === data.id)) return;
    wp.customFields = [...(wp.customFields || []), data];
  },
  [ActivityType.WorkPackageCustomFieldEdit]: (data: any) => {
    const wp = workPackage.value;
    if (!wp) return;
    const found = (wp.customFields || []).find(f => f.id === data.id);
    if (found) Object.assign(found, data);
  },
  [ActivityType.WorkPackageCustomFieldRemove]: (data: any) => {
    const wp = workPackage.value;
    if (!wp) return;
    wp.customFields = (wp.customFields || []).filter(f => f.id !== data.id);
  },
  [ActivityType.WorkPackageCustomFieldValueSet]: (data: any) => {
    const task = findTask(data.taskId);
    if (!task) return;
    const cfv = (task.customFieldValues || []).find((v: any) => v.fieldId === data.fieldId);
    if (cfv) {
      cfv.value = data.value;
    } else {
      task.customFieldValues = [...(task.customFieldValues || []), data];
    }
  },
  [ActivityType.WorkPackageLabelAdd]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    if (!(wp.labels || []).find((l: any) => l.id === data.id)) {
      wp.labels = [...(wp.labels || []), data];
    }
  },
  [ActivityType.WorkPackageLabelRename]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    const found = (wp.labels || []).find((l: any) => l.id === data.id);
    if (found) Object.assign(found, data);
  },
  [ActivityType.WorkPackageLabelRemove]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.packageId) return;
    wp.labels = (wp.labels || []).filter((l: any) => l.id !== data.id);
  },
  [ActivityType.WorkPackageEdit]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.id) return;
    Object.assign(wp, data);
  },
  [ActivityType.WorkPackageArchive]: (data: any) => {
    if (workPackage.value?.id === data.id) router.push('/dashboard');
  },
  [ActivityType.WorkPackageSetting]: (data: any) => {
    const wp = workPackage.value;
    if (!wp || wp.id !== data.id) return;
    Object.assign(wp, data);
  },
  [ActivityType.WorkPackageTaskReposition]: (data: any) => {
    if (!workPackage.value) return;
    // Remove task from old list
    for (const list of workPackage.value.lists) {
      const idx = (list.tasks || []).findIndex((t: any) => t.id === data.id);
      if (idx !== -1) {
        const [movedTask] = list.tasks.splice(idx, 1);
        // Insert into target list at correct position
        const targetList = workPackage.value.lists.find(l => l.id === data.listId);
        if (targetList) {
          movedTask.listId = data.listId;
          movedTask.order = data.order;
          targetList.tasks = targetList.tasks || [];
          targetList.tasks.push(movedTask);
          targetList.tasks.sort((a: any, b: any) => a.order - b.order);
        }
        break;
      }
    }
  },
  [ActivityType.WorkPackageTaskMove]: (data: any) => {
    if (!workPackage.value) return;
    // If task moved out of this package, remove it
    if (data.oldPackageId === workPackage.value.id && data.packageId !== workPackage.value.id) {
      for (const list of workPackage.value.lists) {
        list.tasks = (list.tasks || []).filter((t: any) => t.id !== data.id);
      }
    }
    // If task moved into this package, refetch to get fresh data
    if (data.packageId === workPackage.value.id && data.oldPackageId !== workPackage.value.id) {
      refetch();
    }
  },
  [ActivityType.WorkPackageTaskAttachmentCover]: (data: any) => {
    const task = findTask(data.taskId);
    if (task) {
      task.coverId = data.isCover ? data.attachmentId : '';
    }
  },
});
</script>

<style lang="scss">
@import '@/styles/variables';

.work-package-page {
  background: #fff;
  height: calc(100vh - 58px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__loading {
    height: 3px;
    background: $divider;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__loading-bar {
    height: 100%;
    width: 30%;
    background: $primary;
    border-radius: 2px;
    animation: wp-loading-slide 1.4s ease-in-out infinite;
  }

  &__content {
    flex: 1;
    overflow: auto;
    position: relative;
  }
}

@keyframes wp-loading-slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(200%); }
  100% { transform: translateX(400%); }
}

// ── Dark mode ───────────────────────────────────────────────────────────
body.dark-mode {
  .work-package-page {
    background: #1e1e1e;

    &__loading {
      background: $dark-divider;
    }

    &__loading-bar {
      background: $primary-light;
    }
  }
}
</style>
