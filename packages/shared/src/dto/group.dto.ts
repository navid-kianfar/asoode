export interface CreateGroupDto {
  title: string;
  type: number;
  description?: string;
  parentId?: string;
}

export interface EditGroupDto {
  title?: string;
  description?: string;
  brandTitle?: string;
  supervisorName?: string;
  supervisorNumber?: string;
  responsibleName?: string;
  responsibleNumber?: string;
  email?: string;
  website?: string;
  postalCode?: string;
  address?: string;
  tel?: string;
  fax?: string;
  geoLocation?: string;
  nationalId?: string;
  registrationId?: string;
}

export interface AddAccessDto {
  members: { id: string; access: number; isGroup: boolean }[];
}
