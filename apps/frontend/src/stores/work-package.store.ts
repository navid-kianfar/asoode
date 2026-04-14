import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type WorkPackageViewModel, type OperationResult, OperationResultStatus, API, AccessType,
  type EditWorkPackageDto, type CreateListDto, type CreateLabelDto, type AddAccessDto,
  type CreateCustomFieldDto, type EditCustomFieldDto, type EditListDto,
} from '@asoode/shared';
import { httpService } from '@/services/http.service';
import { useAuthStore } from './auth.store';

export const useWorkPackageStore = defineStore('workPackage', () => {
  const current = ref<WorkPackageViewModel | null>(null);

  async function fetch(id: string): Promise<OperationResult<WorkPackageViewModel>> {
    const result = await httpService.post<WorkPackageViewModel>(API.WP_FETCH(id));
    if (result.status === OperationResultStatus.Success) {
      current.value = result.data;
    }
    return result;
  }

  async function fetchArchived(id: string): Promise<OperationResult<WorkPackageViewModel>> {
    return httpService.post<WorkPackageViewModel>(API.WP_FETCH_ARCHIVED(id));
  }

  async function edit(id: string, model: EditWorkPackageDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_EDIT(id), model);
  }

  async function remove(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_REMOVE(id));
  }

  async function archive(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_ARCHIVE(id));
  }

  async function merge(id: string, packageId: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_MERGE(id, packageId));
  }

  async function createList(id: string, model: CreateListDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.WP_LIST_CREATE(id), model);
  }

  async function renameList(id: string, model: { title: string }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LIST_RENAME(id), model);
  }

  async function editList(id: string, model: EditListDto): Promise<OperationResult<boolean>> {
    const result = await httpService.post<boolean>(API.WP_LIST_EDIT(id), model);
    return result;
  }

  async function repositionList(id: string, model: { order: number }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LIST_REPOSITION(id), model);
  }

  async function cloneList(id: string): Promise<OperationResult<any>> {
    return httpService.post<any>(API.WP_LIST_CLONE(id));
  }

  async function archiveList(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LIST_ARCHIVE(id));
  }

  async function archiveListTasks(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LIST_ARCHIVE_TASKS(id));
  }

  async function clearListTasks(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LIST_CLEAR_TASKS(id));
  }

  async function createLabel(id: string, model: CreateLabelDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.WP_LABEL_CREATE(id), model);
  }

  async function renameLabel(id: string, model: { title: string; color: string; darkColor: boolean }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LABEL_RENAME(id), model);
  }

  async function removeLabel(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LABEL_REMOVE(id));
  }

  async function createObjective(id: string, model: any): Promise<OperationResult<any>> {
    return httpService.post<any>(API.WP_OBJECTIVE_CREATE(id), model);
  }

  async function editObjective(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_OBJECTIVE_EDIT(id), model);
  }

  async function deleteObjective(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_OBJECTIVE_DELETE(id));
  }

  async function addAccess(id: string, model: AddAccessDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_ADD_ACCESS(id), model);
  }

  async function changeAccess(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_CHANGE_ACCESS(id), model);
  }

  async function removeAccess(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_REMOVE_ACCESS(id));
  }

  async function changePendingAccess(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_CHANGE_PENDING(id), model);
  }

  async function removePendingAccess(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_REMOVE_PENDING(id));
  }

  async function updateSetting(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_SETTING(id), model);
  }

  async function updateUserSetting(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_USER_SETTING(id), model);
  }

  async function changeOrder(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_ORDER(id), model);
  }

  async function editSortOrders(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_SORT_ORDERS(id), model);
  }

  async function changePermissions(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_PERMISSIONS(id), model);
  }

  async function leave(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_LEAVE(id));
  }

  async function upgradePackage(id: string, model?: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_UPGRADE(id), model);
  }

  async function connect(id: string, projectId: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_CONNECT(id, projectId));
  }

  async function createCustomField(packageId: string, model: CreateCustomFieldDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.WP_CUSTOM_FIELD_CREATE(packageId), model);
  }

  async function editCustomField(fieldId: string, model: EditCustomFieldDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_CUSTOM_FIELD_EDIT(fieldId), model);
  }

  async function removeCustomField(fieldId: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_CUSTOM_FIELD_REMOVE(fieldId));
  }

  async function reorderCustomFields(packageId: string, model: { fields: { id: string; order: number }[] }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_CUSTOM_FIELD_REORDER(packageId), model);
  }

  function getPermission(projectId: string, packageId: string): AccessType {
    const authStore = useAuthStore();
    if (!current.value) return AccessType.Visitor;
    const member = current.value.members?.find((m) => m.recordId === authStore.userId);
    return member?.access ?? AccessType.Visitor;
  }

  return {
    current, fetch, fetchArchived, edit, remove, archive, merge,
    createList, renameList, editList, repositionList, cloneList, archiveList, archiveListTasks, clearListTasks,
    createLabel, renameLabel, removeLabel,
    createCustomField, editCustomField, removeCustomField, reorderCustomFields,
    createObjective, editObjective, deleteObjective,
    addAccess, changeAccess, removeAccess, changePendingAccess, removePendingAccess,
    updateSetting, updateUserSetting, changeOrder, editSortOrders, changePermissions,
    leave, upgradePackage, connect, getPermission,
  };
});
