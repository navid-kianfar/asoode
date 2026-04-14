<template>
  <div class="fca" @click.self="$emit('click-outside')">
    <FilesSkeleton v-if="loading" :mode="viewMode" />
    <template v-else-if="items.length">
      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="fca-grid" @click.self="$emit('click-outside')">
        <FilesItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          @select="$emit('select', item, $event)"
          @open="$emit('open', item)"
        />
      </div>
      <!-- List View -->
      <div v-else class="fca-list">
        <div class="fca-list-header">
          <div class="fca-lh-icon"></div>
          <div class="fca-lh-name">{{ $t('TITLE') }}</div>
          <div class="fca-lh-size">{{ $t('FILE_SIZE') }}</div>
          <div class="fca-lh-date">{{ $t('FILE_MODIFIED') }}</div>
          <div class="fca-lh-type">{{ $t('FILE_TYPE') }}</div>
        </div>
        <FilesItemRow
          v-for="item in items"
          :key="item.id"
          :item="item"
          @select="$emit('select', item, $event)"
          @open="$emit('open', item)"
        />
      </div>
    </template>
    <FilesEmptyState
      v-else
      :show-action="showUploadAction"
      @action="$emit('upload-action')"
    />
  </div>
</template>

<script setup lang="ts">
import type { DisplayItem } from '@/composables/useFilesNavigation';
import FilesItemCard from './FilesItemCard.vue';
import FilesItemRow from './FilesItemRow.vue';
import FilesEmptyState from './FilesEmptyState.vue';
import FilesSkeleton from '@/components/core/skeletons/FilesSkeleton.vue';

defineProps<{
  items: DisplayItem[];
  viewMode: 'grid' | 'list';
  loading: boolean;
  showUploadAction?: boolean;
}>();

defineEmits<{
  select: [item: DisplayItem, event: MouseEvent];
  open: [item: DisplayItem];
  'click-outside': [];
  'upload-action': [];
}>();
</script>

<style lang="scss">
.fca {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.fca-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 4px;
  padding: 16px;
}

.fca-list {
  display: flex;
  flex-direction: column;
}

.fca-list-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #999;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;

  .fca-lh-icon { width: 32px; flex-shrink: 0; }
  .fca-lh-name { flex: 1; }
  .fca-lh-size, .fca-lh-date { width: 100px; flex-shrink: 0; text-align: right; }
  .fca-lh-type { width: 80px; flex-shrink: 0; text-align: right; }
}

@media (max-width: 768px) {
  .fca-lh-date, .fca-lh-type {
    display: none;
  }
  .fca-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    padding: 12px;
  }
}

body.dark-mode {
  .fca-list-header {
    border-bottom-color: #444;
    background: #313131;
    color: #666;
  }
}
</style>
