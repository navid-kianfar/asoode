<template>
  <div class="prm">
    <!-- Empty state -->
    <div v-if="!workPackages.length" class="prm__empty">
      <i class="mdi mdi-chart-timeline-variant"></i>
      <p>{{ $t('NO_DATA') }}</p>
    </div>

    <template v-else>
      <!-- Seasons banner -->
      <div v-if="project.seasons?.length" class="prm__seasons">
        <div v-for="s in project.seasons" :key="s.id" class="prm__season">
          <i class="mdi mdi-flag"></i>
          <span>{{ s.title }}</span>
        </div>
      </div>

      <!-- Gantt chart -->
      <div class="prm__chart">
        <!-- Header -->
        <div class="prm__header">
          <div class="prm__label-col">{{ $t('WORK_PACKAGE') }}</div>
          <div class="prm__timeline-col">
            <div
              v-for="marker in dateMarkers"
              :key="marker.label"
              class="prm__marker"
              :style="{ left: marker.position + '%' }"
            >
              {{ marker.label }}
            </div>
          </div>
        </div>

        <!-- Work package rows -->
        <div v-for="wp in workPackages" :key="wp.id" class="prm__group">
          <!-- WP header row -->
          <div class="prm__wp-row" @click="goToWp(wp)">
            <div class="prm__label-col prm__wp-label">
              <i class="mdi mdi-package-variant-closed"></i>
              <span>{{ wp.title }}</span>
              <span class="prm__task-count">{{ wpTaskCount(wp) }}</span>
            </div>
            <div class="prm__timeline-col">
              <div
                v-if="wpHasDates(wp)"
                class="prm__wp-bar"
                :style="{
                  left: getWpBarLeft(wp) + '%',
                  width: getWpBarWidth(wp) + '%',
                }"
              ></div>
            </div>
          </div>

          <!-- Task rows -->
          <div
            v-for="task in wpDatedTasks(wp)"
            :key="task.id"
            class="prm__task-row"
            @click="$emit('open-task', task.id)"
          >
            <div class="prm__label-col prm__task-label" :title="task.title">
              {{ task.title }}
            </div>
            <div class="prm__timeline-col">
              <div
                v-if="task.beginAt && task.endAt"
                class="prm__bar"
                :style="{
                  left: getBarLeft(task) + '%',
                  width: getBarWidth(task) + '%',
                  background: stateColor(task.state),
                }"
              >
                <span v-if="getBarWidth(task) > 10" class="prm__bar-text">{{ task.title }}</span>
              </div>
              <div
                v-else-if="task.dueAt"
                class="prm__milestone"
                :style="{ left: getMilestonePos(task) + '%' }"
              >
                <i class="mdi mdi-rhombus" :style="{ color: stateColor(task.state) }"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  type ProjectViewModel,
  type WorkPackageViewModel,
  type WorkPackageTaskViewModel,
  WorkPackageTaskState,
} from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';

const props = defineProps<{ project: ProjectViewModel }>();
const emit = defineEmits<{ 'open-task': [id: string] }>();

const router = useRouter();
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

const workPackages = computed(() => props.project.workPackages || []);

function allTasks(): WorkPackageTaskViewModel[] {
  const tasks: WorkPackageTaskViewModel[] = [];
  for (const wp of workPackages.value) {
    for (const list of wp.lists || []) {
      tasks.push(...(list.tasks || []));
    }
  }
  return tasks;
}

function wpDatedTasks(wp: WorkPackageViewModel): WorkPackageTaskViewModel[] {
  const tasks: WorkPackageTaskViewModel[] = [];
  for (const list of wp.lists || []) {
    for (const t of list.tasks || []) {
      if (t.dueAt || t.beginAt || t.endAt) tasks.push(t);
    }
  }
  return tasks;
}

function wpTaskCount(wp: WorkPackageViewModel): number {
  return (wp.lists || []).reduce((sum, l) => sum + (l.tasks?.length || 0), 0);
}

