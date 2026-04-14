<template>
  <div
    class="wp-board-card"
    :class="{ 'wp-board-card--archived': !!task.archivedAt }"
    :style="{ borderLeftColor: stateColor }"
    @click="$emit('click')"
  >
    <!-- Label strips -->
    <div v-if="assignedLabels.length" class="wp-board-card__labels">
      <div
        v-for="label in assignedLabels"
        :key="label.id"
        class="wp-board-card__label-strip"
        :style="{ backgroundColor: label.color }"
      ></div>
    </div>

    <!-- Cover image -->
    <div
      v-if="task.coverUrl"
      class="wp-board-card__cover"
      :style="{ backgroundImage: `url(${task.coverUrl})` }"
    ></div>

    <!-- Title -->
    <div class="wp-board-card__title">{{ task.title }}</div>

    <!-- Bottom row -->
    <div
      v-if="hasBottomRow"
      class="wp-board-card__bottom"
    >
      <!-- Status dot removed as we now have the left accent -->

      <!-- Due date -->
      <span
        v-if="dueDate"
        class="wp-board-card__due"
        :class="{ 'wp-board-card__due--overdue': isOverdue }"
      >
        <i class="mdi mdi-clock-outline"></i>
        <span>{{ formattedDueDate }}</span>
      </span>

      <!-- Members -->
      <span v-if="visibleMembers.length" class="wp-board-card__members">
        <span
          v-for="member in visibleMembers"
          :key="member.id"
          class="wp-board-card__avatar"
          :title="resolveUserName(member.recordId)"
        >{{ resolveUserInitials(member.recordId) }}</span>
        <span
          v-if="extraMemberCount > 0"
          class="wp-board-card__avatar wp-board-card__avatar--extra"
        >+{{ extraMemberCount }}</span>
      </span>

      <!-- Comment count -->
      <span v-if="task.commentCount" class="wp-board-card__badge">
        <i class="mdi mdi-comment-outline"></i>
        <span>{{ task.commentCount }}</span>
      </span>

      <!-- Attachment count -->
      <span v-if="task.attachmentCount" class="wp-board-card__badge">
        <i class="mdi mdi-paperclip"></i>
        <span>{{ task.attachmentCount }}</span>
      </span>

      <!-- Subtask count -->
      <span v-if="task.subTasksCount" class="wp-board-card__badge">
        <i class="mdi mdi-checkbox-marked-outline"></i>
        <span>{{ task.subTasksDone }}/{{ task.subTasksCount }}</span>
      </span>

      <!-- Time tracking -->
      <span v-if="task.timeSpent" class="wp-board-card__badge">
        <i class="mdi mdi-timer-outline"></i>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  type WorkPackageTaskViewModel,
  type WorkPackageLabelViewModel,
  WorkPackageTaskState,
} from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useUserCache } from '@/composables/useUserCache';

const props = withDefaults(defineProps<{
  task: WorkPackageTaskViewModel;
  labels?: WorkPackageLabelViewModel[];
}>(), {
  labels: () => [],
});

defineEmits<{ click: [] }>();

const { formatDate } = useCulturedDate();
const { resolveUserInitials, resolveUserName } = useUserCache();

// ── State color mapping ──────────────────────────────────────────────
const stateColors: Record<number, string> = {
  [WorkPackageTaskState.ToDo]: '#cccccc',
  [WorkPackageTaskState.InProgress]: '#59a8ef',
  [WorkPackageTaskState.Done]: '#5eb258',
  [WorkPackageTaskState.Paused]: '#666666',
  [WorkPackageTaskState.Blocked]: '#b33634',
  [WorkPackageTaskState.Cancelled]: '#666666',
  [WorkPackageTaskState.Duplicate]: '#808080',
  [WorkPackageTaskState.Incomplete]: '#b3b3b3',
  [WorkPackageTaskState.Blocker]: '#eb973e',
};

const stateColor = computed(() => stateColors[props.task.state] || '#cccccc');

