import { BaseViewModel } from '../core/base.model';
import { AccessType, ProjectTemplate } from '../../enums';
import { MemberInfoViewModel } from '../auth/identity.model';
import { PendingInvitationViewModel } from '../groups/group.model';
import { WorkPackageObjectiveViewModel, WorkPackageViewModel } from './work-package.model';

export interface ProjectViewModel extends BaseViewModel {
  archivedAt?: Date;
  template: ProjectTemplate;
  userId: string;
  title: string;
  description: string;
  premium: boolean;
  complex: boolean;
  tasks: number;
  attachmentSize: number;
  membersCapacity: number;
  membersUsed: number;
  diskSpaceCapacity: number;
  diskSpaceUsed: number;
  pending: PendingInvitationViewModel[];
  members: ProjectMemberViewModel[];
  seasons: ProjectSeasonViewModel[];
  objectives: WorkPackageObjectiveViewModel[];
  subProjects: SubProjectViewModel[];
  workPackages: WorkPackageViewModel[];
}

export interface ProjectMemberViewModel extends BaseViewModel {
  selected: boolean;
  isGroup: boolean;
  recordId: string;
  projectId: string;
  member: MemberInfoViewModel;
  access: AccessType;
  waiting?: boolean;
  deleting?: boolean;
}

export interface ProjectSeasonViewModel extends BaseViewModel {
  userId: string;
  projectId: string;
  title: string;
  description: string;
}

export interface SubProjectViewModel extends BaseViewModel {
  userId: string;
  projectId: string;
  parentId: string;
  title: string;
  description: string;
  level: number;
  order: number;
}

export interface ProjectTemplateViewModel extends BaseViewModel {
  title: string;
  description: string;
  image: string;
  icon: string;
  seasons: ProjectSeasonViewModel[];
  subProjects: SubProjectViewModel[];
  workPackages: WorkPackageViewModel[];
}

export interface ProjectProgressViewModel {
  date: string;
  created: number;
  blocked: number;
  done: number;
}

export interface TreeViewModel {
  tree: { [key: string]: TreeReportViewModel };
}

export interface TreeReportViewModel {
  doneWorkPackages: number;
  workPackages: number;
  workPackageProgress: number;
  progress: number;
  timeSpent: number;
  from?: Date;
  to?: Date;
  total: number;
  done: number;
  members: any[];
}

export interface ProjectObjectiveEstimatedPriceViewModel {
  date: Date;
  time: number;
  amount: number;
  user: string;
  group: string;
}

export interface RoadMapViewModel {}
