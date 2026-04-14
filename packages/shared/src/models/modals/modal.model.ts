import { FormViewModel } from '../core/form.model';
import { WorkPackageTaskViewModel, WorkPackageViewModel } from '../projects/work-package.model';
import { ProjectViewModel } from '../projects/project.model';

export interface TaskModalParameters {
  id: string;
  projectId: string;
  packageId: string;
  model: WorkPackageTaskViewModel;
  project: ProjectViewModel;
  workPackage: WorkPackageViewModel;
}

export interface ModalParameters {
  cancel?: () => Promise<any>;
  action: () => Promise<any>;
  cssClass?: string;
  icon?: string;
  title?: string;
  message?: string;
  heading?: string;
  actionColor?: string;
  actionLabel?: string;
  cancelLabel?: string;
}

export interface PromptModalParameters {
  title: string;
  form: FormViewModel[];
  progress?: ModalProgress;
  cancel?: (params?: any, form?: FormViewModel[]) => Promise<any>;
  action?: (params: any, form: FormViewModel[]) => Promise<any>;
  cssClass?: string;
  summary?: string;
  actionColor?: string;
  actionLabel?: string;
  cancelLabel?: string;
  width?: number;
  actionWaiting?: boolean;
  cancelWaiting?: boolean;
  icon?: string;
  message?: string;
  heading?: string;
  model?: any;
}

export interface ModalProgress {
  uploading: boolean;
  uploadPercent: number;
}

export interface MapMarker {
  icon?: string;
  image?: string;
  title?: string;
  summary?: string;
  onClick?: () => any;
  location: GeoLocation;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface MapModalParameters {
  markers?: MapMarker[];
  center?: MapMarker;
  mapLocation?: string;
}

export interface CreateModalParameters {
  parentId?: string;
  premium?: boolean;
  simpleProject?: boolean;
  simpleGroup?: boolean;
  complexProject?: boolean;
  complexGroup?: boolean;
}
