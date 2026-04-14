<template>
  <div class="channel-files">
    <!-- Header -->
    <div class="channel-files__header">
      <div class="channel-files__header-icon">
        <i class="mdi mdi-folder-outline"></i>
      </div>
      <h4 class="channel-files__header-title">{{ $t('SHARED_FILES') }}</h4>
      <span class="channel-files__header-count" v-if="files.length">{{ files.length }}</span>
    </div>

    <!-- File list -->
    <div v-if="files.length" class="channel-files__list">
      <a
        v-for="file in files"
        :key="file.id"
        :href="file.path"
        target="_blank"
        download
        class="channel-files__item"
      >
        <div class="channel-files__item-icon" :style="{ backgroundColor: getFileIconBg(file) }">
          <i :class="['mdi', getFileIcon(file)]" :style="{ color: getFileIconColor(file) }"></i>
        </div>

        <div class="channel-files__item-info">
          <span class="channel-files__item-name">{{ getFileName(file.path) }}</span>
          <span class="channel-files__item-meta">
            {{ formatDate(file.createdAt) }}
            <template v-if="file.member"> &middot; {{ file.member.fullName }}</template>
          </span>
        </div>

        <button
          class="channel-files__item-download"
          @click.prevent.stop="downloadFile(file.path)"
          :title="$t('DOWNLOAD')"
        >
          <i class="mdi mdi-download"></i>
        </button>
      </a>
    </div>

    <!-- Empty state -->
    <div v-else class="channel-files__empty">
      <div class="channel-files__empty-icon">
        <i class="mdi mdi-file-hidden"></i>
      </div>
      <p class="channel-files__empty-text">{{ $t('NO_FILES') }}</p>
      <p class="channel-files__empty-hint">Files shared in this channel will appear here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ChannelViewModel, ConversationViewModel } from '@asoode/shared';
import { ConversationType } from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';

const props = defineProps<{ channel: ChannelViewModel }>();
const { formatDate } = useCulturedDate();

const files = computed(() => {
  return (props.channel.messages || []).filter(
    (msg) => msg.type === ConversationType.Upload && msg.path
  );
});

function getFileName(path?: string): string {
  if (!path) return 'file';
  return path.split('/').pop() || path;
}

function getFileIcon(file: ConversationViewModel): string {
  const name = getFileName(file.path).toLowerCase();
  if (/\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) return 'mdi-file-image';
  if (/\.(pdf)$/.test(name)) return 'mdi-file-pdf-box';
  if (/\.(doc|docx)$/.test(name)) return 'mdi-file-word';
  if (/\.(xls|xlsx)$/.test(name)) return 'mdi-file-excel';
  if (/\.(ppt|pptx)$/.test(name)) return 'mdi-file-powerpoint';
  if (/\.(zip|rar|7z|gz|tar)$/.test(name)) return 'mdi-folder-zip';
  if (/\.(mp4|avi|mov|mkv)$/.test(name)) return 'mdi-file-video';
  if (/\.(mp3|wav|ogg)$/.test(name)) return 'mdi-file-music';
  return 'mdi-file-outline';
}

function getFileIconColor(file: ConversationViewModel): string {
  const name = getFileName(file.path).toLowerCase();
  if (/\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) return '#4CAF50';
  if (/\.(pdf)$/.test(name)) return '#F44336';
  if (/\.(doc|docx)$/.test(name)) return '#2196F3';
  if (/\.(xls|xlsx)$/.test(name)) return '#2E7D32';
  if (/\.(ppt|pptx)$/.test(name)) return '#FF9800';
  if (/\.(zip|rar|7z|gz|tar)$/.test(name)) return '#795548';
  if (/\.(mp4|avi|mov|mkv)$/.test(name)) return '#9C27B0';
  if (/\.(mp3|wav|ogg)$/.test(name)) return '#E91E63';
  return '#9E9E9E';
}

