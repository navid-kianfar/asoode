import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { SignalService } from '../../common/services/signal.service';
import { QueuePublisherService } from '../../common/services/queue-publisher.service';
import { DomainEventService } from '../../common/services/domain-event.service';
import {
  ActivityType,
  OperationResult,
  type CreateWorkflowDto,
  type EditWorkflowDto,
  type WorkflowViewModel,
  type WorkflowExecutionViewModel,
  type WorkflowExecutionLogEntry,
} from '@asoode/shared';

/**
 * Execution context: stores each node's resolved inputs and outputs.
 * Downstream nodes can reference upstream outputs via expressions like {{nodeId.field}}.
 */
interface ExecutionContext {
  [nodeId: string]: Record<string, any>;
}

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signalService: SignalService,
    private readonly queuePublisher: QueuePublisherService,
    private readonly domainEvent: DomainEventService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────

  private mapWorkflow(wf: any): WorkflowViewModel {
    return {
      id: wf.id,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
      userId: wf.userId,
      projectId: wf.projectId || undefined,
      title: wf.title,
      description: wf.description,
      nodes: (wf.nodes as any[]) || [],
      edges: (wf.edges as any[]) || [],
      active: wf.active,
      trigger: wf.trigger,
      executionCount: wf._count?.executions ?? 0,
      lastExecutedAt: wf.executions?.[0]?.startedAt,
    };
  }

  private mapExecution(exec: any): WorkflowExecutionViewModel {
    return {
      id: exec.id,
      createdAt: exec.createdAt,
      workflowId: exec.workflowId,
      userId: exec.userId,
      status: exec.status,
      startedAt: exec.startedAt,
      finishedAt: exec.finishedAt ?? undefined,
      error: exec.error ?? undefined,
      logs: (exec.logs as WorkflowExecutionLogEntry[]) || [],
    };
  }

  // ─── EXPRESSION RESOLUTION ─────────────────────────────────

  /**
   * Resolve expressions in a value string.
   * Syntax: {{nodeId.fieldName}} references the output of a previous node.
   * If mode is 'fixed' or no expressions found, returns the raw value.
   */
  private resolveExpression(value: any, context: ExecutionContext): any {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;

    // Match {{nodeId.field}} patterns
    const exprRegex = /\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.]+)\}\}/g;
    let hasMatch = false;
    const resolved = value.replace(exprRegex, (_match, nodeId, field) => {
      hasMatch = true;
      const nodeCtx = context[nodeId];
      if (!nodeCtx) return '';
      // Support nested fields: "a.b.c"
      const parts = field.split('.');
      let current: any = nodeCtx;
      for (const part of parts) {
        if (current == null) return '';
        current = current[part];
      }
      return current != null ? String(current) : '';
    });

    // If the entire string was a single expression, try to return the original type
    if (hasMatch && /^\{\{[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.]+\}\}$/.test(value.trim())) {
      const [, nodeId, field] = value.trim().match(/^\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.]+)\}\}$/) || [];
      if (nodeId && field) {
        const nodeCtx = context[nodeId];
        if (nodeCtx) {
          const parts = field.split('.');
          let current: any = nodeCtx;
          for (const part of parts) {
            if (current == null) return resolved;
            current = current[part];
          }
          return current;
        }
      }
    }

    return resolved;
  }

  /**
   * Resolve all expression fields in a node's data object.
   */
  private resolveNodeData(data: Record<string, any>, context: ExecutionContext): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === 'object' && 'mode' in val && 'value' in val) {
        // ExpressionField format: { mode: 'fixed' | 'expression', value: string }
        resolved[key] = val.mode === 'expression'
          ? this.resolveExpression(val.value, context)
          : val.value;
      } else {
        resolved[key] = this.resolveExpression(val, context);
      }
    }
    return resolved;
  }

  // ─── CRUD ─────────────────────────────────────────────────

  async list(userId: string): Promise<OperationResult<WorkflowViewModel[]>> {
    const workflows = await this.prisma.workflow.findMany({
      where: { userId },
      include: {
        _count: { select: { executions: true } },
        executions: { take: 1, orderBy: { startedAt: 'desc' }, select: { startedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return OperationResult.Success(workflows.map((wf) => this.mapWorkflow(wf)));
  }

  async create(userId: string, dto: CreateWorkflowDto): Promise<OperationResult<WorkflowViewModel>> {
    const data: any = {
      userId,
      title: dto.title,
      description: dto.description || '',
      trigger: dto.trigger || 'manual',
      nodes: [],
      edges: [],
    };
    if (dto.projectId) data.projectId = dto.projectId;

    const wf = await this.prisma.workflow.create({ data });

    this.domainEvent.emit({
      type: ActivityType.WorkflowAdd,
      actorId: userId,
      entityId: wf.id,
      entityType: 'workflow',
      recipientUserIds: [userId],
      data: this.mapWorkflow(wf),
    });

    return OperationResult.Success(this.mapWorkflow(wf));
  }

  async fetch(userId: string, id: string): Promise<OperationResult<WorkflowViewModel>> {
    const wf = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        _count: { select: { executions: true } },
        executions: { take: 1, orderBy: { startedAt: 'desc' }, select: { startedAt: true } },
      },
    });
    if (!wf || wf.userId !== userId) return OperationResult.NotFound();

    return OperationResult.Success(this.mapWorkflow(wf));
  }

  async edit(userId: string, id: string, dto: EditWorkflowDto): Promise<OperationResult<boolean>> {
    const wf = await this.prisma.workflow.findUnique({ where: { id } });
    if (!wf || wf.userId !== userId) return OperationResult.NotFound();

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.nodes !== undefined) data.nodes = dto.nodes;
    if (dto.edges !== undefined) data.edges = dto.edges;
    if (dto.trigger !== undefined) data.trigger = dto.trigger;
    if (dto.active !== undefined) data.active = dto.active;

    await this.prisma.workflow.update({ where: { id }, data });

    this.domainEvent.emit({
      type: ActivityType.WorkflowEdit,
      actorId: userId,
      entityId: id,
      entityType: 'workflow',
      recipientUserIds: [userId],
      data: { id, ...data },
    });

    return OperationResult.Success(true);
  }

  async remove(userId: string, id: string): Promise<OperationResult<boolean>> {
    const wf = await this.prisma.workflow.findUnique({ where: { id } });
    if (!wf || wf.userId !== userId) return OperationResult.NotFound();

    await this.prisma.workflow.delete({ where: { id } });

    this.domainEvent.emit({
      type: ActivityType.WorkflowRemove,
      actorId: userId,
      entityId: id,
      entityType: 'workflow',
      recipientUserIds: [userId],
      data: { id },
    });

    return OperationResult.Success(true);
  }

  async toggle(userId: string, id: string): Promise<OperationResult<boolean>> {
    const wf = await this.prisma.workflow.findUnique({ where: { id } });
    if (!wf || wf.userId !== userId) return OperationResult.NotFound();

    await this.prisma.workflow.update({
      where: { id },
      data: { active: !wf.active },
    });

    this.domainEvent.emit({
      type: ActivityType.WorkflowToggle,
      actorId: userId,
      entityId: id,
      entityType: 'workflow',
      recipientUserIds: [userId],
      data: { id, active: !wf.active },
    });

    return OperationResult.Success(true);
  }

  // ─── EXECUTION ────────────────────────────────────────────

  async execute(userId: string, id: string): Promise<OperationResult<WorkflowExecutionViewModel>> {
    const wf = await this.prisma.workflow.findUnique({ where: { id } });
    if (!wf || wf.userId !== userId) return OperationResult.NotFound();

    const nodes = (wf.nodes as any[]) || [];
    const edges = (wf.edges as any[]) || [];

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId: id,
        userId,
        status: 1, // Running
        startedAt: new Date(),
        logs: [],
      },
    });

    // Execution context: stores outputs from each node for expression resolution
    const context: ExecutionContext = {};

    // Execute nodes in topological order
    const logs: WorkflowExecutionLogEntry[] = [];
    let status = 2; // Success
    let error: string | undefined;

    try {
      const sorted = this.topologicalSort(nodes, edges);
      for (const node of sorted) {
        const logEntry = await this.executeNode(node, userId, context);
        logs.push(logEntry);
        if (logEntry.status === 'failed') {
          status = 3; // Failed
          error = logEntry.message;
          break;
        }
      }
    } catch (err) {
      status = 3;
      error = err instanceof Error ? err.message : String(err);
    }

    // Update execution with results
    await this.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status,
        finishedAt: new Date(),
        error: error || null,
        logs: logs as any,
      },
    });

    this.domainEvent.emit({
      type: ActivityType.WorkflowExecute,
      actorId: userId,
      entityId: id,
      entityType: 'workflow',
      recipientUserIds: [userId],
      data: { id, executionId: execution.id, status },
    });

    const updated = await this.prisma.workflowExecution.findUnique({
      where: { id: execution.id },
    });

    return OperationResult.Success(this.mapExecution(updated));
  }

  async executions(
    userId: string,
    id: string,
  ): Promise<OperationResult<WorkflowExecutionViewModel[]>> {
    const wf = await this.prisma.workflow.findUnique({ where: { id } });
    if (!wf || wf.userId !== userId) return OperationResult.NotFound();

    const execs = await this.prisma.workflowExecution.findMany({
      where: { workflowId: id },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return OperationResult.Success(execs.map((e) => this.mapExecution(e)));
  }

  // ─── NODE EXECUTION ENGINE ────────────────────────────────

  private topologicalSort(nodes: any[], edges: any[]): any[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adj.set(node.id, []);
    }
    for (const edge of edges) {
      const targets = adj.get(edge.source) || [];
      targets.push(edge.target);
      adj.set(edge.source, targets);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted: any[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = nodeMap.get(id);
      if (node) sorted.push(node);

      for (const neighbor of adj.get(id) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    return sorted;
  }

  /** Get WP member user IDs for a task (for signal recipients) */
  private async getTaskRecipients(taskId: string): Promise<{ userIds: string[]; packageId: string }> {
    const task = await this.prisma.workPackageTask.findUnique({
      where: { id: taskId },
      select: {
        packageId: true,
        list: {
          select: {
            workPackage: {
              select: {
                members: { select: { recordId: true } },
              },
            },
          },
        },
      },
    });
    if (!task) return { userIds: [], packageId: '' };
    const userIds = task.list?.workPackage?.members?.map((m) => m.recordId) || [];
    return { userIds, packageId: task.packageId };
  }

  private async executeNode(
    node: any,
    userId: string,
    context: ExecutionContext,
  ): Promise<WorkflowExecutionLogEntry> {
    // Resolve expressions in node data
    const rawData = node.data || {};
    const data = this.resolveNodeData(rawData, context);

    const entry: WorkflowExecutionLogEntry = {
      nodeId: node.id,
      nodeType: node.type || 'unknown',
      nodeLabel: node.label || data.label || node.type || 'Node',
      status: 'success',
      message: '',
      timestamp: new Date().toISOString(),
      inputs: { ...data },
      outputs: {},
    };

    try {
      switch (node.type) {
        case 'trigger':
          entry.message = 'Workflow triggered';
          entry.outputs = { triggered: true, userId, timestamp: entry.timestamp };
          break;

        case 'change_state': {
          const { taskId, state } = data;
          if (taskId && state !== undefined) {
            const task = await this.prisma.workPackageTask.findUnique({
              where: { id: taskId },
              select: { state: true },
            });
            const previousState = task?.state;
            await this.prisma.workPackageTask.update({
              where: { id: taskId },
              data: { state: Number(state) },
            });
            entry.message = `Task state changed from ${previousState} to ${state}`;
            entry.outputs = { taskId, previousState, newState: Number(state) };
            const { userIds, packageId } = await this.getTaskRecipients(taskId);
            this.domainEvent.emit({
              type: ActivityType.WorkPackageTaskEdit,
              actorId: userId, entityId: taskId, entityType: 'task',
              recipientUserIds: userIds,
              data: { id: taskId, packageId, state: Number(state) },
            });
          } else {
            entry.message = 'Change state: configured (will apply on matching tasks)';
          }
          break;
        }

        case 'send_notification': {
          const { message, targetUserId } = data;
          const targetUser = targetUserId || userId;
          this.domainEvent.emit({
            type: ActivityType.WorkflowExecute,
            actorId: userId, entityId: targetUser, entityType: 'workflow',
            recipientUserIds: [targetUser],
            data: { message: message || 'Workflow notification' },
            push: {
              title: 'Workflow Notification',
              description: message || 'A workflow sent a notification',
              url: '/workflows',
            },
          });
          entry.message = `Notification sent: ${message || 'default'}`;
          entry.outputs = { sent: true, targetUser, message };
          break;
        }

        case 'add_comment': {
          const { taskId, comment } = data;
          if (taskId && comment) {
            const created = await this.prisma.taskComment.create({
              data: { taskId, userId, message: comment },
            });
            entry.message = `Comment added to task`;
            entry.outputs = { commentId: created.id, taskId };
            const { userIds, packageId } = await this.getTaskRecipients(taskId);
            this.domainEvent.emit({
              type: ActivityType.WorkPackageTaskComment,
              actorId: userId, entityId: taskId, entityType: 'task',
              recipientUserIds: userIds,
              data: { taskId, packageId, id: created.id, message: comment, userId, createdAt: created.createdAt },
            });
          } else {
            entry.message = 'Add comment: no task or comment specified';
            entry.status = 'skipped';
          }
          break;
        }

        case 'assign_member': {
          const { taskId, memberId } = data;
          if (taskId && memberId) {
            const task = await this.prisma.workPackageTask.findUnique({
              where: { id: taskId },
              select: { packageId: true },
            });
            if (task) {
              await this.prisma.taskMember.create({
                data: {
                  taskId,
                  recordId: memberId,
                  packageId: task.packageId,
                  isGroup: false,
                },
              });
              entry.message = `Member assigned to task`;
              entry.outputs = { taskId, memberId };
              const { userIds } = await this.getTaskRecipients(taskId);
              this.domainEvent.emit({
                type: ActivityType.WorkPackageTaskMemberAdd,
                actorId: userId, entityId: taskId, entityType: 'task',
                recipientUserIds: userIds,
                data: { taskId, packageId: task.packageId, id: memberId, recordId: memberId },
              });
            }
          } else {
            entry.message = 'Assign member: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'move_task': {
          const { taskId, listId } = data;
          if (taskId && listId) {
            const task = await this.prisma.workPackageTask.findUnique({
              where: { id: taskId },
              select: { listId: true },
            });
            await this.prisma.workPackageTask.update({
              where: { id: taskId },
              data: { listId },
            });
            entry.message = `Task moved to list`;
            entry.outputs = { taskId, previousListId: task?.listId, newListId: listId };
            const { userIds, packageId } = await this.getTaskRecipients(taskId);
            this.domainEvent.emit({
              type: ActivityType.WorkPackageTaskMove,
              actorId: userId, entityId: taskId, entityType: 'task',
              recipientUserIds: userIds,
              data: { id: taskId, taskId, packageId, listId, fromListId: task?.listId },
            });
          } else {
            entry.message = 'Move task: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'create_task': {
          const { listId, title, description, state, estimatedTime, dueAt, beginAt, endAt } = data;
          if (listId && title) {
            const list = await this.prisma.workPackageList.findUnique({
              where: { id: listId },
              select: { packageId: true },
            });
            if (list) {
              const wp = await this.prisma.workPackage.findUnique({
                where: { id: list.packageId },
                select: { projectId: true },
              });
              const taskData: any = {
                userId,
                packageId: list.packageId,
                projectId: wp?.projectId || '',
                listId,
                title,
                description: description || '',
                order: 0,
                state: state ? Number(state) : 1,
              };
              if (estimatedTime) taskData.estimatedTime = Number(estimatedTime);
              if (dueAt) taskData.dueAt = new Date(dueAt);
              if (beginAt) taskData.beginAt = new Date(beginAt);
              if (endAt) taskData.endAt = new Date(endAt);

              const created = await this.prisma.workPackageTask.create({ data: taskData });
              entry.message = `Task "${title}" created`;
              entry.outputs = { taskId: created.id, title, listId, packageId: list.packageId };
              const members = await this.prisma.workPackageMember.findMany({
                where: { packageId: list.packageId },
                select: { recordId: true },
              });
              this.domainEvent.emit({
                type: ActivityType.WorkPackageTaskAdd,
                actorId: userId, entityId: created.id, entityType: 'task',
                recipientUserIds: members.map((m) => m.recordId),
                data: { id: created.id, title, listId, packageId: list.packageId, state: created.state, order: 0 },
              });
            }
          } else {
            entry.message = 'Create task: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'set_date': {
          const { taskId, field, dateValue } = data;
          if (taskId && field && dateValue) {
            const allowedFields = ['dueAt', 'beginAt', 'endAt'];
            if (allowedFields.includes(field)) {
              await this.prisma.workPackageTask.update({
                where: { id: taskId },
                data: { [field]: new Date(dateValue) },
              });
              entry.message = `Task ${field} set to ${dateValue}`;
              entry.outputs = { taskId, field, dateValue };
              const { userIds, packageId } = await this.getTaskRecipients(taskId);
              this.domainEvent.emit({
                type: ActivityType.WorkPackageTaskEdit,
                actorId: userId, entityId: taskId, entityType: 'task',
                recipientUserIds: userIds,
                data: { id: taskId, packageId, [field]: new Date(dateValue) },
              });
            } else {
              entry.message = `Invalid date field: ${field}`;
              entry.status = 'failed';
            }
          } else {
            entry.message = 'Set date: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'set_custom_field': {
          const { taskId, fieldId, value } = data;
          if (taskId && fieldId) {
            await this.prisma.customFieldValue.upsert({
              where: { fieldId_taskId: { fieldId, taskId } },
              update: { value: String(value ?? '') },
              create: { fieldId, taskId, value: String(value ?? '') },
            });
            entry.message = `Custom field set on task`;
            entry.outputs = { taskId, fieldId, value };
            const { userIds, packageId } = await this.getTaskRecipients(taskId);
            this.domainEvent.emit({
              type: ActivityType.WorkPackageCustomFieldValueSet,
              actorId: userId, entityId: taskId, entityType: 'task',
              recipientUserIds: userIds,
              data: { taskId, packageId, fieldId, value },
            });
          } else {
            entry.message = 'Set custom field: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'add_label': {
          const { taskId, labelId } = data;
          if (taskId && labelId) {
            const task = await this.prisma.workPackageTask.findUnique({
              where: { id: taskId },
              select: { packageId: true },
            });
            if (task) {
              await this.prisma.taskLabel.create({
                data: { taskId, labelId, packageId: task.packageId },
              });
              entry.message = `Label added to task`;
              entry.outputs = { taskId, labelId };
              const { userIds } = await this.getTaskRecipients(taskId);
              this.domainEvent.emit({
                type: ActivityType.WorkPackageTaskLabelAdd,
                actorId: userId, entityId: taskId, entityType: 'task',
                recipientUserIds: userIds,
                data: { taskId, packageId: task.packageId, id: labelId, labelId },
              });
            }
          } else {
            entry.message = 'Add label: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'remove_label': {
          const { taskId, labelId } = data;
          if (taskId && labelId) {
            await this.prisma.taskLabel.deleteMany({
              where: { taskId, labelId },
            });
            entry.message = `Label removed from task`;
            entry.outputs = { taskId, labelId };
            const { userIds, packageId } = await this.getTaskRecipients(taskId);
            this.domainEvent.emit({
              type: ActivityType.WorkPackageTaskLabelRemove,
              actorId: userId, entityId: taskId, entityType: 'task',
              recipientUserIds: userIds,
              data: { taskId, packageId, id: labelId, labelId },
            });
          } else {
            entry.message = 'Remove label: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'add_blocker': {
          const { blockedId, blockerId, description: desc } = data;
          if (blockedId && blockerId) {
            await this.prisma.taskBlocker.create({
              data: {
                blockedId,
                blockerId,
                description: desc || '',
              },
            });
            entry.message = `Blocker relation created`;
            entry.outputs = { blockedId, blockerId };
            const { userIds, packageId } = await this.getTaskRecipients(blockedId);
            this.domainEvent.emit({
              type: ActivityType.WorkPackageTaskBlocked,
              actorId: userId, entityId: blockedId, entityType: 'task',
              recipientUserIds: userIds,
              data: { taskId: blockedId, packageId, blockedId, blockerId },
            });
          } else {
            entry.message = 'Add blocker: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'add_relation': {
          const { fromTaskId, toTaskId, relationType } = data;
          if (fromTaskId && toTaskId) {
            await this.prisma.taskRelation.create({
              data: {
                fromTaskId,
                toTaskId,
                type: relationType ? Number(relationType) : 1,
              },
            });
            entry.message = `Task relation created`;
            entry.outputs = { fromTaskId, toTaskId, relationType };
          } else {
            entry.message = 'Add relation: missing configuration';
            entry.status = 'skipped';
          }
          break;
        }

        case 'send_email': {
          const { to, subject, body, template } = data;
          if (to) {
            this.queuePublisher.emitEmail({
              to,
              template: template || 'workflow-notification',
              culture: 'en',
              data: { subject: subject || 'Workflow Notification', body: body || '' },
              subject: subject || 'Workflow Notification',
            });
            entry.message = `Email queued to ${to}`;
            entry.outputs = { to, subject, queued: true };
          } else {
            entry.message = 'Send email: no recipient specified';
            entry.status = 'skipped';
          }
          break;
        }

        case 'send_sms': {
          const { to, message } = data;
          if (to && message) {
            this.queuePublisher.emitSms({
              to,
              message,
              data: { source: 'workflow' },
            });
            entry.message = `SMS queued to ${to}`;
            entry.outputs = { to, queued: true };
          } else {
            entry.message = 'Send SMS: missing phone or message';
            entry.status = 'skipped';
          }
          break;
        }

        case 'condition': {
          const { field, operator, value, taskId } = data;
          let result = true;
          if (taskId && field) {
            const task = await this.prisma.workPackageTask.findUnique({
              where: { id: taskId },
            });
            if (task) {
              const taskValue = String((task as any)[field] ?? '');
              const compareValue = String(value ?? '');
              switch (operator) {
                case 'equals':
                  result = taskValue === compareValue;
                  break;
                case 'not_equals':
                  result = taskValue !== compareValue;
                  break;
                case 'contains':
                  result = taskValue.includes(compareValue);
                  break;
                case 'greater_than':
                  result = Number(taskValue) > Number(compareValue);
                  break;
                case 'less_than':
                  result = Number(taskValue) < Number(compareValue);
                  break;
                default:
                  result = true;
              }
            }
          }
          entry.message = `Condition evaluated: ${result}`;
          entry.outputs = { result, field, operator, value };
          break;
        }

        case 'delay': {
          const { seconds } = data;
          if (seconds && Number(seconds) > 0) {
            const ms = Math.min(Number(seconds) * 1000, 30000); // max 30s in manual execution
            await new Promise((resolve) => setTimeout(resolve, ms));
            entry.message = `Delayed ${Math.round(ms / 1000)}s`;
            entry.outputs = { delayMs: ms };
          } else {
            entry.message = `Delay node (no duration configured)`;
            entry.status = 'skipped';
          }
          break;
        }

        case 'webhook': {
          const { url, method } = data;
          if (url) {
            try {
              const response = await fetch(url, {
                method: method || 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: method === 'GET' ? undefined : JSON.stringify(context),
              });
              entry.message = `Webhook ${method || 'POST'} ${url} => ${response.status}`;
              entry.outputs = { statusCode: response.status, url };
            } catch (fetchErr) {
              entry.message = `Webhook failed: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;
              entry.status = 'failed';
            }
          } else {
            entry.message = 'Webhook: no URL configured';
            entry.status = 'skipped';
          }
          break;
        }

        default:
          entry.message = `Unknown node type: ${node.type}`;
          entry.status = 'skipped';
      }
    } catch (err) {
      entry.status = 'failed';
      entry.message = err instanceof Error ? err.message : String(err);
    }

    // Store this node's outputs in context for downstream expression resolution
    context[node.id] = entry.outputs || {};

    return entry;
  }
}
