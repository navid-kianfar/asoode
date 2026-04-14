import { ref, computed, watch } from 'vue';
import { useFilesStore } from '@/stores/files.store';
import { useProjectStore } from '@/stores/project.store';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { useTaskStore } from '@/stores/task.store';
import { useMessengerStore } from '@/stores/messenger.store';
import { useFileUpload } from '@/composables/useFileUpload';
import {
  type ExplorerFileViewModel,
  type ExplorerFolderViewModel,
  OperationResultStatus,
  ConversationType,
  WorkPackageTaskAttachmentType,
  type ChannelType,
} from '@asoode/shared';

// ─── Types ────────────────────────────────────────────────────

export type FilesLocation =
  | { source: 'storage'; path: string }
  | { source: 'projects'; level: 'root' }
  | { source: 'projects'; level: 'project'; projectId: string }
  | { source: 'projects'; level: 'workpackage'; projectId: string; workpackageId: string }
  | { source: 'projects'; level: 'task'; projectId: string; workpackageId: string; taskId: string }
  | { source: 'channels'; level: 'root' }
  | { source: 'channels'; level: 'channel'; channelId: string };

export interface DisplayItem {
  id: string;
  type: 'folder' | 'file';
  name: string;
  icon: string;
  thumbnail?: string;
  url?: string;
  size?: number;
  createdAt?: Date;
  extension?: string;
  subtitle?: string;
  selected: boolean;
  sourceData: any;
  readonly: boolean;
}

export interface BreadcrumbItem {
  label: string;
  location: FilesLocation;
  icon?: string;
}

// ─── Composable ───────────────────────────────────────────────