// ── Labels ───────────────────────────────────────────────────────────
const assignedLabels = computed(() => {
  if (!props.labels?.length || !props.task.labels?.length) return [];
  const taskLabelIds = new Set(props.task.labels.map(tl => tl.labelId));
  return props.labels.filter(l => taskLabelIds.has(l.id));
});

// ── Due date ─────────────────────────────────────────────────────────
const dueDate = computed<Date | null>(() => {
  const raw = props.task.dueAt || props.task.endAt;
  if (!raw) return null;
  const d = typeof raw === 'string' ? new Date(raw) : raw;
  return isNaN(d.getTime()) ? null : d;
});

const formattedDueDate = computed(() => {
  if (!dueDate.value) return '';
  return formatDate(dueDate.value);
});

const isOverdue = computed(() => {
  if (!dueDate.value) return false;
  return dueDate.value.getTime() < Date.now();
});

// ── Members ──────────────────────────────────────────────────────────
const MAX_VISIBLE_MEMBERS = 3;

const individualMembers = computed(() =>
  (props.task.members || []).filter(m => !m.isGroup),
);

const visibleMembers = computed(() =>
  individualMembers.value.slice(0, MAX_VISIBLE_MEMBERS),
);

const extraMemberCount = computed(() =>
  Math.max(0, individualMembers.value.length - MAX_VISIBLE_MEMBERS),
);

// ── Bottom row visibility ────────────────────────────────────────────
const hasBottomRow = computed(() =>
  !!dueDate.value ||
  individualMembers.value.length > 0 ||
  !!props.task.commentCount ||
  !!props.task.attachmentCount ||
  !!props.task.subTasksCount ||
  !!props.task.timeSpent,
);
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-board-card {
  background: $surface;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  transition: all $transition-fast;
  overflow: hidden;
  border-left: 3px solid transparent;
  margin-bottom: 2px;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    transform: translateY(-2px);
  }

  &--archived {
    opacity: 0.6;
  }

  // ── Label strips ─────────────────────────────────────────────────
  &__labels {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label-strip {
    width: 100%;
    height: 3px;
  }

  // ── Cover image ──────────────────────────────────────────────────
  &__cover {
    width: 100%;
    height: 120px;
    background-size: cover;
    background-position: center;
  }

  // ── Title ────────────────────────────────────────────────────────
  &__title {
    padding: 8px 10px;
    font-size: 0.85rem;
    font-weight: 500;
    color: $text-primary;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }

  // ── Bottom row ───────────────────────────────────────────────────
  &__bottom {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 2px 10px 10px;
    font-size: 0.75rem;
    color: $text-secondary;
  }

  &__status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__due {
    display: flex;
    align-items: center;
    gap: 3px;

    i {
      font-size: 0.8rem;
    }

    &--overdue {
      color: $warn;

      i {
        color: $warn;
      }
    }
  }

  &__badge {
    display: flex;
    align-items: center;
    gap: 3px;

    i {
      font-size: 0.8rem;
    }
  }

  &__members {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-inline-start: auto;
  }

  &__avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e6e6e6;
    border: 1.5px solid $surface;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.5rem;
    font-weight: 600;
    color: $text-secondary;
    flex-shrink: 0;

    &--extra {
      background: $text-disabled;
      color: $surface;
      font-weight: 700;
    }
  }
}

// ── Dark mode ──────────────────────────────────────────────────────
body.dark-mode {
  .wp-board-card {
    background: $dark-card;

    &__title {
      color: $dark-text-light;
    }

    &__bottom {
      color: $dark-text-secondary;
    }

    &__due--overdue {
      color: $warn;

      i {
        color: $warn;
      }
    }

    &__avatar {
      background: $dark-card-inner;
      border-color: $dark-card;
      color: $dark-text-secondary;

      &--extra {
        background: $dark-text-muted;
        color: $dark-card;
      }
    }
  }
}
</style>
