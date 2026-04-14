import type { Ref } from 'vue';
import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { ActivityType, WorkPackageTaskState, type WorkPackageTaskViewModel } from '@asoode/shared';

/**
 * Lightweight socket handlers for the dashboard page.
 * Updates the recentTasks array in-place so the dashboard
 * reflects real-time changes without polling.
 */
export function useDashboardSocketHandlers(
  recentTasks: Ref<WorkPackageTaskViewModel[]>,
) {
  function findTask(id: string) {
    return recentTasks.value.find((t) => t.id === id);
  }

  useSocketNotifications({
    [ActivityType.WorkPackageTaskEdit]: (data: any) => {
      const task = findTask(data.id);
      if (task) Object.assign(task, data);
    },
    [ActivityType.WorkPackageTaskDone]: (data: any) => {
      const task = findTask(data.id || data.taskId);
      if (task) {
        task.state = data.state;
        task.doneAt = data.doneAt;
      }
    },
    [ActivityType.WorkPackageTaskRemove]: (data: any) => {
      recentTasks.value = recentTasks.value.filter(
        (t) => t.id !== data.id && t.id !== data.taskId,
      );
    },
    [ActivityType.WorkPackageTaskArchive]: (data: any) => {
      const task = findTask(data.id || data.taskId);
      if (task) task.archivedAt = new Date();
    },
    [ActivityType.WorkPackageTaskRestore]: (data: any) => {
      const task = findTask(data.id || data.taskId);
      if (task) task.archivedAt = undefined;
    },
    [ActivityType.WorkPackageTaskMemberAdd]: (data: any) => {
      const task = findTask(data.taskId);
      if (task && task.members && !task.members.find((m: any) => m.recordId === data.recordId)) {
        task.members.push(data);
      }
    },
    [ActivityType.WorkPackageTaskMemberRemove]: (data: any) => {
      const task = findTask(data.taskId);
      if (task && task.members) {
        task.members = task.members.filter((m: any) => m.recordId !== data.recordId);
      }
    },
    [ActivityType.WorkPackageTaskLabelAdd]: (data: any) => {
      const task = findTask(data.taskId);
      if (task && task.labels && !task.labels.find((l: any) => l.labelId === data.labelId)) {
        task.labels.push(data);
      }
    },
    [ActivityType.WorkPackageTaskLabelRemove]: (data: any) => {
      const task = findTask(data.taskId);
      if (task && task.labels) {
        task.labels = task.labels.filter((l: any) => l.labelId !== data.labelId);
      }
    },
  });
}
