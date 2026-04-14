<template>
  <div class="fp">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="!sidebarCollapsed && isMobile"
      class="fp-sidebar-backdrop"
      @click="sidebarCollapsed = true"
    ></div>

    <!-- Sidebar -->
    <FilesSidebar
      :location="nav.currentLocation.value"
      :collapsed="sidebarCollapsed"
      @navigate="onSidebarNavigate"
      @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
    />

    <!-- Mobile sidebar toggle -->
    <button
      v-if="sidebarCollapsed"
      class="fp-sidebar-toggle"
      @click="sidebarCollapsed = false"
    >
      <i class="mdi mdi-menu"></i>
    </button>

    <!-- Main content -->
    <div class="fp-main">
      <FilesToolbar
        :breadcrumbs="nav.breadcrumbs.value"
        :view-mode="nav.viewMode.value"
        :sort-by="nav.sortBy.value"
        :sort-order="nav.sortOrder.value"
        :can-upload="nav.canUpload.value"
        :can-create-folder="nav.canCreateFolder.value"
        :can-delete="nav.canDelete.value"
        :can-rename="nav.canRename.value"
        :can-copy-link="nav.canCopyLink.value"
        :can-download="nav.canDownload.value"
        :can-preview="nav.canPreview.value"
        :has-selection="nav.hasSelection.value"
        @navigate="nav.navigateTo"
        @toggle-view="nav.viewMode.value = $event"
        @action="handleAction"
        @sort-change="nav.setSorting"
      />

      <FilesContentArea
        :items="nav.displayItems.value"
        :view-mode="nav.viewMode.value"
        :loading="nav.loading.value"
        :show-upload-action="nav.isStorage.value"
        @select="onSelect"
        @open="onOpen"
        @click-outside="nav.clearSelection()"
        @upload-action="prepareUpload"
      />
    </div>

    <!-- Hidden file input -->
    <input
      ref="filePicker"
      :accept="allowedTypes"
      multiple
      hidden
      type="file"
      @change="onFileChange"
    />

    <!-- Modals -->
    <FilesPreviewModal
      :visible="preview.visible"
      :url="preview.url"
      :title="preview.title"
      :extension="preview.extension"
      @close="preview.visible = false"
    />

    <FilesRenameModal
      :visible="renameModal.visible"
      :name="renameModal.name"
      @close="renameModal.visible = false"
      @rename="doRename"
    />

    <FilesNewFolderModal
      ref="newFolderRef"
      :visible="newFolderVisible"
      @close="newFolderVisible = false"
      @create="doNewFolder"
    />

    <FilesDeleteModal
      :visible="deleteVisible"
      @close="deleteVisible = false"
      @confirm="doDelete"
    />

    <!-- Upload overlay -->
    <FilesUploadOverlay :uploads="filesStore.uploading" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useFilesStore } from '@/stores/files.store';
import { useViewContext } from '@/composables/useViewContext';
import { useFilesSocketHandlers } from '@/composables/useFilesSocketHandlers';
import { useFilesNavigation, type DisplayItem, type FilesLocation } from '@/composables/useFilesNavigation';
import { OperationResultStatus } from '@asoode/shared';

import FilesSidebar from '@/components/features/files/FilesSidebar.vue';
import FilesToolbar from '@/components/features/files/FilesToolbar.vue';
import FilesContentArea from '@/components/features/files/FilesContentArea.vue';
import FilesPreviewModal from '@/components/features/files/FilesPreviewModal.vue';
import FilesRenameModal from '@/components/features/files/FilesRenameModal.vue';
import FilesNewFolderModal from '@/components/features/files/FilesNewFolderModal.vue';
import FilesDeleteModal from '@/components/features/files/FilesDeleteModal.vue';
import FilesUploadOverlay from '@/components/features/files/FilesUploadOverlay.vue';

const filesStore = useFilesStore();
const nav = useFilesNavigation();
useViewContext('files', 'active');
useFilesSocketHandlers(() => nav.navigateTo(nav.currentLocation.value));

const isMobile = ref(window.innerWidth <= 768);
const sidebarCollapsed = ref(isMobile.value);
const filePicker = ref<HTMLInputElement | null>(null);
const newFolderRef = ref<InstanceType<typeof FilesNewFolderModal> | null>(null);

function onResize() {
  isMobile.value = window.innerWidth <= 768;
}

// Modal states
const preview = reactive({ visible: false, url: '', title: '', extension: '' });
const renameModal = reactive({ visible: false, name: '', path: '' });
const newFolderVisible = ref(false);
const deleteVisible = ref(false);

const allowedTypes = [
  'image/*', 'audio/*', 'video/*',
  '.xls,.xlsx,.csv', '.zip,.rar,.7z,.tar,.gz',
  '.pdf', '.moho', '.ppt,.pptx', '.doc,.docx,.rtf,.txt',
].join(',');

onMounted(() => {
  window.addEventListener('resize', onResize);
  nav.navigateTo({ source: 'storage', path: '/' });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});

