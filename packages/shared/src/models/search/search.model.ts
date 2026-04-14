import { BaseViewModel } from '../core/base.model';
import { MemberInfoViewModel } from '../auth/identity.model';
import { GroupViewModel } from '../groups/group.model';
import { ProjectViewModel } from '../projects/project.model';
import { WorkPackageViewModel } from '../projects/work-package.model';
import { ExplorerFileViewModel, ExplorerFolderViewModel } from '../storage/files.model';
import { WorkPackageTaskState } from '../../enums';

export interface SearchResultViewModel {
  tasks: SearchTaskViewModel[];
  projects: ProjectViewModel[];
  workPackages: WorkPackageViewModel[];
  groups: GroupViewModel[];
  storage: SearchStorageViewModel;
  members: MemberInfoViewModel[];
}

export interface SearchStorageViewModel {
  files: ExplorerFileViewModel[];
  folders: ExplorerFolderViewModel[];
}

export interface SearchTaskViewModel extends BaseViewModel {
  state: WorkPackageTaskState;
  title: string;
  description: string;
  archivedAt: Date;
  createdAt: Date;
  list: string;
  workPackage: string;
  project: string;
  workPackageId: string;
  projectId: string;
  labels: TaskLabelViewModel[];
  members: MemberInfoViewModel[];
}

interface TaskLabelViewModel {
  title: string;
  color: string;
  dark: boolean;
}
