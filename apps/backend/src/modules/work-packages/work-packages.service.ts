import { Injectable, Logger } from '@nestjs/common';
import { parseDate } from '../../common/utils/parse-date';
import { PrismaService } from '../../common/services/prisma.service';
import { DomainEventService } from '../../common/services/domain-event.service';
import {
  AccessType,
  ActivityType,
  BoardTemplate,
  ChannelType,
  OperationResult,
  WorkPackageTaskState,
  CreateWorkPackageDto,
  EditWorkPackageDto,
  CreateListDto,
  CreateLabelDto,
  AddAccessDto,
  EditListDto,
  WorkPackageViewModel,
  WorkPackageListViewModel,
  WorkPackageTaskViewModel,
  WorkPackageLabelViewModel,
  WorkPackageMemberViewModel,
  WorkPackageObjectiveViewModel,
  WorkPackageProgressViewModel,
  WorkPackageUserSetting,
  WorkPackageTaskMemberViewModel,
  WorkPackageTaskLabelViewModel,
  PendingInvitationViewModel,
} from '@asoode/shared';
import { MessengerService } from '../messenger/messenger.service';

@Injectable()
export class WorkPackagesService {
  private readonly logger = new Logger(WorkPackagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvent: DomainEventService,
    private readonly messengerService: MessengerService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────

  private async verifyWorkPackageAccess(
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

    const membership = await this.prisma.workPackageMember.findUnique({
      where: { recordId_packageId: { recordId: userId, packageId } },
    });
    if (membership && membership.access <= minAccess) return true;

    // Fall back to project-level access
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

  private async getWorkPackageMemberUserIds(packageId: string): Promise<string[]> {
    const wp = await this.prisma.workPackage.findUnique({
      where: { id: packageId },
      select: { userId: true, projectId: true },
    });

    const wpMembers = await this.prisma.workPackageMember.findMany({
      where: { packageId, isGroup: false },
      select: { recordId: true },
    });

    const projectMembers = await this.prisma.projectMember.findMany({
      where: { projectId: wp?.projectId ?? '', isGroup: false },
      select: { recordId: true },
    });

    const ids = new Set<string>();
    if (wp) ids.add(wp.userId);
    for (const m of wpMembers) ids.add(m.recordId);
    for (const m of projectMembers) ids.add(m.recordId);

    return [...ids];
  }

  private computeProgress(tasks: { state: number }[]): WorkPackageProgressViewModel {
    const total = tasks.length;
    const done = tasks.filter(
      (t) => t.state === WorkPackageTaskState.Done,
    ).length;
    const canceledOrDuplicate = tasks.filter(
      (t) =>
        t.state === WorkPackageTaskState.Cancelled ||
        t.state === WorkPackageTaskState.Duplicate,
    ).length;
    const effective = total - canceledOrDuplicate;
    const percent = effective > 0 ? Math.round((done / effective) * 100) : 0;

    return { percent, total, done, canceledOrDuplicate };
  }

  private mapTask(task: any): WorkPackageTaskViewModel {
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

    const subTasks = task.subTasks || [];
    const subTasksCount = subTasks.length;
    const subTasksDone = subTasks.filter(
      (st: any) => st.state === WorkPackageTaskState.Done,
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
      listId: task.listId,
      title: task.title,
      description: task.description,
      order: task.order,
      state: task.state,
      geoLocation: task.geoLocation || '',
      dueAt: task.dueAt || undefined,
      beginAt: task.beginAt || undefined,
      endAt: task.endAt || undefined,
      archivedAt: task.archivedAt || undefined,
      doneAt: task.doneAt || undefined,
      doneUserId: task.doneUserId || '',
      coverUrl: task.coverUrl || undefined,
      coverId: task.coverId || '',
      estimatedTime: task.estimatedTime || 0,
      watching: task.watching || false,
      restricted: task.restricted || false,
      votePaused: task.votePaused || false,
      votePrivate: task.votePrivate || false,
      beginReminder: task.beginReminder,
      endReminder: task.endReminder,
      voteNecessity: task.voteNecessity,
      objectiveValue: task.objectiveValue,
      listName: task.list?.title || '',
      timeSpent: 0,
      hasDescription: !!task.description,
      attachmentCount: task.attachments?.length ?? task._count?.attachments ?? 0,
      commentCount: task.comments?.length ?? task._count?.comments ?? 0,
      subTasksCount,
      subTasksDone,
      upVotes: (task.votes || []).filter((v: any) => v.vote === true).length,
      downVotes: (task.votes || []).filter((v: any) => v.vote === false).length,
      targetCounts: 0,
      members,
      labels,
      comments: [],
      subTasks: [],
      attachments: [],
      votes: [],
      timeSpents: [],
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

  private mapWorkPackageToViewModel(
    wp: any,
    userSetting: WorkPackageUserSetting | null,
    pending: PendingInvitationViewModel[],
    progress: WorkPackageProgressViewModel,
  ): WorkPackageViewModel {
    const labels: WorkPackageLabelViewModel[] = (wp.labels || []).map((l: any) => ({
      id: l.id,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      packageId: l.packageId,
      title: l.title,
      color: l.color,
      darkColor: l.darkColor,
      waiting: false,
    }));

    const members: WorkPackageMemberViewModel[] = (wp.members || []).map((m: any) => ({
      id: m.id,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      recordId: m.recordId,
      packageId: m.packageId,
      access: m.access,
      isGroup: m.isGroup,
    }));

    const lists: WorkPackageListViewModel[] = (wp.lists || []).map((list: any) => ({
      id: list.id,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      packageId: list.packageId,
      title: list.title,
      color: list.color,
      darkColor: list.darkColor,
      order: list.order,
      tempName: list.title,
      tasks: (list.tasks || []).map((t: any) => this.mapTask(t)),
    }));

    const objectives: WorkPackageObjectiveViewModel[] = (wp.objectives || []).map((o: any) => ({
      id: o.id,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      type: o.type,
      title: o.title,
      description: o.description,
      workPackage: wp.title,
    }));

    const customFields = (wp.customFields || []).map((cf: any) => ({
      id: cf.id,
      createdAt: cf.createdAt,
      updatedAt: cf.updatedAt,
      packageId: cf.packageId,
      title: cf.title,
      type: cf.type,
      required: cf.required,
      options: cf.options,
      order: cf.order,
    }));

    const defaultUserSetting: WorkPackageUserSetting = userSetting || {
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: '',
      packageId: wp.id,
      projectId: wp.projectId,
      showTotalCards: true,
      receiveNotification: 1,
    };

    return {
      id: wp.id,
      createdAt: wp.createdAt,
      updatedAt: wp.updatedAt,
      userId: wp.userId,
      projectId: wp.projectId,
      subProjectId: wp.subProjectId || '',
      title: wp.title,
      description: wp.description,
      order: wp.order,
      color: wp.color,
      darkColor: wp.darkColor,
      listsSort: wp.listsSort,
      tasksSort: wp.tasksSort,
      subTasksSort: wp.subTasksSort,
      attachmentsSort: wp.attachmentsSort,
      permissionComment: wp.permissionComment,
      permissionEditAttachment: wp.permissionEditAttachment,
      permissionCreateAttachment: wp.permissionCreateAttachment,
      permissionAssignMembers: wp.permissionAssignMembers,
      permissionAssignLabels: wp.permissionAssignLabels,
      permissionChangeTaskState: wp.permissionChangeTaskState,
      permissionEditTask: wp.permissionEditTask,
      permissionArchiveTask: wp.permissionArchiveTask,
      permissionCreateTask: wp.permissionCreateTask,
      permissionArchiveList: wp.permissionArchiveList,
      permissionEditList: wp.permissionEditList,
      permissionCreateList: wp.permissionCreateList,
      permissionClearList: wp.permissionClearList,
      taskVisibility: wp.taskVisibility,
      commentPermission: wp.permissionComment,
      allowAttachment: wp.allowAttachment,
      allowBlockingBoardTasks: wp.allowBlockingBoardTasks,
      allowComments: wp.allowComments,
      allowCustomField: wp.allowCustomField,
      allowEndAt: wp.allowEndAt,
      allowEstimatedTime: wp.allowEstimatedTime,
      allowGeoLocation: wp.allowGeoLocation,
      allowLabels: wp.allowLabels,
      allowMembers: wp.allowMembers,
      allowPoll: wp.allowPoll,
      allowSegments: wp.allowSegments,
      allowState: wp.allowState,
      allowTimeSpent: wp.allowTimeSpent,
      beginAt: wp.beginAt || undefined,
      endAt: wp.endAt || undefined,
      actualBeginAt: wp.actualBeginAt || undefined,
      actualEndAt: wp.actualEndAt || undefined,
      archivedAt: wp.archivedAt || undefined,
      userSetting: defaultUserSetting,
      pending,
      progress,
      labels,
      members,
      lists,
      objectives,
      tasks: [],
      customFields,
    };
  }

  // ─── BOARD TEMPLATE HELPERS ───────────────────────────────────

  private getBoardTemplateLists(template: number): string[] {
    switch (template) {
      case BoardTemplate.Kanban:
        return ['Backlog', 'To Do', 'In Progress', 'Done'];
      case BoardTemplate.WeekDay:
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      case BoardTemplate.Blank:
      default:
        return [];
    }
  }

  // ─── WORK PACKAGE CRUD ──────────────────────────────────────

  async create(
    userId: string,
    projectId: string,
    dto: CreateWorkPackageDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const maxOrder = await this.prisma.workPackage.aggregate({
      where: { projectId },
      _max: { order: true },
    });

    const wp = await this.prisma.workPackage.create({
      data: {
        userId,
        projectId,
        subProjectId: dto.subProjectId || null,
        title: dto.title,
        description: dto.description || '',
        boardTemplate: dto.boardTemplate,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    // Add creator as WP member with Owner access
    await this.prisma.workPackageMember.create({
      data: {
        recordId: userId,
        packageId: wp.id,
        access: AccessType.Owner,
        isGroup: false,
      },
    });

    // Create template lists
    const templateLists = this.getBoardTemplateLists(dto.boardTemplate);
    for (let i = 0; i < templateLists.length; i++) {
      await this.prisma.workPackageList.create({
        data: {
          packageId: wp.id,
          title: templateLists[i],
          order: i,
        },
      });
    }

    // Auto-create a channel for this work package
    await this.messengerService.createEntityChannel(
      userId,
      ChannelType.WorkPackage,
      wp.id,
      wp.title,
      [userId],
    );

    const memberIds = await this.getWorkPackageMemberUserIds(wp.id);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageAdd,
      actorId: userId,
      entityId: wp.id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id: wp.id,
        projectId,
        title: wp.title,
      },
      push: {
        title: 'Board created',
        description: `Board "${wp.title}" was created`,
        url: `/work-package/${wp.id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async fetch(
    userId: string,
    id: string,
  ): Promise<OperationResult<WorkPackageViewModel>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const wp = await this.prisma.workPackage.findUnique({
      where: { id },
      include: {
        labels: true,
        members: true,
        objectives: true,
        customFields: { orderBy: { order: 'asc' } },
        userSettings: { where: { userId } },
        lists: {
          where: { archivedAt: null },
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              where: { archivedAt: null, parentId: null },
              orderBy: { order: 'asc' },
              include: {
                members: true,
                labels: { include: { label: true } },
                subTasks: { select: { id: true, state: true } },
                customFieldValues: true,
                _count: { select: { attachments: true, comments: true } },
              },
            },
          },
        },
      },
    });

    if (!wp) {
      return OperationResult.NotFound();
    }

    // Compute progress from all non-archived tasks
    const allTasks = await this.prisma.workPackageTask.findMany({
      where: { packageId: id, archivedAt: null },
      select: { state: true },
    });
    const progress = this.computeProgress(allTasks);

    // Map user setting
    const userSetting = wp.userSettings[0]
      ? {
          id: wp.userSettings[0].id,
          createdAt: wp.userSettings[0].createdAt,
          updatedAt: wp.userSettings[0].updatedAt,
          userId: wp.userSettings[0].userId,
          packageId: wp.userSettings[0].packageId,
          projectId: wp.userSettings[0].projectId,
          showTotalCards: wp.userSettings[0].showTotalCards,
          receiveNotification: wp.userSettings[0].receiveNotification,
        }
      : null;

    // Load pending invitations
    const pendingInvitations = await this.prisma.pendingInvitation.findMany({
      where: { recordId: id, entityType: 'work_package' },
    });
    const pending: PendingInvitationViewModel[] = pendingInvitations.map((inv) => ({
      id: inv.id,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      identifier: inv.identifier,
      recordId: inv.recordId,
      access: inv.access,
    }));

    return OperationResult.Success(
      this.mapWorkPackageToViewModel(wp, userSetting, pending, progress),
    );
  }

  async fetchArchived(
    userId: string,
    id: string,
  ): Promise<OperationResult<WorkPackageViewModel>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const wp = await this.prisma.workPackage.findUnique({
      where: { id },
      include: {
        labels: true,
        members: true,
        objectives: true,
        customFields: { orderBy: { order: 'asc' } },
        userSettings: { where: { userId } },
        lists: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              where: { archivedAt: { not: null }, parentId: null },
              orderBy: { order: 'asc' },
              include: {
                members: true,
                labels: { include: { label: true } },
                subTasks: { select: { id: true, state: true } },
                customFieldValues: true,
                _count: { select: { attachments: true, comments: true } },
              },
            },
          },
        },
      },
    });

    if (!wp) {
      return OperationResult.NotFound();
    }

    // Progress includes all tasks for overall view
    const allTasks = await this.prisma.workPackageTask.findMany({
      where: { packageId: id },
      select: { state: true },
    });
    const progress = this.computeProgress(allTasks);

    const userSetting = wp.userSettings[0]
      ? {
          id: wp.userSettings[0].id,
          createdAt: wp.userSettings[0].createdAt,
          updatedAt: wp.userSettings[0].updatedAt,
          userId: wp.userSettings[0].userId,
          packageId: wp.userSettings[0].packageId,
          projectId: wp.userSettings[0].projectId,
          showTotalCards: wp.userSettings[0].showTotalCards,
          receiveNotification: wp.userSettings[0].receiveNotification,
        }
      : null;

    const pendingInvitations = await this.prisma.pendingInvitation.findMany({
      where: { recordId: id, entityType: 'work_package' },
    });
    const pending: PendingInvitationViewModel[] = pendingInvitations.map((inv) => ({
      id: inv.id,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      identifier: inv.identifier,
      recordId: inv.recordId,
      access: inv.access,
    }));

    return OperationResult.Success(
      this.mapWorkPackageToViewModel(wp, userSetting, pending, progress),
    );
  }

  async edit(
    userId: string,
    id: string,
    dto: EditWorkPackageDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.darkColor !== undefined) data.darkColor = dto.darkColor;
    if (dto.beginAt !== undefined) data.beginAt = parseDate(dto.beginAt, 'beginAt');
    if (dto.endAt !== undefined) data.endAt = parseDate(dto.endAt, 'endAt');

    await this.prisma.workPackage.update({ where: { id }, data });

    const memberIds = await this.getWorkPackageMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageEdit,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        ...data,
      },
      push: {
        title: 'Board updated',
        description: `Board was updated`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async remove(userId: string, id: string): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Owner);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const memberIds = await this.getWorkPackageMemberUserIds(id);

    const wp = await this.prisma.workPackage.findUnique({
      where: { id },
      select: { projectId: true },
    });

    await this.prisma.pendingInvitation.deleteMany({
      where: { recordId: id, entityType: 'work_package' },
    });

    await this.prisma.workPackage.delete({ where: { id } });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageRemove,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        projectId: wp?.projectId || '',
      },
      push: {
        title: 'Board removed',
        description: `Board was removed`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async archive(userId: string, id: string): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const wp = await this.prisma.workPackage.findUnique({ where: { id } });
    if (!wp) {
      return OperationResult.NotFound();
    }

    const isArchived = wp.archivedAt !== null;
    await this.prisma.workPackage.update({
      where: { id },
      data: { archivedAt: isArchived ? null : new Date() },
    });

    const activityType = isArchived
      ? ActivityType.WorkPackageRestore
      : ActivityType.WorkPackageArchive;

    const memberIds = await this.getWorkPackageMemberUserIds(id);
    this.domainEvent.emit({
      type: activityType,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        projectId: wp.projectId,
      },
      push: {
        title: isArchived ? 'Board restored' : 'Board archived',
        description: isArchived ? `Board was restored` : `Board was archived`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async merge(
    userId: string,
    targetId: string,
    sourceId: string,
  ): Promise<OperationResult<boolean>> {
    const hasTargetAccess = await this.verifyWorkPackageAccess(userId, targetId, AccessType.Admin);
    const hasSourceAccess = await this.verifyWorkPackageAccess(userId, sourceId, AccessType.Admin);
    if (!hasTargetAccess || !hasSourceAccess) {
      return OperationResult.NotFound();
    }

    const sourceWp = await this.prisma.workPackage.findUnique({
      where: { id: sourceId },
      include: { lists: { include: { tasks: true } } },
    });

    if (!sourceWp) {
      return OperationResult.NotFound();
    }

    // Determine the max order of existing lists in the target
    const maxListOrder = await this.prisma.workPackageList.aggregate({
      where: { packageId: targetId },
      _max: { order: true },
    });
    let nextListOrder = (maxListOrder._max.order ?? -1) + 1;

    // Move all lists from source to target
    for (const list of sourceWp.lists) {
      await this.prisma.workPackageList.update({
        where: { id: list.id },
        data: { packageId: targetId, order: nextListOrder++ },
      });

      // Update all tasks in this list to reference the target package
      await this.prisma.workPackageTask.updateMany({
        where: { listId: list.id },
        data: { packageId: targetId },
      });
    }

    // Move labels from source to target
    await this.prisma.workPackageLabel.updateMany({
      where: { packageId: sourceId },
      data: { packageId: targetId },
    });

    // Move objectives from source to target
    await this.prisma.workPackageObjective.updateMany({
      where: { packageId: sourceId },
      data: { packageId: targetId, projectId: sourceWp.projectId },
    });

    // Merge members: add source members that are not already in target
    const sourceMembers = await this.prisma.workPackageMember.findMany({
      where: { packageId: sourceId },
    });
    for (const member of sourceMembers) {
      try {
        await this.prisma.workPackageMember.create({
          data: {
            recordId: member.recordId,
            packageId: targetId,
            access: member.access,
            isGroup: member.isGroup,
          },
        });
      } catch {
        // Skip duplicates (unique constraint on [recordId, packageId])
      }
    }

    // Delete the source WP (cascade will clean up remaining relations)
    await this.prisma.pendingInvitation.deleteMany({
      where: { recordId: sourceId, entityType: 'work_package' },
    });
    await this.prisma.workPackage.delete({ where: { id: sourceId } });

    const memberIds = await this.getWorkPackageMemberUserIds(targetId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageMerge,
      actorId: userId,
      entityId: targetId,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id: targetId,
        sourceId,
      },
      push: {
        title: 'Boards merged',
        description: `Boards were merged`,
        url: `/work-package/${targetId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── LISTS ──────────────────────────────────────────────────

  async createList(
    userId: string,
    packageId: string,
    dto: CreateListDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const maxOrder = await this.prisma.workPackageList.aggregate({
      where: { packageId },
      _max: { order: true },
    });

    const list = await this.prisma.workPackageList.create({
      data: {
        packageId,
        title: dto.title,
        color: dto.color || '',
        darkColor: dto.darkColor || false,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageListAdd,
      actorId: userId,
      entityId: list.id,
      entityType: 'list',
      recipientUserIds: memberIds,
      data: {
        id: list.id,
        packageId,
        title: list.title,
      },
      push: {
        title: 'List created',
        description: `List "${list.title}" was created`,
        url: `/work-package/${packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async editList(
    userId: string,
    listId: string,
    dto: EditListDto,
  ): Promise<OperationResult<boolean>> {
    const list = await this.prisma.workPackageList.findUnique({ where: { id: listId } });
    if (!list) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, list.packageId, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.darkColor !== undefined) data.darkColor = dto.darkColor;

    await this.prisma.workPackageList.update({
      where: { id: listId },
      data,
    });

    const memberIds = await this.getWorkPackageMemberUserIds(list.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageListEdit,
      actorId: userId,
      entityId: listId,
      entityType: 'list',
      recipientUserIds: memberIds,
      data: {
        id: listId,
        packageId: list.packageId,
        ...data,
      },
      push: {
        title: 'List updated',
        description: `List "${data.title || list.title}" was updated`,
        url: `/work-package/${list.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async renameList(
    userId: string,
    listId: string,
    dto: { title: string },
  ): Promise<OperationResult<boolean>> {
    return this.editList(userId, listId, { title: dto.title });
  }

  async repositionList(
    userId: string,
    listId: string,
    dto: { order: number },
  ): Promise<OperationResult<boolean>> {
    const list = await this.prisma.workPackageList.findUnique({ where: { id: listId } });
    if (!list) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, list.packageId, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageList.update({
      where: { id: listId },
      data: { order: dto.order },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(list.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageListOrder,
      actorId: userId,
      entityId: listId,
      entityType: 'list',
      recipientUserIds: memberIds,
      data: {
        id: listId,
        packageId: list.packageId,
        order: dto.order,
      },
      push: {
        title: 'List reordered',
        description: `List was repositioned`,
        url: `/work-package/${list.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async cloneList(
    userId: string,
    listId: string,
    dto: { title: string },
  ): Promise<OperationResult<boolean>> {
    const sourceList = await this.prisma.workPackageList.findUnique({
      where: { id: listId },
      include: {
        tasks: {
          where: { archivedAt: null, parentId: null },
          include: {
            members: true,
            labels: true,
          },
        },
      },
    });

    if (!sourceList) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(
      userId,
      sourceList.packageId,
      AccessType.Editor,
    );
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const maxOrder = await this.prisma.workPackageList.aggregate({
      where: { packageId: sourceList.packageId },
      _max: { order: true },
    });

    // Create the new list
    const newList = await this.prisma.workPackageList.create({
      data: {
        packageId: sourceList.packageId,
        title: dto.title,
        color: sourceList.color,
        darkColor: sourceList.darkColor,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    // Clone all tasks from the source list
    for (const task of sourceList.tasks) {
      const newTask = await this.prisma.workPackageTask.create({
        data: {
          userId: task.userId,
          packageId: task.packageId,
          projectId: task.projectId,
          subProjectId: task.subProjectId,
          seasonId: task.seasonId,
          listId: newList.id,
          title: task.title,
          description: task.description,
          order: task.order,
          state: task.state,
          geoLocation: task.geoLocation,
          dueAt: task.dueAt,
          beginAt: task.beginAt,
          endAt: task.endAt,
          beginReminder: task.beginReminder,
          endReminder: task.endReminder,
          estimatedTime: task.estimatedTime,
          voteNecessity: task.voteNecessity,
          objectiveValue: task.objectiveValue,
        },
      });

      // Clone task members
      for (const member of task.members) {
        await this.prisma.taskMember.create({
          data: {
            taskId: newTask.id,
            recordId: member.recordId,
            isGroup: member.isGroup,
            packageId: member.packageId,
          },
        });
      }

      // Clone task labels
      for (const label of task.labels) {
        await this.prisma.taskLabel.create({
          data: {
            taskId: newTask.id,
            labelId: label.labelId,
            packageId: label.packageId,
          },
        });
      }
    }

    const memberIds = await this.getWorkPackageMemberUserIds(sourceList.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageListClone,
      actorId: userId,
      entityId: newList.id,
      entityType: 'list',
      recipientUserIds: memberIds,
      data: {
        id: newList.id,
        packageId: sourceList.packageId,
        sourceListId: listId,
        title: dto.title,
      },
      push: {
        title: 'List cloned',
        description: `List "${dto.title}" was cloned`,
        url: `/work-package/${sourceList.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async archiveList(
    userId: string,
    listId: string,
  ): Promise<OperationResult<boolean>> {
    const list = await this.prisma.workPackageList.findUnique({ where: { id: listId } });
    if (!list) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, list.packageId, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const isArchived = list.archivedAt !== null;
    await this.prisma.workPackageList.update({
      where: { id: listId },
      data: { archivedAt: isArchived ? null : new Date() },
    });

    const activityType = isArchived
      ? ActivityType.WorkPackageListRestore
      : ActivityType.WorkPackageListArchive;

    const memberIds = await this.getWorkPackageMemberUserIds(list.packageId);
    this.domainEvent.emit({
      type: activityType,
      actorId: userId,
      entityId: listId,
      entityType: 'list',
      recipientUserIds: memberIds,
      data: {
        id: listId,
        packageId: list.packageId,
      },
      push: {
        title: isArchived ? 'List restored' : 'List archived',
        description: isArchived ? `List was restored` : `List was archived`,
        url: `/work-package/${list.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async archiveListTasks(
    userId: string,
    listId: string,
  ): Promise<OperationResult<boolean>> {
    const list = await this.prisma.workPackageList.findUnique({ where: { id: listId } });
    if (!list) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, list.packageId, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageTask.updateMany({
      where: { listId, archivedAt: null },
      data: { archivedAt: new Date() },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(list.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageListTasksArchive,
      actorId: userId,
      entityId: listId,
      entityType: 'list',
      recipientUserIds: memberIds,
      data: {
        id: listId,
        packageId: list.packageId,
      },
      push: {
        title: 'List tasks archived',
        description: `All tasks in list were archived`,
        url: `/work-package/${list.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async clearListTasks(
    userId: string,
    listId: string,
  ): Promise<OperationResult<boolean>> {
    const list = await this.prisma.workPackageList.findUnique({ where: { id: listId } });
    if (!list) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, list.packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    // Delete all tasks in the list (cascade will handle sub-records)
    await this.prisma.workPackageTask.deleteMany({
      where: { listId },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(list.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageListTasksDelete,
      actorId: userId,
      entityId: listId,
      entityType: 'list',
      recipientUserIds: memberIds,
      data: {
        id: listId,
        packageId: list.packageId,
      },
      push: {
        title: 'List tasks deleted',
        description: `All tasks in list were deleted`,
        url: `/work-package/${list.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── LABELS ─────────────────────────────────────────────────

  async createLabel(
    userId: string,
    packageId: string,
    dto: CreateLabelDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const label = await this.prisma.workPackageLabel.create({
      data: {
        packageId,
        title: dto.title,
        color: dto.color,
        darkColor: dto.darkColor,
      },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageLabelAdd,
      actorId: userId,
      entityId: label.id,
      entityType: 'label',
      recipientUserIds: memberIds,
      data: {
        id: label.id,
        packageId,
        title: label.title,
        color: label.color,
      },
      push: {
        title: 'Label created',
        description: `Label "${label.title}" was created`,
        url: `/work-package/${packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async renameLabel(
    userId: string,
    labelId: string,
    dto: { title: string; color: string },
  ): Promise<OperationResult<boolean>> {
    const label = await this.prisma.workPackageLabel.findUnique({ where: { id: labelId } });
    if (!label) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, label.packageId, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageLabel.update({
      where: { id: labelId },
      data: { title: dto.title, color: dto.color },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(label.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageLabelRename,
      actorId: userId,
      entityId: labelId,
      entityType: 'label',
      recipientUserIds: memberIds,
      data: {
        id: labelId,
        packageId: label.packageId,
        title: dto.title,
        color: dto.color,
      },
      push: {
        title: 'Label updated',
        description: `Label "${dto.title}" was updated`,
        url: `/work-package/${label.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeLabel(
    userId: string,
    labelId: string,
  ): Promise<OperationResult<boolean>> {
    const label = await this.prisma.workPackageLabel.findUnique({ where: { id: labelId } });
    if (!label) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, label.packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const memberIds = await this.getWorkPackageMemberUserIds(label.packageId);

    await this.prisma.workPackageLabel.delete({ where: { id: labelId } });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageLabelRemove,
      actorId: userId,
      entityId: labelId,
      entityType: 'label',
      recipientUserIds: memberIds,
      data: {
        id: labelId,
        packageId: label.packageId,
      },
      push: {
        title: 'Label removed',
        description: `Label "${label.title}" was removed`,
        url: `/work-package/${label.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── CUSTOM FIELDS ─────────────────────────────────────────

  async createCustomField(
    userId: string,
    packageId: string,
    dto: { title: string; type: number; required?: boolean; options?: string },
  ): Promise<OperationResult<any>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Editor);
    if (!hasAccess) return OperationResult.NotFound();

    const maxOrder = await this.prisma.customField.count({ where: { packageId } });

    const field = await this.prisma.customField.create({
      data: {
        packageId,
        title: dto.title,
        type: dto.type,
        required: dto.required ?? false,
        options: dto.options,
        order: maxOrder,
      },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageCustomFieldAdd,
      actorId: userId,
      entityId: field.id,
      entityType: 'custom-field',
      recipientUserIds: memberIds,
      data: {
        id: field.id,
        packageId,
        title: field.title,
        type: field.type,
        required: field.required,
        options: field.options,
        order: field.order,
      },
      push: {
        title: 'Custom field added',
        description: `Custom field "${field.title}" was added`,
        url: `/work-package/${packageId}`,
      },
    });

    return OperationResult.Success({
      id: field.id,
      packageId,
      title: field.title,
      type: field.type,
      required: field.required,
      options: field.options,
      order: field.order,
    });
  }

  async editCustomField(
    userId: string,
    fieldId: string,
    dto: { title?: string; type?: number; required?: boolean; options?: string },
  ): Promise<OperationResult<boolean>> {
    const field = await this.prisma.customField.findUnique({ where: { id: fieldId } });
    if (!field) return OperationResult.NotFound();

    const hasAccess = await this.verifyWorkPackageAccess(userId, field.packageId, AccessType.Editor);
    if (!hasAccess) return OperationResult.NotFound();

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.required !== undefined) data.required = dto.required;
    if (dto.options !== undefined) data.options = dto.options;

    await this.prisma.customField.update({ where: { id: fieldId }, data });

    const memberIds = await this.getWorkPackageMemberUserIds(field.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageCustomFieldEdit,
      actorId: userId,
      entityId: fieldId,
      entityType: 'custom-field',
      recipientUserIds: memberIds,
      data: {
        id: fieldId,
        packageId: field.packageId,
        ...data,
      },
      push: {
        title: 'Custom field updated',
        description: `Custom field was updated`,
        url: `/work-package/${field.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeCustomField(
    userId: string,
    fieldId: string,
  ): Promise<OperationResult<boolean>> {
    const field = await this.prisma.customField.findUnique({ where: { id: fieldId } });
    if (!field) return OperationResult.NotFound();

    const hasAccess = await this.verifyWorkPackageAccess(userId, field.packageId, AccessType.Admin);
    if (!hasAccess) return OperationResult.NotFound();

    const memberIds = await this.getWorkPackageMemberUserIds(field.packageId);

    await this.prisma.customField.delete({ where: { id: fieldId } });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageCustomFieldRemove,
      actorId: userId,
      entityId: fieldId,
      entityType: 'custom-field',
      recipientUserIds: memberIds,
      data: {
        id: fieldId,
        packageId: field.packageId,
      },
      push: {
        title: 'Custom field removed',
        description: `Custom field "${field.title}" was removed`,
        url: `/work-package/${field.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async reorderCustomFields(
    userId: string,
    packageId: string,
    dto: { fields: { id: string; order: number }[] },
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Editor);
    if (!hasAccess) return OperationResult.NotFound();

    for (const item of dto.fields) {
      await this.prisma.customField.update({
        where: { id: item.id },
        data: { order: item.order },
      });
    }

    return OperationResult.Success(true);
  }

  // ─── OBJECTIVES ─────────────────────────────────────────────

  async createObjective(
    userId: string,
    packageId: string,
    dto: { title: string; description: string; type: number },
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const workPackage = await this.prisma.workPackage.findUnique({
      where: { id: packageId },
      select: { projectId: true },
    });
    if (!workPackage) {
      return OperationResult.NotFound();
    }

    const objective = await this.prisma.workPackageObjective.create({
      data: {
        packageId,
        projectId: workPackage.projectId,
        title: dto.title,
        description: dto.description || '',
        type: dto.type,
      },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageObjectiveAdd,
      actorId: userId,
      entityId: objective.id,
      entityType: 'objective',
      recipientUserIds: memberIds,
      data: {
        id: objective.id,
        packageId,
        title: objective.title,
      },
      push: {
        title: 'Objective added',
        description: `Objective "${objective.title}" was added`,
        url: `/work-package/${packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async editObjective(
    userId: string,
    objectiveId: string,
    dto: { title?: string; description?: string; type?: number },
  ): Promise<OperationResult<boolean>> {
    const objective = await this.prisma.workPackageObjective.findUnique({
      where: { id: objectiveId },
    });
    if (!objective) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, objective.packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;

    await this.prisma.workPackageObjective.update({
      where: { id: objectiveId },
      data,
    });

    const memberIds = await this.getWorkPackageMemberUserIds(objective.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageObjectiveEdit,
      actorId: userId,
      entityId: objectiveId,
      entityType: 'objective',
      recipientUserIds: memberIds,
      data: {
        id: objectiveId,
        packageId: objective.packageId,
        ...data,
      },
      push: {
        title: 'Objective updated',
        description: `Objective was updated`,
        url: `/work-package/${objective.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async deleteObjective(
    userId: string,
    objectiveId: string,
  ): Promise<OperationResult<boolean>> {
    const objective = await this.prisma.workPackageObjective.findUnique({
      where: { id: objectiveId },
    });
    if (!objective) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, objective.packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const memberIds = await this.getWorkPackageMemberUserIds(objective.packageId);

    await this.prisma.workPackageObjective.delete({ where: { id: objectiveId } });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageObjectiveRemove,
      actorId: userId,
      entityId: objectiveId,
      entityType: 'objective',
      recipientUserIds: memberIds,
      data: {
        id: objectiveId,
        packageId: objective.packageId,
      },
      push: {
        title: 'Objective removed',
        description: `Objective "${objective.title}" was removed`,
        url: `/work-package/${objective.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── ACCESS MANAGEMENT ─────────────────────────────────────

  async addAccess(
    userId: string,
    packageId: string,
    dto: AddAccessDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const wp = await this.prisma.workPackage.findUnique({
      where: { id: packageId },
      select: { projectId: true },
    });
    if (!wp) {
      return OperationResult.NotFound();
    }

    for (const entry of dto.members) {
      if (entry.isGroup) {
        // For groups: add the group record as a WP member
        try {
          await this.prisma.workPackageMember.create({
            data: {
              recordId: entry.id,
              packageId,
              access: entry.access,
              isGroup: true,
            },
          });
        } catch {
          // Skip duplicates
        }
      } else {
        // Try to find user by ID
        const user = await this.prisma.user.findUnique({
          where: { id: entry.id },
        });

        if (user) {
          try {
            await this.prisma.workPackageMember.create({
              data: {
                recordId: user.id,
                packageId,
                access: entry.access,
                isGroup: false,
              },
            });
          } catch {
            // Skip duplicates
          }
        } else {
          // Try by email/username
          const existingUser = await this.prisma.user.findFirst({
            where: {
              OR: [{ email: entry.id }, { username: entry.id }],
            },
          });

          if (existingUser) {
            try {
              await this.prisma.workPackageMember.create({
                data: {
                  recordId: existingUser.id,
                  packageId,
                  access: entry.access,
                  isGroup: false,
                },
              });
            } catch {
              // Skip duplicates
            }
          } else {
            // Create pending invitation
            await this.prisma.pendingInvitation.create({
              data: {
                identifier: entry.id,
                recordId: packageId,
                access: entry.access,
                entityType: 'work_package',
              },
            });
          }
        }
      }
    }

    const memberIds = await this.getWorkPackageMemberUserIds(packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageMemberAdd,
      actorId: userId,
      entityId: packageId,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id: packageId,
      },
      push: {
        title: 'Member added',
        description: `Members were added to the board`,
        url: `/work-package/${packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async changeAccess(
    userId: string,
    memberId: string,
    dto: { access: number },
  ): Promise<OperationResult<boolean>> {
    const member = await this.prisma.workPackageMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, member.packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackageMember.update({
      where: { id: memberId },
      data: { access: dto.access },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(member.packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageMemberPermission,
      actorId: userId,
      entityId: member.packageId,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id: member.packageId,
        memberId,
        access: dto.access,
      },
      push: {
        title: 'Member permission changed',
        description: `Member permission was updated`,
        url: `/work-package/${member.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeAccess(
    userId: string,
    memberId: string,
  ): Promise<OperationResult<boolean>> {
    const member = await this.prisma.workPackageMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, member.packageId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    // Prevent removing the owner
    if (member.access === AccessType.Owner) {
      return OperationResult.Rejected();
    }

    const memberIds = await this.getWorkPackageMemberUserIds(member.packageId);

    await this.prisma.workPackageMember.delete({ where: { id: memberId } });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageMemberRemove,
      actorId: userId,
      entityId: member.packageId,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id: member.packageId,
        memberId,
      },
      push: {
        title: 'Member removed',
        description: `Member was removed from the board`,
        url: `/work-package/${member.packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async changePendingAccess(
    userId: string,
    invitationId: string,
    dto: { access: number },
  ): Promise<OperationResult<boolean>> {
    const invitation = await this.prisma.pendingInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.entityType !== 'work_package') {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, invitation.recordId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.pendingInvitation.update({
      where: { id: invitationId },
      data: { access: dto.access },
    });

    return OperationResult.Success(true);
  }

  async removePendingAccess(
    userId: string,
    invitationId: string,
  ): Promise<OperationResult<boolean>> {
    const invitation = await this.prisma.pendingInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.entityType !== 'work_package') {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyWorkPackageAccess(userId, invitation.recordId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.pendingInvitation.delete({ where: { id: invitationId } });

    return OperationResult.Success(true);
  }

  // ─── SETTINGS & PERMISSIONS ─────────────────────────────────

  async updateSetting(
    userId: string,
    id: string,
    dto: {
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
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.allowMembers !== undefined) data.allowMembers = dto.allowMembers;
    if (dto.allowLabels !== undefined) data.allowLabels = dto.allowLabels;
    if (dto.allowAttachment !== undefined) data.allowAttachment = dto.allowAttachment;
    if (dto.allowComments !== undefined) data.allowComments = dto.allowComments;
    if (dto.allowCustomField !== undefined) data.allowCustomField = dto.allowCustomField;
    if (dto.allowEndAt !== undefined) data.allowEndAt = dto.allowEndAt;
    if (dto.allowEstimatedTime !== undefined) data.allowEstimatedTime = dto.allowEstimatedTime;
    if (dto.allowGeoLocation !== undefined) data.allowGeoLocation = dto.allowGeoLocation;
    if (dto.allowPoll !== undefined) data.allowPoll = dto.allowPoll;
    if (dto.allowSegments !== undefined) data.allowSegments = dto.allowSegments;
    if (dto.allowState !== undefined) data.allowState = dto.allowState;
    if (dto.allowTimeSpent !== undefined) data.allowTimeSpent = dto.allowTimeSpent;
    if (dto.allowBlockingBoardTasks !== undefined) data.allowBlockingBoardTasks = dto.allowBlockingBoardTasks;

    if (Object.keys(data).length > 0) {
      await this.prisma.workPackage.update({ where: { id }, data });
    }

    const memberIds = await this.getWorkPackageMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageSetting,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        ...data,
      },
      push: {
        title: 'Settings updated',
        description: `Board settings were updated`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async updateUserSetting(
    userId: string,
    packageId: string,
    dto: { showTotalCards?: boolean; receiveNotification?: number },
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const wp = await this.prisma.workPackage.findUnique({
      where: { id: packageId },
      select: { projectId: true },
    });
    if (!wp) {
      return OperationResult.NotFound();
    }

    const updateData: Record<string, unknown> = {};
    if (dto.showTotalCards !== undefined) updateData.showTotalCards = dto.showTotalCards;
    if (dto.receiveNotification !== undefined) updateData.receiveNotification = dto.receiveNotification;

    await this.prisma.workPackageUserSetting.upsert({
      where: { userId_packageId: { userId, packageId } },
      update: updateData,
      create: {
        userId,
        packageId,
        projectId: wp.projectId,
        showTotalCards: dto.showTotalCards ?? true,
        receiveNotification: dto.receiveNotification ?? 1,
      },
    });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageUserSetting,
      actorId: userId,
      entityId: packageId,
      entityType: 'work-package',
      recipientUserIds: [userId],
      data: { id: packageId },
    });

    return OperationResult.Success(true);
  }

  async updateOrder(
    userId: string,
    id: string,
    dto: { order: number },
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Editor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.workPackage.update({
      where: { id },
      data: { order: dto.order },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageEdit,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        order: dto.order,
      },
      push: {
        title: 'Board updated',
        description: `Board order was updated`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async updateSortOrders(
    userId: string,
    id: string,
    dto: {
      listsSort?: number;
      tasksSort?: number;
      subTasksSort?: number;
      attachmentsSort?: number;
    },
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.listsSort !== undefined) data.listsSort = dto.listsSort;
    if (dto.tasksSort !== undefined) data.tasksSort = dto.tasksSort;
    if (dto.subTasksSort !== undefined) data.subTasksSort = dto.subTasksSort;
    if (dto.attachmentsSort !== undefined) data.attachmentsSort = dto.attachmentsSort;

    if (Object.keys(data).length > 0) {
      await this.prisma.workPackage.update({ where: { id }, data });
    }

    const memberIds = await this.getWorkPackageMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageSetting,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        ...data,
      },
      push: {
        title: 'Settings updated',
        description: `Board sort orders were updated`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async updatePermissions(
    userId: string,
    id: string,
    dto: {
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
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.permissionComment !== undefined) data.permissionComment = dto.permissionComment;
    if (dto.permissionEditAttachment !== undefined) data.permissionEditAttachment = dto.permissionEditAttachment;
    if (dto.permissionCreateAttachment !== undefined) data.permissionCreateAttachment = dto.permissionCreateAttachment;
    if (dto.permissionAssignMembers !== undefined) data.permissionAssignMembers = dto.permissionAssignMembers;
    if (dto.permissionAssignLabels !== undefined) data.permissionAssignLabels = dto.permissionAssignLabels;
    if (dto.permissionChangeTaskState !== undefined) data.permissionChangeTaskState = dto.permissionChangeTaskState;
    if (dto.permissionEditTask !== undefined) data.permissionEditTask = dto.permissionEditTask;
    if (dto.permissionArchiveTask !== undefined) data.permissionArchiveTask = dto.permissionArchiveTask;
    if (dto.permissionCreateTask !== undefined) data.permissionCreateTask = dto.permissionCreateTask;
    if (dto.permissionArchiveList !== undefined) data.permissionArchiveList = dto.permissionArchiveList;
    if (dto.permissionEditList !== undefined) data.permissionEditList = dto.permissionEditList;
    if (dto.permissionCreateList !== undefined) data.permissionCreateList = dto.permissionCreateList;
    if (dto.permissionClearList !== undefined) data.permissionClearList = dto.permissionClearList;

    if (Object.keys(data).length > 0) {
      await this.prisma.workPackage.update({ where: { id }, data });
    }

    const memberIds = await this.getWorkPackageMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageSetting,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        ...data,
      },
      push: {
        title: 'Settings updated',
        description: `Board permissions were updated`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── LEAVE / UPGRADE / CONNECT ──────────────────────────────

  async leave(userId: string, id: string): Promise<OperationResult<boolean>> {
    const member = await this.prisma.workPackageMember.findUnique({
      where: { recordId_packageId: { recordId: userId, packageId: id } },
    });
    if (!member) {
      return OperationResult.NotFound();
    }

    // Owners cannot leave their own WP
    if (member.access === AccessType.Owner) {
      return OperationResult.Rejected();
    }

    const memberIds = await this.getWorkPackageMemberUserIds(id);

    await this.prisma.workPackageMember.delete({ where: { id: member.id } });

    this.domainEvent.emit({
      type: ActivityType.WorkPackageMemberRemove,
      actorId: userId,
      entityId: id,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id,
        memberId: member.id,
        userId,
      },
      push: {
        title: 'Member removed',
        description: `Member left the board`,
        url: `/work-package/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async upgrade(userId: string, id: string): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, id, AccessType.Owner);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    // Mock: billing integration placeholder
    this.logger.log(`Work package upgrade requested: ${id} by user: ${userId}`);

    return OperationResult.Success(true);
  }

  async connect(
    userId: string,
    packageId: string,
    targetProjectId: string,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyWorkPackageAccess(userId, packageId, AccessType.Owner);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    // Verify the user has access to the target project
    const hasProjectAccess = await this.verifyProjectAccess(userId, targetProjectId, AccessType.Admin);
    if (!hasProjectAccess) {
      return OperationResult.NotFound();
    }

    const wp = await this.prisma.workPackage.findUnique({
      where: { id: packageId },
      select: { projectId: true },
    });
    if (!wp) {
      return OperationResult.NotFound();
    }

    const oldProjectId = wp.projectId;

    // Move the WP to the target project
    await this.prisma.workPackage.update({
      where: { id: packageId },
      data: { projectId: targetProjectId },
    });

    // Update project references on all tasks in this WP
    await this.prisma.workPackageTask.updateMany({
      where: { packageId },
      data: { projectId: targetProjectId },
    });

    // Update the user settings project reference
    await this.prisma.workPackageUserSetting.updateMany({
      where: { packageId },
      data: { projectId: targetProjectId },
    });

    const memberIds = await this.getWorkPackageMemberUserIds(packageId);
    this.domainEvent.emit({
      type: ActivityType.WorkPackageConnect,
      actorId: userId,
      entityId: packageId,
      entityType: 'work-package',
      recipientUserIds: memberIds,
      data: {
        id: packageId,
        oldProjectId,
        projectId: targetProjectId,
      },
      push: {
        title: 'Board connected',
        description: `Board was connected to a new project`,
        url: `/work-package/${packageId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── PROJECT ACCESS HELPER ──────────────────────────────────

  private async verifyProjectAccess(
    userId: string,
    projectId: string,
    minAccess: AccessType = AccessType.Editor,
  ): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return false;

    if (project.userId === userId) return true;

    const membership = await this.prisma.projectMember.findUnique({
      where: { recordId_projectId: { recordId: userId, projectId } },
    });
    if (!membership) return false;

    return membership.access <= minAccess;
  }
}
