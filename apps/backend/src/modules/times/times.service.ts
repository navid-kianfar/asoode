import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  TimeSpentViewModel,
  MemberInfoViewModel,
} from '@asoode/shared';
import { parseDateOrDefault } from '../../common/utils/parse-date';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class TimesService {
  private readonly logger = new Logger(TimesService.name);

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

  private mapTimeSpent(ts: any): TimeSpentViewModel {
    return {
      style: {},
      parsed: {
        Year: ts.begin.getFullYear(),
        Month: ts.begin.getMonth() + 1,
        Day: ts.begin.getDate(),
        Hours: ts.begin.getHours(),
        Minutes: ts.begin.getMinutes(),
        Seconds: ts.begin.getSeconds(),
      },
      task: {
        id: ts.task.id,
        title: ts.task.title,
        description: ts.task.description,
        state: ts.task.state,
        projectId: ts.task.projectId,
        packageId: ts.task.packageId,
        listId: ts.task.listId,
        userId: ts.task.userId,
        subProjectId: ts.task.subProjectId ?? '',
        seasonId: ts.task.seasonId ?? '',
        parentId: ts.task.parentId ?? '',
        order: ts.task.order,
        restricted: ts.task.restricted,
        votePaused: ts.task.votePaused,
        votePrivate: ts.task.votePrivate,
        createdAt: ts.task.createdAt,
        updatedAt: ts.task.updatedAt,
        archivedAt: ts.task.archivedAt ?? undefined,
        dueAt: ts.task.dueAt ?? undefined,
        beginAt: ts.task.beginAt ?? undefined,
        endAt: ts.task.endAt ?? undefined,
        doneAt: ts.task.doneAt ?? undefined,
        coverUrl: ts.task.coverUrl ?? undefined,
        coverId: ts.task.coverId ?? '',
        estimatedTime: ts.task.estimatedTime ?? 0,
        watching: ts.task.watching,
        geoLocation: ts.task.geoLocation ?? '',
        doneUserId: ts.task.doneUserId ?? '',
        listName: '',
        timeSpent: 0,
        hasDescription: !!ts.task.description,
        attachmentCount: 0,
        commentCount: 0,
        targetCounts: 0,
        downVotes: 0,
        upVotes: 0,
        subTasksDone: 0,
        subTasksCount: 0,
        beginReminder: ts.task.beginReminder,
        endReminder: ts.task.endReminder,
        voteNecessity: ts.task.voteNecessity,
        objectiveValue: ts.task.objectiveValue,
        comments: [],
        subTasks: [],
        members: [],
        labels: [],
        attachments: [],
        votes: [],
        timeSpents: [],
      } as any,
      time: {
        id: ts.id,
        createdAt: ts.createdAt,
        updatedAt: ts.updatedAt,
        begin: ts.begin,
        end: ts.end,
        manual: ts.manual,
        userId: ts.userId,
        taskId: ts.taskId,
        packageId: ts.packageId,
        projectId: ts.projectId,
        subProjectId: ts.subProjectId ?? '',
        member: ts.user ? this.toMemberInfo(ts.user) : ({} as MemberInfoViewModel),
      } as any,
    };
  }

  // ─── MINE ─────────────────────────────────────────────────────

  async mine(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<TimeSpentViewModel[]> {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const fromDate = parseDateOrDefault(from, defaultFrom);
    const toDate = parseDateOrDefault(to, defaultTo);

    const timeSpents = await this.prisma.taskTimeSpent.findMany({
      where: {
        userId,
        begin: { gte: fromDate },
        end: { lte: toDate },
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            firstName: true,
            lastName: true,
            username: true,
            bio: true,
          },
        },
      },
      orderBy: { begin: 'asc' },
    });

    return timeSpents.map((ts) => this.mapTimeSpent(ts));
  }

  // ─── GROUP ────────────────────────────────────────────────────

  async group(
    userId: string,
    groupId: string,
    from: string,
    to: string,
  ): Promise<TimeSpentViewModel[]> {
    // Verify user is a member of the group
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.userId !== userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });

      if (!membership) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Find all projects linked to this group
    const projects = await this.prisma.project.findMany({
      where: { groupId },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const fromDate = parseDateOrDefault(from, defaultFrom);
    const toDate = parseDateOrDefault(to, defaultTo);

    const timeSpents = await this.prisma.taskTimeSpent.findMany({
      where: {
        projectId: { in: projectIds },
        begin: { gte: fromDate },
        end: { lte: toDate },
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            firstName: true,
            lastName: true,
            username: true,
            bio: true,
          },
        },
      },
      orderBy: { begin: 'asc' },
    });

    return timeSpents.map((ts) => this.mapTimeSpent(ts));
  }
}
