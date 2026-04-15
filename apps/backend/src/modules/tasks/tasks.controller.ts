import {
  Body,
  Controller,
  Param,
  Post,
  Res,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateTaskDto,
  RepositionTaskDto,
  MoveTaskDto,
  ChangeTitleDto,
  ChangePriorityDto,
  ChangeDescriptionDto,
  ChangeStateDto,
  SetDateDto,
  AddCommentDto,
  VoteDto,
  SpendTimeDto,
  AddMemberDto,
} from '@asoode/shared';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─── TASK CRUD ──────────────────────────────────────────────

  @Post(':listId/create')
  create(
    @CurrentUser() userId: string,
    @Param('listId') listId: string,
    @Body() body: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, listId, body);
  }

  @Post(':id/detail')
  detail(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.detail(userId, id);
  }

  @Post(':id/convert-to-task')
  convertToTask(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.convertToTask(userId, id);
  }

  @Post(':id/change-title')
  changeTitle(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: ChangeTitleDto,
  ) {
    return this.tasksService.changeTitle(userId, id, body);
  }

  @Post(':id/change-priority')
  changePriority(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: ChangePriorityDto,
  ) {
    return this.tasksService.changePriority(userId, id, body);
  }

  @Post(':id/change-description')
  changeDescription(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: ChangeDescriptionDto,
  ) {
    return this.tasksService.changeDescription(userId, id, body);
  }

  @Post(':id/change-state')
  changeState(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: ChangeStateDto,
  ) {
    return this.tasksService.changeState(userId, id, body);
  }

  @Post(':id/reposition')
  reposition(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: RepositionTaskDto,
  ) {
    return this.tasksService.reposition(userId, id, body);
  }

  @Post(':id/move')
  move(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: MoveTaskDto,
  ) {
    return this.tasksService.move(userId, id, body);
  }

  @Post(':id/set-date')
  setDate(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: SetDateDto,
  ) {
    return this.tasksService.setDate(userId, id, body);
  }

  @Post(':id/location')
  location(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { geoLocation: string },
  ) {
    return this.tasksService.location(userId, id, body);
  }

  // ─── MEMBERS ────────────────────────────────────────────────

  @Post(':id/member/add')
  addMember(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: AddMemberDto,
  ) {
    return this.tasksService.addMember(userId, id, body);
  }

  @Post(':taskId/member/:id/remove')
  removeMember(
    @CurrentUser() userId: string,
    @Param('taskId') taskId: string,
    @Param('id') memberId: string,
  ) {
    return this.tasksService.removeMember(userId, taskId, memberId);
  }

  // ─── LABELS ─────────────────────────────────────────────────

  @Post(':taskId/label/add/:labelId')
  addLabel(
    @CurrentUser() userId: string,
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.tasksService.addLabel(userId, taskId, labelId);
  }

  @Post(':taskId/label/:labelId/remove')
  removeLabel(
    @CurrentUser() userId: string,
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.tasksService.removeLabel(userId, taskId, labelId);
  }

  // ─── ATTACHMENTS ────────────────────────────────────────────

  @Post('attachment/:id/rename')
  renameAttachment(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    return this.tasksService.renameAttachment(userId, id, body);
  }

  @Post('attachment/:id/remove')
  removeAttachment(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.removeAttachment(userId, id);
  }

  @Post('attachment/:id/cover')
  toggleAttachmentCover(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.toggleAttachmentCover(userId, id);
  }

  @Post(':id/bulk-attach')
  @UseInterceptors(FilesInterceptor('files'))
  bulkAttach(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.tasksService.bulkAttach(userId, id, files);
  }

  @Post(':id/:userId/bulk-download')
  async bulkDownload(
    @CurrentUser() currentUserId: string,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.tasksService.bulkDownload(currentUserId, id, targetUserId);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="attachments.zip"`,
    });
    res.send(buffer);
  }

  @Post(':taskId/attach')
  @UseInterceptors(FileInterceptor('files'))
  attach(
    @CurrentUser() userId: string,
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tasksService.attach(userId, taskId, file);
  }

  // ─── COMMENTS & INTERACTION ─────────────────────────────────

  @Post(':id/comment')
  addComment(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: AddCommentDto,
  ) {
    return this.tasksService.addComment(userId, id, body);
  }

  @Post(':id/vote')
  vote(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: VoteDto,
  ) {
    return this.tasksService.vote(userId, id, body);
  }

  @Post(':id/watch')
  watch(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.watch(userId, id);
  }

  // ─── TIME TRACKING ─────────────────────────────────────────

  @Post(':id/estimated')
  estimated(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { estimatedTime: number },
  ) {
    return this.tasksService.estimated(userId, id, body);
  }

  @Post(':id/spend-time')
  spendTime(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: SpendTimeDto,
  ) {
    return this.tasksService.spendTime(userId, id, body);
  }

  @Post(':id/toggle-timer')
  toggleTimer(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.toggleTimer(userId, id);
  }

  // ─── CUSTOM FIELD VALUES ───────────────────────────────────

  @Post(':taskId/custom-field/:fieldId/value')
  setCustomFieldValue(
    @CurrentUser() userId: string,
    @Param('taskId') taskId: string,
    @Param('fieldId') fieldId: string,
    @Body() body: { value: string },
  ) {
    return this.tasksService.setCustomFieldValue(userId, taskId, fieldId, body);
  }

  // ─── LOGS & ARCHIVE ────────────────────────────────────────

  @Post(':id/logs')
  logs(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.logs(userId, id);
  }

  @Post(':id/archive')
  archive(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.tasksService.archive(userId, id);
  }

  // ─── CALENDAR & KARTABL ────────────────────────────────────

  @Post('calendar')
  calendar(
    @CurrentUser() userId: string,
    @Body() body: { from: Date; to: Date },
  ) {
    return this.tasksService.calendar(userId, body);
  }

  @Post('kartabl')
  kartabl(@CurrentUser() userId: string) {
    return this.tasksService.kartabl(userId);
  }
}
