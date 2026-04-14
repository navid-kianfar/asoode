import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, ActivityType } from '@asoode/shared';
import { QueuePublisherService } from '../services/queue-publisher.service';
import { PrismaService } from '../services/prisma.service';
import { DOMAIN_EVENT } from '../services/domain-event.service';

/** Maps ActivityType to a human-readable description for activity logs */
const ACTIVITY_DESCRIPTIONS: Partial<Record<ActivityType, string>> = {
  [ActivityType.AccountEdit]: 'Updated account',
  [ActivityType.GroupAdd]: 'Created a group',
  [ActivityType.GroupEdit]: 'Updated group',
  [ActivityType.GroupRemove]: 'Removed group',
  [ActivityType.GroupArchive]: 'Archived group',
  [ActivityType.GroupRestore]: 'Restored group',
  [ActivityType.GroupMemberAdd]: 'Added a group member',
  [ActivityType.GroupMemberRemove]: 'Removed a group member',
  [ActivityType.GroupMemberPermission]: 'Changed group member permission',
  [ActivityType.GroupWorkEntry]: 'Work entry logged',
  [ActivityType.GroupTimeOffAdd]: 'Requested time off',
  [ActivityType.GroupTimeOffResponse]: 'Responded to time off request',
  [ActivityType.GroupShiftAdd]: 'Created a shift',
  [ActivityType.GroupShiftEdit]: 'Updated a shift',
  [ActivityType.GroupShiftRemove]: 'Removed a shift',
  [ActivityType.GroupPendingAccessChange]: 'Changed pending group access',
  [ActivityType.GroupPendingAccessRemove]: 'Removed pending group access',
  [ActivityType.ProjectAdd]: 'Created a project',
  [ActivityType.ProjectEdit]: 'Updated project',
  [ActivityType.ProjectRemove]: 'Removed project',
  [ActivityType.ProjectMemberAdd]: 'Added a project member',
  [ActivityType.ProjectMemberRemove]: 'Removed a project member',
  [ActivityType.ProjectMemberPermission]: 'Changed project member permission',
  [ActivityType.ProjectSubAdd]: 'Created a sub-project',
  [ActivityType.ProjectSubEdit]: 'Updated sub-project',
  [ActivityType.ProjectSubRemove]: 'Removed sub-project',
  [ActivityType.ProjectSeasonAdd]: 'Created a season',
  [ActivityType.ProjectSeasonEdit]: 'Updated season',
  [ActivityType.ProjectSeasonRemove]: 'Removed season',
  [ActivityType.ProjectArchive]: 'Archived project',
  [ActivityType.ProjectRestore]: 'Restored project',
  [ActivityType.ProjectPendingAccessChange]: 'Changed pending project access',
  [ActivityType.ProjectPendingAccessRemove]: 'Removed pending project access',
  [ActivityType.WorkPackageAdd]: 'Created a work package',
  [ActivityType.WorkPackageEdit]: 'Updated work package',
  [ActivityType.WorkPackageRemove]: 'Removed work package',
  [ActivityType.WorkPackageArchive]: 'Archived work package',
  [ActivityType.WorkPackageRestore]: 'Restored work package',
  [ActivityType.WorkPackageMemberAdd]: 'Added a work package member',
  [ActivityType.WorkPackageMemberRemove]: 'Removed a work package member',
  [ActivityType.WorkPackageMemberPermission]: 'Changed work package member permission',
  [ActivityType.WorkPackageLabelAdd]: 'Added a label',
  [ActivityType.WorkPackageLabelRename]: 'Renamed a label',
  [ActivityType.WorkPackageLabelRemove]: 'Removed a label',
  [ActivityType.WorkPackageSetting]: 'Updated work package settings',
  [ActivityType.WorkPackageListAdd]: 'Created a list',
  [ActivityType.WorkPackageListEdit]: 'Updated a list',
  [ActivityType.WorkPackageListRemove]: 'Removed a list',
  [ActivityType.WorkPackageListArchive]: 'Archived a list',
  [ActivityType.WorkPackageListOrder]: 'Reordered lists',
  [ActivityType.WorkPackageListClone]: 'Cloned a list',
  [ActivityType.WorkPackageListTasksArchive]: 'Archived all tasks in list',
  [ActivityType.WorkPackageListTasksDelete]: 'Deleted all tasks in list',
  [ActivityType.WorkPackageTaskAdd]: 'Created a task',
  [ActivityType.WorkPackageTaskEdit]: 'Updated a task',
  [ActivityType.WorkPackageTaskDone]: 'Marked task as done',
  [ActivityType.WorkPackageTaskRemove]: 'Removed a task',
  [ActivityType.WorkPackageTaskReposition]: 'Reordered task',
  [ActivityType.WorkPackageTaskMove]: 'Moved task to another list',
  [ActivityType.WorkPackageTaskArchive]: 'Archived a task',
  [ActivityType.WorkPackageTaskRestore]: 'Restored a task',
  [ActivityType.WorkPackageTaskComment]: 'Added a comment',
  [ActivityType.WorkPackageTaskView]: 'Viewed a task',
  [ActivityType.WorkPackageTaskMemberAdd]: 'Added a task member',
  [ActivityType.WorkPackageTaskMemberRemove]: 'Removed a task member',
  [ActivityType.WorkPackageTaskLabelAdd]: 'Added a label to task',
  [ActivityType.WorkPackageTaskLabelRemove]: 'Removed a label from task',
  [ActivityType.WorkPackageTaskAttachmentAdd]: 'Added an attachment',
  [ActivityType.WorkPackageTaskAttachmentRemove]: 'Removed an attachment',
  [ActivityType.WorkPackageTaskAttachmentCover]: 'Changed cover image',
  [ActivityType.WorkPackageTaskAttachmentRename]: 'Renamed an attachment',
  [ActivityType.WorkPackageTaskWatch]: 'Toggled task watch',
  [ActivityType.WorkPackageTaskTime]: 'Logged time on task',
  [ActivityType.WorkPackageTaskVote]: 'Voted on task',
  [ActivityType.WorkPackageTaskVoteReset]: 'Reset task votes',
  [ActivityType.WorkPackageTaskBlocked]: 'Blocked a task',
  [ActivityType.WorkPackageTaskUnBlock]: 'Unblocked a task',
  [ActivityType.WorkPackageTaskBulkAdd]: 'Added multiple tasks',
  [ActivityType.WorkPackageTaskAttachmentBulkAdd]: 'Added multiple attachments',
  [ActivityType.WorkPackageCustomFieldAdd]: 'Added a custom field',
  [ActivityType.WorkPackageCustomFieldEdit]: 'Updated a custom field',
  [ActivityType.WorkPackageCustomFieldRemove]: 'Removed a custom field',
  [ActivityType.WorkPackageCustomFieldValueSet]: 'Set a custom field value',
  [ActivityType.ChannelMessage]: 'Sent a message',
  [ActivityType.ChannelUpload]: 'Uploaded a file to chat',
  [ActivityType.ChannelCreate]: 'Created a channel',
  [ActivityType.FileUpload]: 'Uploaded a file',
  [ActivityType.FileDelete]: 'Deleted a file',
  [ActivityType.FileRename]: 'Renamed a file',
  [ActivityType.FolderCreate]: 'Created a folder',
  [ActivityType.WorkflowAdd]: 'Created a workflow',
  [ActivityType.WorkflowEdit]: 'Updated a workflow',
  [ActivityType.WorkflowRemove]: 'Removed a workflow',
  [ActivityType.WorkflowToggle]: 'Toggled workflow active state',
  [ActivityType.WorkflowExecute]: 'Executed a workflow',
};

