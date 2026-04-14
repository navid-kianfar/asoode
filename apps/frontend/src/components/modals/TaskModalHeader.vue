<template>
  <div class="tmh" :class="{ 'has-cover': task?.coverUrl }">
    <!-- Cover image -->
    <div
      v-if="task?.coverUrl"
      class="tmh-cover"
      :style="{ backgroundImage: `url(${task.coverUrl})` }"
    ></div>

    <div class="tmh-bar">
      <!-- Breadcrumb -->
      <div class="tmh-breadcrumb">
        <span class="tmh-list-name">{{ task?.listName }}</span>
        <i class="mdi mdi-chevron-right tmh-sep"></i>
        <span class="tmh-task-title">{{ task?.title }}</span>
      </div>

      <!-- Actions -->
      <div class="tmh-actions">
        <div class="tmh-action-group">
          <button
            class="tmh-icon-btn"
            :class="{ active: task?.watching }"
            :disabled="togglingWatch"
            :title="$t('WATCH')"
            @click="$emit('toggle-watch')"
          >
            <i :class="togglingWatch ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-eye-outline'"></i>
          </button>
          <button
            class="tmh-icon-btn"
            :disabled="togglingArchive"
            :title="$t('ARCHIVE')"
            @click="$emit('toggle-archive')"
          >
            <i :class="togglingArchive ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-archive-outline'"></i>
          </button>
          <div class="tmh-divider"></div>
          <button class="tmh-icon-btn tmh-close-btn" :title="$t('CLOSE')" @click="$emit('close')">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Archived banner -->
    <div v-if="task?.archivedAt" class="tmh-archived">
      <i class="mdi mdi-archive-outline"></i>
      {{ $t('TASK_ARCHIVED_AT') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue';
import type { WorkPackageTaskViewModel } from '@asoode/shared';

defineProps<{
  togglingWatch: boolean;
  togglingArchive: boolean;
}>();

defineEmits<{
  close: [];
  'toggle-watch': [];
  'toggle-archive': [];
}>();

const task = inject<Ref<WorkPackageTaskViewModel | null>>('task')!;
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.tmh {
  position: relative;
  flex-shrink: 0;
  border-bottom: 1px solid $divider;
}

.tmh-cover {
  height: 120px;
  background-size: cover;
  background-position: center;
  border-radius: 16px 16px 0 0;
}

.tmh-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  gap: 12px;
}

.tmh-breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  font-size: 0.8rem;

  .tmh-list-name {
    color: $text-secondary;
    white-space: nowrap;
  }

  .tmh-sep {
    color: $text-disabled;
    font-size: 0.75rem;
  }

  .tmh-task-title {
    color: $text-primary;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.tmh-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tmh-action-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tmh-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  transition: all $transition-fast;

  i { font-size: 1.1rem; }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: $text-primary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &.active {
    color: $success;
  }
}

.tmh-close-btn {
  i { font-size: 1.2rem; }
  &:hover { background: rgba($warn, 0.08); color: $warn; }
}

.tmh-divider {
  width: 1px;
  height: 20px;
  background: $divider;
  margin: 0 4px;
}

// Archived banner
.tmh-archived {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 16px;
  background: #fff3cd;
  color: #856404;
  font-size: 0.78rem;
  font-weight: 500;
}
</style>

<!-- Dark mode -->
<style lang="scss">
body.dark-mode {
  .tmh {
    border-color: #444;
  }

  .tmh-bar {
    .tmh-list-name { color: #888; }
    .tmh-task-title { color: #e0e0e0; }
    .tmh-sep { color: #666; }
  }

  .tmh-icon-btn {
    color: #999;
    &:hover { background: rgba(255, 255, 255, 0.08); color: #ddd; }
    &.active { color: #5eb258; }
  }

  .tmh-close-btn:hover {
    background: rgba(#F44336, 0.12);
    color: #ef5350;
  }

  .tmh-divider { background: #555; }

  .tmh-archived {
    background: #4a4528;
    color: #ffd54f;
  }
}
</style>
