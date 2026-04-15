import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type ProjectViewModel, type ProjectTemplateViewModel, type OperationResult,
  OperationResultStatus, API, AccessType,
  type CreateProjectDto, type EditProjectDto, type CreateSubProjectDto, type CreateSeasonDto,
  type AddAccessDto, type CreateWorkPackageDto,
  type ProjectProgressViewModel, type TreeViewModel, type RoadMapViewModel,
} from '@asoode/shared';
import { httpService } from '@/services/http.service';
import { useAuthStore } from './auth.store';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProjectViewModel[]>([]);
  const templates = ref<ProjectTemplateViewModel[]>([]);

  function upsertProject(project: ProjectViewModel): ProjectViewModel {
    const existing = projects.value.find((p) => p.id === project.id);
    if (existing) {
      Object.assign(existing, project);
      return existing;
    }
    projects.value.push(project);
    return project;
  }

  async function load(): Promise<void> {
    const result = await httpService.post<ProjectViewModel[]>(API.PROJECTS_LIST);
    if (result.status === OperationResultStatus.Success) {
      projects.value = result.data || [];
    }
  }

  async function archived(): Promise<OperationResult<ProjectViewModel[]>> {
    return httpService.post<ProjectViewModel[]>(API.PROJECTS_ARCHIVED);
  }

  async function fetchProject(id: string): Promise<OperationResult<ProjectViewModel>> {
    const result = await httpService.post<ProjectViewModel>(API.PROJECTS_FETCH(id));
    if (result.status === OperationResultStatus.Success && result.data) {
      result.data = upsertProject(result.data);
    }
    return result;
  }

  async function create(model: CreateProjectDto): Promise<OperationResult<ProjectViewModel>> {
    const result = await httpService.post<ProjectViewModel>(API.PROJECTS_CREATE, model);
    if (result.status === OperationResultStatus.Success) upsertProject(result.data);
    return result;
  }

  async function edit(id: string, model: EditProjectDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_EDIT(id), model);
  }

  async function remove(id: string): Promise<OperationResult<boolean>> {
    const result = await httpService.post<boolean>(API.PROJECTS_REMOVE(id));
    if (result.status === OperationResultStatus.Success) {
      projects.value = projects.value.filter((p) => p.id !== id);
    }
    return result;
  }

  async function archiveProject(id: string): Promise<OperationResult<boolean>> {
    const result = await httpService.post<boolean>(API.PROJECTS_ARCHIVE(id));
    if (result.status === OperationResultStatus.Success) {
      projects.value = projects.value.filter((p) => p.id !== id);
    }
    return result;
  }

  async function createSubProject(id: string, model: CreateSubProjectDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.PROJECTS_SUB_CREATE(id), model);
  }

  async function editSubProject(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_SUB_EDIT(id), model);
  }

  async function removeSubProject(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_SUB_REMOVE(id));
  }

  async function changeSubProjectOrder(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_SUB_ORDER(id), model);
  }

  async function createSeason(id: string, model: CreateSeasonDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.PROJECTS_SEASON_CREATE(id), model);
  }

  async function editSeason(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_SEASON_EDIT(id), model);
  }

  async function removeSeason(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_SEASON_REMOVE(id));
  }

  async function createWorkPackage(projectId: string, model: CreateWorkPackageDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.WP_CREATE(projectId), model);
  }

  async function addWorkPackageAccess(id: string, model: AddAccessDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.WP_ADD_ACCESS(id), model);
  }

  async function addAccess(id: string, model: AddAccessDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_ADD_ACCESS(id), model);
  }

  async function changeAccess(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_CHANGE_ACCESS(id), model);
  }

  async function removeAccess(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_REMOVE_ACCESS(id));
  }

  async function changePendingAccess(id: string, model: any): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_CHANGE_PENDING(id), model);
  }

  async function removePendingAccess(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.PROJECTS_REMOVE_PENDING(id));
  }

  async function objectives(id: string): Promise<OperationResult<any>> {
    return httpService.post<any>(API.PROJECTS_OBJECTIVES(id));
  }

  async function objectiveDetails(id: string): Promise<OperationResult<any>> {
    return httpService.post<any>(API.PROJECTS_OBJECTIVE_DETAIL(id));
  }

  async function tree(id: string): Promise<OperationResult<TreeViewModel>> {
    return httpService.post<TreeViewModel>(API.PROJECTS_TREE(id));
  }

  async function roadMap(id: string): Promise<OperationResult<RoadMapViewModel>> {
    return httpService.post<RoadMapViewModel>(API.PROJECTS_ROAD_MAP(id));
  }

  async function progress(id: string): Promise<OperationResult<ProjectProgressViewModel[]>> {
    return httpService.post<ProjectProgressViewModel[]>(API.PROJECTS_PROGRESS(id));
  }

  function getPermission(project: ProjectViewModel | string): AccessType {
    const authStore = useAuthStore();
    const p = typeof project === 'string' ? projects.value.find((x) => x.id === project) : project;
    if (!p) return AccessType.Visitor;
    const member = p.members?.find((m) => m.member?.id === authStore.userId);
    return member?.access ?? AccessType.Visitor;
  }

  function getWorkPackagePermission(project: ProjectViewModel, workPackage: any): AccessType {
    const authStore = useAuthStore();
    const wpMember = workPackage?.members?.find((m: any) => m.recordId === authStore.userId);
    if (wpMember) return wpMember.access;
    return getPermission(project);
  }

  return {
    projects, templates, load, archived, fetchProject, create, edit, remove, archiveProject,
    createSubProject, editSubProject, removeSubProject, changeSubProjectOrder,
    createSeason, editSeason, removeSeason, createWorkPackage, addWorkPackageAccess,
    addAccess, changeAccess, removeAccess, changePendingAccess, removePendingAccess,
    objectives, objectiveDetails, tree, roadMap, progress,
    getPermission, getWorkPackagePermission, upsertProject,
  };
});