@Injectable()
export class DomainEventListener {
  private readonly logger = new Logger(DomainEventListener.name);

  constructor(
    private readonly queuePublisher: QueuePublisherService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(DOMAIN_EVENT, { async: true })
  async handleDomainEvent(event: DomainEvent): Promise<void> {
    try {
      // 1. Emit socket notification (fast — just a RabbitMQ publish)
      await this.queuePublisher.emitSocket(
        event.recipientUserIds,
        event.type,
        event.data,
        {
          title: event.push?.title || '',
          description: event.push?.description || '',
          avatar: event.push?.avatar || '',
          url: event.push?.url || '',
          userId: event.actorId,
        },
      );

      // 2. Emit push notification if push metadata provided
      if (event.push?.title && event.recipientUserIds.length > 0) {
        await this.handlePush(event);
      }

      // 3. Write activity log directly (fast Prisma insert)
      await this.writeActivityLog(event);
    } catch (err) {
      this.logger.error(
        `Failed to process domain event (type=${event.type})`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async handlePush(event: DomainEvent): Promise<void> {
    try {
      // Exclude the actor from push notifications
      let pushUsers = event.recipientUserIds.filter(
        (u) => u !== event.actorId,
      );
      if (pushUsers.length === 0) return;

      // Filter by notification preferences
      const packageId = event.data.packageId as string | undefined;
      if (packageId) {
        pushUsers = await this.filterByNotificationPreference(
          pushUsers,
          packageId,
        );
      }
      if (pushUsers.length === 0) return;

      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId: { in: pushUsers } },
      });
      if (subscriptions.length === 0) return;

      await this.queuePublisher.emitPush(
        subscriptions.map((s) => ({
          id: s.id,
          userId: s.userId,
          endpoint: s.endpoint,
          auth: s.auth,
          p256dh: s.p256dh,
        })),
        event.push!.title,
        event.push!.description,
        event.push?.avatar || '',
        event.push?.url || '',
        event.data,
        event.type,
      );
    } catch (err) {
      this.logger.warn(
        'Failed to emit push notification',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async writeActivityLog(event: DomainEvent): Promise<void> {
    try {
      const description =
        event.log?.description ||
        ACTIVITY_DESCRIPTIONS[event.type] ||
        '';

      await this.prisma.activityLog.create({
        data: {
          userId: event.actorId,
          type: event.type,
          description,
          entityId: event.entityId,
          entityType: event.entityType,
          taskId: event.log?.taskId || (event.entityType === 'task' ? event.entityId : null),
        },
      });
    } catch (err) {
      this.logger.warn(
        'Failed to write activity log',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async filterByNotificationPreference(
    users: string[],
    packageId: string,
  ): Promise<string[]> {
    const settings = await this.prisma.workPackageUserSetting.findMany({
      where: { packageId, userId: { in: users } },
    });
    if (settings.length === 0) return users;

    const settingsMap = new Map(
      settings.map((s) => [s.userId, s.receiveNotification]),
    );

    return users.filter((userId) => {
      const pref = settingsMap.get(userId);
      if (pref === undefined) return true;
      if (pref === 3) return false; // ReceiveNone
      return true;
    });
  }
}
