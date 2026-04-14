export interface CreateWorkPackageDto {
  title: string;
  description?: string;
  boardTemplate: number;
  subProjectId?: string;
}

export interface EditWorkPackageDto {
  title?: string;
  description?: string;
  color?: string;
  darkColor?: boolean;
  beginAt?: Date;
  endAt?: Date;
}

export interface CreateListDto {
  title: string;
  color?: string;
  darkColor?: boolean;
}

export interface EditListDto {
  title?: string;
  color?: string;
  darkColor?: boolean;
}

export interface CreateLabelDto {
  title: string;
  color: string;
  darkColor: boolean;
}

export interface CreateCustomFieldDto {
  title: string;
  type: number;
  required?: boolean;
  options?: string;
}

export interface EditCustomFieldDto {
  title?: string;
  type?: number;
  required?: boolean;
  options?: string;
}

export interface SetCustomFieldValueDto {
  value: string;
}
