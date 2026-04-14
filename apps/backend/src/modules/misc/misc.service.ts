import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CaptchaResult,
  DashboardViewModel,
  OverallViewModel,
  DayReportViewModel,
  IDateEvent,
  WorkPackageTaskState,
  WorkPackageTaskViewModel,
  MemberInfoViewModel,
  // Enums for /enums endpoint
  GroupType,
  ProjectTemplate,
  DurationMode,
  AccessType,
  WorkPackageCommentPermission,
  ChannelType,
  ConversationType,
  ChannelNotificationReceive,
  SortType,
  RequestStatus,
  ShiftType,
  BoardTemplate,
  TransactionStatus,
  ProjectFilter,
  WorkPackageTaskVisibility,
  ReceiveNotificationType,
  ActivityType,
  WorkPackageObjectiveType,
  WorkPackageTaskReminderType,
  WorkPackageTaskVoteNecessity,
  WorkPackageTaskObjectiveValue,
  WorkPackageTaskAttachmentType,
  // Core enums
  OperationResultStatus,
  FileType,
  WeekDay,
  CalendarType,
  UserType,
} from '@asoode/shared';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class MiscService {
  private readonly logger = new Logger(MiscService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const initials = [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
    return {
      id: user.id,
      email: user.email,
      avatar: user.avatar ?? '',
      firstName: user.firstName,
      lastName: user.lastName,
      fullName,
      initials,
      username: user.username,
      bio: user.bio,
    };
  }

  private enumToKeyValuePairs(enumObj: Record<string, string | number>): { value: number; label: string }[] {
    return Object.entries(enumObj)
      .filter(([key]) => isNaN(Number(key)))
      .map(([label, value]) => ({ value: value as number, label }));
  }

  // ─── CAPTCHA ──────────────────────────────────────────────────

  async captcha(): Promise<CaptchaResult> {
    const token = uuidv4();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Generate a simple SVG-based captcha as base64
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50">
      <rect width="150" height="50" fill="#f0f0f0"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
            font-size="24" font-family="monospace" fill="#333"
            transform="rotate(${Math.floor(Math.random() * 10) - 5}, 75, 25)">
        ${code}
      </text>
      <line x1="${Math.random() * 50}" y1="${Math.random() * 50}" x2="${100 + Math.random() * 50}" y2="${Math.random() * 50}" stroke="#aaa" stroke-width="1"/>
      <line x1="${Math.random() * 50}" y1="${Math.random() * 50}" x2="${100 + Math.random() * 50}" y2="${Math.random() * 50}" stroke="#ccc" stroke-width="1"/>
    </svg>`;

    const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    const expire = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    return { image, token, expire };
  }

  // ─── ENUMS ────────────────────────────────────────────────────

  async enums(): Promise<Record<string, { value: number; label: string }[]>> {
    return {
      GroupType: this.enumToKeyValuePairs(GroupType),
      ProjectTemplate: this.enumToKeyValuePairs(ProjectTemplate),
      DurationMode: this.enumToKeyValuePairs(DurationMode),
      AccessType: this.enumToKeyValuePairs(AccessType),
      WorkPackageCommentPermission: this.enumToKeyValuePairs(WorkPackageCommentPermission),
      ChannelType: this.enumToKeyValuePairs(ChannelType),
      ConversationType: this.enumToKeyValuePairs(ConversationType),
      ChannelNotificationReceive: this.enumToKeyValuePairs(ChannelNotificationReceive),
      SortType: this.enumToKeyValuePairs(SortType),
      RequestStatus: this.enumToKeyValuePairs(RequestStatus),
      ShiftType: this.enumToKeyValuePairs(ShiftType),
      BoardTemplate: this.enumToKeyValuePairs(BoardTemplate),
      TransactionStatus: this.enumToKeyValuePairs(TransactionStatus),
      ProjectFilter: this.enumToKeyValuePairs(ProjectFilter),
      WorkPackageTaskVisibility: this.enumToKeyValuePairs(WorkPackageTaskVisibility),
      ReceiveNotificationType: this.enumToKeyValuePairs(ReceiveNotificationType),
      ActivityType: this.enumToKeyValuePairs(ActivityType),
      WorkPackageObjectiveType: this.enumToKeyValuePairs(WorkPackageObjectiveType),
      WorkPackageTaskReminderType: this.enumToKeyValuePairs(WorkPackageTaskReminderType),
      WorkPackageTaskState: this.enumToKeyValuePairs(WorkPackageTaskState),
      WorkPackageTaskVoteNecessity: this.enumToKeyValuePairs(WorkPackageTaskVoteNecessity),
      WorkPackageTaskObjectiveValue: this.enumToKeyValuePairs(WorkPackageTaskObjectiveValue),
      WorkPackageTaskAttachmentType: this.enumToKeyValuePairs(WorkPackageTaskAttachmentType),
      OperationResultStatus: this.enumToKeyValuePairs(OperationResultStatus),
      FileType: this.enumToKeyValuePairs(FileType),
      WeekDay: this.enumToKeyValuePairs(WeekDay),
      CalendarType: this.enumToKeyValuePairs(CalendarType),
      UserType: this.enumToKeyValuePairs(UserType),
    };
  }

  // ─── DASHBOARD ────────────────────────────────────────────────

  async dashboard(userId: string): Promise<DashboardViewModel> {
    // Find all projects where user is a member
    const memberProjects = await this.prisma.projectMember.findMany({
      where: { recordId: userId },
      select: { projectId: true },
    });

    const ownedProjects = await this.prisma.project.findMany({
      where: { userId },
      select: { id: true },
    });

    const projectIds = [
      ...new Set([
        ...memberProjects.map((m) => m.projectId),
        ...ownedProjects.map((p) => p.id),
      ]),
    ];

    // ─── Overall task counts ────────────────────────────────────
    let overall: OverallViewModel = { total: 0, done: 0, blocked: 0, inProgress: 0 };

    if (projectIds.length > 0) {
      const allTasks = await this.prisma.workPackageTask.findMany({
        where: {
          projectId: { in: projectIds },
          archivedAt: null,
        },
        select: { state: true },
      });

      overall = {
        total: allTasks.length,
        done: allTasks.filter((t) => t.state === WorkPackageTaskState.Done).length,
        blocked: allTasks.filter(
          (t) => t.state === WorkPackageTaskState.Blocked || t.state === WorkPackageTaskState.Blocker,
        ).length,
        inProgress: allTasks.filter((t) => t.state === WorkPackageTaskState.InProgress).length,
      };
    }

    // ─── Progress (last 30 days) ────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const progress: DayReportViewModel[] = [];

    if (projectIds.length > 0) {
      const recentTasks = await this.prisma.workPackageTask.findMany({
        where: {
          projectId: { in: projectIds },
          createdAt: { lte: new Date() },
        },
        select: {
          state: true,
          createdAt: true,
          doneAt: true,
        },
      });

      const currentDate = new Date(thirtyDaysAgo);
      const today = new Date();

      while (currentDate <= today) {
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const tasksUpToDay = recentTasks.filter((t) => t.createdAt <= dayEnd);

        let total = tasksUpToDay.length;
        let done = 0;
        let blocked = 0;
        let inProgress = 0;

        for (const task of tasksUpToDay) {
          if (task.doneAt && task.doneAt <= dayEnd) {
            done++;
          } else if (
            task.state === WorkPackageTaskState.Blocked ||
            task.state === WorkPackageTaskState.Blocker
          ) {
            blocked++;
          } else if (task.state === WorkPackageTaskState.InProgress) {
            inProgress++;
          }
        }

        progress.push({
          date: new Date(currentDate),
          total,
          done,
          blocked,
          inProgress,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // ─── Events (tasks with due dates) ─────────────────────────
    const events: IDateEvent[] = [];

    if (projectIds.length > 0) {
      const tasksWithDates = await this.prisma.workPackageTask.findMany({
        where: {
          projectId: { in: projectIds },
          archivedAt: null,
          OR: [
            { dueAt: { not: null } },
            { beginAt: { not: null } },
            { endAt: { not: null } },
          ],
        },
        select: {
          id: true,
          title: true,
          state: true,
          dueAt: true,
          beginAt: true,
          endAt: true,
        },
        take: 100,
        orderBy: { updatedAt: 'desc' },
      });

      for (const task of tasksWithDates) {
        const eventDate = task.dueAt ?? task.endAt ?? task.beginAt;
        if (eventDate) {
          let color = '#4caf50'; // green for todo
          if (task.state === WorkPackageTaskState.Done) color = '#2196f3';
          else if (task.state === WorkPackageTaskState.InProgress) color = '#ff9800';
          else if (
            task.state === WorkPackageTaskState.Blocked ||
            task.state === WorkPackageTaskState.Blocker
          ) {
            color = '#f44336';
          }

          events.push({
            date: eventDate,
            title: eventDate,
            recordId: task.id,
            color,
            cssClass: '',
            state: task.state as WorkPackageTaskState,
          });
        }
      }
    }

    return { events, overall, progress };
  }

  // ─── RECENT ACTIVITIES ────────────────────────────────────────

  async recentActivities(userId: string): Promise<WorkPackageTaskViewModel[]> {
    // Find all projects where user is a member
    const memberProjects = await this.prisma.projectMember.findMany({
      where: { recordId: userId },
      select: { projectId: true },
    });

    const ownedProjects = await this.prisma.project.findMany({
      where: { userId },
      select: { id: true },
    });

    const projectIds = [
      ...new Set([
        ...memberProjects.map((m) => m.projectId),
        ...ownedProjects.map((p) => p.id),
      ]),
    ];

    if (projectIds.length === 0) {
      return [];
    }

    const tasks = await this.prisma.workPackageTask.findMany({
      where: {
        projectId: { in: projectIds },
      },
      include: {
        list: { select: { title: true } },
        members: {
          where: { isGroup: false },
          include: {
            user: {
              select: {
                id: true, email: true, avatar: true,
                firstName: true, lastName: true, username: true, bio: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: { select: { title: true, color: true, darkColor: true } },
          },
        },
        _count: {
          select: {
            attachments: true,
            comments: true,
            subTasks: true,
          },
        },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      userId: task.userId,
      packageId: task.packageId,
      projectId: task.projectId,
      subProjectId: task.subProjectId ?? '',
      seasonId: task.seasonId ?? '',
      parentId: task.parentId ?? '',
      order: task.order,
      restricted: task.restricted,
      votePaused: task.votePaused,
      votePrivate: task.votePrivate,
      state: task.state as WorkPackageTaskState,
      title: task.title,
      description: task.description,
      geoLocation: task.geoLocation ?? '',
      listId: task.listId,
      listName: task.list?.title ?? '',
      coverUrl: task.coverUrl ?? undefined,
      coverId: task.coverId ?? '',
      estimatedTime: task.estimatedTime ?? 0,
      watching: task.watching,
      doneUserId: task.doneUserId ?? '',
      archivedAt: task.archivedAt ?? undefined,
      dueAt: task.dueAt ?? undefined,
      beginAt: task.beginAt ?? undefined,
      endAt: task.endAt ?? undefined,
      doneAt: task.doneAt ?? undefined,
      hasDescription: !!task.description,
      attachmentCount: task._count.attachments,
      commentCount: task._count.comments,
      targetCounts: 0,
      downVotes: 0,
      upVotes: 0,
      subTasksDone: 0,
      subTasksCount: task._count.subTasks,
      beginReminder: task.beginReminder,
      endReminder: task.endReminder,
      voteNecessity: task.voteNecessity,
      objectiveValue: task.objectiveValue,
      timeSpent: 0,
      comments: [],
      subTasks: [],
      members: task.members
        .filter((m) => m.user)
        .map((m) => ({
          id: m.id,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          taskId: m.taskId,
          recordId: m.recordId,
          isGroup: m.isGroup,
          packageId: m.packageId,
        })),
      labels: task.labels.map((tl: any) => ({
        id: tl.id,
        createdAt: tl.createdAt,
        updatedAt: tl.updatedAt,
        taskId: tl.taskId,
        labelId: tl.labelId,
        packageId: tl.packageId,
        title: tl.label?.title ?? '',
        color: tl.label?.color ?? '',
        dark: tl.label?.darkColor ?? false,
      })),
      attachments: [],
      votes: [],
      timeSpents: [],
    })) as any;
  }
}
