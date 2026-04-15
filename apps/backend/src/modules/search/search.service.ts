import { Injectable, Logger } from '@nestjs/common';
import {
  SearchResultViewModel,
  SearchTaskViewModel,
  SearchStorageViewModel,
  ProjectViewModel,
  GroupViewModel,
  MemberInfoViewModel,
  ExplorerFileViewModel,
  ExplorerFolderViewModel,
  AccessType,
  WorkPackageTaskState,
  WorkPackageViewModel,
} from '@asoode/shared';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { IStorageService, STORAGE_SERVICE } from '../../common/storage';

const SEARCH_LIMIT = 20;

// ─── File Type Detection ───────────────────────────────────────

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif',
]);
const PDF_EXTENSIONS = new Set(['pdf']);
const SPREADSHEET_EXTENSIONS = new Set([
  'xls', 'xlsx', 'xlsm', 'csv', 'ods', 'tsv',
]);
const DOCUMENT_EXTENSIONS = new Set([
  'doc', 'docx', 'odt', 'rtf', 'txt', 'pages',
]);
const PRESENTATION_EXTENSIONS = new Set([
  'ppt', 'pptx', 'odp', 'key',
]);
const ARCHIVE_EXTENSIONS = new Set([
  'zip', 'rar', 'tar', 'gz', 'bz2', '7z', 'xz', 'tgz',
]);
const EXECUTABLE_EXTENSIONS = new Set([
  'exe', 'msi', 'dmg', 'app', 'bat', 'sh', 'cmd', 'deb', 'rpm', 'apk',
]);
const CODE_EXTENSIONS = new Set([
  'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs',
  'rb', 'php', 'swift', 'kt', 'dart', 'vue', 'svelte', 'html', 'css',
  'scss', 'sass', 'less', 'json', 'xml', 'yaml', 'yml', 'sql', 'sh',
]);

