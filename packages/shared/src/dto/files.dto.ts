export interface NewFolderDto {
  path: string;
  name: string;
}

export interface RenameDto {
  path: string;
  name: string;
}

export interface DeleteDto {
  path: string;
}
