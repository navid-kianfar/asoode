import { AccessType, type GroupViewModel, type ProjectViewModel } from '@asoode/shared';
import { useGroupStore } from '@/stores/group.store';
import { useProjectStore } from '@/stores/project.store';
import { useWorkPackageStore } from '@/stores/work-package.store';

export function usePermission() {
  function getGroupPermission(group: GroupViewModel | string): AccessType {
    const groupStore = useGroupStore();
    return groupStore.getPermission(group);
  }

  function getProjectPermission(project: ProjectViewModel | string): AccessType {
    const projectStore = useProjectStore();
    return projectStore.getPermission(project);
  }

  function getWorkPackagePermission(projectId: string, packageId: string): AccessType {
    const wpStore = useWorkPackageStore();
    return wpStore.getPermission(projectId, packageId);
  }

  function canEdit(access: AccessType): boolean {
    return [AccessType.Owner, AccessType.Admin, AccessType.Editor].includes(access);
  }

  function canAdmin(access: AccessType): boolean {
    return [AccessType.Owner, AccessType.Admin].includes(access);
  }

  function isOwner(access: AccessType): boolean {
    return access === AccessType.Owner;
  }

  return { getGroupPermission, getProjectPermission, getWorkPackagePermission, canEdit, canAdmin, isOwner };
}