function getFileIconBg(file: ConversationViewModel): string {
  const name = getFileName(file.path).toLowerCase();
  if (/\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) return 'rgba(76, 175, 80, 0.1)';
  if (/\.(pdf)$/.test(name)) return 'rgba(244, 67, 54, 0.1)';
  if (/\.(doc|docx)$/.test(name)) return 'rgba(33, 150, 243, 0.1)';
  if (/\.(xls|xlsx)$/.test(name)) return 'rgba(46, 125, 50, 0.1)';
  if (/\.(ppt|pptx)$/.test(name)) return 'rgba(255, 152, 0, 0.1)';
  if (/\.(zip|rar|7z|gz|tar)$/.test(name)) return 'rgba(121, 85, 72, 0.1)';
  if (/\.(mp4|avi|mov|mkv)$/.test(name)) return 'rgba(156, 39, 176, 0.1)';
  if (/\.(mp3|wav|ogg)$/.test(name)) return 'rgba(233, 30, 99, 0.1)';
  return 'rgba(158, 158, 158, 0.1)';
}

function downloadFile(path?: string) {
  if (!path) return;
  const link = document.createElement('a');
  link.href = path;
  link.download = getFileName(path);
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.channel-files {
  padding: $spacing-md;
  height: 100%;
  display: flex;
  flex-direction: column;

  // Header
  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding-bottom: $spacing-md;
    margin-bottom: $spacing-sm;
    border-bottom: 1px solid $divider;
  }

  &__header-icon {
    width: 32px;
    height: 32px;
    border-radius: $border-radius-md;
    background-color: rgba($primary, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .mdi {
      font-size: 18px;
      color: $primary;
    }
  }

  &__header-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
    flex: 1;
  }

  &__header-count {
    font-size: 11px;
    font-weight: 600;
    color: $primary;
    background-color: rgba($primary, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
    line-height: 1.4;
  }

  // File list
  &__list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }
  }

  // File item
  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-sm + 4px;
    padding: $spacing-sm + 2px $spacing-sm;
    border-radius: $border-radius-md;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: background-color $transition-fast;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);

      .channel-files__item-download {
        opacity: 1;
      }
    }
  }

  &__item-icon {
    width: 36px;
    height: 36px;
    border-radius: $border-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .mdi {
      font-size: 20px;
    }
  }

  &__item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item-name {
    font-size: 13px;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  &__item-meta {
    font-size: 11px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  &__item-download {
    width: 30px;
    height: 30px;
    border-radius: $border-radius-sm;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all $transition-fast;
    flex-shrink: 0;
    color: $text-secondary;

    &:hover {
      background-color: rgba($primary, 0.1);
      color: $primary;
    }

    .mdi {
      font-size: 18px;
    }
  }

  // Empty state
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-xl $spacing-md;
    text-align: center;
  }

  &__empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-md;

    .mdi {
      font-size: 28px;
      color: $text-disabled;
    }
  }

  &__empty-text {
    font-size: 14px;
    font-weight: 500;
    color: $text-secondary;
    margin: 0 0 4px;
  }

  &__empty-hint {
    font-size: 12px;
    color: $text-disabled;
    margin: 0;
  }
}

// Dark mode
body.dark-mode {
  .channel-files {
    &__header {
      border-bottom-color: $dark-border;
    }

    &__header-icon {
      background-color: rgba($primary-light, 0.15);

      .mdi {
        color: $primary-light;
      }
    }

    &__header-title {
      color: $dark-text-light;
    }

    &__header-count {
      background-color: rgba($primary-light, 0.15);
      color: $primary-light;
    }

    &__list {
      &::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }

    &__item {
      &:hover {
        background-color: rgba(255, 255, 255, 0.06);
      }
    }

    &__item-icon {
      background-color: rgba(255, 255, 255, 0.06) !important;
    }

    &__item-name {
      color: $dark-text-light;
    }

    &__item-meta {
      color: $dark-text-muted;
    }

    &__item-download {
      color: $dark-text-muted;

      &:hover {
        background-color: rgba($primary-light, 0.15);
        color: $primary-light;
      }
    }

    &__empty-icon {
      background-color: rgba(255, 255, 255, 0.06);

      .mdi {
        color: $dark-text-muted;
      }
    }

    &__empty-text {
      color: $dark-text-light;
    }

    &__empty-hint {
      color: $dark-text-muted;
    }
  }
}
</style>
