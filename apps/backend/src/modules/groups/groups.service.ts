import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { parseDate } from '../../common/utils/parse-date';
import { PrismaService } from '../../common/services/prisma.service';
import { DomainEventService } from '../../common/services/domain-event.service';
import {
  AccessType,
  ActivityType,
  ChannelType,
  RequestStatus,
  CreateGroupDto,
  EditGroupDto,
  AddAccessDto,
  GroupViewModel,
  GroupMemberViewModel,
  PendingInvitationViewModel,
  MemberInfoViewModel,
  DayReportViewModel,
  TimeSpentViewModel,
} from '@asoode/shared';
import { MessengerService } from '../messenger/messenger.service';
import type { User, Group, GroupMember, PendingInvitation, WorkEntry, TimeOff } from '@prisma/client';

// ─── HELPER: User → MemberInfoViewModel ──────────────────────────

function toMemberInfo(user: User): MemberInfoViewModel {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || user.username;
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase())
    .join('') || user.username.charAt(0).toUpperCase();

  return {
    id: user.id,
    email: user.email,
    avatar: user.avatar || '',
    firstName,
    lastName,
    fullName,
    initials,
    username: user.username,
    bio: user.bio || '',
  };
}

// ─── HELPER: Map Group + relations → GroupViewModel ──────────────

type GroupWithRelations = Group & {
  members?: (GroupMember & { user: User })[];
  pendingInvitations?: PendingInvitation[];
};

function toGroupViewModel(
  group: GroupWithRelations,
  access?: AccessType,
): GroupViewModel {
  const members: GroupMemberViewModel[] = (group.members || []).map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    userId: m.userId,
    groupId: m.groupId,
    access: m.access as AccessType,
    member: toMemberInfo(m.user),
  }));

  const pending: PendingInvitationViewModel[] = (group.pendingInvitations || []).map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    identifier: p.identifier,
    recordId: p.recordId,
    access: p.access as AccessType,
  }));

  return {
    id: group.id,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    userId: group.userId,
    parentId: group.parentId || undefined,
    rootId: group.rootId || undefined,
    type: group.type,
    title: group.title,
    subTitle: group.subTitle,
    brandTitle: group.brandTitle,
    description: group.description,
    email: group.email,
    website: group.website,
    postalCode: group.postalCode,
    address: group.address,
    tel: group.tel,
    fax: group.fax,
    geoLocation: group.geoLocation || undefined,
    nationalId: group.nationalId,
    registrationId: group.registrationId,
    supervisorName: group.supervisorName,
    supervisorNumber: group.supervisorNumber,
    responsibleName: group.responsibleName,
    responsibleNumber: group.responsibleNumber,
    avatar: group.avatar || undefined,
    avatarId: group.avatar || '',
    premium: group.premium,
    complex: group.complex,
    archivedAt: group.archivedAt || undefined,
    membersCapacity: group.membersCapacity,
    membersUsed: group.membersUsed,
    diskSpaceCapacity: Number(group.diskSpaceCapacity),
    diskSpaceUsed: Number(group.diskSpaceUsed),
    attachmentSize: Number(group.attachmentSize),
    offices: group.offices,
    employees: group.employees,
    registeredAt: group.registeredAt || undefined,
    expireAt: group.expireAt || undefined,
    access,
    members,
    pending,
  };
}

// ─── Prisma include for group members with user info ─────────────

