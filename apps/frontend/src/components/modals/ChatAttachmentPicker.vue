<template>
  <AppModal
    v-model="internalVisible"
    :title="$t('ATTACH_FILE')"
    :width="520"
    :loading="uploading"
    @close="$emit('close')"
  >
    <!-- Tabs -->
    <div class="cap-tabs">
      <button
        class="cap-tab"
        :class="{ active: tab === 'local' }"
        @click="tab = 'local'"
      >
        <v-icon size="18">mdi-upload</v-icon>
        {{ $t('LOCAL_FILES') }}
      </button>
      <button
        class="cap-tab"
        :class="{ active: tab === 'storage' }"
        @click="tab = 'storage'; loadStorage()"
      >
        <v-icon size="18">mdi-cloud-outline</v-icon>
        {{ $t('MY_STORAGE') }}
      </button>
    </div>

    <!-- Local upload tab -->
    <div v-if="tab === 'local'" class="cap-body">
      <div
        class="cap-dropzone"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
        @click="triggerInput"
      >
        <v-icon size="40">mdi-cloud-upload-outline</v-icon>
        <p>{{ $t('DROP_FILES_HERE') }}</p>
        <span>{{ $t('OR_CLICK_TO_BROWSE') }}</span>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="cap-hidden-input"
        @change="onFileInput"
      />

      <!-- Selected files -->
      <div v-if="localFiles.length" class="cap-file-list">
        <div v-for="(f, i) in localFiles" :key="i" class="cap-file-item">
          <v-icon size="16">mdi-file-outline</v-icon>
          <span class="cap-file-name">{{ f.name }}</span>
          <span class="cap-file-size">{{ formatSize(f.size) }}</span>
          <v-btn
            icon
            size="x-small"
            variant="text"
            color="error"
            @click="localFiles.splice(i, 1)"
          >
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Storage tab -->
    <div v-if="tab === 'storage'" class="cap-body">
      <div v-if="storageLoading" class="cap-loading">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <template v-else>
        <!-- Breadcrumb -->
        <div v-if="storagePath !== '/'" class="cap-breadcrumb">
          <v-btn icon size="x-small" variant="text" @click="navigateStorage('/')">
            <v-icon size="18">mdi-home</v-icon>
          </v-btn>
          <span v-for="(part, i) in pathParts" :key="i">
            <v-icon size="14">mdi-chevron-right</v-icon>
            <v-btn size="small" variant="text" @click="navigateStorage(pathParts.slice(0, i + 1).join('/'))">
              {{ part }}
            </v-btn>
          </span>
        </div>

        <!-- Folders -->
        <div
          v-for="folder in storageFolders"
          :key="'f-' + folder.path"
          class="cap-storage-item"
          @click="navigateStorage(folder.path)"
        >
          <v-icon color="amber-darken-2">mdi-folder-outline</v-icon>
          <span>{{ folder.name }}</span>
        </div>

        <!-- Files -->
        <div
          v-for="file in storageFiles"
          :key="'s-' + file.path"
          class="cap-storage-item cap-storage-file"
          :class="{ selected: selectedStorageFiles.has(file.path) }"
          @click="toggleStorageFile(file)"
        >
          <v-icon :color="file.isImage ? 'primary' : 'grey'">
            {{ file.isImage ? 'mdi-image-outline' : 'mdi-file-outline' }}
          </v-icon>
          <span>{{ file.name }}</span>
          <span class="cap-file-size">{{ formatSize(file.size) }}</span>
          <v-icon v-if="selectedStorageFiles.has(file.path)" color="success">mdi-check-circle</v-icon>
        </div>

        <div v-if="!storageFolders.length && !storageFiles.length" class="cap-empty">
          <v-icon size="40">mdi-folder-open-outline</v-icon>
          <span>{{ $t('NO_DATA') }}</span>
        </div>
      </template>
    </div>

    <!-- Footer -->
    <template #footer>
      <span class="cap-selection-count">
        {{ totalSelected }} {{ $t('FILES_SELECTED') }}
      </span>
      <v-spacer />
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('CANCEL') }}
      </v-btn>
      <v-btn
        color="primary"
        elevation="2"
        :disabled="!totalSelected || uploading"
        :loading="uploading"
        @click="attachFiles"
      >
        {{ $t('ATTACH') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { httpService } from '@/services/http.service';
import { resolveApiUrl } from '@/services/runtime-config.service';
import {
  API, OperationResultStatus,
  type ExplorerFileViewModel, type ExplorerFolderViewModel,
} from '@asoode/shared';
import AppModal from '../core/AppModal.vue';

const props = defineProps<{ visible: boolean; channelId: string }>();
const emit = defineEmits<{ close: []; attached: [] }>();

const internalVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) emit('close');
  },
});

const tab = ref<'local' | 'storage'>('local');
const dragging = ref(false);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement>();

// Local files
const localFiles = ref<File[]>([]);

// Storage browser
const storageLoading = ref(false);
const storagePath = ref('/');
const storageFolders = ref<ExplorerFolderViewModel[]>([]);
const storageFiles = ref<ExplorerFileViewModel[]>([]);
const selectedStorageFiles = ref(new Set<string>());

