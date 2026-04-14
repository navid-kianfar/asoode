import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { DomainEventService } from '../../common/services/domain-event.service';
import {
  AccessType,
  ActivityType,
  ChannelType,
  OperationResult,
  CreateProjectDto,
  EditProjectDto,
  CreateSubProjectDto,
  CreateSeasonDto,
  AddAccessDto,
  ProjectViewModel,
  ProjectMemberViewModel,
  ProjectSeasonViewModel,
  SubProjectViewModel,
  ProjectProgressViewModel,
  TreeViewModel,
  TreeReportViewModel,
  RoadMapViewModel,
  WorkPackageObjectiveViewModel,
  ProjectObjectiveEstimatedPriceViewModel,
  PendingInvitationViewModel,
  MemberInfoViewModel,
  WorkPackageTaskState,
  BoardTemplate,
} from '@asoode/shared';
import { MessengerService } from '../messenger/messenger.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvent: DomainEventService,
    private readonly messengerService: MessengerService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────

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

  private async getProjectMemberUserIds(projectId: string): Promise<string[]> {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId, isGroup: false },
      select: { recordId: true },
    });
    return members.map((m) => m.recordId);
  }

  // ─── PROJECT CRUD ─────────────────────────────────────────

  async list(userId: string): Promise<ProjectViewModel[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        archivedAt: null,
        OR: [
          { userId },
          { members: { some: { recordId: userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, avatar: true, firstName: true, lastName: true, username: true, bio: true },
            },
          },
        },
        seasons: true,
        subProjects: { orderBy: { order: 'asc' } },
        workPackages: { where: { archivedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projectIds = projects.map((p) => p.id);
    const pendingInvitations = await this.prisma.pendingInvitation.findMany({
      where: { recordId: { in: projectIds }, entityType: 'project' },
    });
    const pendingMap = new Map<string, PendingInvitationViewModel[]>();
    for (const inv of pendingInvitations) {
      const list = pendingMap.get(inv.recordId) || [];
      list.push({
        id: inv.id,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        identifier: inv.identifier,
        recordId: inv.recordId,
        access: inv.access,
      });
      pendingMap.set(inv.recordId, list);
    }

    return projects.map((p) => this.mapProjectToViewModel(p, pendingMap.get(p.id) || []));
  }

  async archived(userId: string): Promise<ProjectViewModel[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        archivedAt: { not: null },
        OR: [
          { userId },
          { members: { some: { recordId: userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, avatar: true, firstName: true, lastName: true, username: true, bio: true },
            },
          },
        },
        seasons: true,
        subProjects: { orderBy: { order: 'asc' } },
        workPackages: { where: { archivedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projectIds = projects.map((p) => p.id);
    const pendingInvitations = await this.prisma.pendingInvitation.findMany({
      where: { recordId: { in: projectIds }, entityType: 'project' },
    });
    const pendingMap = new Map<string, PendingInvitationViewModel[]>();
    for (const inv of pendingInvitations) {
      const list = pendingMap.get(inv.recordId) || [];
      list.push({
        id: inv.id,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        identifier: inv.identifier,
        recordId: inv.recordId,
        access: inv.access,
      });
      pendingMap.set(inv.recordId, list);
    }

    return projects.map((p) => this.mapProjectToViewModel(p, pendingMap.get(p.id) || []));
  }

  async fetch(userId: string, id: string): Promise<OperationResult<ProjectViewModel>> {
    const hasAccess = await this.verifyProjectAccess(userId, id, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, avatar: true, firstName: true, lastName: true, username: true, bio: true },
            },
          },
        },
        seasons: true,
        subProjects: { orderBy: { order: 'asc' } },
        workPackages: {
          where: { archivedAt: null },
          include: {
            members: true,
            labels: true,
            lists: { orderBy: { order: 'asc' } },
            objectives: true,
            userSettings: { where: { userId } },
          },
        },
      },
    });

    if (!project) {
      return OperationResult.NotFound();
    }

    const pendingInvitations = await this.prisma.pendingInvitation.findMany({
      where: { recordId: id, entityType: 'project' },
    });
    const pending: PendingInvitationViewModel[] = pendingInvitations.map((inv) => ({
      id: inv.id,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      identifier: inv.identifier,
      recordId: inv.recordId,
      access: inv.access,
    }));

    return OperationResult.Success(this.mapProjectToViewModel(project, pending));
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectViewModel | undefined> {
    const project = await this.prisma.project.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description || '',
        complex: dto.complex,
        groupId: dto.groupId || null,
        template: 0,
      },
    });

    await this.prisma.projectMember.create({
      data: {
        recordId: userId,
        projectId: project.id,
        access: AccessType.Owner,
        isGroup: false,
      },
    });

    // For simple projects, create a default workpackage
    if (!dto.complex) {
      const wp = await this.prisma.workPackage.create({
        data: {
          userId,
          projectId: project.id,
          title: project.title,
          description: '',
          boardTemplate: BoardTemplate.Kanban,
          order: 0,
        },
      });

      // Add creator as WP member
      await this.prisma.workPackageMember.create({
        data: {
          recordId: userId,
          packageId: wp.id,
          access: AccessType.Owner,
          isGroup: false,
        },
      });

      // Create default lists: Backlog, To Do, In Progress, Done
      const lists = ['Backlog', 'To Do', 'In Progress', 'Done'];
      for (let i = 0; i < lists.length; i++) {
        await this.prisma.workPackageList.create({
          data: {
            packageId: wp.id,
            title: lists[i],
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
    }

    // Auto-create a channel for this project
    await this.messengerService.createEntityChannel(
      userId,
      ChannelType.Project,
      project.id,
      project.title,
      [userId],
      dto.complex, // active if complex, inactive if simple
    );

    const memberIds = await this.getProjectMemberUserIds(project.id);
    this.domainEvent.emit({
      type: ActivityType.ProjectAdd,
      actorId: userId,
      entityId: project.id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id: project.id,
        title: project.title,
      },
      push: {
        title: 'Project created',
        description: `Project "${project.title}" was created`,
        url: `/project/${project.id}`,
      },
    });

    const result = await this.fetch(userId, project.id);
    return result.data;
  }

  async edit(userId: string, id: string, dto: EditProjectDto): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyProjectAccess(userId, id, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;

    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) return OperationResult.NotFound();

    // If converting from simple to complex
    if (dto.complex === true && !project.complex) {
      data.complex = true;
      // Activate the project channel
      await this.prisma.channel.updateMany({
        where: { rootId: id, type: ChannelType.Project },
        data: { active: true },
      });
    }

    await this.prisma.project.update({ where: { id }, data });

    const memberIds = await this.getProjectMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.ProjectEdit,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id,
        ...data,
      },
      push: {
        title: 'Project updated',
        description: `Project was updated`,
        url: `/project/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async remove(userId: string, id: string): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyProjectAccess(userId, id, AccessType.Owner);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const memberIds = await this.getProjectMemberUserIds(id);

    const workPackages = await this.prisma.workPackage.findMany({
      where: { projectId: id },
      select: { id: true },
    });
    const wpIds = workPackages.map((wp) => wp.id);

    const tasks = await this.prisma.workPackageTask.findMany({
      where: { packageId: { in: wpIds } },
      select: { id: true },
    });
    const taskIds = tasks.map((t) => t.id);

    const workflows = await this.prisma.workflow.findMany({
      where: { projectId: id },
      select: { id: true },
    });
    const workflowIds = workflows.map((w) => w.id);

    const allEntityIds = [id, ...wpIds, ...taskIds, ...workflowIds];

    // Cleanup messenger channels and messages
    await this.messengerService.deleteEntityChannels(allEntityIds);

    // Cleanup activity logs for project, work packages, tasks and workflows
    await this.prisma.activityLog.deleteMany({
      where: {
        OR: [
          { entityId: { in: allEntityIds } },
          { taskId: { in: taskIds } },
        ],
      },
    });

    // Cleanup pending invitations for project and work packages
    await this.prisma.pendingInvitation.deleteMany({
      where: { recordId: { in: [id, ...wpIds] } },
    });

    // Finally delete the project (this triggers cascades for other related tables)
    await this.prisma.project.delete({ where: { id } });

    this.domainEvent.emit({
      type: ActivityType.ProjectRemove,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: { id },
      push: {
        title: 'Project removed',
        description: `Project was removed`,
        url: `/project/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  async archive(userId: string, id: string): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyProjectAccess(userId, id, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      return OperationResult.NotFound();
    }

    const isArchived = project.archivedAt !== null;
    await this.prisma.project.update({
      where: { id },
      data: { archivedAt: isArchived ? null : new Date() },
    });

    const activityType = isArchived ? ActivityType.ProjectRestore : ActivityType.ProjectArchive;

    const memberIds = await this.getProjectMemberUserIds(id);
    this.domainEvent.emit({
      type: activityType,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: { id },
      push: {
        title: isArchived ? 'Project restored' : 'Project archived',
        description: isArchived ? `Project was restored` : `Project was archived`,
        url: `/project/${id}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── SUB-PROJECTS ────────────────────────────────────────

  async createSubProject(
    userId: string,
    projectId: string,
    dto: CreateSubProjectDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    let level = 0;
    if (dto.parentId) {
      const parent = await this.prisma.subProject.findUnique({
        where: { id: dto.parentId },
      });
      if (parent) level = parent.level + 1;
    }

    const maxOrder = await this.prisma.subProject.aggregate({
      where: { projectId, parentId: dto.parentId || null },
      _max: { order: true },
    });

    const subProject = await this.prisma.subProject.create({
      data: {
        userId,
        projectId,
        parentId: dto.parentId || null,
        title: dto.title,
        description: dto.description || '',
        level,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    const memberIds = await this.getProjectMemberUserIds(projectId);
    this.domainEvent.emit({
      type: ActivityType.ProjectSubAdd,
      actorId: userId,
      entityId: subProject.id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id: subProject.id,
        projectId,
        title: subProject.title,
      },
      push: {
        title: 'Sub-project created',
        description: `Sub-project "${subProject.title}" was created`,
        url: `/project/${projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async editSubProject(
    userId: string,
    id: string,
    dto: { title?: string; description?: string },
  ): Promise<OperationResult<boolean>> {
    const subProject = await this.prisma.subProject.findUnique({ where: { id } });
    if (!subProject) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, subProject.projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;

    await this.prisma.subProject.update({ where: { id }, data });

    const memberIds = await this.getProjectMemberUserIds(subProject.projectId);
    this.domainEvent.emit({
      type: ActivityType.ProjectSubEdit,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id,
        projectId: subProject.projectId,
        ...data,
      },
      push: {
        title: 'Sub-project updated',
        description: `Sub-project was updated`,
        url: `/project/${subProject.projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeSubProject(userId: string, id: string): Promise<OperationResult<boolean>> {
    const subProject = await this.prisma.subProject.findUnique({ where: { id } });
    if (!subProject) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, subProject.projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const memberIds = await this.getProjectMemberUserIds(subProject.projectId);

    await this.prisma.subProject.delete({ where: { id } });

    this.domainEvent.emit({
      type: ActivityType.ProjectSubRemove,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id,
        projectId: subProject.projectId,
      },
      push: {
        title: 'Sub-project removed',
        description: `Sub-project was removed`,
        url: `/project/${subProject.projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async orderSubProject(
    userId: string,
    id: string,
    dto: { order: number },
  ): Promise<OperationResult<boolean>> {
    const subProject = await this.prisma.subProject.findUnique({ where: { id } });
    if (!subProject) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, subProject.projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.subProject.update({
      where: { id },
      data: { order: dto.order },
    });

    const memberIds = await this.getProjectMemberUserIds(subProject.projectId);
    this.domainEvent.emit({
      type: ActivityType.ProjectSubEdit,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id,
        projectId: subProject.projectId,
        order: dto.order,
      },
      push: {
        title: 'Sub-project updated',
        description: `Sub-project order was updated`,
        url: `/project/${subProject.projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── SEASONS ──────────────────────────────────────────────

  async createSeason(
    userId: string,
    projectId: string,
    dto: CreateSeasonDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const season = await this.prisma.projectSeason.create({
      data: {
        userId,
        projectId,
        title: dto.title,
        description: dto.description || '',
      },
    });

    const memberIds = await this.getProjectMemberUserIds(projectId);
    this.domainEvent.emit({
      type: ActivityType.ProjectSeasonAdd,
      actorId: userId,
      entityId: season.id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id: season.id,
        projectId,
        title: season.title,
      },
      push: {
        title: 'Season created',
        description: `Season "${season.title}" was created`,
        url: `/project/${projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async editSeason(
    userId: string,
    id: string,
    dto: { title?: string; description?: string },
  ): Promise<OperationResult<boolean>> {
    const season = await this.prisma.projectSeason.findUnique({ where: { id } });
    if (!season) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, season.projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;

    await this.prisma.projectSeason.update({ where: { id }, data });

    const memberIds = await this.getProjectMemberUserIds(season.projectId);
    this.domainEvent.emit({
      type: ActivityType.ProjectSeasonEdit,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id,
        projectId: season.projectId,
        ...data,
      },
      push: {
        title: 'Season updated',
        description: `Season was updated`,
        url: `/project/${season.projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeSeason(userId: string, id: string): Promise<OperationResult<boolean>> {
    const season = await this.prisma.projectSeason.findUnique({ where: { id } });
    if (!season) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, season.projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const memberIds = await this.getProjectMemberUserIds(season.projectId);

    await this.prisma.projectSeason.delete({ where: { id } });

    this.domainEvent.emit({
      type: ActivityType.ProjectSeasonRemove,
      actorId: userId,
      entityId: id,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id,
        projectId: season.projectId,
      },
      push: {
        title: 'Season removed',
        description: `Season was removed`,
        url: `/project/${season.projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── ACCESS MANAGEMENT ───────────────────────────────────

  async addAccess(
    userId: string,
    projectId: string,
    dto: AddAccessDto,
  ): Promise<OperationResult<boolean>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    for (const member of dto.members) {
      try {
        await this.prisma.projectMember.create({
          data: {
            recordId: member.id,
            projectId,
            access: member.access,
            isGroup: member.isGroup,
          },
        });
      } catch (error) {
        // Skip duplicates (unique constraint violation)
        this.logger.warn(`Failed to add member ${member.id} to project ${projectId}: ${error}`);
      }
    }

    // Update membersUsed count
    const memberCount = await this.prisma.projectMember.count({
      where: { projectId },
    });
    await this.prisma.project.update({
      where: { id: projectId },
      data: { membersUsed: memberCount },
    });

    const memberIds = await this.getProjectMemberUserIds(projectId);
    this.domainEvent.emit({
      type: ActivityType.ProjectMemberAdd,
      actorId: userId,
      entityId: projectId,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id: projectId,
      },
      push: {
        title: 'Member added to project',
        description: `A member was added to the project`,
        url: `/project/${projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async changeAccess(
    userId: string,
    memberId: string,
    dto: { access: number },
  ): Promise<OperationResult<boolean>> {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, member.projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    if (dto.access === AccessType.Owner) {
      // Must be root owner to transfer ownership
      const project = await this.prisma.project.findUnique({ where: { id: member.projectId } });
      if (!project || project.userId !== userId) {
        return OperationResult.Rejected();
      }

      // 1. Update Project record's userId (Root Owner)
      await this.prisma.project.update({
        where: { id: member.projectId },
        data: { userId: member.recordId },
      });

      // 2. Downgrade previous owner's member record to Admin
      await this.prisma.projectMember.updateMany({
        where: { projectId: member.projectId, recordId: userId },
        data: { access: AccessType.Admin },
      });
    }

    await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { access: dto.access },
    });

    const memberIds = await this.getProjectMemberUserIds(member.projectId);
    this.domainEvent.emit({
      type: ActivityType.ProjectMemberPermission,
      actorId: userId,
      entityId: member.projectId,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id: member.projectId,
        memberId,
        access: dto.access,
      },
      push: {
        title: 'Permission updated',
        description: `Member permission was updated`,
        url: `/project/${member.projectId}`,
      },
    });

    return OperationResult.Success(true);
  }

  async removeAccess(userId: string, memberId: string): Promise<OperationResult<boolean>> {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, member.projectId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    // Prevent removing the owner
    if (member.access === AccessType.Owner) {
      return OperationResult.Rejected();
    }

    const memberIds = await this.getProjectMemberUserIds(member.projectId);

    await this.prisma.projectMember.delete({ where: { id: memberId } });

    // Update membersUsed count
    const memberCount = await this.prisma.projectMember.count({
      where: { projectId: member.projectId },
    });
    await this.prisma.project.update({
      where: { id: member.projectId },
      data: { membersUsed: memberCount },
    });

    this.domainEvent.emit({
      type: ActivityType.ProjectMemberRemove,
      actorId: userId,
      entityId: member.projectId,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        id: member.projectId,
        memberId,
      },
      push: {
        title: 'Member removed from project',
        description: `A member was removed from the project`,
        url: `/project/${member.projectId}`,
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
    if (!invitation || invitation.entityType !== 'project') {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, invitation.recordId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.pendingInvitation.update({
      where: { id: invitationId },
      data: { access: dto.access },
    });

    const memberIds = await this.getProjectMemberUserIds(invitation.recordId);
    this.domainEvent.emit({
      type: ActivityType.ProjectPendingAccessChange,
      actorId: userId,
      entityId: invitation.recordId,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        invitationId,
        projectId: invitation.recordId,
        access: dto.access,
      },
      push: {
        title: 'Pending access updated',
        description: `Pending invitation access was updated`,
        url: `/project/${invitation.recordId}`,
      },
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
    if (!invitation || invitation.entityType !== 'project') {
      return OperationResult.NotFound();
    }

    const hasAccess = await this.verifyProjectAccess(userId, invitation.recordId, AccessType.Admin);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    await this.prisma.pendingInvitation.delete({ where: { id: invitationId } });

    const memberIds = await this.getProjectMemberUserIds(invitation.recordId);
    this.domainEvent.emit({
      type: ActivityType.ProjectPendingAccessRemove,
      actorId: userId,
      entityId: invitation.recordId,
      entityType: 'project',
      recipientUserIds: memberIds,
      data: {
        invitationId,
        projectId: invitation.recordId,
      },
      push: {
        title: 'Pending access removed',
        description: `Pending invitation was removed`,
        url: `/project/${invitation.recordId}`,
      },
    });

    return OperationResult.Success(true);
  }

  // ─── REPORTS & ANALYTICS ─────────────────────────────────

  async objectives(
    userId: string,
    projectId: string,
  ): Promise<OperationResult<WorkPackageObjectiveViewModel[]>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const objectives = await this.prisma.workPackageObjective.findMany({
      where: { projectId },
      include: {
        workPackage: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result: WorkPackageObjectiveViewModel[] = objectives.map((obj) => ({
      id: obj.id,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      type: obj.type,
      title: obj.title,
      description: obj.description,
      workPackage: obj.workPackage.title,
    }));

    return OperationResult.Success(result);
  }

  async objectivesDetail(
    userId: string,
    projectId: string,
  ): Promise<OperationResult<ProjectObjectiveEstimatedPriceViewModel[]>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const workPackages = await this.prisma.workPackage.findMany({
      where: { projectId },
      select: { id: true },
    });
    const packageIds = workPackages.map((wp) => wp.id);

    const timeSpents = await this.prisma.taskTimeSpent.findMany({
      where: { packageId: { in: packageIds } },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { begin: 'asc' },
    });

    const result: ProjectObjectiveEstimatedPriceViewModel[] = timeSpents.map((ts) => {
      const diffMs = ts.end ? ts.end.getTime() - ts.begin.getTime() : 0;
      const diffMinutes = diffMs / (1000 * 60);
      return {
        date: ts.begin,
        time: diffMinutes,
        amount: 0,
        user: `${ts.user.firstName} ${ts.user.lastName}`.trim(),
        group: '',
      };
    });

    return OperationResult.Success(result);
  }

  async tree(userId: string, projectId: string): Promise<OperationResult<TreeViewModel>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    const subProjects = await this.prisma.subProject.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });

    const workPackages = await this.prisma.workPackage.findMany({
      where: { projectId },
      include: {
        members: {
          where: { isGroup: false },
          include: {
            user: {
              select: { id: true, email: true, avatar: true, firstName: true, lastName: true, username: true, bio: true },
            },
          },
        },
      },
    });

    // Aggregate task counts per work package
    const wpIds = workPackages.map((wp) => wp.id);
    const taskAggregates = await this.prisma.workPackageTask.groupBy({
      by: ['packageId', 'state'],
      where: { packageId: { in: wpIds }, archivedAt: null },
      _count: { id: true },
    });

    // Aggregate time spent per work package
    const timeAggregates = await this.prisma.taskTimeSpent.groupBy({
      by: ['packageId'],
      where: { packageId: { in: wpIds } },
      _count: { id: true },
    });

    // Calculate time spent more accurately
    const timeSpentByPackage = new Map<string, number>();
    for (const wpId of wpIds) {
      const times = await this.prisma.taskTimeSpent.findMany({
        where: { packageId: wpId },
        select: { begin: true, end: true },
      });
      const totalMs = times.reduce(
        (sum, t) => sum + (t.end ? t.end.getTime() - t.begin.getTime() : 0),
        0,
      );
      timeSpentByPackage.set(wpId, totalMs / (1000 * 60));
    }

    const tree: { [key: string]: TreeReportViewModel } = {};

    // Build tree node for each sub-project and root
    const buildNode = (subProjectId: string | null): TreeReportViewModel => {
      const relatedWps = workPackages.filter(
        (wp) => (wp.subProjectId || null) === subProjectId,
      );

      let total = 0;
      let done = 0;
      let timeSpent = 0;
      const memberSet = new Set<string>();

      for (const wp of relatedWps) {
        const wpTasks = taskAggregates.filter((ta) => ta.packageId === wp.id);
        for (const ta of wpTasks) {
          total += ta._count.id;
          if (ta.state === WorkPackageTaskState.Done) {
            done += ta._count.id;
          }
        }
        timeSpent += timeSpentByPackage.get(wp.id) || 0;
        for (const m of wp.members) {
          if (m.user) memberSet.add(m.user.id);
        }
      }

      const doneWorkPackages = relatedWps.filter((wp) => wp.archivedAt !== null).length;

      return {
        doneWorkPackages,
        workPackages: relatedWps.length,
        workPackageProgress: relatedWps.length > 0
          ? Math.round((doneWorkPackages / relatedWps.length) * 100)
          : 0,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        timeSpent,
        from: relatedWps.length > 0
          ? relatedWps.reduce(
              (min, wp) => (wp.beginAt && (!min || wp.beginAt < min) ? wp.beginAt : min),
              null as Date | null | undefined,
            ) || undefined
          : undefined,
        to: relatedWps.length > 0
          ? relatedWps.reduce(
              (max, wp) => (wp.endAt && (!max || wp.endAt > max) ? wp.endAt : max),
              null as Date | null | undefined,
            ) || undefined
          : undefined,
        total,
        done,
        members: Array.from(memberSet).map((mid) => {
          const wpWithMember = relatedWps.find((wp) =>
            wp.members.some((m) => m.user?.id === mid),
          );
          const memberData = wpWithMember?.members.find((m) => m.user?.id === mid);
          return memberData?.user ? this.toMemberInfo(memberData.user) : { id: mid };
        }),
      };
    };

    // Root node (work packages not assigned to any sub-project)
    tree['root'] = buildNode(null);

    // Sub-project nodes
    for (const sp of subProjects) {
      tree[sp.id] = buildNode(sp.id);
    }

    return OperationResult.Success({ tree });
  }

  async roadMap(userId: string, projectId: string): Promise<OperationResult<RoadMapViewModel>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    return OperationResult.Success({} as RoadMapViewModel);
  }

  async progress(
    userId: string,
    projectId: string,
  ): Promise<OperationResult<ProjectProgressViewModel[]>> {
    const hasAccess = await this.verifyProjectAccess(userId, projectId, AccessType.Visitor);
    if (!hasAccess) {
      return OperationResult.NotFound();
    }

    // Get all tasks for this project from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await this.prisma.workPackageTask.findMany({
      where: {
        projectId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        state: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const progressMap = new Map<string, { created: number; blocked: number; done: number }>();

    for (const task of tasks) {
      const dateKey = task.createdAt.toISOString().split('T')[0];
      const entry = progressMap.get(dateKey) || { created: 0, blocked: 0, done: 0 };
      entry.created++;
      if (task.state === WorkPackageTaskState.Done) entry.done++;
      if (
        task.state === WorkPackageTaskState.Blocked ||
        task.state === WorkPackageTaskState.Blocker
      ) {
        entry.blocked++;
      }
      progressMap.set(dateKey, entry);
    }

    const result: ProjectProgressViewModel[] = [];
    for (const [date, counts] of progressMap) {
      result.push({
        date,
        created: counts.created,
        blocked: counts.blocked,
        done: counts.done,
      });
    }

    return OperationResult.Success(result);
  }

  // ─── VIEW MODEL MAPPING ──────────────────────────────────

  private mapProjectToViewModel(
    project: any,
    pending: PendingInvitationViewModel[],
  ): ProjectViewModel {
    const members: ProjectMemberViewModel[] = (project.members || []).map(
      (m: any) => ({
        id: m.id,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        selected: false,
        isGroup: m.isGroup,
        recordId: m.recordId,
        projectId: m.projectId,
        access: m.access,
        member: m.user ? this.toMemberInfo(m.user) : ({} as MemberInfoViewModel),
      }),
    );

    const seasons: ProjectSeasonViewModel[] = (project.seasons || []).map(
      (s: any) => ({
        id: s.id,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        userId: s.userId,
        projectId: s.projectId,
        title: s.title,
        description: s.description,
      }),
    );

    const subProjects: SubProjectViewModel[] = (project.subProjects || []).map(
      (sp: any) => ({
        id: sp.id,
        createdAt: sp.createdAt,
        updatedAt: sp.updatedAt,
        userId: sp.userId,
        projectId: sp.projectId,
        parentId: sp.parentId || null,
        title: sp.title,
        description: sp.description,
        level: sp.level,
        order: sp.order,
      }),
    );

    const objectives: WorkPackageObjectiveViewModel[] = (project.workPackages || []).flatMap(
      (wp: any) => (wp.objectives || []).map((objective: any) => ({
        id: objective.id,
        createdAt: objective.createdAt,
        updatedAt: objective.updatedAt,
        type: objective.type,
        title: objective.title,
        description: objective.description,
        workPackage: wp.title,
      })),
    );

    return {
      id: project.id,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      userId: project.userId,
      title: project.title,
      description: project.description,
      template: project.template,
      complex: project.complex,
      premium: project.premium,
      archivedAt: project.archivedAt || undefined,
      tasks: project.tasks,
      attachmentSize: Number(project.attachmentSize),
      membersCapacity: project.membersCapacity,
      membersUsed: project.membersUsed,
      diskSpaceCapacity: Number(project.diskSpaceCapacity),
      diskSpaceUsed: Number(project.diskSpaceUsed),
      members,
      pending,
      seasons,
      objectives,
      subProjects,
      workPackages: (project.workPackages || []).map((wp: any) => ({
        ...wp,
        subProjectId: wp.subProjectId || null,
      })),
    };
  }
}
