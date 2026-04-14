<template>
  <div
    :class="['fi-row', { 'fi-row--selected': item.selected }]"
    @click.stop="$emit('select', $event)"
    @dblclick.stop="$emit('open')"
  >
    <div class="fi-row__icon-cell">
      <img v-if="item.thumbnail" :src="item.thumbnail" class="fi-row__thumb" />
      <div v-else-if="item.type === 'folder'" class="fi-row__folder-art">
        <div class="fi-row__folder-tab"></div>
        <div class="fi-row__folder-body"></div>
      </div>
      <i v-else :class="['fi-row__icon', 'mdi', item.icon]"></i>
    </div>
    <div class="fi-row__name" :title="item.name">{{ item.name }}</div>
    <div class="fi-row__size">{{ item.type === 'file' ? formatSize(item.size) : item.subtitle || '--' }}</div>
    <div class="fi-row__date">{{ formatDate(item.createdAt) }}</div>
    <div class="fi-row__type">{{ item.type === 'folder' ? $t('FOLDER') : (item.extension?.toUpperCase() || '--') }}</div>
  </div>
</template>

<script setup lang="ts">
import type { DisplayItem } from '@/composables/useFilesNavigation';

defineProps<{ item: DisplayItem }>();
defineEmits<{
  select: [event: MouseEvent];
  open: [];
}>();

function formatSize(bytes?: number): string {
  if (!bytes) return '--';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(date?: Date): string {
  if (!date) return '--';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style lang="scss">
.fi-row {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.1s;
  font-size: 0.83rem;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  &--selected {
    background: rgba(103, 58, 183, 0.06);
  }

  &__icon-cell {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__thumb {
    width: 32px;
    height: 32px;
    object-fit: cover;
    border-radius: 4px;
  }

  &__icon {
    font-size: 24px;
    color: #999;
  }

  &__folder-art {
    position: relative;
    width: 26px;
    height: 20px;
  }

  &__folder-tab {
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 5px;
    background: #f6c547;
    border-radius: 2px 2px 0 0;
  }

  &__folder-body {
    position: absolute;
    top: 4px;
    left: 0;
    width: 100%;
    height: 16px;
    background: linear-gradient(135deg, #fbd968 0%, #f5b731 100%);
    border-radius: 1px 3px 3px 3px;
    box-shadow: 0 1px 3px rgba(245, 183, 49, 0.25);
  }

  &__name {
    flex: 1;
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  &__size, &__date, &__type {
    width: 100px;
    flex-shrink: 0;
    color: #888;
    text-align: right;
  }

  &__type {
    width: 80px;
  }
}

@media (max-width: 768px) {
  .fi-row__date, .fi-row__type {
    display: none;
  }
}

body.dark-mode {
  .fi-row {
    border-bottom-color: #444;
    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    &--selected {
      background: rgba(89, 168, 239, 0.1);
    }
    &__name {
      color: #ccc;
    }
    &__size, &__date, &__type {
      color: #777;
    }
    &__icon {
      color: #777;
    }
    &__folder-tab {
      background: #d4a833;
    }
    &__folder-body {
      background: linear-gradient(135deg, #d4a833 0%, #b8922a 100%);
      box-shadow: 0 1px 3px rgba(212, 168, 51, 0.15);
    }
  }
}
</style>