function detectFileType(extension: string) {
  const ext = extension.toLowerCase().replace(/^\./, '');
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isPdf = PDF_EXTENSIONS.has(ext);
  const isSpreadsheet = SPREADSHEET_EXTENSIONS.has(ext);
  const isDocument = DOCUMENT_EXTENSIONS.has(ext);
  const isPresentation = PRESENTATION_EXTENSIONS.has(ext);
  const isArchive = ARCHIVE_EXTENSIONS.has(ext);
  const isExecutable = EXECUTABLE_EXTENSIONS.has(ext);
  const isCode = CODE_EXTENSIONS.has(ext);
  const isOther = !isImage && !isPdf && !isSpreadsheet && !isDocument
    && !isPresentation && !isArchive && !isExecutable && !isCode;

  return {
    isImage, isPdf, isSpreadsheet, isDocument,
    isPresentation, isArchive, isExecutable, isCode, isOther,
  };
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
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

  // ─── SEARCH ───────────────────────────────────────────────────

  async search(userId: string, query: string): Promise<SearchResultViewModel> {
    const trimmedQuery = query?.trim() ?? '';

    if (!trimmedQuery) {
      return {
        tasks: [],
        projects: [],
        workPackages: [],
        groups: [],
        storage: { files: [], folders: [] },
        members: [],
      };
    }

    // Run all search queries in parallel
    const [tasks, projects, workPackages, groups, members, storage] = await Promise.all([
      this.searchTasks(userId, trimmedQuery),
      this.searchProjects(userId, trimmedQuery),
      this.searchWorkPackages(userId, trimmedQuery),
      this.searchGroups(userId, trimmedQuery),
      this.searchMembers(trimmedQuery),
      this.searchStorage(userId, trimmedQuery),
    ]);

    return {
      tasks,
      projects,
      workPackages,
      groups,
      storage,
      members,
    } as any;
  }

  // ─── SEARCH TASKS ────────────────────────────────────────────

  private async searchTasks(
    userId: string,
    query: string,
  ): Promise<SearchTaskViewModel[]> {
    // Find projects where user is a member
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
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        list: {
          include: {
            workPackage: {
              include: {
                project: { select: { title: true } },
              },
            },
          },
        },
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
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    return tasks.map((task) => {
      const list = task.list as any;
      return {
        id: task.id,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        state: task.state as WorkPackageTaskState,
        title: task.title,
        description: task.description,
        archivedAt: task.archivedAt as Date,
        list: list?.title ?? '',
        workPackage: list?.workPackage?.title ?? '',
        project: list?.workPackage?.project?.title ?? '',
        workPackageId: list?.packageId ?? '',
        projectId: task.projectId,
        labels: task.labels.map((tl: any) => ({
          title: tl.label?.title ?? '',
          color: tl.label?.color ?? '',
          dark: tl.label?.darkColor ?? false,
        })),
        members: task.members
          .filter((m: any) => m.user)
          .map((m: any) => this.toMemberInfo(m.user)),
      };
    });
  }

  // ─── SEARCH PROJECTS ─────────────────────────────────────────

  private async searchProjects(
    userId: string,
    query: string,
  ): Promise<ProjectViewModel[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { recordId: userId } } },
        ],
        AND: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      userId: p.userId,
      title: p.title,
      description: p.description,
      template: p.template,
      complex: p.complex,
      premium: p.premium,
      archivedAt: p.archivedAt ?? undefined,
      tasks: p.tasks,
      attachmentSize: Number(p.attachmentSize),
      membersCapacity: p.membersCapacity,
      membersUsed: p.membersUsed,
      diskSpaceCapacity: Number(p.diskSpaceCapacity),
      diskSpaceUsed: Number(p.diskSpaceUsed),
      members: [],
      pending: [],
      seasons: [],
      objectives: [],
      subProjects: [],
      workPackages: [],
    }));
  }

  // ─── SEARCH WORK PACKAGES ────────────────────────────────────

  private async searchWorkPackages(
    userId: string,
    query: string,
  ): Promise<WorkPackageViewModel[]> {
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

    const wps = await this.prisma.workPackage.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        project: { select: { title: true } },
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    return wps.map((wp) => ({
      id: wp.id,
      createdAt: wp.createdAt,
      updatedAt: wp.updatedAt,
      userId: wp.userId,
      projectId: wp.projectId,
      title: wp.title,
      description: wp.description,
      order: wp.order,
      color: wp.color,
      darkColor: wp.darkColor,
      // Additional fields for context to be used in UI
      projectTitle: (wp as any).project?.title,
    })) as any;
  }

  // ─── SEARCH GROUPS ────────────────────────────────────────────

  private async searchGroups(
    userId: string,
    query: string,
  ): Promise<GroupViewModel[]> {
    const groups = await this.prisma.group.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
        AND: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    return groups.map((g) => ({
      id: g.id,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      userId: g.userId,
      parentId: g.parentId ?? undefined,
      rootId: g.rootId ?? undefined,
      type: g.type,
      title: g.title,
      subTitle: g.subTitle,
      brandTitle: g.brandTitle,
      description: g.description,
      email: g.email,
      website: g.website,
      postalCode: g.postalCode,
      address: g.address,
      tel: g.tel,
      fax: g.fax,
      geoLocation: g.geoLocation ?? undefined,
      nationalId: g.nationalId,
      registrationId: g.registrationId,
      supervisorName: g.supervisorName,
      supervisorNumber: g.supervisorNumber,
      responsibleName: g.responsibleName,
      responsibleNumber: g.responsibleNumber,
      avatar: g.avatar ?? undefined,
      avatarId: g.avatar ?? '',
      premium: g.premium,
      complex: g.complex,
      archivedAt: g.archivedAt ?? undefined,
      membersCapacity: g.membersCapacity,
      membersUsed: g.membersUsed,
      diskSpaceCapacity: Number(g.diskSpaceCapacity),
      diskSpaceUsed: Number(g.diskSpaceUsed),
      attachmentSize: Number(g.attachmentSize),
      offices: g.offices,
      employees: g.employees,
      registeredAt: g.registeredAt ?? undefined,
      expireAt: g.expireAt ?? undefined,
      members: [],
      pending: [],
    }));
  }

  // ─── SEARCH MEMBERS ──────────────────────────────────────────

  private async searchMembers(query: string): Promise<MemberInfoViewModel[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        avatar: true,
        firstName: true,
        lastName: true,
        username: true,
        bio: true,
      },
      take: SEARCH_LIMIT,
    });

    return users.map((u) => this.toMemberInfo(u));
  }

  // ─── SEARCH STORAGE ──────────────────────────────────────────

  private async searchStorage(
    userId: string,
    query: string,
  ): Promise<SearchStorageViewModel> {
    const entries = await this.prisma.fileEntry.findMany({
      where: {
        userId,
        name: { contains: query, mode: 'insensitive' },
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    const files: ExplorerFileViewModel[] = [];
    const folders: ExplorerFolderViewModel[] = [];

    for (const entry of entries) {
      if (entry.isFolder) {
        const parts = entry.path.split('/').filter(Boolean);
        const parent = parts.length > 1
          ? '/' + parts.slice(0, -1).join('/')
          : '/';

        folders.push({
          parent,
          path: entry.path,
          name: entry.name,
          createdAt: entry.createdAt,
          selected: false,
        });
      } else {
        const ext = entry.extension.toLowerCase().replace(/^\./, '');
        const extensionLessName = entry.name.replace(/\.[^/.]+$/, '');
        const fileTypes = detectFileType(ext);
        const url = this.storage.getPublicUrl(entry.path);
        const thumbnail = fileTypes.isImage ? url : '';

        files.push({
          userId: entry.userId,
          path: entry.path,
          name: entry.name,
          extensionLessName,
          extension: ext,
          url,
          thumbnail,
          size: Number(entry.size),
          createdAt: entry.createdAt,
          selected: false,
          ...fileTypes,
        });
      }
    }

    return { files, folders };
  }
}
