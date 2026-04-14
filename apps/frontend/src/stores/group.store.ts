import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type GroupViewModel, type OperationResult, OperationResultStatus, API, AccessType,
  type CreateGroupDto, type EditGroupDto, type AddAccessDto,
} from '@asoode/shared';
import { httpService } from '@/services/http.service';
import { useAuthStore } from './auth.store';

export const useGroupStore = defineStore('group', () => {
  const groups = ref<GroupViewModel[]>([]);

  async function load(): Promise<void> {
    const result = await httpService.post<GroupViewModel[]>(API.GROUPS_LIST);
    if (result.status === OperationResultStatus.Success) {
      groups.value = result.data || [];
    }
  }

  async function archived(): Promise<OperationResult<GroupViewModel[]>> {
    return httpService.post<GroupViewModel[]>(API.GROUPS_ARCHIVED);
  }

  async function create(model: CreateGroupDto): Promise<OperationResult<GroupViewModel>> {
    const result = await httpService.post<GroupViewModel>(API.GROUPS_CREATE, model);
    if (result.status === OperationResultStatus.Success) {
      groups.value.push(result.data);
    }
    return result;
  }

  async function edit(id: string, model: EditGroupDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_EDIT(id), model);
  }

  async function remove(id: string): Promise<OperationResult<boolean>> {
    const result = await httpService.post<boolean>(API.GROUPS_REMOVE(id));
    if (result.status === OperationResultStatus.Success) {
      groups.value = groups.value.filter((g) => g.id !== id);
    }
    return result;
  }

  async function archive(id: string): Promise<OperationResult<boolean>> {
    const result = await httpService.post<boolean>(API.GROUPS_ARCHIVE(id));
    if (result.status === OperationResultStatus.Success) {
      groups.value = groups.value.filter((g) => g.id !== id);
    }
    return result;
  }

  async function restore(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_RESTORE(id));
  }

  async function fetch(id: string): Promise<OperationResult<GroupViewModel>> {
    return httpService.post<GroupViewModel>(API.GROUPS_FETCH(id));
  }

  async function addAccess(id: string, model: AddAccessDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_ADD_ACCESS(id), model);
  }

  async function changeAccess(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_CHANGE_ACCESS(id), model);
  }

  async function removeAccess(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_REMOVE_ACCESS(id));
  }

  async function changePendingAccess(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_CHANGE_PENDING(id), model);
  }

  async function removePendingAccess(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_REMOVE_PENDING(id));
  }

  async function toggleEntry(id: string, model?: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_TOGGLE_ENTRY(id), model);
  }

  async function removeEntry(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_REMOVE_ENTRY(id));
  }

  async function editEntry(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_EDIT_ENTRY(id), model);
  }

  async function manualEntry(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_MANUAL_ENTRY(id), model);
  }

  async function createShift(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_CREATE_SHIFT(id), model);
  }

  async function editShift(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_EDIT_SHIFT(id), model);
  }

  async function removeShift(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_REMOVE_SHIFT(id));
  }

  async function timeOffRequest(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_TIME_OFF_REQUEST(id), model);
  }

  async function timeOffDelete(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_TIME_OFF_DELETE(id));
  }

  async function timeOffApprove(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_TIME_OFF_APPROVE(id));
  }

  async function timeOffDecline(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_TIME_OFF_DECLINE(id));
  }

  async function timeOffDetail(id: string): Promise<OperationResult<any>> {
    return httpService.post<any>(API.GROUPS_TIME_OFF_DETAIL(id));
  }

  async function timeSpent(id: string, model?: any): Promise<OperationResult<any>> {
    return httpService.post<any>(API.GROUPS_TIMESPENT(id), model);
  }

  async function report(id: string, model?: any): Promise<OperationResult<any>> {
    return httpService.post<any>(API.GROUPS_REPORT(id), model);
  }

  async function upgrade(id: string, model?: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_UPGRADE(id), model);
  }

  async function notAttached(id: string): Promise<OperationResult<any>> {
    return httpService.post<any>(API.GROUPS_NOT_ATTACHED(id));
  }

  async function connect(parentId: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.GROUPS_CONNECT(parentId), model);
  }

  function getPermission(group: GroupViewModel | string): AccessType {
    const authStore = useAuthStore();
    const g = typeof group === 'string' ? groups.value.find((x) => x.id === group) : group;
    if (!g) return AccessType.Visitor;
    const member = g.members?.find((m) => m.userId === authStore.userId);
    return member?.access ?? AccessType.Visitor;
  }

  return {
    groups, load, archived, create, edit, remove, archive, restore, fetch,
    addAccess, changeAccess, removeAccess, changePendingAccess, removePendingAccess,
    toggleEntry, removeEntry, editEntry, manualEntry,
    createShift, editShift, removeShift,
    timeOffRequest, timeOffDelete, timeOffApprove, timeOffDecline, timeOffDetail,
    timeSpent, report, upgrade, notAttached, connect, getPermission,
  };
});
