export interface CreateProjectDto {
  title: string;
  description?: string;
  complex: boolean;
  groupId?: string;
  templateId?: string;
}

export interface EditProjectDto {
  title?: string;
  description?: string;
  complex?: boolean;
}

export interface CreateSubProjectDto {
  title: string;
  description?: string;
  parentId?: string;
}

export interface CreateSeasonDto {
  title: string;
  description?: string;
}
