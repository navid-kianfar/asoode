import { defineStore } from 'pinia';
import {
  type WorkPackageTaskViewModel, type OperationResult, type ActivityLogViewModel,
  type KartablViewModel,
  API,
  type CreateTaskDto, type ChangeTitleDto, type ChangeDescriptionDto,
  type ChangeStateDto, type RepositionTaskDto, type MoveTaskDto,
  type SetDateDto, type AddCommentDto, type VoteDto, type SpendTimeDto, type AddMemberDto,
} from '@asoode/shared';
import { httpService } from '@/services/http.service';

export const useTaskStore = defineStore('task', () => {
  async function create(listId: string, model: CreateTaskDto): Promise<OperationResult<WorkPackageTaskViewModel>> {
    return httpService.post<WorkPackageTaskViewModel>(API.TASKS_CREATE(listId), model);
  }

  async function convertToTask(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_CONVERT_TO_TASK(id));
  }

  async function fetchTask(id: string): Promise<OperationResult<WorkPackageTaskViewModel>> {
    return httpService.post<WorkPackageTaskViewModel>(API.TASKS_DETAIL(id));
  }

  async function changeTitle(id: string, model: ChangeTitleDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_CHANGE_TITLE(id), model);
  }

  async function changeDescription(id: string, model: ChangeDescriptionDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_CHANGE_DESC(id), model);
  }

  async function changeState(id: string, model: ChangeStateDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_CHANGE_STATE(id), model);
  }

  async function reposition(id: string, model: RepositionTaskDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_REPOSITION(id), model);
  }

  async function move(id: string, model: MoveTaskDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_MOVE(id), model);
  }

  async function setDate(id: string, model: SetDateDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_SET_DATE(id), model);
  }

  async function setLocation(id: string, model: { geoLocation: string }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_LOCATION(id), model);
  }

  async function addMember(id: string, model: AddMemberDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.TASKS_MEMBER_ADD(id), model);
  }

  async function removeMember(taskId: string, id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_MEMBER_REMOVE(taskId, id));
  }

  async function addLabel(taskId: string, labelId: string): Promise<OperationResult<any>> {
    return httpService.post<any>(API.TASKS_LABEL_ADD(taskId, labelId));
  }

  async function removeLabel(taskId: string, labelId: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_LABEL_REMOVE(taskId, labelId));
  }

  async function renameAttachment(id: string, model: { title: string }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_ATTACHMENT_RENAME(id), model);
  }

  async function removeAttachment(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_ATTACHMENT_REMOVE(id));
  }

  async function coverAttachment(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_ATTACHMENT_COVER(id));
  }

  async function uploadAttachment(taskId: string, file: File, onProgress?: (p: number) => void): Promise<OperationResult<any>> {
    return httpService.upload<any>(API.TASKS_ATTACH(taskId), [file], {}, onProgress ?? (() => {}));
  }

  async function comment(id: string, model: AddCommentDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.TASKS_COMMENT(id), model);
  }

  async function vote(id: string, model: VoteDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_VOTE(id), model);
  }

  async function toggleWatch(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_WATCH(id));
  }

  async function changeEstimated(id: string, model: { estimatedTime: number }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_ESTIMATED(id), model);
  }

  async function spendTime(id: string, model: SpendTimeDto): Promise<OperationResult<any>> {
    return httpService.post<any>(API.TASKS_SPEND_TIME(id), model);
  }

  async function toggleTimer(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_TOGGLE_TIMER(id));
  }

  async function logs(id: string): Promise<OperationResult<ActivityLogViewModel[]>> {
    return httpService.post<ActivityLogViewModel[]>(API.TASKS_LOGS(id));
  }

  async function toggleArchive(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_ARCHIVE(id));
  }

  async function setCustomFieldValue(taskId: string, fieldId: string, model: { value: string }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.TASKS_CUSTOM_FIELD_VALUE(taskId, fieldId), model);
  }

  async function calendar(model?: any): Promise<OperationResult<any>> {
    return httpService.post<any>(API.TASKS_CALENDAR, model);
  }

  async function kartabl(model?: any): Promise<OperationResult<KartablViewModel>> {
    return httpService.post<KartablViewModel>(API.TASKS_KARTABL, model);
  }

  async function timeSpents(model?: any): Promise<OperationResult<any>> {
    return httpService.post<any>(API.TIMES_MINE, model);
  }

  return {
    create, convertToTask, fetchTask, changeTitle, changeDescription, changeState,
    reposition, move, setDate, setLocation,
    addMember, removeMember, addLabel, removeLabel,
    renameAttachment, removeAttachment, coverAttachment, uploadAttachment,
    comment, vote, toggleWatch, changeEstimated, spendTime, toggleTimer, logs, toggleArchive,
    setCustomFieldValue,
    calendar, kartabl, timeSpents,
  };
});