function onSidebarNavigate(location: FilesLocation) {
  nav.navigateTo(location);
  if (isMobile.value) {
    sidebarCollapsed.value = true;
  }
}

// ─── Item interactions ────────────────────────────────────

function onSelect(item: DisplayItem, event: MouseEvent) {
  nav.selectItem(item, event.ctrlKey || event.metaKey);
}

function onOpen(item: DisplayItem) {
  if (item.type === 'folder') {
    openFolder(item);
  } else {
    openFile(item);
  }
}

function openFolder(item: DisplayItem) {
  const loc = nav.currentLocation.value;

  if (loc.source === 'storage') {
    const folder = item.sourceData;
    nav.navigateTo({ source: 'storage', path: folder.path });
  } else if (loc.source === 'projects') {
    if ('level' in loc) {
      if (loc.level === 'root') {
        nav.navigateTo({ source: 'projects', level: 'project', projectId: item.id });
      } else if (loc.level === 'project') {
        nav.navigateTo({
          source: 'projects',
          level: 'workpackage',
          projectId: loc.projectId,
          workpackageId: item.id,
        });
      } else if (loc.level === 'workpackage') {
        nav.navigateTo({
          source: 'projects',
          level: 'task',
          projectId: loc.projectId,
          workpackageId: loc.workpackageId,
          taskId: item.id,
        });
      }
    }
  } else if (loc.source === 'channels') {
    if ('level' in loc && loc.level === 'root') {
      nav.navigateTo({ source: 'channels', level: 'channel', channelId: item.id });
    }
  }
}

function openFile(item: DisplayItem) {
  if (item.url) {
    const ext = item.extension || '';
    preview.url = item.url;
    preview.title = item.name;
    preview.extension = ext;
    preview.visible = true;
  }
}

// ─── Actions ──────────────────────────────────────────────

function handleAction(action: string) {
  switch (action) {
    case 'new-folder':
      newFolderVisible.value = true;
      break;
    case 'upload':
      prepareUpload();
      break;
    case 'delete':
      deleteVisible.value = true;
      break;
    case 'rename': {
      const item = nav.singleSelection.value;
      if (!item) return;
      const sourceName = item.type === 'file'
        ? item.sourceData.extensionLessName || item.name.replace(/\.[^/.]+$/, '')
        : item.name;
      renameModal.name = sourceName;
      renameModal.path = item.sourceData.path;
      renameModal.visible = true;
      break;
    }
    case 'copy-link': {
      const item = nav.singleSelection.value;
      if (item?.url) navigator.clipboard.writeText(item.url);
      break;
    }
    case 'download': {
      const item = nav.singleSelection.value;
      if (item?.url) window.open(item.url, '_blank');
      break;
    }
    case 'preview': {
      const item = nav.singleSelection.value;
      if (item) openFile(item);
      break;
    }
  }
}

function prepareUpload() {
  filePicker.value?.click();
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || !target.files.length) return;

  const files: File[] = [];
  for (let i = 0; i < target.files.length; i++) {
    files.push(target.files.item(i)!);
  }
  target.value = '';

  const loc = nav.currentLocation.value;
  if (loc.source === 'storage') {
    filesStore.upload(files, loc.path).then((uploads) => {
      uploads.forEach((u) =>
        u.promise.then(() => nav.navigateTo(nav.currentLocation.value)),
      );
    });
  }
}

async function doNewFolder(name: string) {
  const loc = nav.currentLocation.value;
  if (loc.source !== 'storage') return;

  const op = await filesStore.newFolder({ path: loc.path, name });
  if (op.status === OperationResultStatus.Duplicate) {
    newFolderRef.value?.setError('DIRECTORY_EXISTS');
    return;
  }
  newFolderVisible.value = false;
  nav.navigateTo(nav.currentLocation.value);
}

async function doRename(name: string) {
  const op = await filesStore.rename({ path: renameModal.path, name });
  if (op.status === OperationResultStatus.Duplicate) return;
  renameModal.visible = false;
  nav.navigateTo(nav.currentLocation.value);
}

async function doDelete() {
  const selected = nav.selectedItems.value;
  for (const item of selected) {
    await filesStore.deleteFile({ path: item.sourceData.path });
  }
  deleteVisible.value = false;
  nav.navigateTo(nav.currentLocation.value);
}
</script>

<style lang="scss">
.fp {
  display: flex;
  height: calc(100vh - 58px);
  background: #f8f8f8;
  position: relative;
}

.fp-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.fp-sidebar-backdrop {
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: fixed;
    inset: 0;
    top: 48px;
    background: rgba(0, 0, 0, 0.35);
    z-index: 49;
  }
}

.fp-sidebar-toggle {
  position: fixed;
  left: 8px;
  top: 58px;
  width: 44px;
  height: 44px;
  border: none;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1.3rem;
  transition: all 0.15s;

  &:hover {
    background: #f5f5f5;
  }
}

body.dark-mode {
  .fp {
    background: #3b3b3b;
  }
  .fp-sidebar-toggle {
    background: #313131;
    color: #999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    &:hover { background: #3b3b3b; }
  }
}
</style>
