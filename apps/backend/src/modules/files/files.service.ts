import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ExplorerViewModel,
  ExplorerFileViewModel,
  ExplorerFolderViewModel,
  NewFolderDto,
  RenameDto,
  DeleteDto,
  ActivityType,
} from '@asoode/shared';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { DomainEventService } from '../../common/services/domain-event.service';
import { IStorageService, STORAGE_SERVICE } from '../../common/storage';

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
  'bash', 'ps1', 'r', 'lua', 'scala', 'hs', 'elm', 'ex', 'exs', 'erl',
]);

function detectFileType(extension: string): {
  isImage: boolean;
  isPdf: boolean;
  isSpreadsheet: boolean;
  isDocument: boolean;
  isPresentation: boolean;
  isArchive: boolean;
  isExecutable: boolean;
  isCode: boolean;
  isOther: boolean;
} {
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
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvent: DomainEventService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────

  private toFileViewModel(entry: {
    userId: string;
    path: string;
    storageKey: string;
    name: string;
    extension: string;
    size: bigint;
    createdAt: Date;
  }): ExplorerFileViewModel {
    const ext = entry.extension.toLowerCase().replace(/^\./, '');
    const extensionLessName = entry.name.replace(/\.[^/.]+$/, '');
    const fileTypes = detectFileType(ext);
    const url = this.storage.getPublicUrl(entry.storageKey || entry.path);
    const thumbnail = fileTypes.isImage ? url : '';

    return {
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
    };
  }

  private toFolderViewModel(entry: {
    path: string;
    name: string;
    createdAt: Date;
  }): ExplorerFolderViewModel {
    const parts = entry.path.split('/').filter(Boolean);
    const parent = parts.length > 1
      ? '/' + parts.slice(0, -1).join('/')
      : '/';

    return {
      parent,
      path: entry.path,
      name: entry.name,
      createdAt: entry.createdAt,
      selected: false,
    };
  }

  private buildExplorerViewModel(entries: {
    userId: string;
    name: string;
    path: string;
    storageKey: string;
    extension: string;
    size: bigint;
    isFolder: boolean;
    createdAt: Date;
  }[]): ExplorerViewModel {
    const files: ExplorerFileViewModel[] = [];
    const folders: ExplorerFolderViewModel[] = [];

    for (const entry of entries) {
      if (entry.isFolder) {
        folders.push(this.toFolderViewModel(entry));
      } else {
        files.push(this.toFileViewModel(entry));
      }
    }

    return { files, folders };
  }

  private normalizePath(path: string): string {
    if (!path) return '/';
    let normalized = path.startsWith('/') ? path : '/' + path;
    if (!normalized.endsWith('/')) normalized += '/';
    return normalized;
  }

  // ─── MINE ─────────────────────────────────────────────────────

  async mine(userId: string, path: string): Promise<ExplorerViewModel> {
    const normalizedPath = this.normalizePath(path);

    const entries = await this.prisma.fileEntry.findMany({
      where: {
        userId,
        sharedWithUserId: null,
        path: { startsWith: normalizedPath },
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' },
      ],
    });

    // Only return direct children (not deeply nested)
    const directChildren = entries.filter((entry) => {
      const relativePath = entry.path.slice(normalizedPath.length);
      const segments = relativePath.split('/').filter(Boolean);
      return segments.length <= 1;
    });

    return this.buildExplorerViewModel(directChildren);
  }

  // ─── SHARED BY ME ─────────────────────────────────────────────

  async sharedByMe(userId: string, path: string): Promise<ExplorerViewModel> {
    const normalizedPath = this.normalizePath(path);

    const entries = await this.prisma.fileEntry.findMany({
      where: {
        userId,
        sharedWithUserId: { not: null },
        path: { startsWith: normalizedPath },
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' },
      ],
    });

    return this.buildExplorerViewModel(entries);
  }

  // ─── SHARED BY OTHERS ────────────────────────────────────────

  async sharedByOthers(userId: string, path: string): Promise<ExplorerViewModel> {
    const normalizedPath = this.normalizePath(path);

    const entries = await this.prisma.fileEntry.findMany({
      where: {
        sharedWithUserId: userId,
        path: { startsWith: normalizedPath },
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' },
      ],
    });

    return this.buildExplorerViewModel(entries);
  }

  // ─── NEW FOLDER ───────────────────────────────────────────────

  async newFolder(userId: string, dto: NewFolderDto): Promise<boolean> {
    if (!dto.name?.trim()) {
      return false;
    }

    const normalizedPath = this.normalizePath(dto.path);
    const folderPath = `${normalizedPath}${dto.name.trim()}/`;

    // Check for duplicate folder name at this path
    const existing = await this.prisma.fileEntry.findFirst({
      where: {
        userId,
        path: folderPath,
        isFolder: true,
      },
    });

    if (existing) {
      return false;
    }

    const entry = await this.prisma.fileEntry.create({
      data: {
        userId,
        name: dto.name.trim(),
        path: folderPath,
        extension: '',
        size: 0,
        isFolder: true,
      },
    });

    this.domainEvent.emit({
      type: ActivityType.FolderCreate,
      actorId: userId,
      entityId: entry.id,
      entityType: 'file',
      recipientUserIds: [userId],
      data: { id: entry.id, name: entry.name, path: folderPath, isFolder: true },
    });

    return true;
  }

  // ─── RENAME ───────────────────────────────────────────────────

  async rename(userId: string, dto: RenameDto): Promise<boolean> {
    if (!dto.name?.trim() || !dto.path) {
      return false;
    }

    const entry = await this.prisma.fileEntry.findFirst({
      where: { userId, path: dto.path },
    });

    if (!entry) {
      throw new NotFoundException('File or folder not found');
    }

    const newName = dto.name.trim();
    let newPath: string;

    if (entry.isFolder) {
      const parts = entry.path.split('/').filter(Boolean);
      parts[parts.length - 1] = newName;
      newPath = '/' + parts.join('/') + '/';
    } else {
      const extension = newName.includes('.')
        ? newName.split('.').pop() ?? ''
        : entry.extension;
      const parts = entry.path.split('/').filter(Boolean);
      parts[parts.length - 1] = newName;
      newPath = '/' + parts.join('/');

      await this.prisma.fileEntry.update({
        where: { id: entry.id },
        data: {
          name: newName,
          path: newPath,
          extension,
        },
      });

      this.domainEvent.emit({
        type: ActivityType.FileRename,
        actorId: userId,
        entityId: entry.id,
        entityType: 'file',
        recipientUserIds: [userId],
        data: { id: entry.id, name: newName, path: newPath, oldPath: dto.path, isFolder: false },
      });

      return true;
    }

    await this.prisma.fileEntry.update({
      where: { id: entry.id },
      data: {
        name: newName,
        path: newPath,
      },
    });

    this.domainEvent.emit({
      type: ActivityType.FileRename,
      actorId: userId,
      entityId: entry.id,
      entityType: 'file',
      recipientUserIds: [userId],
      data: { id: entry.id, name: newName, path: newPath, oldPath: dto.path, isFolder: true },
    });

    return true;
  }

  // ─── DELETE ───────────────────────────────────────────────────

  async delete(userId: string, dto: DeleteDto): Promise<boolean> {
    if (!dto.path) {
      return false;
    }

    const entry = await this.prisma.fileEntry.findFirst({
      where: { userId, path: dto.path },
    });

    if (!entry) {
      throw new NotFoundException('File or folder not found');
    }

    if (entry.isFolder) {
      // Delete all entries within this folder
      const childEntries = await this.prisma.fileEntry.findMany({
        where: {
          userId,
          path: { startsWith: entry.path },
          isFolder: false,
        },
      });

      // Delete MinIO objects for all files within the folder
      for (const child of childEntries) {
        try {
          await this.storage.delete(child.storageKey || child.path);
        } catch {
          this.logger.warn(`Failed to delete MinIO object: ${child.storageKey || child.path}`);
        }
      }

      // Delete all file entries within the folder (including the folder itself)
      await this.prisma.fileEntry.deleteMany({
        where: {
          userId,
          path: { startsWith: entry.path },
        },
      });
    } else {
      // Delete MinIO object
      try {
        await this.storage.delete(entry.storageKey || entry.path);
      } catch {
        this.logger.warn(`Failed to delete MinIO object: ${entry.storageKey || entry.path}`);
      }

      await this.prisma.fileEntry.delete({ where: { id: entry.id } });
    }

    this.domainEvent.emit({
      type: ActivityType.FileDelete,
      actorId: userId,
      entityId: entry.id,
      entityType: 'file',
      recipientUserIds: [userId],
      data: { id: entry.id, path: dto.path, isFolder: entry.isFolder },
    });

    return true;
  }

  // ─── UPLOAD ───────────────────────────────────────────────────

  async upload(
    userId: string,
    path: string,
    files: Express.Multer.File[],
  ): Promise<boolean> {
    if (!files || files.length === 0) {
      return false;
    }

    const normalizedPath = this.normalizePath(path);

    for (const file of files) {
      const extension = file.originalname.split('.').pop() ?? '';
      const storageKey = `files/${userId}/${uuidv4()}.${extension}`;

      await this.storage.upload(storageKey, file.buffer, file.mimetype, file.size);

      const filePath = `${normalizedPath}${file.originalname}`;

      const entry = await this.prisma.fileEntry.create({
        data: {
          userId,
          name: file.originalname,
          path: filePath,
          storageKey,
          extension,
          size: file.size,
          isFolder: false,
        },
      });

      this.domainEvent.emit({
        type: ActivityType.FileUpload,
        actorId: userId,
        entityId: entry.id,
        entityType: 'file',
        recipientUserIds: [userId],
        data: {
          id: entry.id,
          name: file.originalname,
          path: filePath,
          extension,
          url: this.storage.getPublicUrl(storageKey),
          isFolder: false,
        },
      });
    }

    return true;
  }
}
