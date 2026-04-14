<template>
  <div
    :class="['fi-card', { 'fi-card--selected': item.selected, 'fi-card--folder': item.type === 'folder' }]"
    @click.stop="$emit('select', $event)"
    @dblclick.stop="$emit('open')"
  >
    <div class="fi-card__preview">
      <img
        v-if="item.thumbnail"
        :src="item.thumbnail"
        :alt="item.name"
        class="fi-card__thumb"
      />
      <!-- CSS art folder -->
      <div v-else-if="item.type === 'folder'" class="fi-card__folder-art">
        <div class="fi-card__folder-tab"></div>
        <div class="fi-card__folder-body">
          <div class="fi-card__folder-shine"></div>
        </div>
      </div>
      <!-- File icon -->
      <i v-else :class="['fi-card__icon', 'mdi', item.icon]"></i>
    </div>
    <div class="fi-card__info">
      <div class="fi-card__name" :title="item.name">{{ item.name }}</div>
      <div v-if="item.subtitle" class="fi-card__subtitle">{{ item.subtitle }}</div>
      <div v-else-if="item.size" class="fi-card__subtitle">{{ formatSize(item.size) }}</div>
    </div>
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
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
</script>

<style lang="scss">
.fi-card {
  width: 180px;
  border-radius: 10px;
  border: 2px solid transparent;
  padding: 16px 12px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  &--selected {
    border-color: #673AB7;
    background: rgba(103, 58, 183, 0.06);
  }

  &__preview {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    overflow: hidden;
  }

  &__thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  &__icon {
    font-size: 40px;
    color: #999;
  }

  // CSS art folder
  &__folder-art {
    position: relative;
    width: 56px;
    height: 44px;
  }

  &__folder-tab {
    position: absolute;
    top: 0;
    left: 0;
    width: 22px;
    height: 10px;
    background: #f6c547;
    border-radius: 4px 4px 0 0;
  }

  &__folder-body {
    position: absolute;
    top: 8px;
    left: 0;
    width: 100%;
    height: 36px;
    background: linear-gradient(135deg, #fbd968 0%, #f5b731 100%);
    border-radius: 2px 6px 6px 6px;
    box-shadow: 0 2px 8px rgba(245, 183, 49, 0.3);
    overflow: hidden;
  }

  &__folder-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 14px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 100%);
    border-radius: 2px 6px 0 0;
  }

  &--selected &__folder-body {
    box-shadow: 0 2px 12px rgba(103, 58, 183, 0.25);
  }

  &__info {
    text-align: center;
    width: 100%;
    min-width: 0;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #333;
  }

  &__subtitle {
    font-size: 0.72rem;
    color: #999;
    margin-top: 2px;
  }
}

body.dark-mode {
  .fi-card {
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    &--selected {
      border-color: #59a8ef;
      background: rgba(89, 168, 239, 0.1);
    }
    &__icon {
      color: #777;
    }
    &__folder-tab {
      background: #d4a833;
    }
    &__folder-body {
      background: linear-gradient(135deg, #d4a833 0%, #b8922a 100%);
      box-shadow: 0 2px 8px rgba(212, 168, 51, 0.2);
    }
    &__folder-shine {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
    }
    &__name {
      color: #ccc;
    }
    &__subtitle {
      color: #777;
    }
  }
}
</style>