function wpHasDates(wp: WorkPackageViewModel): boolean {
  return !!(wp.beginAt || wp.endAt || wpDatedTasks(wp).length);
}

// ── Date range ──
const rangeStart = computed<number>(() => {
  const dates: number[] = [];
  for (const wp of workPackages.value) {
    if (wp.beginAt) dates.push(new Date(wp.beginAt).getTime());
    if (wp.endAt) dates.push(new Date(wp.endAt).getTime());
    for (const t of wpDatedTasks(wp)) {
      if (t.beginAt) dates.push(new Date(t.beginAt).getTime());
      if (t.dueAt) dates.push(new Date(t.dueAt).getTime());
      if (t.endAt) dates.push(new Date(t.endAt).getTime());
    }
  }
  return dates.length ? Math.min(...dates) : Date.now();
});

const rangeEnd = computed<number>(() => {
  const dates: number[] = [];
  for (const wp of workPackages.value) {
    if (wp.endAt) dates.push(new Date(wp.endAt).getTime());
    if (wp.beginAt) dates.push(new Date(wp.beginAt).getTime());
    for (const t of wpDatedTasks(wp)) {
      if (t.endAt) dates.push(new Date(t.endAt).getTime());
      if (t.dueAt) dates.push(new Date(t.dueAt).getTime());
      if (t.beginAt) dates.push(new Date(t.beginAt).getTime());
    }
  }
  return dates.length ? Math.max(...dates) : Date.now() + 86400000 * 30;
});

const totalRange = computed<number>(() => {
  const diff = rangeEnd.value - rangeStart.value;
  return diff > 0 ? diff : 86400000;
});

// ── Date markers ──
const dateMarkers = computed(() => {
  const count = 8;
  const start = rangeStart.value;
  const range = totalRange.value;
  const markers: { label: string; position: number }[] = [];
  for (let i = 0; i <= count; i++) {
    const ts = start + (range * i) / count;
    markers.push({
      label: culturedFormat(new Date(ts), 'MM/dd'),
      position: (i / count) * 100,
    });
  }
  return markers;
});

// ── Bar positioning ──
function getBarLeft(task: WorkPackageTaskViewModel): number {
  if (!task.beginAt) return 0;
  return ((new Date(task.beginAt).getTime() - rangeStart.value) / totalRange.value) * 100;
}

function getBarWidth(task: WorkPackageTaskViewModel): number {
  if (!task.beginAt || !task.endAt) return 0;
  const duration = new Date(task.endAt).getTime() - new Date(task.beginAt).getTime();
  return duration > 0 ? (duration / totalRange.value) * 100 : 1;
}

function getMilestonePos(task: WorkPackageTaskViewModel): number {
  if (!task.dueAt) return 0;
  return ((new Date(task.dueAt).getTime() - rangeStart.value) / totalRange.value) * 100;
}

function getWpBarLeft(wp: WorkPackageViewModel): number {
  const dates: number[] = [];
  if (wp.beginAt) dates.push(new Date(wp.beginAt).getTime());
  for (const t of wpDatedTasks(wp)) {
    if (t.beginAt) dates.push(new Date(t.beginAt).getTime());
    if (t.dueAt) dates.push(new Date(t.dueAt).getTime());
  }
  if (!dates.length) return 0;
  return ((Math.min(...dates) - rangeStart.value) / totalRange.value) * 100;
}

function getWpBarWidth(wp: WorkPackageViewModel): number {
  const starts: number[] = [];
  const ends: number[] = [];
  if (wp.beginAt) starts.push(new Date(wp.beginAt).getTime());
  if (wp.endAt) ends.push(new Date(wp.endAt).getTime());
  for (const t of wpDatedTasks(wp)) {
    if (t.beginAt) starts.push(new Date(t.beginAt).getTime());
    if (t.endAt) ends.push(new Date(t.endAt).getTime());
    if (t.dueAt) { starts.push(new Date(t.dueAt).getTime()); ends.push(new Date(t.dueAt).getTime()); }
  }
  if (!starts.length || !ends.length) return 0;
  const duration = Math.max(...ends) - Math.min(...starts);
  return duration > 0 ? (duration / totalRange.value) * 100 : 1;
}