const pathParts = computed(() =>
  storagePath.value.split('/').filter(Boolean),
);

const totalSelected = computed(() =>
  localFiles.value.length + selectedStorageFiles.value.size,
);

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function triggerInput() {
  fileInput.value?.click();
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  localFiles.value.push(...files);
  input.value = '';
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  localFiles.value.push(...files);
}

async function loadStorage() {
  storageLoading.value = true;
  const op = await httpService.post<{ files: ExplorerFileViewModel[]; folders: ExplorerFolderViewModel[] }>(
    API.FILES_MINE,
    { path: storagePath.value },
  );
  storageLoading.value = false;
  if (op.status === OperationResultStatus.Success && op.data) {
    storageFiles.value = op.data.files || [];
    storageFolders.value = op.data.folders || [];
  }
}

function navigateStorage(path: string) {
  storagePath.value = path.startsWith('/') ? path : '/' + path;
  loadStorage();
}

function toggleStorageFile(file: ExplorerFileViewModel) {
  if (selectedStorageFiles.value.has(file.path)) {
    selectedStorageFiles.value.delete(file.path);
  } else {
    selectedStorageFiles.value.add(file.path);
  }
  selectedStorageFiles.value = new Set(selectedStorageFiles.value);
}

async function attachFiles() {
  if (!totalSelected.value) return;
  uploading.value = true;

  // Upload local files
  if (localFiles.value.length) {
    await httpService.upload(
      API.MESSENGER_ATTACH(props.channelId),
      localFiles.value,
      {},
      () => {},
    );
  }

  // For storage files, send each as a message with the file URL
  for (const path of selectedStorageFiles.value) {
    const file = storageFiles.value.find(f => f.path === path);
    if (file) {
      await httpService.post(API.MESSENGER_SEND(props.channelId), {
        message: file.url || resolveApiUrl(`/storage/file/${file.path}`),
      });
    }
  }

  uploading.value = false;
  localFiles.value = [];
  selectedStorageFiles.value = new Set();
  emit('attached');
  emit('close');
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.cap-tabs {
  display: flex;
  border-bottom: 2px solid rgba(var(--v-border-color), 0.05);
  margin-bottom: $spacing-md;
}

.cap-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 500;
  color: $text-secondary;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &.active {
    color: $primary;
    border-bottom-color: $primary;
    background: rgba($primary, 0.02);
  }

  &:hover:not(.active) {
    color: $text-primary;
    background: rgba(0,0,0,0.02);
  }
}

.cap-body {
  padding: 4px;
  min-height: 240px;
}

.cap-dropzone {
  border: 2px dashed rgba(var(--v-border-color), 0.15);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &.dragging, &:hover {
    border-color: $primary;
    background: rgba($primary, 0.04);
    .v-icon { color: $primary !important; }
  }

  .v-icon {
    color: $text-secondary !important;
    margin-bottom: 12px;
  }

  p {
    margin: 0 0 6px;
    font-size: 0.95rem;
    font-weight: 600;
    color: $text-primary;
  }

  span {
    font-size: 0.8rem;
    color: $text-secondary;
  }
}

.cap-hidden-input { display: none; }

.cap-file-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cap-file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.cap-file-name {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cap-file-size {
  font-size: 0.75rem;
  color: $text-secondary;
}

.cap-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.cap-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  background: rgba(0,0,0,0.02);
  padding: 4px 8px;
  border-radius: 8px;
}

.cap-storage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;

  &:hover { background: rgba(0, 0, 0, 0.04); }
  &.selected { background: rgba($primary, 0.08); }

  .v-icon { font-size: 20px; }
  
  .cap-file-size { margin-inline-start: auto; }
}

.cap-empty {
  text-align: center;
  padding: 48px;
  color: $text-secondary;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0.5;
}

.cap-selection-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: $primary;
}

// Dark mode
body.dark-mode {
  .cap-tab {
    color: $dark-text-secondary;
    &.active { color: $primary-light; border-bottom-color: $primary-light; }
    &:hover:not(.active) { background: rgba(255,255,255,0.03); }
  }
  
  .cap-dropzone {
    border-color: rgba(255, 255, 255, 0.1);
    &.dragging, &:hover { border-color: $primary-light; background: rgba($primary-light, 0.06); }
    p { color: $dark-text-primary; }
    span { color: $dark-text-secondary; }
  }
  
  .cap-file-item { background: rgba(255, 255, 255, 0.05); }
  .cap-file-name { color: $dark-text-primary; }
  .cap-file-size { color: $dark-text-secondary; }
  
  .cap-breadcrumb { background: rgba(255, 255, 255, 0.03); }
  
  .cap-storage-item {
    color: $dark-text-primary;
    &:hover { background: rgba(255, 255, 255, 0.05); }
    &.selected { background: rgba($primary-light, 0.1); }
  }
  
  .cap-empty { color: $dark-text-secondary; }
  .cap-selection-count { color: $dark-text-secondary; }
}
</style>
