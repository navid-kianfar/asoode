import { Controller, Post, Param, Body } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  EditGroupDto,
  AddAccessDto,
  GroupViewModel,
  DayReportViewModel,
  TimeSpentViewModel,
} from '@asoode/shared';

@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ─── LIST / ARCHIVE ────────────────────────────────────────────

  @Post('groups/list')
  list(@CurrentUser() userId: string): Promise<GroupViewModel[]> {
    return this.groupsService.list(userId);
  }

  @Post('groups/archived')
  archived(@CurrentUser() userId: string): Promise<GroupViewModel[]> {
    return this.groupsService.archived(userId);
  }

  // ─── CRUD ──────────────────────────────────────────────────────

  @Post('groups/create')
  create(
    @CurrentUser() userId: string,
    @Body() dto: CreateGroupDto,
  ): Promise<{ id: string }> {
    return this.groupsService.create(userId, dto);
  }

  @Post('groups/:id/edit')
  edit(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: EditGroupDto,
  ): Promise<boolean> {
    return this.groupsService.edit(userId, id, dto);
  }

  @Post('groups/:id/remove')
  remove(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    return this.groupsService.remove(userId, id);
  }

  @Post('groups/:id/archive')
  archive(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    return this.groupsService.archive(userId, id);
  }

  @Post('groups/:id/restore')
  restore(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    return this.groupsService.restore(userId, id);
  }

  @Post('groups/:id/fetch')
  fetch(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<GroupViewModel> {
    return this.groupsService.fetch(userId, id);
  }

  // ─── ACCESS MANAGEMENT ────────────────────────────────────────

  @Post('groups/:id/add-access')
  addAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: AddAccessDto,
  ): Promise<boolean> {
    return this.groupsService.addAccess(userId, id, dto);
  }

  @Post('groups/change-access/:id')
  changeAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { access: number },
  ): Promise<boolean> {
    return this.groupsService.changeAccess(userId, id, body.access);
  }

  @Post('groups/remove-access/:id')
  removeAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    return this.groupsService.removeAccess(userId, id);
  }

  @Post('groups/change-pending-access/:id')
  changePendingAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { access: number },
  ): Promise<boolean> {
    return this.groupsService.changePendingAccess(userId, id, body.access);
  }

  @Post('groups/remove-pending-access/:id')
  removePendingAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    return this.groupsService.removePendingAccess(userId, id);
  }

  // ─── WORK ENTRIES (ATTENDANCE) ─────────────────────────────────

  @Post('groups/toggle-entry/:id')
  toggleEntry(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
  ): Promise<boolean> {
    return this.groupsService.toggleEntry(userId, groupId);
  }

  @Post('groups/remove-entry/:id')
  removeEntry(
    @CurrentUser() userId: string,
    @Param('id') entryId: string,
  ): Promise<boolean> {
    return this.groupsService.removeEntry(userId, entryId);
  }

  @Post('groups/edit-entry/:id')
  editEntry(
    @CurrentUser() userId: string,
    @Param('id') entryId: string,
    @Body() body: { begin: string; end: string },
  ): Promise<boolean> {
    return this.groupsService.editEntry(userId, entryId, body.begin, body.end);
  }

  @Post('groups/manual-entry/:id')
  manualEntry(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Body() body: { begin: string; end: string; userId: string },
  ): Promise<boolean> {
    return this.groupsService.manualEntry(userId, groupId, body.begin, body.end, body.userId);
  }

  // ─── SHIFTS ────────────────────────────────────────────────────

  @Post('groups/shifts/:id/create')
  createShift(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Body() body: { title: string; type: number; config?: string },
  ): Promise<boolean> {
    return this.groupsService.createShift(userId, groupId, body);
  }

  @Post('groups/shifts/:id/edit')
  editShift(
    @CurrentUser() userId: string,
    @Param('id') shiftId: string,
    @Body() body: { title?: string; type?: number; config?: string },
  ): Promise<boolean> {
    return this.groupsService.editShift(userId, shiftId, body);
  }

  @Post('groups/shifts/:id/remove')
  removeShift(
    @CurrentUser() userId: string,
    @Param('id') shiftId: string,
  ): Promise<boolean> {
    return this.groupsService.removeShift(userId, shiftId);
  }

  // ─── TIME OFFS ─────────────────────────────────────────────────

  @Post('groups/time-offs/:id/request')
  requestTimeOff(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Body() body: { from: string; to: string; reason?: string },
  ): Promise<boolean> {
    return this.groupsService.requestTimeOff(userId, groupId, body);
  }

  @Post('groups/time-offs/:id/delete')
  deleteTimeOff(
    @CurrentUser() userId: string,
    @Param('id') timeOffId: string,
  ): Promise<boolean> {
    return this.groupsService.deleteTimeOff(userId, timeOffId);
  }

  @Post('groups/time-offs/:id/approve')
  approveTimeOff(
    @CurrentUser() userId: string,
    @Param('id') timeOffId: string,
  ): Promise<boolean> {
    return this.groupsService.approveTimeOff(userId, timeOffId);
  }

  @Post('groups/time-offs/:id/decline')
  declineTimeOff(
    @CurrentUser() userId: string,
    @Param('id') timeOffId: string,
  ): Promise<boolean> {
    return this.groupsService.declineTimeOff(userId, timeOffId);
  }

  @Post('groups/time-offs/:id/detail')
  timeOffDetail(
    @CurrentUser() userId: string,
    @Param('id') timeOffId: string,
  ): Promise<any> {
    return this.groupsService.timeOffDetail(userId, timeOffId);
  }

  // ─── REPORTS / TIMES ───────────────────────────────────────────

  @Post('times/group/:id')
  groupTimes(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Body() body: { from: string; to: string },
  ): Promise<TimeSpentViewModel[]> {
    return this.groupsService.groupTimes(userId, groupId, body.from, body.to);
  }

  @Post('groups/:id/report')
  report(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { from: string; to: string },
  ): Promise<DayReportViewModel[]> {
    return this.groupsService.report(userId, id, body.from, body.to);
  }

  // ─── UPGRADE / CONNECT ─────────────────────────────────────────

  @Post('groups/:id/upgrade')
  upgrade(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    return this.groupsService.upgrade(userId, id);
  }

  @Post('groups/:id/non-attached')
  nonAttached(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<GroupViewModel[]> {
    return this.groupsService.nonAttached(userId, id);
  }

  @Post('groups/:parentId/connect')
  connect(
    @CurrentUser() userId: string,
    @Param('parentId') parentId: string,
    @Body() body: { id: string },
  ): Promise<boolean> {
    return this.groupsService.connect(userId, parentId, body.id);
  }
}
