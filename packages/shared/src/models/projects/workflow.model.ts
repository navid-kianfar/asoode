import type { WorkflowNodeDto, WorkflowEdgeDto } from '../../dto/workflow.dto';

export enum WorkflowExecutionStatus {
  Pending = 0,
  Running = 1,
  Success = 2,
  Failed = 3,
  Cancelled = 4,
}

export enum WorkflowTrigger {
  Manual = 'manual',
  TaskCreated = 'task_created',
  TaskStateChanged = 'task_state_changed',
  TaskAssigned = 'task_assigned',
  TaskDue = 'task_due',
  MemberAdded = 'member_added',
  CommentAdded = 'comment_added',
}

export enum WorkflowNodeType {
  Trigger = 'trigger',
  Condition = 'condition',
  ChangeState = 'change_state',
  AssignMember = 'assign_member',
  SendNotification = 'send_notification',
  AddComment = 'add_comment',
  SetDate = 'set_date',
  MoveTask = 'move_task',
  CreateTask = 'create_task',
  Delay = 'delay',
  Webhook = 'webhook',
  // New node types
  SetCustomField = 'set_custom_field',
  AddLabel = 'add_label',
  RemoveLabel = 'remove_label',
  AddBlocker = 'add_blocker',
  AddRelation = 'add_relation',
  SendEmail = 'send_email',
  SendSms = 'send_sms',
}

export interface WorkflowViewModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projectId?: string;
  title: string;
  description: string;
  nodes: WorkflowNodeDto[];
  edges: WorkflowEdgeDto[];
  active: boolean;
  trigger: string;
  executionCount?: number;
  lastExecutedAt?: Date;
}

export interface WorkflowExecutionViewModel {
  id: string;
  createdAt: Date;
  workflowId: string;
  userId: string;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  finishedAt?: Date;
  error?: string;
  logs: WorkflowExecutionLogEntry[];
}

export interface WorkflowExecutionLogEntry {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  timestamp: string;
  data?: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}

/**
 * Expression system: nodes can reference data from previous nodes.
 * Syntax: {{nodeId.fieldName}} or use fixed values.
 * The execution context maps nodeId -> outputs for resolution.
 */
export interface WorkflowExpressionField {
  mode: 'fixed' | 'expression';
  value: string;
}
