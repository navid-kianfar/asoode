import { Inject, Injectable, Logger } from '@nestjs/common';
import { parseDate, parseDateOrNull } from '../../common/utils/parse-date';
import { PrismaService } from '../../common/services/prisma.service';
import { DomainEventService } from '../../common/services/domain-event.service';
import { IStorageService, STORAGE_SERVICE } from '../../common/storage';
import {
  AccessType,
  ActivityType,
  OperationResult,
  WorkPackageTaskState,
  WorkPackageTaskAttachmentType,
  CreateTaskDto,
  RepositionTaskDto,
  MoveTaskDto,
  ChangeTitleDto,
  ChangeDescriptionDto,
  ChangeStateDto,
  SetDateDto,
  AddCommentDto,
  VoteDto,
  SpendTimeDto,
  AddMemberDto,
  WorkPackageTaskViewModel,
  WorkPackageTaskCommentViewModel,
  WorkPackageTaskMemberViewModel,
  WorkPackageTaskLabelViewModel,
  WorkPackageTaskAttachmentViewModel,
  WorkPackageTaskVoteViewModel,
  WorkPackageTaskTimeViewModel,
  ActivityLogViewModel,
  KartablViewModel,
  MemberInfoViewModel,
} from '@asoode/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvent: DomainEventService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────

  private toMemberInfo(user: {
    id: string;
    email: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
  }): MemberInfoViewModel {
    return {
      id: user.id,
      email: user.email,
      avatar: user.avatar || '',
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase(),
      username: user.username,
      bio: user.bio,
    };
  }

  private async getTaskWithContext(taskId: string) {
    return this.prisma.workPackageTask.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            workPackage: {
              include: {
                project: {
                  select: { id: true, groupId: true, userId: true },
                },
              },
            },
          },
        },
      },
    });
  }

  private async verifyTaskAccess(
    userId: string,
    taskId: string,
    minAccess: AccessType = AccessType.Editor,
  ) {
    const task = await this.getTaskWithContext(taskId);
    if (!task) return null;

    const wp = task.list?.workPackage;
    if (!wp) return null;

    // WP owner has full access
    if (wp.userId === userId) return task;

    // Check WP membership
    const wpMembership = await this.prisma.workPackageMember.findUnique({
      where: { recordId_packageId: { recordId: userId, packageId: task.packageId } },
    });
    if (wpMembership && wpMembership.access <= minAccess) return task;

    // Fall back to project owner
    if (wp.project?.userId === userId) return task;

    // Fall back to project membership
    const projectMembership = await this.prisma.projectMember.findUnique({
      where: { recordId_projectId: { recordId: userId, projectId: wp.projectId } },
    });
    if (projectMembership && projectMembership.access <= minAccess) return task;

    return null;
  }

  private async verifyPackageAccess(
    userId: string,
    packageId: string,
    minAccess: AccessType = AccessType.Editor,
  ): Promise<boolean> {
    const wp = await this.prisma.workPackage.findUnique({
      where: { id: packageId },
      select: { id: true, userId: true, projectId: true },
    });
    if (!wp) return false;

    if (wp.userId === userId) return true;

    const wpMembership = await this.prisma.workPackageMember.findUnique({
      where: { recordId_packageId: { recordId: userId, packageId } },
    });
    if (wpMembership && wpMembership.access <= minAccess) return true;

    const project = await this.prisma.project.findUnique({
      where: { id: wp.projectId },
      select: { userId: true },
    });
    if (project?.userId === userId) return true;

    const projectMembership = await this.prisma.projectMember.findUnique({
      where: { recordId_projectId: { recordId: userId, projectId: wp.projectId } },
    });
    if (projectMembership && projectMembership.access <= minAccess) return true;

    return false;
  }

  private generateAttachmentKey(
    groupId: string | null,
    projectId: string,
    packageId: string,
    taskId: string,
    originalFilename: string,
  ): string {
    const orgId = groupId || '_personal';
    const attachmentId = uuidv4();
    const normalized = this.normalizeFilename(originalFilename);
    return `${orgId}/${projectId}/${packageId}/${taskId}/${attachmentId}/${normalized}`;
  }

  private normalizeFilename(name: string): string {
    const ext = name.lastIndexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')) : '';
    const base = name.slice(0, name.length - ext.length);
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return (slug || 'file') + ext.toLowerCase();
  }

  private async getPackageMemberUserIds(packageId: string): Promise<string[]> {
    const members = await this.prisma.workPackageMember.findMany({
      where: { packageId, isGroup: false },
      select: { recordId: true },
    });
    return members.map((m) => m.recordId);
  }

  private mapTaskToViewModel(
    task: any,
    listName = '',
    includeRelations = false,
  ): WorkPackageTaskViewModel {
    const comments: WorkPackageTaskCommentViewModel[] = includeRelations
      ? (task.comments || []).map((c: any) => ({
          id: c.id,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          taskId: c.taskId,
          userId: c.userId,
          replyId: c.replyId || undefined,
          private: c.private,
          message: c.message,
          member: c.user ? this.toMemberInfo(c.user) : ({} as MemberInfoViewModel),
        }))
      : [];

    const members: WorkPackageTaskMemberViewModel[] = (task.members || []).map((m: any) => ({
      id: m.id,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      taskId: m.taskId,
      recordId: m.recordId,
      isGroup: m.isGroup,
      packageId: m.packageId,
    }));

    const labels: WorkPackageTaskLabelViewModel[] = (task.labels || []).map((l: any) => ({
      id: l.id,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      taskId: l.taskId,
      labelId: l.labelId,
      packageId: l.packageId,
      color: l.label?.color || '',
      title: l.label?.title || '',
      dark: l.label?.darkColor || false,
    }));

    const attachments: WorkPackageTaskAttachmentViewModel[] = (task.attachments || []).map(
      (a: any) => ({
        id: a.id,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        description: a.description,
        path: a.path ? this.storage.getPublicUrl(a.path) : '',
        thumbnailPath: a.thumbnailPath ? this.storage.getPublicUrl(a.thumbnailPath) : '',
        title: a.title,
        type: a.type,
        isCover: a.isCover,
        packageId: a.packageId,
        projectId: a.projectId,
        taskId: a.taskId,
        uploadId: a.uploadId || '',
        userId: a.userId,
        subProjectId: a.subProjectId || '',
      }),
    );

    const votes: WorkPackageTaskVoteViewModel[] = (task.votes || []).map((v: any) => ({
      id: v.id,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      vote: v.vote,
      packageId: v.packageId,
      projectId: v.projectId,
      taskId: v.taskId,
      userId: v.userId,
      subProjectId: v.subProjectId || '',
    }));

    const timeSpents: WorkPackageTaskTimeViewModel[] = includeRelations
      ? (task.timeSpents || []).map((t: any) => {
          const diffMs = t.end
            ? new Date(t.end).getTime() - new Date(t.begin).getTime()
            : 0;
          return {
            id: t.id,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            member: t.user ? this.toMemberInfo(t.user) : ({} as MemberInfoViewModel),
            begin: t.begin,
            end: t.end,
            manual: t.manual,
            userId: t.userId,
            packageId: t.packageId,
            projectId: t.projectId,
            taskId: t.taskId,
            subProjectId: t.subProjectId || '',
            diff: Math.round(diffMs / (1000 * 60)),
          };
        })
      : [];

    const subTasks: WorkPackageTaskViewModel[] = (task.subTasks || []).map((st: any) =>
      this.mapTaskToViewModel(st, st.list?.title || listName, false),
    );

    const upVotes = votes.filter((v) => v.vote).length;
    const downVotes = votes.filter((v) => !v.vote).length;

    const totalTimeSpentMs = (task.timeSpents || []).reduce((sum: number, t: any) => {
      if (!t.end) return sum;
      return sum + (new Date(t.end).getTime() - new Date(t.begin).getTime());
    }, 0);
    const timeSpent = Math.round(totalTimeSpentMs / (1000 * 60));

    const subTasksDone = subTasks.filter(
      (st) => st.state === WorkPackageTaskState.Done,
    ).length;

    return {
      id: task.id,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      userId: task.userId,
      packageId: task.packageId,
      projectId: task.projectId,
      subProjectId: task.subProjectId || '',
      seasonId: task.seasonId || '',
      parentId: task.parentId || '',
      order: task.order,
      state: task.state,
      restricted: task.restricted,
      votePaused: task.votePaused,
      votePrivate: task.votePrivate,
      title: task.title,
      description: task.description,
      geoLocation: task.geoLocation || '',
      listId: task.listId,
      listName: listName || task.list?.title || '',
      dueAt: task.dueAt || undefined,
      beginAt: task.beginAt || undefined,
      endAt: task.endAt || undefined,
      doneAt: task.doneAt || undefined,
      archivedAt: task.archivedAt || undefined,
      doneUserId: task.doneUserId || '',
      coverUrl: task.coverUrl || undefined,
      coverId: task.coverId || '',
      estimatedTime: task.estimatedTime,
      watching: task.watching,
      beginReminder: task.beginReminder,
      endReminder: task.endReminder,
      voteNecessity: task.voteNecessity,
      objectiveValue: task.objectiveValue,
      attachmentCount: (task.attachments || []).length,
      commentCount: (task.comments || []).length,
      hasDescription: !!task.description && task.description.length > 0,
      targetCounts: members.length,
      upVotes,
      downVotes,
      subTasksCount: subTasks.length,
      subTasksDone,
      timeSpent,
      comments,
      subTasks,
      members,
      labels,
      attachments,
      votes,
      timeSpents,
      customFieldValues: (task.customFieldValues || []).map((cfv: any) => ({
        id: cfv.id,
        createdAt: cfv.createdAt,
        updatedAt: cfv.updatedAt,
        fieldId: cfv.fieldId,
        taskId: cfv.taskId,
        value: cfv.value,
      })),
    };
  }

  // ─── TASK CRUD ──────────────────────────────────────────────

  async create(
    userId: string,
    listId: string,
    dto: CreateTaskDto,
  ): Promise<OperationResult<WorkPackageTaskViewModel>> {
    const list = await this.prisma.workPackageList.findUnique({
      where: { id: listId },
      include: { workPackage: true },
    });
    if (!list) {
      return OperationResult.NotFound();
    }

    if (!(await this.verifyPackageAccess(userId, list.packageId, AccessType.Editor))) {
      return OperationResult.NotFound();
    }

    const maxOrder = await this.prisma.workPackageTask.aggregate({
      where: { listId },
      _max: { order: true },
    });

    const task = await this.prisma.workPackageTask.create({
      data: {
        userId,
        packageId: list.packageId,
        projectId: list.workPackage.projectId,
        subProjectId: list.workPackage.subProjectId || null,
        listId,
        parentId: dto.parentId || null,
        title: dto.title,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    const viewModel = this.mapTaskToViewModel(task, list.title, false);

    const memberIds = await this.getPackageMemberUserIds(list.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskAdd,
      actorId: userId,
      entityId: task.id,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { ...viewModel, packageId: list.packageId },
      push: {
        title: 'Task created',
        description: `Task "${task.title}" was created`,
        url: `/work-package/${list.packageId}`,
      },
    });

    return OperationResult.Success(viewModel);
  }

  async detail(
    userId: string,
    id: string,
  ): Promise<OperationResult<WorkPackageTaskViewModel>> {
    const userSelect = {
      id: true,
      email: true,
      avatar: true,
      firstName: true,
      lastName: true,
      username: true,
      bio: true,
    };

    const task = await this.prisma.workPackageTask.findUnique({
      where: { id },
      include: {
        list: true,
        subTasks: {
          include: {
            members: true,
            labels: { include: { label: true } },
            attachments: true,
            votes: true,
            list: true,
          },
          orderBy: { order: 'asc' },
        },
        members: true,
        labels: { include: { label: true } },
        attachments: { orderBy: { createdAt: 'desc' } },
        comments: {
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
        votes: true,
        timeSpents: {
          include: { user: { select: userSelect } },
          orderBy: { begin: 'desc' },
        },
        customFieldValues: true,
      },
    });

    if (!task) {
      return OperationResult.NotFound();
    }

    if (!(await this.verifyPackageAccess(userId, task.packageId, AccessType.Visitor))) {
      return OperationResult.NotFound();
    }

    // Log the view activity
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskView,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: [],
      data: {},
    });

    const viewModel = this.mapTaskToViewModel(task, task.list?.title || '', true);
    return OperationResult.Success(viewModel);
  }

  async convertToTask(
    userId: string,
    id: string,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    if (!task.parentId) {
      return OperationResult.Success(true); // already a top-level task
    }

    const parentId = task.parentId;

    await this.prisma.workPackageTask.update({
      where: { id },
      data: { parentId: null },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);

    // Notify about the parent task update (subtask removed)
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskEdit,
      actorId: userId,
      entityId: parentId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id: parentId, packageId: task.packageId, removedSubTaskId: id },
      push: {
        title: 'Subtask converted',
        description: `Subtask "${task.title}" was converted to a task`,
        url: `/work-package/${task.packageId}`,
      },
    });

    // Notify about the new top-level task (so board updates)
    const updatedTask = await this.prisma.workPackageTask.findUnique({
      where: { id },
      include: {
        list: true,
        members: true,
        labels: { include: { label: true } },
        attachments: true,
        votes: true,
      },
    });
    if (updatedTask) {
      const viewModel = this.mapTaskToViewModel(updatedTask, updatedTask.list?.title || '', false);
      this.domainEvent.emit({
        type: ActivityType.WorkPackageTaskAdd,
        actorId: userId,
        entityId: id,
        entityType: 'task',
        recipientUserIds: memberIds,
        data: { ...viewModel, packageId: task.packageId },
        push: {
          title: 'Task added',
          description: `"${task.title}" is now a task`,
          url: `/work-package/${task.packageId}`,
        },
      });
    }

    return OperationResult.Success(true);
  }

  async changeTitle(
    userId: string,
    id: string,
    dto: ChangeTitleDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageTask.update({
      where: { id },
      data: { title: dto.title },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskEdit,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id, title: dto.title, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Task updated',
        description: `Task "${dto.title}" was updated`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async changeDescription(
    userId: string,
    id: string,
    dto: ChangeDescriptionDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageTask.update({
      where: { id },
      data: { description: dto.description },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskEdit,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id, description: dto.description, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Task updated',
        description: `Task "${task.title}" description was updated`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async changeState(
    userId: string,
    id: string,
    dto: ChangeStateDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = { state: dto.state };

    if (dto.state === WorkPackageTaskState.Done) {
      data.doneAt = new Date();
      data.doneUserId = userId;
    } else if (task.state === WorkPackageTaskState.Done && dto.state !== WorkPackageTaskState.Done) {
      // Undoing done state
      data.doneAt = null;
      data.doneUserId = null;
    }

    await this.prisma.workPackageTask.update({ where: { id }, data });

    const activityType =
      dto.state === WorkPackageTaskState.Done
        ? ActivityType.WorkPackageTaskDone
        : ActivityType.WorkPackageTaskEdit;

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: activityType,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id, state: dto.state, packageId: task.packageId, listId: task.listId },
      push: {
        title: dto.state === WorkPackageTaskState.Done ? 'Task completed' : 'Task updated',
        description: `Task "${task.title}" state was changed`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async reposition(
    userId: string,
    id: string,
    dto: RepositionTaskDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    const movingToNewList = task.listId !== dto.listId;

    // Shift tasks in the target list to make room at the desired position
    await this.prisma.workPackageTask.updateMany({
      where: {
        listId: dto.listId,
        order: { gte: dto.order },
        id: { not: id },
      },
      data: { order: { increment: 1 } },
    });

    // If moving to a new list, close the gap in the old list
    if (movingToNewList) {
      await this.prisma.workPackageTask.updateMany({
        where: {
          listId: task.listId,
          order: { gt: task.order },
          id: { not: id },
        },
        data: { order: { decrement: 1 } },
      });
    }

    await this.prisma.workPackageTask.update({
      where: { id },
      data: { listId: dto.listId, order: dto.order },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskReposition,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id, listId: dto.listId, order: dto.order, packageId: task.packageId, oldListId: task.listId },
      push: {
        title: 'Task repositioned',
        description: `Task "${task.title}" was repositioned`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async move(
    userId: string,
    id: string,
    dto: MoveTaskDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    // Get new list's work package for project/subproject info
    const targetList = await this.prisma.workPackageList.findUnique({
      where: { id: dto.listId },
      include: { workPackage: true },
    });
    if (!targetList) {
      return OperationResult.NotFound();
    }

    const maxOrder = await this.prisma.workPackageTask.aggregate({
      where: { listId: dto.listId },
      _max: { order: true },
    });

    await this.prisma.workPackageTask.update({
      where: { id },
      data: {
        packageId: dto.packageId,
        listId: dto.listId,
        projectId: targetList.workPackage.projectId,
        subProjectId: targetList.workPackage.subProjectId || null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    // Close the gap in the old list
    await this.prisma.workPackageTask.updateMany({
      where: {
        listId: task.listId,
        order: { gt: task.order },
        id: { not: id },
      },
      data: { order: { decrement: 1 } },
    });

    // Notify both old and new package members
    const oldMemberIds = await this.getPackageMemberUserIds(task.packageId);
    const newMemberIds = await this.getPackageMemberUserIds(dto.packageId);
    const allMemberIds = [...new Set([...oldMemberIds, ...newMemberIds])];

    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskMove,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: allMemberIds,
      data: { id, packageId: dto.packageId, listId: dto.listId, oldPackageId: task.packageId, oldListId: task.listId },
      push: {
        title: 'Task moved',
        description: `Task "${task.title}" was moved to another package`,
        url: `/work-package/${dto.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async setDate(
    userId: string,
    id: string,
    dto: SetDateDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.beginAt !== undefined) data.beginAt = parseDateOrNull(dto.beginAt);
    if (dto.endAt !== undefined) data.endAt = parseDateOrNull(dto.endAt);
    if (dto.dueAt !== undefined) data.dueAt = parseDateOrNull(dto.dueAt);
    if (dto.beginReminder !== undefined) data.beginReminder = dto.beginReminder;
    if (dto.endReminder !== undefined) data.endReminder = dto.endReminder;

    await this.prisma.workPackageTask.update({ where: { id }, data });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskEdit,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id, packageId: task.packageId, listId: task.listId, ...data },
      push: {
        title: 'Task updated',
        description: `Task "${task.title}" dates were updated`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async location(
    userId: string,
    id: string,
    dto: { geoLocation: string },
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, id, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageTask.update({
      where: { id },
      data: { geoLocation: dto.geoLocation },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskEdit,
      actorId: userId,
      entityId: id,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id, geoLocation: dto.geoLocation, packageId: task.packageId },
      push: {
        title: 'Task updated',
        description: `Task "${task.title}" location was updated`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── MEMBERS ────────────────────────────────────────────────

  async addMember(
    userId: string,
    taskId: string,
    dto: AddMemberDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    try {
      await this.prisma.taskMember.create({
        data: {
          taskId,
          recordId: dto.recordId,
          isGroup: dto.isGroup,
          packageId: task.packageId,
        },
      });
    } catch (error) {
      // Unique constraint violation: member already assigned
      this.logger.warn(`Member ${dto.recordId} already assigned to task ${taskId}`);
      return OperationResult.Duplicate();
    }

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskMemberAdd,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, recordId: dto.recordId, isGroup: dto.isGroup, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Member added',
        description: `A member was added to task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeMember(
    userId: string,
    taskId: string,
    memberId: string,
  ): Promise<OperationResult<boolean>> {
    const member = await this.prisma.taskMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.taskId !== taskId) {
      return OperationResult.NotFound();
    }

    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    await this.prisma.taskMember.delete({ where: { id: memberId } });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskMemberRemove,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, memberId, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Member removed',
        description: `A member was removed from task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── LABELS ─────────────────────────────────────────────────

  async addLabel(
    userId: string,
    taskId: string,
    labelId: string,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    const label = await this.prisma.workPackageLabel.findUnique({
      where: { id: labelId },
    });
    if (!label) {
      return OperationResult.NotFound();
    }

    try {
      await this.prisma.taskLabel.create({
        data: {
          taskId,
          labelId,
          packageId: task.packageId,
        },
      });
    } catch (error) {
      // Unique constraint violation: label already assigned
      this.logger.warn(`Label ${labelId} already assigned to task ${taskId}`);
      return OperationResult.Duplicate();
    }

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskLabelAdd,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, labelId, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Label added',
        description: `A label was added to task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeLabel(
    userId: string,
    taskId: string,
    labelId: string,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    const taskLabel = await this.prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId, labelId } },
    });
    if (!taskLabel) {
      return OperationResult.NotFound();
    }

    await this.prisma.taskLabel.delete({
      where: { taskId_labelId: { taskId, labelId } },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskLabelRemove,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, labelId, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Label removed',
        description: `A label was removed from task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── ATTACHMENTS ────────────────────────────────────────────

  async renameAttachment(
    userId: string,
    attachmentId: string,
    dto: { title: string },
  ): Promise<OperationResult<boolean>> {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment) {
      return OperationResult.NotFound();
    }

    if (!(await this.verifyPackageAccess(userId, attachment.packageId, AccessType.Editor))) {
      return OperationResult.NotFound();
    }

    await this.prisma.taskAttachment.update({
      where: { id: attachmentId },
      data: { title: dto.title },
    });

    const memberIds = await this.getPackageMemberUserIds(attachment.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskAttachmentRename,
      actorId: userId,
      entityId: attachment.taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { attachmentId, taskId: attachment.taskId, title: dto.title, packageId: attachment.packageId },
      push: {
        title: 'Attachment renamed',
        description: `Attachment was renamed to "${dto.title}"`,
        url: `/work-package/${attachment.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeAttachment(
    userId: string,
    attachmentId: string,
  ): Promise<OperationResult<boolean>> {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment) {
      return OperationResult.NotFound();
    }

    if (!(await this.verifyPackageAccess(userId, attachment.packageId, AccessType.Editor))) {
      return OperationResult.NotFound();
    }

    // Remove from storage
    try {
      await this.storage.delete(attachment.path);
      if (attachment.thumbnailPath) {
        await this.storage.delete(attachment.thumbnailPath);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete attachment file from storage: ${error}`,
      );
    }

    // If this was the cover, clear the cover on the task
    if (attachment.isCover) {
      await this.prisma.workPackageTask.update({
        where: { id: attachment.taskId },
        data: { coverUrl: null, coverId: null },
      });
    }

    await this.prisma.taskAttachment.delete({ where: { id: attachmentId } });

    const memberIds = await this.getPackageMemberUserIds(attachment.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskAttachmentRemove,
      actorId: userId,
      entityId: attachment.taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { id: attachmentId, attachmentId, taskId: attachment.taskId, packageId: attachment.packageId },
      push: {
        title: 'Attachment removed',
        description: `An attachment was removed from a task`,
        url: `/work-package/${attachment.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async toggleAttachmentCover(
    userId: string,
    attachmentId: string,
  ): Promise<OperationResult<boolean>> {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment) {
      return OperationResult.NotFound();
    }

    if (!(await this.verifyPackageAccess(userId, attachment.packageId, AccessType.Editor))) {
      return OperationResult.NotFound();
    }

    const newIsCover = !attachment.isCover;

    // Clear all other covers on this task
    await this.prisma.taskAttachment.updateMany({
      where: { taskId: attachment.taskId, id: { not: attachmentId } },
      data: { isCover: false },
    });

    // Toggle cover on this attachment
    await this.prisma.taskAttachment.update({
      where: { id: attachmentId },
      data: { isCover: newIsCover },
    });

    // Update cover info on the task itself
    await this.prisma.workPackageTask.update({
      where: { id: attachment.taskId },
      data: {
        coverUrl: newIsCover ? attachment.path : null,
        coverId: newIsCover ? attachmentId : null,
      },
    });

    const memberIds = await this.getPackageMemberUserIds(attachment.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskAttachmentCover,
      actorId: userId,
      entityId: attachment.taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { attachmentId, taskId: attachment.taskId, isCover: newIsCover, packageId: attachment.packageId },
      push: {
        title: 'Cover toggled',
        description: `Attachment cover was ${newIsCover ? 'set' : 'removed'}`,
        url: `/work-package/${attachment.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async bulkAttach(
    userId: string,
    taskId: string,
    files: Express.Multer.File[],
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    if (!files || files.length === 0) {
      return OperationResult.Validation();
    }

    const groupId = task.list?.workPackage?.project?.groupId ?? null;

    for (const file of files) {
      const fileKey = this.generateAttachmentKey(
        groupId, task.projectId, task.packageId, taskId, file.originalname,
      );

      await this.storage.upload(fileKey, file.buffer, file.mimetype, file.size);

      await this.prisma.taskAttachment.create({
        data: {
          taskId,
          packageId: task.packageId,
          projectId: task.projectId,
          subProjectId: task.subProjectId || null,
          userId,
          title: file.originalname,
          path: fileKey,
          type: WorkPackageTaskAttachmentType.Upload,
          isCover: false,
        },
      });
    }

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskAttachmentBulkAdd,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, count: files.length, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Attachments uploaded',
        description: `${files.length} attachments were uploaded to task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async bulkDownload(
    _userId: string,
    _taskId: string,
    _targetUserId: string,
  ): Promise<Buffer> {
    // Mock implementation: return an empty buffer
    // In production, this would zip all attachments for the task and return the archive
    return Buffer.alloc(0);
  }

  async attach(
    userId: string,
    taskId: string,
    file: Express.Multer.File,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    if (!file) {
      return OperationResult.Validation();
    }

    const groupId = task.list?.workPackage?.project?.groupId ?? null;
    const fileKey = this.generateAttachmentKey(
      groupId, task.projectId, task.packageId, taskId, file.originalname,
    );

    await this.storage.upload(fileKey, file.buffer, file.mimetype, file.size);

    const attachment = await this.prisma.taskAttachment.create({
      data: {
        taskId,
        packageId: task.packageId,
        projectId: task.projectId,
        subProjectId: task.subProjectId || null,
        userId,
        title: file.originalname,
        path: fileKey,
        type: WorkPackageTaskAttachmentType.Upload,
        isCover: false,
      },
    });

    const attachmentViewModel = {
      id: attachment.id,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
      description: attachment.description,
      path: this.storage.getPublicUrl(attachment.path),
      thumbnailPath: '',
      title: attachment.title,
      type: attachment.type,
      isCover: attachment.isCover,
      packageId: attachment.packageId,
      projectId: attachment.projectId,
      taskId: attachment.taskId,
      uploadId: '',
      userId: attachment.userId,
      subProjectId: attachment.subProjectId || '',
    };

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskAttachmentAdd,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: {
        taskId,
        packageId: task.packageId,
        listId: task.listId,
        parentId: task.parentId || null,
        attachment: attachmentViewModel,
      },
      push: {
        title: 'Attachment uploaded',
        description: `An attachment was uploaded to task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── COMMENTS & INTERACTION ─────────────────────────────────

  async addComment(
    userId: string,
    taskId: string,
    dto: AddCommentDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Visitor);
    if (!task) {
      return OperationResult.NotFound();
    }

    await this.prisma.taskComment.create({
      data: {
        taskId,
        userId,
        message: dto.message,
        private: dto.private || false,
      },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskComment,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Comment added',
        description: `A comment was added to task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async vote(
    userId: string,
    taskId: string,
    dto: VoteDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Visitor);
    if (!task) {
      return OperationResult.NotFound();
    }

    // Upsert the vote
    const existingVote = await this.prisma.taskVote.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (existingVote) {
      await this.prisma.taskVote.update({
        where: { id: existingVote.id },
        data: { vote: dto.vote },
      });
    } else {
      await this.prisma.taskVote.create({
        data: {
          taskId,
          userId,
          vote: dto.vote,
          packageId: task.packageId,
          projectId: task.projectId,
          subProjectId: task.subProjectId || null,
        },
      });
    }

    // Calculate updated vote counts
    const votes = await this.prisma.taskVote.findMany({ where: { taskId } });
    const upVotes = votes.filter((v) => v.vote).length;
    const downVotes = votes.filter((v) => !v.vote).length;

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskVote,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, upVotes, downVotes, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Vote cast',
        description: `A vote was cast on task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async watch(
    userId: string,
    taskId: string,
  ): Promise<OperationResult<boolean>> {
    const task = await this.prisma.workPackageTask.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      return OperationResult.NotFound();
    }

    if (!(await this.verifyPackageAccess(userId, task.packageId, AccessType.Visitor))) {
      return OperationResult.NotFound();
    }

    const newWatching = !task.watching;
    await this.prisma.workPackageTask.update({
      where: { id: taskId },
      data: { watching: newWatching },
    });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskWatch,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: [],
      data: { taskId, watching: newWatching },
    });

    return OperationResult.Success(true);
  }

  // ─── TIME TRACKING ─────────────────────────────────────────

  async estimated(
    userId: string,
    taskId: string,
    dto: { estimatedTime: number },
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageTask.update({
      where: { id: taskId },
      data: { estimatedTime: dto.estimatedTime },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskEdit,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, estimatedTime: dto.estimatedTime, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Task updated',
        description: `Estimated time for task "${task.title}" was updated`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async spendTime(
    userId: string,
    taskId: string,
    dto: SpendTimeDto,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    await this.prisma.taskTimeSpent.create({
      data: {
        taskId,
        userId,
        packageId: task.packageId,
        projectId: task.projectId,
        subProjectId: task.subProjectId || null,
        begin: parseDate(dto.begin, 'begin'),
        end: dto.end ? parseDate(dto.end, 'end') : null,
        manual: true,
      },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskTime,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Time logged',
        description: `Time was logged on task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async toggleTimer(
    userId: string,
    taskId: string,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Editor);
    if (!task) {
      return OperationResult.NotFound();
    }

    // Find any active timer for this user (across all tasks)
    const activeTimer = await this.prisma.taskTimeSpent.findFirst({
      where: { userId, end: null },
    });

    if (activeTimer) {
      // Stop the active timer
      await this.prisma.taskTimeSpent.update({
        where: { id: activeTimer.id },
        data: { end: new Date() },
      });

      // If stopping timer on the same task, just clear working state
      if (activeTimer.taskId === taskId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { workingTaskId: null, workingTaskFrom: null, workingPackageId: null, workingProjectId: null },
        });

        const memberIds = await this.getPackageMemberUserIds(task.packageId);
        this.domainEvent.emit({
          type: ActivityType.WorkPackageTaskTime,
          actorId: userId,
          entityId: taskId,
          entityType: 'task',
          recipientUserIds: memberIds,
          data: { taskId, packageId: task.packageId, listId: task.listId },
          push: {
            title: 'Timer stopped',
            description: `Timer was stopped on task "${task.title}"`,
            url: `/work-package/${task.packageId}`,
          },
        });

        return OperationResult.Success(true);
      }

      // If different task, emit stop event for old task
      const oldMemberIds = await this.getPackageMemberUserIds(activeTimer.packageId);
      this.domainEvent.emit({
        type: ActivityType.WorkPackageTaskTime,
        actorId: userId,
        entityId: activeTimer.taskId,
        entityType: 'task',
        recipientUserIds: oldMemberIds,
        data: { taskId: activeTimer.taskId, packageId: activeTimer.packageId },
        push: {
          title: 'Timer stopped',
          description: `Timer was stopped on a previous task`,
          url: `/work-package/${activeTimer.packageId}`,
        },
      });
    }

    // Start new timer on requested task
    await this.prisma.taskTimeSpent.create({
      data: {
        taskId,
        userId,
        packageId: task.packageId,
        projectId: task.projectId,
        subProjectId: task.subProjectId || null,
        begin: new Date(),
        end: null,
        manual: false,
      },
    });

    // Update user's working state
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        workingTaskId: taskId,
        workingTaskFrom: new Date(),
        workingPackageId: task.packageId,
        workingProjectId: task.projectId,
      },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageTaskTime,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, packageId: task.packageId, listId: task.listId },
      push: {
        title: 'Timer started',
        description: `Timer was started on task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── CUSTOM FIELD VALUES ───────────────────────────────────

  async setCustomFieldValue(
    userId: string,
    taskId: string,
    fieldId: string,
    dto: { value: string },
  ): Promise<OperationResult<boolean>> {
    const task = await this.prisma.workPackageTask.findUnique({
      where: { id: taskId },
    });
    if (!task) return OperationResult.NotFound();

    if (!(await this.verifyPackageAccess(userId, task.packageId, AccessType.Editor))) {
      return OperationResult.NotFound();
    }

    const field = await this.prisma.customField.findUnique({
      where: { id: fieldId },
    });
    if (!field || field.packageId !== task.packageId) return OperationResult.NotFound();

    await this.prisma.customFieldValue.upsert({
      where: { fieldId_taskId: { fieldId, taskId } },
      create: { fieldId, taskId, value: dto.value },
      update: { value: dto.value },
    });

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageCustomFieldValueSet,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, fieldId, value: dto.value, packageId: task.packageId },
      push: {
        title: 'Custom field updated',
        description: `Custom field value was set on task "${task.title}"`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── LOGS & ARCHIVE ────────────────────────────────────────

  async logs(
    userId: string,
    taskId: string,
  ): Promise<OperationResult<ActivityLogViewModel[]>> {
    const task = await this.prisma.workPackageTask.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      return OperationResult.NotFound();
    }

    if (!(await this.verifyPackageAccess(userId, task.packageId, AccessType.Visitor))) {
      return OperationResult.NotFound();
    }

    const userSelect = {
      id: true,
      email: true,
      avatar: true,
      firstName: true,
      lastName: true,
      username: true,
      bio: true,
    };

    const logs = await this.prisma.activityLog.findMany({
      where: { taskId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
    });

    const result: ActivityLogViewModel[] = logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      description: log.description,
      type: log.type,
      userId: log.userId,
      member: log.user ? this.toMemberInfo(log.user) : undefined,
    }));

    return OperationResult.Success(result);
  }

  async archive(
    userId: string,
    taskId: string,
  ): Promise<OperationResult<boolean>> {
    const task = await this.verifyTaskAccess(userId, taskId, AccessType.Admin);
    if (!task) {
      return OperationResult.NotFound();
    }

    const isArchived = task.archivedAt !== null;
    await this.prisma.workPackageTask.update({
      where: { id: taskId },
      data: { archivedAt: isArchived ? null : new Date() },
    });

    const activityType = isArchived
      ? ActivityType.WorkPackageTaskRestore
      : ActivityType.WorkPackageTaskArchive;

    const memberIds = await this.getPackageMemberUserIds(task.packageId);
    this.domainEvent.emit({
      type: activityType,
      actorId: userId,
      entityId: taskId,
      entityType: 'task',
      recipientUserIds: memberIds,
      data: { taskId, archived: !isArchived, packageId: task.packageId, listId: task.listId },
      push: {
        title: isArchived ? 'Task restored' : 'Task archived',
        description: `Task "${task.title}" was ${isArchived ? 'restored' : 'archived'}`,
        url: `/work-package/${task.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── CALENDAR & KARTABL ────────────────────────────────────

  async calendar(
    userId: string,
    dto: { from: Date; to: Date },
  ): Promise<OperationResult<WorkPackageTaskViewModel[]>> {
    const fromDate = parseDate(dto.from, 'from');
    const toDate = parseDate(dto.to, 'to');

    // Find all tasks where the user is a member and that fall within the date range
    const tasks = await this.prisma.workPackageTask.findMany({
      where: {
        archivedAt: null,
        members: { some: { recordId: userId } },
        OR: [
          { dueAt: { gte: fromDate, lte: toDate } },
          { beginAt: { gte: fromDate, lte: toDate } },
          { endAt: { gte: fromDate, lte: toDate } },
          // Also include tasks that span the entire range
          {
            AND: [
              { beginAt: { lte: fromDate } },
              { endAt: { gte: toDate } },
            ],
          },
        ],
      },
      include: {
        list: true,
        members: true,
        labels: { include: { label: true } },
        attachments: true,
        votes: true,
        subTasks: {
          include: {
            members: true,
            labels: { include: { label: true } },
            list: true,
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    const result: WorkPackageTaskViewModel[] = tasks.map((task) =>
      this.mapTaskToViewModel(task, task.list?.title || '', false),
    );

    return OperationResult.Success(result);
  }

  async kartabl(userId: string): Promise<OperationResult<KartablViewModel>> {
    const tasks = await this.prisma.workPackageTask.findMany({
      where: {
        archivedAt: null,
        members: { some: { recordId: userId } },
      },
      include: {
        list: true,
        members: true,
        labels: { include: { label: true } },
        attachments: true,
        votes: true,
        subTasks: {
          include: {
            members: true,
            labels: { include: { label: true } },
            list: true,
          },
        },
      },
      orderBy: [{ state: 'asc' }, { updatedAt: 'desc' }],
    });

    const result: WorkPackageTaskViewModel[] = tasks.map((task) =>
      this.mapTaskToViewModel(task, task.list?.title || '', false),
    );

    return OperationResult.Success({ tasks: result });
  }
}
