import { ActivityType } from '../../enums/app.enum';

export interface DomainEvent {
  /** ActivityType enum value identifying the event */
  type: ActivityType;
  /** User ID of the actor who triggered the action */
  actorId: string;
  /** Primary entity ID affected (task ID, project ID, etc.) */
  entityId: string;
  /** Entity type string: 'task', 'project', 'group', 'work-package', 'file', 'channel', 'workflow' */
  entityType: string;
  /** User IDs who should receive the socket + push notification */
  recipientUserIds: string[];
  /** Payload data sent to the frontend via socket */
  data: Record<string, any>;
  /** Push notification metadata (omit to skip push) */
  push?: {
    title: string;
    description: string;
    avatar?: string;
    url?: string;
  };
  /** Activity log overrides (description auto-generated from type if omitted) */
  log?: {
    description?: string;
    taskId?: string;
  };
}
