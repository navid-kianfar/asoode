import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type WorkflowViewModel,
  type WorkflowExecutionViewModel,
  type OperationResult,
  type CreateWorkflowDto,
  type EditWorkflowDto,
  OperationResultStatus,
  API,
} from '@asoode/shared';
import { httpService } from '@/services/http.service';

export const useWorkflowStore = defineStore('workflow', () => {
  const workflows = ref<WorkflowViewModel[]>([]);

  async function load(): Promise<void> {
    const result = await httpService.post<WorkflowViewModel[]>(API.WORKFLOWS_LIST);
    if (result.status === OperationResultStatus.Success) {
      workflows.value = result.data || [];
    }
  }

  async function create(model: CreateWorkflowDto): Promise<OperationResult<WorkflowViewModel>> {
    const result = await httpService.post<WorkflowViewModel>(API.WORKFLOWS_CREATE, model);
    if (result.status === OperationResultStatus.Success) {
      workflows.value.push(result.data);
    }
    return result;
  }

  async function fetch(id: string): Promise<OperationResult<WorkflowViewModel>> {
    return httpService.post<WorkflowViewModel>(API.WORKFLOWS_FETCH(id));
  }

  async function edit(id: string, model: EditWorkflowDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WORKFLOWS_EDIT(id), model);
  }

  async function remove(id: string): Promise<OperationResult<boolean>> {
    const result = await httpService.post<boolean>(API.WORKFLOWS_REMOVE(id));
    if (result.status === OperationResultStatus.Success) {
      workflows.value = workflows.value.filter((w) => w.id !== id);
    }
    return result;
  }

  async function toggle(id: string): Promise<OperationResult<boolean>> {
    const result = await httpService.post<boolean>(API.WORKFLOWS_TOGGLE(id));
    if (result.status === OperationResultStatus.Success) {
      const wf = workflows.value.find((w) => w.id === id);
      if (wf) wf.active = !wf.active;
    }
    return result;
  }

  async function execute(id: string): Promise<OperationResult<WorkflowExecutionViewModel>> {
    return httpService.post<WorkflowExecutionViewModel>(API.WORKFLOWS_EXECUTE(id));
  }

  async function executions(id: string): Promise<OperationResult<WorkflowExecutionViewModel[]>> {
    return httpService.post<WorkflowExecutionViewModel[]>(API.WORKFLOWS_EXECUTIONS(id));
  }

  return {
    workflows, load, create, fetch, edit, remove, toggle, execute, executions,
  };
});