const membersInclude = {
  members: {
    include: { user: true },
  },
} as const;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvent: DomainEventService,
    private readonly messengerService: MessengerService,
  ) {}

  // ─── LIST / ARCHIVE ──────────────────────────────────────────

  async list(userId: string): Promise<GroupViewModel[]> {
    const groups = await this.prisma.group.findMany({
      where: {
        archivedAt: null,
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      include: membersInclude,
      orderBy: { createdAt: 'desc' },
    });

    return groups.map((g) => {
      const membership = g.members.find((m) => m.userId === userId);
      const access = g.userId === userId
        ? AccessType.Owner
        : (membership?.access as AccessType) || AccessType.Visitor;
      return toGroupViewModel(g, access);
    });
  }

  async archived(userId: string): Promise<GroupViewModel[]> {
    const groups = await this.prisma.group.findMany({
      where: {
        archivedAt: { not: null },
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      include: membersInclude,
      orderBy: { archivedAt: 'desc' },
    });

    return groups.map((g) => {
      const membership = g.members.find((m) => m.userId === userId);
      const access = g.userId === userId
        ? AccessType.Owner
        : (membership?.access as AccessType) || AccessType.Visitor;
      return toGroupViewModel(g, access);
    });
  }

  // ─── CRUD ────────────────────────────────────────────────────

  async create(userId: string, dto: CreateGroupDto): Promise<{ id: string }> {
    const rootId = dto.parentId
      ? (await this.prisma.group.findUnique({ where: { id: dto.parentId }, select: { rootId: true, id: true } }))?.rootId ?? dto.parentId
      : undefined;

    const group = await this.prisma.group.create({
      data: {
        userId,
        title: dto.title,
        type: dto.type,
        description: dto.description || '',
        parentId: dto.parentId || undefined,
        rootId: rootId || undefined,
      },
    });

    // Add the creator as a group member with Owner access
    await this.prisma.groupMember.create({
      data: {
        userId,
        groupId: group.id,
        access: AccessType.Owner,
      },
    });

    // Update membersUsed count
    await this.prisma.group.update({
      where: { id: group.id },
      data: { membersUsed: 1 },
    });

    // Auto-create a channel for this group
    await this.messengerService.createEntityChannel(
      userId,
      ChannelType.Group,
      group.id,
      group.title,
      [userId],
    );

    this.domainEvent.emit({
      type: ActivityType.GroupAdd,
      actorId: userId,
      entityId: group.id,
      entityType: 'group',
      recipientUserIds: [userId],
      data: { group: { id: group.id, title: group.title } },
      push: {
        title: 'Group created',
        description: `Group "${group.title}" was created`,
        url: `/group/${group.id}`,
      },
    });

    return { id: group.id };
  }

  async edit(userId: string, id: string, dto: EditGroupDto): Promise<boolean> {
    const group = await this.findGroupWithAccessCheck(id, userId, AccessType.Admin);

    const data: Record<string, any> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.brandTitle !== undefined) data.brandTitle = dto.brandTitle;
    if (dto.supervisorName !== undefined) data.supervisorName = dto.supervisorName;
    if (dto.supervisorNumber !== undefined) data.supervisorNumber = dto.supervisorNumber;
    if (dto.responsibleName !== undefined) data.responsibleName = dto.responsibleName;
    if (dto.responsibleNumber !== undefined) data.responsibleNumber = dto.responsibleNumber;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.tel !== undefined) data.tel = dto.tel;
    if (dto.fax !== undefined) data.fax = dto.fax;
    if (dto.geoLocation !== undefined) data.geoLocation = dto.geoLocation;
    if (dto.nationalId !== undefined) data.nationalId = dto.nationalId;
    if (dto.registrationId !== undefined) data.registrationId = dto.registrationId;

    if (Object.keys(data).length > 0) {
      await this.prisma.group.update({ where: { id }, data });
    }

    const memberIds = await this.getGroupMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.GroupEdit,
      actorId: userId,
      entityId: id,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: id, ...data },
      push: {
        title: 'Group updated',
        description: `Group was updated`,
        url: `/group/${id}`,
      },
    });

    return true;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    await this.findGroupWithAccessCheck(id, userId, AccessType.Owner);

    const memberIds = await this.getGroupMemberUserIds(id);

    await this.prisma.group.delete({ where: { id } });

    this.domainEvent.emit({
      type: ActivityType.GroupRemove,
      actorId: userId,
      entityId: id,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: id },
      push: {
        title: 'Group removed',
        description: `Group was removed`,
        url: `/group/${id}`,
      },
    });

    return true;
  }

  async archive(userId: string, id: string): Promise<boolean> {
    await this.findGroupWithAccessCheck(id, userId, AccessType.Admin);

    await this.prisma.group.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    const memberIds = await this.getGroupMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.GroupArchive,
      actorId: userId,
      entityId: id,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: id },
      push: {
        title: 'Group archived',
        description: `Group was archived`,
        url: `/group/${id}`,
      },
    });

    return true;
  }

  async restore(userId: string, id: string): Promise<boolean> {
    await this.findGroupWithAccessCheck(id, userId, AccessType.Admin);

    await this.prisma.group.update({
      where: { id },
      data: { archivedAt: null },
    });

    const memberIds = await this.getGroupMemberUserIds(id);
    this.domainEvent.emit({
      type: ActivityType.GroupRestore,
      actorId: userId,
      entityId: id,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: id },
      push: {
        title: 'Group restored',
        description: `Group was restored`,
        url: `/group/${id}`,
      },
    });

    return true;
  }

  async fetch(userId: string, id: string): Promise<GroupViewModel> {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: { include: { user: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Verify user has access
    const isMember = group.userId === userId || group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Access denied');
    }

    // Fetch pending invitations for this group
    const pendingInvitations = await this.prisma.pendingInvitation.findMany({
      where: { recordId: id, entityType: 'group' },
    });

    const membership = group.members.find((m) => m.userId === userId);
    const access = group.userId === userId
      ? AccessType.Owner
      : (membership?.access as AccessType) || AccessType.Visitor;

    return toGroupViewModel(
      { ...group, pendingInvitations } as GroupWithRelations,
      access,
    );
  }

  // ─── ACCESS MANAGEMENT ──────────────────────────────────────

  async addAccess(userId: string, groupId: string, dto: AddAccessDto): Promise<boolean> {
    const group = await this.findGroupWithAccessCheck(groupId, userId, AccessType.Admin);
    const memberIds = await this.getGroupMemberUserIds(groupId);
    const newMemberIds: string[] = [];

    for (const entry of dto.members) {
      if (entry.isGroup) {
        // If it's a group reference, add all members of that group
        const sourceMembers = await this.prisma.groupMember.findMany({
          where: { groupId: entry.id },
          select: { userId: true },
        });

        for (const sm of sourceMembers) {
          await this.upsertGroupMember(groupId, sm.userId, entry.access);
          newMemberIds.push(sm.userId);
        }
      } else {
        // Check if the identifier matches an existing user
        const user = await this.prisma.user.findUnique({
          where: { id: entry.id },
        });

        if (user) {
          await this.upsertGroupMember(groupId, user.id, entry.access);
          newMemberIds.push(user.id);
        } else {
          // If no user found, try by email/username and create pending invitation
          const existingUser = await this.prisma.user.findFirst({
            where: {
              OR: [{ email: entry.id }, { username: entry.id }],
            },
          });

          if (existingUser) {
            await this.upsertGroupMember(groupId, existingUser.id, entry.access);
            newMemberIds.push(existingUser.id);
          } else {
            // Create a pending invitation
            await this.prisma.pendingInvitation.create({
              data: {
                identifier: entry.id,
                recordId: groupId,
                access: entry.access,
                entityType: 'group',
              },
            });
          }
        }
      }
    }

    // Update membersUsed count
    const totalMembers = await this.prisma.groupMember.count({ where: { groupId } });
    await this.prisma.group.update({
      where: { id: groupId },
      data: { membersUsed: totalMembers },
    });

    const allNotifyIds = [...new Set([...memberIds, ...newMemberIds])];
    this.domainEvent.emit({
      type: ActivityType.GroupMemberAdd,
      actorId: userId,
      entityId: groupId,
      entityType: 'group',
      recipientUserIds: allNotifyIds,
      data: { groupId },
      push: {
        title: 'Member added to group',
        description: `A member was added to the group`,
        url: `/group/${groupId}`,
      },
    });

    return true;
  }

  async changeAccess(userId: string, membershipId: string, access: number): Promise<boolean> {
    const membership = await this.prisma.groupMember.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Group membership not found');
    }

    await this.findGroupWithAccessCheck(membership.groupId, userId, AccessType.Admin);

    await this.prisma.groupMember.update({
      where: { id: membershipId },
      data: { access },
    });

    const memberIds = await this.getGroupMemberUserIds(membership.groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupMemberPermission,
      actorId: userId,
      entityId: membership.groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: membership.groupId, memberId: membership.userId, access },
      push: {
        title: 'Permission updated',
        description: `Member permission was updated`,
        url: `/group/${membership.groupId}`,
      },
    });

    return true;
  }

  async removeAccess(userId: string, membershipId: string): Promise<boolean> {
    const membership = await this.prisma.groupMember.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Group membership not found');
    }

    await this.findGroupWithAccessCheck(membership.groupId, userId, AccessType.Admin);

    await this.prisma.groupMember.delete({ where: { id: membershipId } });

    // Update membersUsed count
    const totalMembers = await this.prisma.groupMember.count({
      where: { groupId: membership.groupId },
    });
    await this.prisma.group.update({
      where: { id: membership.groupId },
      data: { membersUsed: totalMembers },
    });

    const memberIds = await this.getGroupMemberUserIds(membership.groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupMemberRemove,
      actorId: userId,
      entityId: membership.groupId,
      entityType: 'group',
      recipientUserIds: [...memberIds, membership.userId],
      data: { groupId: membership.groupId, memberId: membership.userId },
      push: {
        title: 'Member removed from group',
        description: `A member was removed from the group`,
        url: `/group/${membership.groupId}`,
      },
    });

    return true;
  }

  async changePendingAccess(userId: string, invitationId: string, access: number): Promise<boolean> {
    const invitation = await this.prisma.pendingInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.entityType !== 'group') {
      throw new NotFoundException('Pending invitation not found');
    }

    await this.findGroupWithAccessCheck(invitation.recordId, userId, AccessType.Admin);

    await this.prisma.pendingInvitation.update({
      where: { id: invitationId },
      data: { access },
    });

    const memberIds = await this.getGroupMemberUserIds(invitation.recordId);
    this.domainEvent.emit({
      type: ActivityType.GroupPendingAccessChange,
      actorId: userId,
      entityId: invitation.recordId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: {
        invitationId,
        groupId: invitation.recordId,
        access,
      },
      push: {
        title: 'Pending access updated',
        description: `Pending invitation access was updated`,
        url: `/group/${invitation.recordId}`,
      },
    });

    return true;
  }

  async removePendingAccess(userId: string, invitationId: string): Promise<boolean> {
    const invitation = await this.prisma.pendingInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.entityType !== 'group') {
      throw new NotFoundException('Pending invitation not found');
    }

    await this.findGroupWithAccessCheck(invitation.recordId, userId, AccessType.Admin);

    await this.prisma.pendingInvitation.delete({ where: { id: invitationId } });

    const memberIds = await this.getGroupMemberUserIds(invitation.recordId);
    this.domainEvent.emit({
      type: ActivityType.GroupPendingAccessRemove,
      actorId: userId,
      entityId: invitation.recordId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: {
        invitationId,
        groupId: invitation.recordId,
      },
      push: {
        title: 'Pending access removed',
        description: `Pending invitation was removed`,
        url: `/group/${invitation.recordId}`,
      },
    });

    return true;
  }

  // ─── WORK ENTRIES (ATTENDANCE) ──────────────────────────────

  async toggleEntry(userId: string, groupId: string): Promise<boolean> {
    await this.findGroupWithMembershipCheck(groupId, userId);

    // Check if there's an active (open) entry for this user in this group
    const activeEntry = await this.prisma.workEntry.findFirst({
      where: {
        userId,
        groupId,
        end: null,
      },
      orderBy: { begin: 'desc' },
    });

    if (activeEntry) {
      // Close the existing entry
      await this.prisma.workEntry.update({
        where: { id: activeEntry.id },
        data: { end: new Date() },
      });
    } else {
      // Open a new entry
      await this.prisma.workEntry.create({
        data: {
          userId,
          groupId,
          begin: new Date(),
        },
      });
    }

    const memberIds = await this.getGroupMemberUserIds(groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupWorkEntry,
      actorId: userId,
      entityId: groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId, userId, toggled: !activeEntry },
      push: {
        title: 'Work entry added',
        description: `Work entry was toggled`,
        url: `/group/${groupId}`,
      },
    });

    return true;
  }

  async removeEntry(userId: string, entryId: string): Promise<boolean> {
    const entry = await this.prisma.workEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Work entry not found');
    }

    // The user must be the entry owner or an admin/owner of the group
    if (entry.userId !== userId) {
      await this.findGroupWithAccessCheck(entry.groupId, userId, AccessType.Admin);
    }

    await this.prisma.workEntry.delete({ where: { id: entryId } });

    const memberIds = await this.getGroupMemberUserIds(entry.groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupWorkEntry,
      actorId: userId,
      entityId: entry.groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: entry.groupId, entryId },
    });

    return true;
  }

  async editEntry(
    userId: string,
    entryId: string,
    begin: string,
    end: string,
  ): Promise<boolean> {
    const entry = await this.prisma.workEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Work entry not found');
    }

    if (entry.userId !== userId) {
      await this.findGroupWithAccessCheck(entry.groupId, userId, AccessType.Admin);
    }

    await this.prisma.workEntry.update({
      where: { id: entryId },
      data: {
        begin: parseDate(begin, 'begin'),
        end: parseDate(end, 'end'),
      },
    });

    const memberIds = await this.getGroupMemberUserIds(entry.groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupWorkEntry,
      actorId: userId,
      entityId: entry.groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: entry.groupId, entryId },
    });

    return true;
  }

  async manualEntry(
    userId: string,
    groupId: string,
    begin: string,
    end: string,
    targetUserId: string,
  ): Promise<boolean> {
    await this.findGroupWithAccessCheck(groupId, userId, AccessType.Admin);

    await this.prisma.workEntry.create({
      data: {
        userId: targetUserId,
        groupId,
        begin: parseDate(begin, 'begin'),
        end: parseDate(end, 'end'),
      },
    });

    const memberIds = await this.getGroupMemberUserIds(groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupWorkEntry,
      actorId: userId,
      entityId: groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId, targetUserId },
    });

    return true;
  }

  // ─── SHIFTS ──────────────────────────────────────────────────

  async createShift(
    userId: string,
    groupId: string,
    data: { title: string; type: number; config?: string },
  ): Promise<boolean> {
    await this.findGroupWithAccessCheck(groupId, userId, AccessType.Admin);

    const shift = await this.prisma.shift.create({
      data: {
        groupId,
        title: data.title,
        type: data.type,
        config: data.config || null,
      },
    });

    const memberIds = await this.getGroupMemberUserIds(groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupShiftAdd,
      actorId: userId,
      entityId: groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId, shiftId: shift.id, title: data.title },
      push: {
        title: 'Shift created',
        description: `Shift "${data.title}" was created`,
        url: `/group/${groupId}`,
      },
    });

    return true;
  }

  async editShift(
    userId: string,
    shiftId: string,
    data: { title?: string; type?: number; config?: string },
  ): Promise<boolean> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    await this.findGroupWithAccessCheck(shift.groupId, userId, AccessType.Admin);

    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.config !== undefined) updateData.config = data.config;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.shift.update({
        where: { id: shiftId },
        data: updateData,
      });
    }

    const memberIds = await this.getGroupMemberUserIds(shift.groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupShiftEdit,
      actorId: userId,
      entityId: shift.groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: shift.groupId, shiftId, ...updateData },
      push: {
        title: 'Shift updated',
        description: `Shift was updated`,
        url: `/group/${shift.groupId}`,
      },
    });

    return true;
  }

  async removeShift(userId: string, shiftId: string): Promise<boolean> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    await this.findGroupWithAccessCheck(shift.groupId, userId, AccessType.Admin);

    await this.prisma.shift.delete({ where: { id: shiftId } });

    const memberIds = await this.getGroupMemberUserIds(shift.groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupShiftRemove,
      actorId: userId,
      entityId: shift.groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: shift.groupId, shiftId },
      push: {
        title: 'Shift removed',
        description: `Shift was removed`,
        url: `/group/${shift.groupId}`,
      },
    });

    return true;
  }

  // ─── TIME OFFS ──────────────────────────────────────────────

  async requestTimeOff(
    userId: string,
    groupId: string,
    data: { from: string; to: string; reason?: string },
  ): Promise<boolean> {
    await this.findGroupWithMembershipCheck(groupId, userId);

    await this.prisma.timeOff.create({
      data: {
        userId,
        groupId,
        from: parseDate(data.from, 'from'),
        to: parseDate(data.to, 'to'),
        reason: data.reason || '',
        status: RequestStatus.Pending,
      },
    });

    const memberIds = await this.getGroupMemberUserIds(groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupTimeOffAdd,
      actorId: userId,
      entityId: groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId, userId },
      push: {
        title: 'Time off requested',
        description: `A time off request was submitted`,
        url: `/group/${groupId}`,
      },
    });

    return true;
  }

  async deleteTimeOff(userId: string, timeOffId: string): Promise<boolean> {
    const timeOff = await this.prisma.timeOff.findUnique({
      where: { id: timeOffId },
    });

    if (!timeOff) {
      throw new NotFoundException('Time off request not found');
    }

    // Only the requester or an admin can delete
    if (timeOff.userId !== userId) {
      await this.findGroupWithAccessCheck(timeOff.groupId, userId, AccessType.Admin);
    }

    await this.prisma.timeOff.delete({ where: { id: timeOffId } });

    const memberIds = await this.getGroupMemberUserIds(timeOff.groupId);
    this.domainEvent.emit({
      type: ActivityType.GroupTimeOffResponse,
      actorId: userId,
      entityId: timeOff.groupId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: timeOff.groupId, timeOffId },
    });

    return true;
  }

  async approveTimeOff(userId: string, timeOffId: string): Promise<boolean> {
    const timeOff = await this.prisma.timeOff.findUnique({
      where: { id: timeOffId },
    });

    if (!timeOff) {
      throw new NotFoundException('Time off request not found');
    }

    await this.findGroupWithAccessCheck(timeOff.groupId, userId, AccessType.Admin);

    await this.prisma.timeOff.update({
      where: { id: timeOffId },
      data: { status: RequestStatus.Approved },
    });

    this.domainEvent.emit({
      type: ActivityType.GroupTimeOffResponse,
      actorId: userId,
      entityId: timeOff.groupId,
      entityType: 'group',
      recipientUserIds: [timeOff.userId],
      data: { groupId: timeOff.groupId, timeOffId, status: RequestStatus.Approved },
      push: {
        title: 'Time off approved',
        description: `Time off request was approved`,
        url: `/group/${timeOff.groupId}`,
      },
    });

    return true;
  }

  async declineTimeOff(userId: string, timeOffId: string): Promise<boolean> {
    const timeOff = await this.prisma.timeOff.findUnique({
      where: { id: timeOffId },
    });

    if (!timeOff) {
      throw new NotFoundException('Time off request not found');
    }

    await this.findGroupWithAccessCheck(timeOff.groupId, userId, AccessType.Admin);

    await this.prisma.timeOff.update({
      where: { id: timeOffId },
      data: { status: RequestStatus.Canceled },
    });

    this.domainEvent.emit({
      type: ActivityType.GroupTimeOffResponse,
      actorId: userId,
      entityId: timeOff.groupId,
      entityType: 'group',
      recipientUserIds: [timeOff.userId],
      data: { groupId: timeOff.groupId, timeOffId, status: RequestStatus.Canceled },
      push: {
        title: 'Time off declined',
        description: `Time off request was declined`,
        url: `/group/${timeOff.groupId}`,
      },
    });

    return true;
  }

  async timeOffDetail(userId: string, timeOffId: string): Promise<any> {
    const timeOff = await this.prisma.timeOff.findUnique({
      where: { id: timeOffId },
      include: { user: true, group: true },
    });

    if (!timeOff) {
      throw new NotFoundException('Time off request not found');
    }

    await this.findGroupWithMembershipCheck(timeOff.groupId, userId);

    return {
      id: timeOff.id,
      createdAt: timeOff.createdAt,
      updatedAt: timeOff.updatedAt,
      userId: timeOff.userId,
      groupId: timeOff.groupId,
      from: timeOff.from,
      to: timeOff.to,
      reason: timeOff.reason,
      status: timeOff.status,
      member: toMemberInfo(timeOff.user),
      groupTitle: timeOff.group.title,
    };
  }

  // ─── REPORTS / TIMES ────────────────────────────────────────

  async groupTimes(
    userId: string,
    groupId: string,
    from: string,
    to: string,
  ): Promise<TimeSpentViewModel[]> {
    await this.findGroupWithMembershipCheck(groupId, userId);

    const fromDate = parseDate(from, 'from');
    const toDate = parseDate(to, 'to');

    // Find all projects linked to this group
    const projects = await this.prisma.project.findMany({
      where: { groupId },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    // Find all task time spents within the date range for projects in this group
    const timeSpents = await this.prisma.taskTimeSpent.findMany({
      where: {
        projectId: { in: projectIds },
        begin: { gte: fromDate },
        end: { lte: toDate },
      },
      include: {
        task: true,
        user: true,
      },
      orderBy: { begin: 'asc' },
    });

    return timeSpents.map((ts) => ({
      style: {},
      parsed: {
        Day: ts.begin.getDate(),
        Month: ts.begin.getMonth() + 1,
        Year: ts.begin.getFullYear(),
        Hours: ts.begin.getHours(),
        Minutes: ts.begin.getMinutes(),
        Seconds: ts.begin.getSeconds(),
      },
      task: {
        id: ts.task.id,
        title: ts.task.title,
        state: ts.task.state,
        projectId: ts.task.projectId,
        packageId: ts.task.packageId,
        listId: ts.task.listId,
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
      } as any,
    }));
  }

  async report(
    userId: string,
    id: string,
    from: string,
    to: string,
  ): Promise<DayReportViewModel[]> {
    await this.findGroupWithMembershipCheck(id, userId);

    const fromDate = parseDate(from, 'from');
    const toDate = parseDate(to, 'to');

    // Find all projects linked to this group
    const projects = await this.prisma.project.findMany({
      where: { groupId: id },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      // Return empty day reports for the date range
      return this.buildEmptyDayReports(fromDate, toDate);
    }

    // Get all tasks for these projects within the date range
    const tasks = await this.prisma.workPackageTask.findMany({
      where: {
        projectId: { in: projectIds },
        createdAt: { lte: toDate },
      },
      select: {
        id: true,
        state: true,
        createdAt: true,
        doneAt: true,
      },
    });

    // Build day-by-day report
    const reports: DayReportViewModel[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Tasks that existed by this day
      const tasksUpToDay = tasks.filter((t) => t.createdAt <= dayEnd);

      let total = tasksUpToDay.length;
      let done = 0;
      let blocked = 0;
      let inProgress = 0;

      for (const task of tasksUpToDay) {
        if (task.doneAt && task.doneAt <= dayEnd) {
          done++;
        } else if (task.state === 5) {
          // WorkPackageTaskState.Blocked
          blocked++;
        } else if (task.state === 2) {
          // WorkPackageTaskState.InProgress
          inProgress++;
        }
      }

      reports.push({
        date: new Date(currentDate),
        total,
        done,
        blocked,
        inProgress,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return reports;
  }

  // ─── UPGRADE / CONNECT ──────────────────────────────────────

  async upgrade(userId: string, id: string): Promise<boolean> {
    // Mock: always succeed — billing integration placeholder
    await this.findGroupWithAccessCheck(id, userId, AccessType.Owner);
    this.logger.log(`Group upgrade requested: ${id} by user: ${userId}`);
    return true;
  }

  async nonAttached(userId: string, id: string): Promise<GroupViewModel[]> {
    await this.findGroupWithAccessCheck(id, userId, AccessType.Admin);

    // Collect ancestor IDs to prevent cycles
    const ancestorIds = new Set<string>([id]);
    let currentId: string | null = id;
    while (currentId) {
      const g: { parentId: string | null } | null = await this.prisma.group.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      if (g?.parentId) {
        ancestorIds.add(g.parentId);
        currentId = g.parentId;
      } else {
        currentId = null;
      }
    }

    // Find groups the user is a member of that have no parent and are not this group or its ancestors
    const groups = await this.prisma.group.findMany({
      where: {
        parentId: null,
        archivedAt: null,
        id: { notIn: Array.from(ancestorIds) },
        members: { some: { userId } },
      },
      include: membersInclude,
      orderBy: { title: 'asc' },
    });

    return groups.map((g) => toGroupViewModel(g));
  }

  async connect(userId: string, parentId: string, childId: string): Promise<boolean> {
    await this.findGroupWithAccessCheck(parentId, userId, AccessType.Admin);

    const child = await this.prisma.group.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Group not found');
    }

    // Verify user has access to the child group
    const childMembership = await this.prisma.groupMember.findFirst({
      where: { groupId: childId, userId },
    });
    if (!childMembership && child.userId !== userId) {
      throw new ForbiddenException('Access denied to this group');
    }

    // Determine rootId: if parent has a rootId use that, otherwise parent is the root
    const parent = await this.prisma.group.findUnique({
      where: { id: parentId },
      select: { rootId: true },
    });
    const rootId = parent?.rootId || parentId;

    await this.prisma.group.update({
      where: { id: childId },
      data: { parentId, rootId },
    });

    const memberIds = await this.getGroupMemberUserIds(parentId);
    this.domainEvent.emit({
      type: ActivityType.GroupEdit,
      actorId: userId,
      entityId: childId,
      entityType: 'group',
      recipientUserIds: memberIds,
      data: { groupId: childId, parentId },
      push: {
        title: 'Group updated',
        description: `Group connection was updated`,
        url: `/group/${parentId}`,
      },
    });

    return true;
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────

  /**
   * Finds a group by ID and verifies the user has at least the
   * required access level. Throws NotFoundException or ForbiddenException.
   */
  private async findGroupWithAccessCheck(
    groupId: string,
    userId: string,
    requiredAccess: AccessType,
  ): Promise<Group> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Owner always has full access
    if (group.userId === userId) {
      return group;
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    // Lower number = higher privilege (Owner=1, Admin=2, ...)
    if (membership.access > requiredAccess) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return group;
  }

  /**
   * Verifies that the user is a member of (or owner of) the given group.
   * Does not check a specific access level.
   */
  private async findGroupWithMembershipCheck(
    groupId: string,
    userId: string,
  ): Promise<Group> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.userId === userId) {
      return group;
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return group;
  }

  /**
   * Retrieves all user IDs who are members of a group (including the owner).
   */
  private async getGroupMemberUserIds(groupId: string): Promise<string[]> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true },
    });

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    const ids = new Set(members.map((m) => m.userId));
    if (group) {
      ids.add(group.userId);
    }

    return [...ids];
  }

  /**
   * Upserts a GroupMember record. If the membership already exists,
   * the access level is updated; otherwise a new record is created.
   */
  private async upsertGroupMember(
    groupId: string,
    userId: string,
    access: number,
  ): Promise<void> {
    await this.prisma.groupMember.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: { access },
      create: { userId, groupId, access },
    });
  }

  /**
   * Builds an array of empty DayReportViewModels for a date range.
   */
  private buildEmptyDayReports(from: Date, to: Date): DayReportViewModel[] {
    const reports: DayReportViewModel[] = [];
    const current = new Date(from);

    while (current <= to) {
      reports.push({
        date: new Date(current),
        total: 0,
        done: 0,
        blocked: 0,
        inProgress: 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return reports;
  }
}