export function useFilesNavigation() {
  const filesStore = useFilesStore();
  const projectStore = useProjectStore();
  const wpStore = useWorkPackageStore();
  const taskStore = useTaskStore();
  const messengerStore = useMessengerStore();
  const { getFileIcon } = useFileUpload();

  // State
  const currentLocation = ref<FilesLocation>({ source: 'storage', path: '/' });
  const displayItems = ref<DisplayItem[]>([]);
  const loading = ref(false);
  const viewMode = ref<'grid' | 'list'>('grid');
  const sortBy = ref<'name' | 'date' | 'size'>('name');
  const sortOrder = ref<'asc' | 'desc'>('asc');

  // Cached names for breadcrumbs
  const nameCache = ref<Record<string, string>>({});

  // ─── Selection ────────────────────────────────────────────

  const selectedItems = computed(() => displayItems.value.filter((i) => i.selected));
  const hasSelection = computed(() => selectedItems.value.length > 0);
  const singleSelection = computed(() =>
    selectedItems.value.length === 1 ? selectedItems.value[0] : null,
  );

  // ─── Capabilities ────────────────────────────────────────

  const isStorage = computed(() => currentLocation.value.source === 'storage');
  const canUpload = computed(() => isStorage.value);
  const canCreateFolder = computed(() => isStorage.value);
  const canDelete = computed(() => isStorage.value && hasSelection.value);
  const canRename = computed(() => isStorage.value && singleSelection.value !== null);
  const canCopyLink = computed(() => singleSelection.value?.type === 'file' && !!singleSelection.value?.url);
  const canDownload = computed(() => singleSelection.value?.type === 'file' && !!singleSelection.value?.url);
  const canPreview = computed(() => {
    const item = singleSelection.value;
    if (!item || item.type !== 'file') return false;
    const ext = (item.extension || '').toLowerCase();
    const previewable = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    return previewable.includes(ext);
  });

  // ─── Breadcrumbs ──────────────────────────────────────────

  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const loc = currentLocation.value;
    const crumbs: BreadcrumbItem[] = [];

    if (loc.source === 'storage') {
      crumbs.push({
        label: 'FILES',
        location: { source: 'storage', path: '/' },
        icon: 'mdi-folder-lock',
      });
      if (loc.path !== '/') {
        const segments = loc.path.split('/').filter(Boolean);
        let buildPath = '/';
        for (const seg of segments) {
          buildPath += seg + '/';
          crumbs.push({
            label: seg,
            location: { source: 'storage', path: buildPath },
          });
        }
      }
    } else if (loc.source === 'projects') {
      crumbs.push({
        label: 'PROJECTS',
        location: { source: 'projects', level: 'root' },
        icon: 'mdi-briefcase',
      });
      if (loc.level !== 'root') {
        crumbs.push({
          label: nameCache.value[loc.projectId] || '...',
          location: { source: 'projects', level: 'project', projectId: loc.projectId },
        });
      }
      if (loc.level === 'workpackage' || loc.level === 'task') {
        crumbs.push({
          label: nameCache.value[loc.workpackageId] || '...',
          location: {
            source: 'projects',
            level: 'workpackage',
            projectId: loc.projectId,
            workpackageId: loc.workpackageId,
          },
        });
      }
      if (loc.level === 'task') {
        crumbs.push({
          label: nameCache.value[loc.taskId] || '...',
          location: loc,
        });
      }
    } else if (loc.source === 'channels') {
      crumbs.push({
        label: 'CHANNELS',
        location: { source: 'channels', level: 'root' },
        icon: 'mdi-message-text',
      });
      if (loc.level === 'channel') {
        crumbs.push({
          label: nameCache.value[loc.channelId] || '...',
          location: loc,
        });
      }
    }

    return crumbs;
  });

  // ─── Navigation ───────────────────────────────────────────

  async function navigateTo(location: FilesLocation) {
    currentLocation.value = location;
    loading.value = true;
    clearSelection();

    try {
      if (location.source === 'storage') {
        await fetchStorage(location.path);
      } else if (location.source === 'projects') {
        await fetchProjects(location);
      } else if (location.source === 'channels') {
        await fetchChannels(location);
      }
    } finally {
      loading.value = false;
      applySorting();
    }
  }

  async function fetchStorage(path: string) {
    const op = await filesStore.myFiles(path);
    if (op.status !== OperationResultStatus.Success) return;
    const data = op.data!;
    const items: DisplayItem[] = [];

    for (const folder of data.folders) {
      items.push({
        id: folder.path,
        type: 'folder',
        name: folder.name,
        icon: 'mdi-folder',
        createdAt: folder.createdAt,
        selected: false,
        sourceData: folder,
        readonly: false,
      });
    }

    for (const file of data.files) {
      items.push({
        id: file.path,
        type: 'file',
        name: file.name,
        icon: getFileIcon(file.extension),
        thumbnail: file.thumbnail || undefined,
        url: file.url,
        size: file.size,
        extension: file.extension,
        createdAt: file.createdAt,
        selected: false,
        sourceData: file,
        readonly: false,
      });
    }

    displayItems.value = items;
  }

  async function fetchProjects(location: FilesLocation & { source: 'projects' }) {
    if (location.level === 'root') {
      if (!projectStore.projects.length) {
        await projectStore.load();
      }
      displayItems.value = projectStore.projects
        .filter((p) => !p.archivedAt)
        .map((p) => {
          nameCache.value[p.id] = p.title;
          return {
            id: p.id,
            type: 'folder' as const,
            name: p.title,
            icon: 'mdi-briefcase',
            subtitle: `${p.workPackages?.length || 0} work packages`,
            selected: false,
            sourceData: p,
            readonly: true,
          };
        });
    } else if (location.level === 'project') {
      const op = await projectStore.fetchProject(location.projectId);
      if (op.status !== OperationResultStatus.Success) return;
      const project = op.data!;
      nameCache.value[project.id] = project.title;

      displayItems.value = (project.workPackages || [])
        .filter((wp: any) => !wp.archivedAt)
        .map((wp: any) => {
          nameCache.value[wp.id] = wp.title;
          return {
            id: wp.id,
            type: 'folder' as const,
            name: wp.title,
            icon: 'mdi-package-variant',
            subtitle: wp.color ? undefined : undefined,
            selected: false,
            sourceData: wp,
            readonly: true,
          };
        });
    } else if (location.level === 'workpackage') {
      const op = await wpStore.fetch(location.workpackageId);
      if (op.status !== OperationResultStatus.Success) return;
      const wp = op.data!;
      nameCache.value[wp.id] = wp.title;

      // Flatten tasks from all lists, only show those with attachments
      const allTasks = (wp.lists || []).flatMap((list: any) =>
        (list.tasks || []).map((task: any) => ({ ...task, listName: list.title })),
      );

      displayItems.value = allTasks
        .filter((t: any) => t.attachmentCount > 0 && !t.archivedAt)
        .map((t: any) => {
          nameCache.value[t.id] = t.title;
          return {
            id: t.id,
            type: 'folder' as const,
            name: t.title,
            icon: 'mdi-checkbox-marked-outline',
            subtitle: `${t.attachmentCount} attachment${t.attachmentCount !== 1 ? 's' : ''}`,
            selected: false,
            sourceData: t,
            readonly: true,
          };
        });
    } else if (location.level === 'task') {
      const op = await taskStore.fetchTask(location.taskId);
      if (op.status !== OperationResultStatus.Success) return;
      const task = op.data!;
      nameCache.value[task.id] = task.title;

      displayItems.value = (task.attachments || [])
        .filter((a: any) => a.type === WorkPackageTaskAttachmentType.Upload)
        .map((a: any) => {
          const ext = (a.title || '').split('.').pop()?.toLowerCase() || '';
          return {
            id: a.id,
            type: 'file' as const,
            name: a.title,
            icon: getFileIcon(ext),
            thumbnail: a.thumbnailPath || undefined,
            url: a.path,
            extension: ext,
            createdAt: a.createdAt,
            selected: false,
            sourceData: a,
            readonly: true,
          };
        });
    }
  }

  async function fetchChannels(location: FilesLocation & { source: 'channels' }) {
    if (location.level === 'root') {
      if (!messengerStore.channels.directs.length) {
        await messengerStore.load();
      }
      displayItems.value = messengerStore.channels.directs.map((ch) => {
        nameCache.value[ch.id] = ch.title || 'Direct Message';
        return {
          id: ch.id,
          type: 'folder' as const,
          name: ch.title || 'Direct Message',
          icon: ch.type === 1 ? 'mdi-account' : 'mdi-pound',
          selected: false,
          sourceData: ch,
          readonly: true,
        };
      });
    } else if (location.level === 'channel') {
      const op = await messengerStore.channelFiles(location.channelId);
      if (op.status !== OperationResultStatus.Success) return;
      const files = op.data || [];

      displayItems.value = files
        .filter((c) => c.type === ConversationType.Upload && c.path)
        .map((c) => {
          const ext = (c.message || '').split('.').pop()?.toLowerCase() || '';
          return {
            id: c.id,
            type: 'file' as const,
            name: c.message || 'Uploaded file',
            icon: getFileIcon(ext),
            url: c.path,
            extension: ext,
            createdAt: c.createdAt,
            selected: false,
            sourceData: c,
            readonly: true,
          };
        });
    }
  }

  // ─── Selection ────────────────────────────────────────────

  function selectItem(item: DisplayItem, multi = false) {
    if (multi) {
      item.selected = !item.selected;
    } else {
      displayItems.value.forEach((i) => (i.selected = false));
      item.selected = true;
    }
  }

  function clearSelection() {
    displayItems.value.forEach((i) => (i.selected = false));
  }

  // ─── Sorting ──────────────────────────────────────────────

  function setSorting(by: 'name' | 'date' | 'size', order: 'asc' | 'desc') {
    sortBy.value = by;
    sortOrder.value = order;
    applySorting();
  }

  function applySorting() {
    const folders = displayItems.value.filter((i) => i.type === 'folder');
    const files = displayItems.value.filter((i) => i.type === 'file');
    const mult = sortOrder.value === 'asc' ? 1 : -1;

    const sortFn = (a: DisplayItem, b: DisplayItem) => {
      if (sortBy.value === 'name') {
        return a.name.localeCompare(b.name) * mult;
      }
      if (sortBy.value === 'date') {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (da - db) * mult;
      }
      if (sortBy.value === 'size') {
        return ((a.size || 0) - (b.size || 0)) * mult;
      }
      return 0;
    };

    folders.sort(sortFn);
    files.sort(sortFn);
    displayItems.value = [...folders, ...files];
  }

  // ─── Helpers ──────────────────────────────────────────────

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  return {
    // State
    currentLocation,
    displayItems,
    loading,
    viewMode,
    sortBy,
    sortOrder,
    breadcrumbs,
    nameCache,

    // Selection
    selectedItems,
    hasSelection,
    singleSelection,

    // Capabilities
    isStorage,
    canUpload,
    canCreateFolder,
    canDelete,
    canRename,
    canCopyLink,
    canDownload,
    canPreview,

    // Actions
    navigateTo,
    selectItem,
    clearSelection,
    setSorting,
    formatFileSize,
  };
}
