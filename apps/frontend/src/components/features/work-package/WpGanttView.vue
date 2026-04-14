<template>
  <div class="wp-gantt">
    <!-- Scale header -->
    <div class="wp-gantt__header">
      <div class="wp-gantt__label-col">{{ $t('TASK') }}</div>
      <div class="wp-gantt__timeline-col">
        <div
          v-for="marker in dateMarkers"
          :key="marker.label"
          class="wp-gantt__marker"
          :style="{ left: marker.position + '%' }"
        >
          {{ marker.label }}
        </div>
      </div>
    </div>

    <!-- Rows grouped by list -->
    <div v-for="list in sortedLists" :key="list.id" class="wp-gantt__group">
      <div class="wp-gantt__group-title">{{ list.title }}</div>
      <div
        v-for="task in list.tasks"
        :key="task.id"
        class="wp-gantt__row"
        @click="$emit('open-task', task.id)"
      >
        <div class="wp-gantt__task-label" :title="task.title">{{ task.title }}</div>
        <div class="wp-gantt__bar-container">
          <!-- Range bar (has both beginAt and endAt) -->
          <div
            v-if="task.beginAt && task.endAt"
            class="wp-gantt__bar"
            :style="{
              left: getBarLeft(task) + '%',
              width: getBarWidth(task) + '%',
              background: stateColor(task.state),
            }"
          >
            <span v-if="getBarWidth(task) > 8" class="wp-gantt__bar-text">{{ task.title }}</span>
          </div>
          <!-- Milestone (only dueAt, no range) -->
          <div
            v-else-if="task.dueAt"
            class="wp-gantt__milestone"
            :style="{ left: getMilestonePos(task) + '%' }"
          >
            <i class="mdi mdi-rhombus" :style="{ color: stateColor(task.state) }"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!allTasks.length" class="wp-gantt__empty">
      <i class="mdi mdi-chart-timeline-variant"></i>
      <p>{{ $t('NO_DATA') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  type WorkPackageViewModel,
  type WorkPackageTaskViewModel,
  type WorkPackageListViewModel,
  WorkPackageTaskState,
  SortType,
} from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';

interface DateMarker {
  label: string;
  position: number;
}

const props = defineProps<{
  workPackage: WorkPackageViewModel;
}>();

const emit = defineEmits<{
  (e: 'open-task', id: string): void;
}>();

const { formatDate: culturedFormat } = useCulturedDate();

const STATE_COLORS: Record<number, string> = {
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

function stateColor(state: WorkPackageTaskState): string {
  return STATE_COLORS[state] || '#cccccc';
}

// ── All tasks flat list ──
const allTasks = computed<WorkPackageTaskViewModel[]>(() => {
  return (props.workPackage.lists || [])
    .map(l => l.tasks || [])
    .reduce((prev, curr) => prev.concat(curr), []);
});

// ── Tasks with dates (for range computation) ──
const datedTasks = computed<WorkPackageTaskViewModel[]>(() => {
  return allTasks.value.filter(t => t.dueAt || t.beginAt || t.endAt);
});

// ── Overall date range ──
const rangeStart = computed<number>(() => {
  const dates: number[] = [];

  // Try workPackage-level dates
  if (props.workPackage.beginAt) {
    dates.push(new Date(props.workPackage.beginAt).getTime());
  }

  // Collect from tasks
  for (const t of datedTasks.value) {
    if (t.beginAt) dates.push(new Date(t.beginAt).getTime());
    if (t.dueAt) dates.push(new Date(t.dueAt).getTime());
    if (t.endAt) dates.push(new Date(t.endAt).getTime());
  }

  if (dates.length === 0) return Date.now();
  return Math.min(...dates);
});

const rangeEnd = computed<number>(() => {
  const dates: number[] = [];

  if (props.workPackage.endAt) {
    dates.push(new Date(props.workPackage.endAt).getTime());
  }

  for (const t of datedTasks.value) {
    if (t.endAt) dates.push(new Date(t.endAt).getTime());
    if (t.dueAt) dates.push(new Date(t.dueAt).getTime());
    if (t.beginAt) dates.push(new Date(t.beginAt).getTime());
  }

  if (dates.length === 0) return Date.now() + 86400000 * 30;
  return Math.max(...dates);
});

const totalRange = computed<number>(() => {
  const diff = rangeEnd.value - rangeStart.value;
  // Minimum 1 day range to avoid division by zero
  return diff > 0 ? diff : 86400000;
});

// ── Sorted lists ──
const sortedLists = computed<WorkPackageListViewModel[]>(() => {
  const lists = [...(props.workPackage.lists || [])];
  const sort = props.workPackage.listsSort ?? SortType.Manual;

  if (sort === SortType.Manual) {
    lists.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } else {
    lists.sort((a, b) => a.title.localeCompare(b.title));
  }

  return lists;
});

// ── Date markers ──
const dateMarkers = computed<DateMarker[]>(() => {
  const count = 8;
  const start = rangeStart.value;
  const range = totalRange.value;
  const markers: DateMarker[] = [];

  for (let i = 0; i <= count; i++) {
    const ts = start + (range * i) / count;
    const d = new Date(ts);
    markers.push({
      label: culturedFormat(d, 'MM/dd'),
      position: (i / count) * 100,
    });
  }

  return markers;
});

// ── Bar positioning ──
function getBarLeft(task: WorkPackageTaskViewModel): number {
  if (!task.beginAt) return 0;
  const begin = new Date(task.beginAt).getTime();
  return ((begin - rangeStart.value) / totalRange.value) * 100;
}

function getBarWidth(task: WorkPackageTaskViewModel): number {
  if (!task.beginAt || !task.endAt) return 0;
  const begin = new Date(task.beginAt).getTime();
  const end = new Date(task.endAt).getTime();
  const duration = end - begin;
  if (duration <= 0) return 1;
  return (duration / totalRange.value) * 100;
}

function getMilestonePos(task: WorkPackageTaskViewModel): number {
  if (!task.dueAt) return 0;
  const due = new Date(task.dueAt).getTime();
  return ((due - rangeStart.value) / totalRange.value) * 100;
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables';

.wp-gantt {
  background: $surface;
  border-radius: $border-radius-md;
  overflow: auto;
  max-height: calc(100vh - 200px);

  // ── Header ──
  &__header {
    display: flex;
    border-bottom: 1px solid $divider;
    height: 36px;
    position: sticky;
    top: 0;
    background: $surface;
    z-index: 3;
  }

  &__label-col {
    width: 250px;
    min-width: 250px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 $spacing-md;
    font-size: 0.75rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-inline-end: 1px solid $divider;
  }

  &__timeline-col {
    flex: 1;
    position: relative;
    min-width: 500px;
  }

  &__marker {
    position: absolute;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 0.65rem;
    font-weight: 500;
    color: $text-secondary;
    transform: translateX(-50%);
    white-space: nowrap;
    user-select: none;
  }

  // ── Group ──
  &__group {
    &:not(:last-child) {
      border-bottom: 1px solid $divider;
    }
  }

  &__group-title {
    height: 28px;
    display: flex;
    align-items: center;
    padding: 0 $spacing-md;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: $text-secondary;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid $divider;
  }

  // ── Row ──
  &__row {
    display: flex;
    height: 32px;
    border-bottom: 1px solid $divider;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    &:nth-child(even) {
      background: rgba(0, 0, 0, 0.01);

      &:hover {
        background: rgba(0, 0, 0, 0.03);
      }
    }
  }

  &__task-label {
    width: 250px;
    min-width: 250px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 $spacing-md;
    font-size: 0.8rem;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-inline-end: 1px solid $divider;
  }

  &__bar-container {
    flex: 1;
    position: relative;
    min-width: 500px;
    overflow: visible;
  }

  // ── Bar ──
  &__bar {
    position: absolute;
    top: 4px;
    height: 24px;
    border-radius: $border-radius-sm;
    display: flex;
    align-items: center;
    padding: 0 6px;
    min-width: 4px;
    transition: opacity $transition-fast, box-shadow $transition-fast;

    &:hover {
      opacity: 0.9;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    }
  }

  &__bar-text {
    font-size: 0.7rem;
    font-weight: 500;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ── Milestone ──
  &__milestone {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);

    i {
      font-size: 16px;
    }
  }

  // ── Empty state ──
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-xl * 2 $spacing-md;
    color: $text-secondary;

    i {
      font-size: 2.5rem;
      margin-bottom: $spacing-sm;
      opacity: 0.5;
    }

    p {
      font-size: 0.85rem;
      margin: 0;
    }
  }
}

// ── Dark Mode ──
body.dark-mode {
  .wp-gantt {
    background: $dark-card;

    &__header {
      background: $dark-card;
      border-bottom-color: $dark-divider;
    }

    &__label-col {
      color: $dark-text-secondary;
      border-inline-end-color: $dark-divider;
    }

    &__marker {
      color: $dark-text-secondary;
    }

    &__group-title {
      color: $dark-text-secondary;
      background: rgba(255, 255, 255, 0.03);
      border-bottom-color: $dark-divider;
    }

    &__group {
      &:not(:last-child) {
        border-bottom-color: $dark-divider;
      }
    }

    &__row {
      border-bottom-color: $dark-divider;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      &:nth-child(even) {
        background: rgba(255, 255, 255, 0.02);

        &:hover {
          background: rgba(255, 255, 255, 0.04);
        }
      }
    }

    &__task-label {
      color: $dark-text-primary;
      border-inline-end-color: $dark-divider;
    }

    &__empty {
      color: $dark-text-secondary;
    }
  }
}

// ── Responsive ──
@media (max-width: $breakpoint-sm) {
  .wp-gantt {
    &__label-col,
    &__task-label {
      width: 150px;
      min-width: 150px;
    }
  }
}
</style>
