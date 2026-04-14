export interface CreateTaskDto {
  title: string;
  listId: string;
  parentId?: string;
}

export interface RepositionTaskDto {
  listId: string;
  order: number;
}

export interface MoveTaskDto {
  packageId: string;
  listId: string;
}

export interface ChangeTitleDto {
  title: string;
}

export interface ChangeDescriptionDto {
  description: string;
}

export interface ChangeStateDto {
  state: number;
}

export interface SetDateDto {
  beginAt?: Date;
  endAt?: Date;
  dueAt?: Date;
  beginReminder?: number;
  endReminder?: number;
}

export interface AddCommentDto {
  message: string;
  private?: boolean;
}

export interface VoteDto {
  vote: boolean;
}

export interface SpendTimeDto {
  begin: Date;
  end?: Date;
}

export interface AddMemberDto {
  recordId: string;
  isGroup: boolean;
}
