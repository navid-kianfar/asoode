<template>
  <div class="ft">
    <!-- Row 1: Breadcrumbs + View Toggle -->
    <div class="ft-top">
      <div class="ft-breadcrumbs">
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <i v-if="idx > 0" class="mdi mdi-chevron-right ft-sep"></i>
          <button
            :class="['ft-crumb', { 'ft-crumb--last': idx === breadcrumbs.length - 1 }]"
            @click="$emit('navigate', crumb.location)"
          >
            <i v-if="crumb.icon" :class="['mdi', crumb.icon, 'ft-crumb-icon']"></i>
            {{ $t(crumb.label) || crumb.label }}
          </button>
        </template>
      </div>
      <div class="ft-view-toggle">
        <button
          :class="['ft-view-btn', { active: viewMode === 'grid' }]"
          @click="$emit('toggle-view', 'grid')"
          :title="$t('GRID_VIEW')"
        >
          <i class="mdi mdi-view-grid"></i>
        </button>
        <button
          :class="['ft-view-btn', { active: viewMode === 'list' }]"
          @click="$emit('toggle-view', 'list')"
          :title="$t('LIST_VIEW')"
        >
          <i class="mdi mdi-view-list"></i>
        </button>
      </div>
    </div>

    <!-- Row 2: Actions -->
    <div class="ft-actions">
      <!-- Add menu (storage only) -->
      <div v-if="canUpload" class="ft-add-wrap">
        <button class="ft-action-btn ft-action-btn--primary" @click="showAddMenu = !showAddMenu">
          <i class="mdi mdi-plus"></i>
          {{ $t('ADD') }}
        </button>
        <div v-if="showAddMenu" class="ft-dropdown">
          <button class="ft-dropdown-item" @click="emitAction('new-folder')">
            <i class="mdi mdi-folder-plus"></i>
            {{ $t('NEW_FOLDER') }}
          </button>
          <button class="ft-dropdown-item" @click="emitAction('upload')">
            <i class="mdi mdi-upload"></i>
            {{ $t('UPLOAD') }}
          </button>
        </div>
      </div>

      <!-- Context actions -->
      <button v-if="canDelete" class="ft-action-btn" @click="$emit('action', 'delete')">
        <i class="mdi mdi-delete-outline"></i>
        <span class="ft-action-label">{{ $t('DELETE') }}</span>
      </button>
      <button v-if="canRename" class="ft-action-btn" @click="$emit('action', 'rename')">
        <i class="mdi mdi-pencil-outline"></i>
        <span class="ft-action-label">{{ $t('RENAME_SHORT') }}</span>
      </button>
      <button v-if="canCopyLink" class="ft-action-btn" @click="$emit('action', 'copy-link')">
        <i class="mdi mdi-link"></i>
        <span class="ft-action-label">{{ $t('COPY_LINK') }}</span>
      </button>
      <button v-if="canDownload" class="ft-action-btn" @click="$emit('action', 'download')">
        <i class="mdi mdi-download"></i>
        <span class="ft-action-label">{{ $t('DOWNLOAD') }}</span>
      </button>
      <button v-if="canPreview" class="ft-action-btn" @click="$emit('action', 'preview')">
        <i class="mdi mdi-eye-outline"></i>
        <span class="ft-action-label">{{ $t('VIEW') }}</span>
      </button>

      <!-- Spacer -->
      <div class="ft-spacer"></div>

      <!-- Sort -->
      <div class="ft-sort-wrap">
        <button class="ft-action-btn" @click="showSortMenu = !showSortMenu">
          <i class="mdi mdi-sort"></i>
          <span class="ft-action-label">{{ $t('SORT_BY') }}</span>
        </button>
        <div v-if="showSortMenu" class="ft-dropdown ft-dropdown--right">
          <button
            :class="['ft-dropdown-item', { active: sortBy === 'name' }]"
            @click="emitSort('name')"
          >{{ $t('SORT_BY_NAME') }}</button>
          <button
            :class="['ft-dropdown-item', { active: sortBy === 'date' }]"
            @click="emitSort('date')"
          >{{ $t('SORT_BY_DATE') }}</button>
          <button
            :class="['ft-dropdown-item', { active: sortBy === 'size' }]"
            @click="emitSort('size')"
          >{{ $t('SORT_BY_SIZE') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { BreadcrumbItem, FilesLocation } from '@/composables/useFilesNavigation';

const props = defineProps<{
  breadcrumbs: BreadcrumbItem[];
  viewMode: 'grid' | 'list';
  sortBy: string;
  sortOrder: string;
  canUpload: boolean;
  canCreateFolder: boolean;
  canDelete: boolean;
  canRename: boolean;
  canCopyLink: boolean;
  canDownload: boolean;
  canPreview: boolean;
  hasSelection: boolean;
}>();

const emit = defineEmits<{
  navigate: [location: FilesLocation];
  'toggle-view': [mode: 'grid' | 'list'];
  action: [action: string];
  'sort-change': [by: 'name' | 'date' | 'size', order: 'asc' | 'desc'];
}>();

const showAddMenu = ref(false);
const showSortMenu = ref(false);

function emitAction(action: string) {
  showAddMenu.value = false;
  emit('action', action);
}

function emitSort(by: 'name' | 'date' | 'size') {
  const order = props.sortBy === by && props.sortOrder === 'asc' ? 'desc' : 'asc';
  showSortMenu.value = false;
  emit('sort-change', by, order);
}
</script>

<style lang="scss">
.ft {
  border-bottom: 1px solid #eee;
  background: #fff;
  flex-shrink: 0;
}

.ft-top {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 12px;
}

.ft-breadcrumbs {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.ft-sep {
  font-size: 1rem;
  color: #bbb;
  margin: 0 2px;
  flex-shrink: 0;
}

.ft-crumb {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.1s;

  &:hover { background: #f5f5f5; color: #333; }
  &--last { font-weight: 600; color: #333; }
}

.ft-crumb-icon {
  font-size: 1rem;
}

.ft-view-toggle {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.ft-view-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  color: #bbb;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;

  &.active { color: #673AB7; background: rgba(103, 58, 183, 0.08); }
  &:hover:not(.active) { color: #666; }
}

.ft-actions {
  display: flex;
  align-items: center;
  padding: 6px 16px 10px;
  gap: 4px;
  flex-wrap: wrap;
}

.ft-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #555;
  transition: all 0.1s;

  i { font-size: 1rem; }
  &:hover { background: #f5f5f5; }

  &--primary {
    background: #673AB7;
    color: #fff;
    font-weight: 500;
    &:hover { background: #5a2da8; }
  }
}

.ft-action-label {
  @media (max-width: 768px) { display: none; }
}

.ft-spacer { flex: 1; }

.ft-add-wrap, .ft-sort-wrap {
  position: relative;
}

.ft-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 160px;
  padding: 4px;

  &--right { left: auto; right: 0; }
}

.ft-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
  color: #444;
  border-radius: 4px;
  transition: background 0.1s;

  &:hover { background: #f5f5f5; }
  &.active { color: #673AB7; font-weight: 500; }
  i { font-size: 1.1rem; }
}

body.dark-mode {
  .ft {
    background: #313131;
    border-bottom-color: #444;
  }
  .ft-sep { color: #555; }
  .ft-crumb {
    color: #888;
    &:hover { background: #3b3b3b; color: #ccc; }
    &--last { color: #ccc; }
  }
  .ft-view-btn {
    color: #666;
    &.active { color: #59a8ef; background: rgba(89, 168, 239, 0.1); }
    &:hover:not(.active) { color: #999; }
  }
  .ft-action-btn {
    color: #888;
    &:hover { background: #3b3b3b; }
    &--primary {
      background: #59a8ef;
      color: #fff;
      &:hover { background: #4a90d9; }
    }
  }
  .ft-dropdown {
    background: #313131;
    border-color: #444;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .ft-dropdown-item {
    color: #999;
    &:hover { background: #3b3b3b; }
    &.active { color: #59a8ef; }
  }
}
</style>
