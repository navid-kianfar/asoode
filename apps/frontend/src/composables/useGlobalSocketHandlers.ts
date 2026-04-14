import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { useGroupStore } from '@/stores/group.store';
import { useProjectStore } from '@/stores/project.store';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { ActivityType } from '@asoode/shared';

/**
 * Registers global socket event handlers for app-level events.
 * All UI updates flow through socket events for a single source of truth.
 * Call once in App.vue when authenticated.
 */
export function useGlobalSocketHandlers() {
  const groupStore = useGroupStore();
  const projectStore = useProjectStore();
  const authStore = useAuthStore();
  const wpStore = useWorkPackageStore();

  /** Returns true if the event targets the currently viewed work package */
  function isCurrentWP(data: any): boolean {
    const packageId = data?.packageId || data?.id;
    return !!(packageId && wpStore.current?.id === packageId);
  }

  /** Refetch for complex operations (list clone, merge, bulk) where granular update isn't practical */
  function refetchIfCurrentWP(data: any) {
    const packageId = data?.packageId || data?.id;
    if (packageId && wpStore.current?.id === packageId) {
      wpStore.fetch(packageId);
    }
  }

  /** Find a task in the current WP tasks array */
  function findTask(taskId: string) {
    return wpStore.current?.tasks?.find((t) => t.id === taskId);
  }

  useSocketNotifications({
    // ─── Groups ────────────────────────────────────────────
    [ActivityType.GroupAdd]: (data: any) => {
      if (!groupStore.groups.find((g) => g.id === data.id)) {
        groupStore.groups.push(data);
      }
    },
    [ActivityType.GroupEdit]: (data: any) => {
      const found = groupStore.groups.find((g) => g.id === data.id);
      if (found) Object.assign(found, data);
    },
    [ActivityType.GroupRemove]: (data: any) => {
      groupStore.groups = groupStore.groups.filter((g) => g.id !== data.id);
    },
    [ActivityType.GroupArchive]: (data: any) => {
      groupStore.groups = groupStore.groups.filter((g) => g.id !== data.id);
    },
    [ActivityType.GroupRestore]: () => {
      groupStore.load();
    },

    // ─── Projects ──────────────────────────────────────────
    [ActivityType.ProjectAdd]: (data: any) => {
      if (!projectStore.projects.find((p) => p.id === data.id)) {
        projectStore.projects.push(data);
      }
    },
    [ActivityType.ProjectEdit]: (data: any) => {
      const found = projectStore.projects.find((p) => p.id === data.id);
      if (found) Object.assign(found, data);
    },
    [ActivityType.ProjectRemove]: (data: any) => {
      projectStore.projects = projectStore.projects.filter((p) => p.id !== data.id);
    },
    [ActivityType.ProjectArchive]: (data: any) => {
      projectStore.projects = projectStore.projects.filter((p) => p.id !== data.id);
    },
    [ActivityType.ProjectRestore]: () => {
      projectStore.load();
    },
    [ActivityType.ProjectSubAdd]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectSubEdit]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectSubRemove]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectSeasonAdd]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectSeasonEdit]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectSeasonRemove]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectMemberAdd]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectMemberRemove]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectMemberPermission]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectPendingAccessChange]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.ProjectPendingAccessRemove]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },

    // ─── Account ───────────────────────────────────────────
    [ActivityType.AccountEdit]: (data: any) => {
      if (authStore.profile) {
        Object.assign(authStore.profile, data);
      }
    },

    // ─── Work Package (settings/members/labels) ────────────
    [ActivityType.WorkPackageEdit]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
      if (isCurrentWP(data) && wpStore.current) {
        Object.assign(wpStore.current, data);
      }
    },
    [ActivityType.WorkPackageAdd]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.WorkPackageRemove]: (data: any) => {
      if (data.projectId) projectStore.fetchProject(data.projectId);
    },
    [ActivityType.WorkPackageMemberAdd]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        if (!wpStore.current.members.find((m) => m.id === data.id)) {
          wpStore.current.members.push(data);
        }
      }
    },
    [ActivityType.WorkPackageMemberRemove]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        wpStore.current.members = wpStore.current.members.filter((m) => m.recordId !== data.recordId && m.id !== data.id);
      }
    },
    [ActivityType.WorkPackageMemberPermission]: (data: any) => refetchIfCurrentWP(data),
    [ActivityType.WorkPackageLabelAdd]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        if (!wpStore.current.labels.find((l) => l.id === data.id)) {
          wpStore.current.labels.push(data);
        }
      }
    },
    [ActivityType.WorkPackageLabelRename]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        const label = wpStore.current.labels.find((l) => l.id === data.id);
        if (label) Object.assign(label, data);
      }
    },
    [ActivityType.WorkPackageLabelRemove]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        wpStore.current.labels = wpStore.current.labels.filter((l) => l.id !== data.id);
      }
    },
    [ActivityType.WorkPackageSetting]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        Object.assign(wpStore.current, data);
      }
    },
    [ActivityType.WorkPackageArchive]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        wpStore.current.archivedAt = new Date();
      }
    },

    // ─── Work Package Lists ────────────────────────────────
    [ActivityType.WorkPackageListAdd]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        if (!wpStore.current.lists.find((l) => l.id === data.id)) {
          wpStore.current.lists.push(data);
        }
      }
    },
    [ActivityType.WorkPackageListEdit]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        const list = wpStore.current.lists.find((l) => l.id === data.id);
        if (list) Object.assign(list, data);
      }
    },
    [ActivityType.WorkPackageListRemove]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        wpStore.current.lists = wpStore.current.lists.filter((l) => l.id !== data.id);
        wpStore.current.tasks = wpStore.current.tasks.filter((t) => t.listId !== data.id);
      }
    },
    [ActivityType.WorkPackageListArchive]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        const list = wpStore.current.lists.find((l) => l.id === data.id);
        if (list) (list as any).archivedAt = new Date();
      }
    },
    [ActivityType.WorkPackageListMove]: (data: any) => refetchIfCurrentWP(data),
    [ActivityType.WorkPackageListOrder]: (data: any) => refetchIfCurrentWP(data),
    [ActivityType.WorkPackageListClone]: (data: any) => refetchIfCurrentWP(data),
    [ActivityType.WorkPackageListTasksArchive]: (data: any) => refetchIfCurrentWP(data),
    [ActivityType.WorkPackageListTasksDelete]: (data: any) => refetchIfCurrentWP(data),

    // ─── Tasks (granular in-place updates) ──────────────────
    [ActivityType.WorkPackageTaskAdd]: (data: any) => {
      // Skip board update for subtask additions — handled by TaskModal
      if (data?.parentId) return;
      if (isCurrentWP(data) && wpStore.current) {
        if (!wpStore.current.tasks.find((t) => t.id === data.id)) {
          wpStore.current.tasks.push(data);
        }
      }
    },
    [ActivityType.WorkPackageTaskEdit]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.id);
      if (task) {
        const updates: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined) updates[k] = v;
        }
        Object.assign(task, updates);
      }
    },
    [ActivityType.WorkPackageTaskDone]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.id || data.taskId);
      if (task) {
        task.state = data.state;
        task.doneAt = data.doneAt;
        if (data.doneUserId) task.doneUserId = data.doneUserId;
      }
    },
    [ActivityType.WorkPackageTaskRemove]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        wpStore.current.tasks = wpStore.current.tasks.filter((t) => t.id !== data.id && t.id !== data.taskId);
      }
    },
    [ActivityType.WorkPackageTaskReposition]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.id || data.taskId);
      if (task) {
        if (data.order !== undefined) task.order = data.order;
        if (data.listId) task.listId = data.listId;
      }
    },
    [ActivityType.WorkPackageTaskMove]: (data: any) => {
      // Task moved to another WP — remove from current
      if (isCurrentWP(data) && wpStore.current) {
        wpStore.current.tasks = wpStore.current.tasks.filter((t) => t.id !== data.id && t.id !== data.taskId);
      }
    },
    [ActivityType.WorkPackageTaskArchive]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.id || data.taskId);
      if (task) task.archivedAt = new Date();
    },
    [ActivityType.WorkPackageTaskRestore]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.id || data.taskId);
      if (task) task.archivedAt = undefined;
    },
    [ActivityType.WorkPackageTaskMemberAdd]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task && task.members && !task.members.find((m: any) => m.id === data.id)) {
        task.members.push(data);
      }
    },
    [ActivityType.WorkPackageTaskMemberRemove]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task && task.members) {
        task.members = task.members.filter((m: any) => m.id !== data.id && m.recordId !== data.recordId);
      }
    },
    [ActivityType.WorkPackageTaskLabelAdd]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task && task.labels && !task.labels.find((l: any) => l.id === data.id)) {
        task.labels.push(data);
      }
    },
    [ActivityType.WorkPackageTaskLabelRemove]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task && task.labels) {
        task.labels = task.labels.filter((l: any) => l.id !== data.id);
      }
    },
    [ActivityType.WorkPackageTaskAttachmentAdd]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task) {
        task.attachmentCount = (task.attachmentCount || 0) + 1;
      }
    },
    [ActivityType.WorkPackageTaskAttachmentRemove]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task && task.attachmentCount > 0) {
        task.attachmentCount--;
      }
    },
    [ActivityType.WorkPackageTaskAttachmentBulkAdd]: (data: any) => refetchIfCurrentWP(data),
    [ActivityType.WorkPackageTaskComment]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task) {
        task.commentCount = (task.commentCount || 0) + 1;
      }
    },
    [ActivityType.WorkPackageTaskWatch]: (data: any) => {
      // Watching doesn't change board view — no-op for board
    },
    [ActivityType.WorkPackageTaskTime]: (data: any) => {
      // Time tracking doesn't change board card — no-op for board
    },
    [ActivityType.WorkPackageTaskVote]: (data: any) => {
      // Voting doesn't change board card — no-op for board
    },
    [ActivityType.WorkPackageTaskBlocked]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task) (task as any).isBlocked = true;
    },
    [ActivityType.WorkPackageTaskUnBlock]: (data: any) => {
      if (!isCurrentWP(data)) return;
      const task = findTask(data.taskId);
      if (task) (task as any).isBlocked = false;
    },
    [ActivityType.WorkPackageTaskBulkAdd]: (data: any) => refetchIfCurrentWP(data),

    // ─── Custom Fields ─────────────────────────────────────
    [ActivityType.WorkPackageCustomFieldAdd]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        if (!wpStore.current.customFields.find((f) => f.id === data.id)) {
          wpStore.current.customFields.push(data);
        }
      }
    },
    [ActivityType.WorkPackageCustomFieldEdit]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        const field = wpStore.current.customFields.find((f) => f.id === data.id);
        if (field) Object.assign(field, data);
      }
    },
    [ActivityType.WorkPackageCustomFieldRemove]: (data: any) => {
      if (isCurrentWP(data) && wpStore.current) {
        wpStore.current.customFields = wpStore.current.customFields.filter((f) => f.id !== data.id);
      }
    },
    [ActivityType.WorkPackageCustomFieldValueSet]: (data: any) => {
      // Custom field value set on a task — no board-level change needed
    },
  });
}
