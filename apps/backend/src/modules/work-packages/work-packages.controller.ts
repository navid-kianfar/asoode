import { Controller, Post, Param, Body } from '@nestjs/common';
import { WorkPackagesService } from './work-packages.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateWorkPackageDto,
  EditWorkPackageDto,
  CreateListDto,
  EditListDto,
  CreateLabelDto,
  AddAccessDto,
} from '@asoode/shared';

@Controller('work-packages')
export class WorkPackagesController {
  constructor(private readonly workPackagesService: WorkPackagesService) {}

  // ─── WORK PACKAGE CRUD ──────────────────────────────────────

  @Post('create/:projectId')
  create(
    @CurrentUser() userId: string,
    @Param('projectId') projectId: string,
    @Body() body: CreateWorkPackageDto,
  ) {
    return this.workPackagesService.create(userId, projectId, body);
  }

  @Post('fetch/:id')
  fetch(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.fetch(userId, id);
  }

  @Post('fetch/:id/archived')
  fetchArchived(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.fetchArchived(userId, id);
  }

  @Post(':id/edit')
  edit(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: EditWorkPackageDto,
  ) {
    return this.workPackagesService.edit(userId, id, body);
  }

  @Post(':id/remove')
  remove(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.remove(userId, id);
  }

  @Post(':id/archive')
  archive(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.archive(userId, id);
  }

  @Post(':id/merge/:packageId')
  merge(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Param('packageId') packageId: string,
  ) {
    return this.workPackagesService.merge(userId, id, packageId);
  }

  // ─── LISTS ──────────────────────────────────────────────────

  @Post(':id/lists/create')
  createList(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: CreateListDto,
  ) {
    return this.workPackagesService.createList(userId, id, body);
  }

  @Post('lists/:id/rename')
  renameList(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    return this.workPackagesService.renameList(userId, id, body);
  }

  @Post('lists/:id/edit')
  editList(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: EditListDto,
  ) {
    return this.workPackagesService.editList(userId, id, body);
  }

  @Post('lists/:id/reposition')
  repositionList(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { order: number },
  ) {
    return this.workPackagesService.repositionList(userId, id, body);
  }

  @Post('lists/:id/clone')
  cloneList(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    return this.workPackagesService.cloneList(userId, id, body);
  }

  @Post('lists/:id/archive')
  archiveList(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.archiveList(userId, id);
  }

  @Post('lists/:id/archive-tasks')
  archiveListTasks(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.archiveListTasks(userId, id);
  }

  @Post('lists/:id/clear-tasks')
  clearListTasks(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.clearListTasks(userId, id);
  }

  // ─── LABELS ─────────────────────────────────────────────────

  @Post('labels/:id/create')
  createLabel(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: CreateLabelDto,
  ) {
    return this.workPackagesService.createLabel(userId, id, body);
  }

  @Post('labels/:id/rename')
  renameLabel(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title: string; color: string },
  ) {
    return this.workPackagesService.renameLabel(userId, id, body);
  }

  @Post('labels/:id/remove')
  removeLabel(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.removeLabel(userId, id);
  }

  // ─── CUSTOM FIELDS ──────────────────────────────────────────

  @Post(':id/custom-fields/create')
  createCustomField(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title: string; type: number; required?: boolean; options?: string },
  ) {
    return this.workPackagesService.createCustomField(userId, id, body);
  }

  @Post('custom-fields/:id/edit')
  editCustomField(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; type?: number; required?: boolean; options?: string },
  ) {
    return this.workPackagesService.editCustomField(userId, id, body);
  }

  @Post('custom-fields/:id/remove')
  removeCustomField(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.removeCustomField(userId, id);
  }

  @Post(':id/custom-fields/reorder')
  reorderCustomFields(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { fields: { id: string; order: number }[] },
  ) {
    return this.workPackagesService.reorderCustomFields(userId, id, body);
  }

  // ─── OBJECTIVES ─────────────────────────────────────────────

  @Post(':id/objectives/create')
  createObjective(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title: string; description: string; type: number },
  ) {
    return this.workPackagesService.createObjective(userId, id, body);
  }

  @Post('objectives/:id/edit')
  editObjective(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; type?: number },
  ) {
    return this.workPackagesService.editObjective(userId, id, body);
  }

  @Post('objectives/:id/delete')
  deleteObjective(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.deleteObjective(userId, id);
  }

  // ─── ACCESS MANAGEMENT ─────────────────────────────────────

  @Post(':id/add-access')
  addAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: AddAccessDto,
  ) {
    return this.workPackagesService.addAccess(userId, id, body);
  }

  @Post('change-access/:id')
  changeAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { access: number },
  ) {
    return this.workPackagesService.changeAccess(userId, id, body);
  }

  @Post('remove-access/:id')
  removeAccess(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.removeAccess(userId, id);
  }

  @Post('change-pending-access/:id')
  changePendingAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { access: number },
  ) {
    return this.workPackagesService.changePendingAccess(userId, id, body);
  }

  @Post('remove-pending-access/:id')
  removePendingAccess(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.removePendingAccess(userId, id);
  }

  // ─── SETTINGS & PERMISSIONS ─────────────────────────────────

  @Post(':id/setting')
  updateSetting(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body()
    body: {
      allowMembers?: boolean;
      allowLabels?: boolean;
      allowAttachment?: boolean;
      allowComments?: boolean;
      allowCustomField?: boolean;
      allowEndAt?: boolean;
      allowEstimatedTime?: boolean;
      allowGeoLocation?: boolean;
      allowPoll?: boolean;
      allowSegments?: boolean;
      allowState?: boolean;
      allowTimeSpent?: boolean;
      allowBlockingBoardTasks?: boolean;
    },
  ) {
    return this.workPackagesService.updateSetting(userId, id, body);
  }

  @Post(':id/setting/user')
  updateUserSetting(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { showTotalCards?: boolean; receiveNotification?: number },
  ) {
    return this.workPackagesService.updateUserSetting(userId, id, body);
  }

  @Post(':id/order')
  updateOrder(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { order: number },
  ) {
    return this.workPackagesService.updateOrder(userId, id, body);
  }

  @Post(':id/sort-orders')
  updateSortOrders(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body()
    body: {
      listsSort?: number;
      tasksSort?: number;
      subTasksSort?: number;
      attachmentsSort?: number;
    },
  ) {
    return this.workPackagesService.updateSortOrders(userId, id, body);
  }

  @Post(':id/permissions')
  updatePermissions(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body()
    body: {
      permissionComment?: number;
      permissionEditAttachment?: number;
      permissionCreateAttachment?: number;
      permissionAssignMembers?: number;
      permissionAssignLabels?: number;
      permissionChangeTaskState?: number;
      permissionEditTask?: number;
      permissionArchiveTask?: number;
      permissionCreateTask?: number;
      permissionArchiveList?: number;
      permissionEditList?: number;
      permissionCreateList?: number;
      permissionClearList?: number;
    },
  ) {
    return this.workPackagesService.updatePermissions(userId, id, body);
  }

  @Post(':id/leave')
  leave(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.leave(userId, id);
  }

  @Post(':id/upgrade')
  upgrade(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workPackagesService.upgrade(userId, id);
  }

  @Post(':id/connect/:projectId')
  connect(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Param('projectId') projectId: string,
  ) {
    return this.workPackagesService.connect(userId, id, projectId);
  }
}