function goToWp(wp: WorkPackageViewModel) {
  router.push(`/work-package/${wp.id}`);
}
</script>

<style lang="scss">
@import '@/styles/variables';

.prm {
  // ── Seasons ──
  &__seasons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 0 16px;
  }

  &__season {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba($primary, 0.08);
    border-radius: 20px;
    font-size: 0.78rem;
    color: $primary;
    font-weight: 500;

    i { font-size: 0.85rem; }
  }

  // ── Chart ──
  &__chart {
    background: $surface;
    border-radius: $border-radius-md;
    overflow: hidden;
    border: 1px solid $divider;
  }

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
    width: 260px;
    min-width: 260px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 12px;
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
    min-width: 0;
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

  // ── WP row ──
  &__wp-row {
    display: flex;
    height: 36px;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid $divider;
    transition: background 0.15s;

    &:hover { background: rgba(0, 0, 0, 0.04); }
  }

  &__wp-label {
    gap: 8px;
    font-weight: 600;
    font-size: 0.82rem;
    color: $text-primary;

    i { font-size: 1rem; color: $primary; }
  }

  &__task-count {
    margin-inline-start: auto;
    font-size: 0.7rem;
    font-weight: 400;
    color: $text-secondary;
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 6px;
    border-radius: 10px;
  }

  &__wp-bar {
    position: absolute;
    top: 6px;
    height: 24px;
    border-radius: 4px;
    background: rgba($primary, 0.15);
    border: 1px solid rgba($primary, 0.3);
    min-width: 4px;
  }

  // ── Task row ──
  &__task-row {
    display: flex;
    height: 30px;
    border-bottom: 1px solid $divider;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: rgba(0, 0, 0, 0.03); }
  }

  &__task-label {
    font-size: 0.78rem;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-inline-start: 24px;
  }

  // ── Bar ──
  &__bar {
    position: absolute;
    top: 3px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding: 0 6px;
    min-width: 4px;

    &:hover {
      opacity: 0.9;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    }
  }

  &__bar-text {
    font-size: 0.68rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ── Milestone ──
  &__milestone {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);

    i { font-size: 14px; }
  }

  // ── Empty ──
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 16px;
    color: $text-secondary;

    i {
      font-size: 2.5rem;
      margin-bottom: 8px;
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
  .prm {
    &__season {
      background: rgba($primary-light, 0.12);
      color: $primary-light;
    }

    &__chart {
      background: $dark-card;
      border-color: $dark-divider;
    }

    &__header {
      background: $dark-card;
      border-bottom-color: $dark-divider;
    }

    &__label-col {
      color: $dark-text-secondary;
      border-inline-end-color: $dark-divider;
    }

    &__marker { color: $dark-text-secondary; }

    &__group:not(:last-child) { border-bottom-color: $dark-divider; }

    &__wp-row {
      background: rgba(255, 255, 255, 0.03);
      border-bottom-color: $dark-divider;

      &:hover { background: rgba(255, 255, 255, 0.05); }
    }

    &__wp-label {
      color: $dark-text-primary;

      i { color: $primary-light; }
    }

    &__task-count {
      color: $dark-text-secondary;
      background: rgba(255, 255, 255, 0.08);
    }

    &__wp-bar {
      background: rgba($primary-light, 0.12);
      border-color: rgba($primary-light, 0.25);
    }

    &__task-row {
      border-bottom-color: $dark-divider;

      &:hover { background: rgba(255, 255, 255, 0.04); }
    }

    &__task-label { color: $dark-text-primary; }

    &__empty { color: $dark-text-secondary; }
  }
}

@media (max-width: 768px) {
  .prm {
    &__label-col { width: 160px; min-width: 160px; }
  }
}
</style>
