import { type Ref } from 'vue';
import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { useWorkflowStore } from '@/stores/workflow.store';
import { ActivityType, type WorkflowViewModel } from '@asoode/shared';

/**
 * Socket handlers for the Workflow Designer page.
 * Updates the current workflow in real-time when another user edits it.
 */
export function useWorkflowSocketHandlers(
  currentWorkflow: Ref<WorkflowViewModel | null>,
) {
  const workflowStore = useWorkflowStore();

  useSocketNotifications({
    [ActivityType.WorkflowAdd]: (data: any) => {
      if (!workflowStore.workflows.find((w) => w.id === data.id)) {
        workflowStore.workflows.push(data);
      }
    },

    [ActivityType.WorkflowEdit]: (data: any) => {
      const found = workflowStore.workflows.find((w) => w.id === data.id);
      if (found) Object.assign(found, data);

      if (currentWorkflow.value && currentWorkflow.value.id === data.id) {
        Object.assign(currentWorkflow.value, data);
      }
    },

    [ActivityType.WorkflowRemove]: (data: any) => {
      workflowStore.workflows = workflowStore.workflows.filter((w) => w.id !== data.id);
    },

    [ActivityType.WorkflowToggle]: (data: any) => {
      const found = workflowStore.workflows.find((w) => w.id === data.id);
      if (found) found.active = data.active ?? !found.active;

      if (currentWorkflow.value && currentWorkflow.value.id === data.id) {
        currentWorkflow.value.active = data.active ?? !currentWorkflow.value.active;
      }
    },

    [ActivityType.WorkflowExecute]: (_data: any) => {
      // Execution completed — designer page can refresh executions tab if needed
    },
  });
}
