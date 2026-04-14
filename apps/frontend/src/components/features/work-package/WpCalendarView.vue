<template>
  <div class="wp-calendar">
    <!-- Toolbar -->
    <div class="wp-calendar__toolbar">
      <div class="wp-calendar__nav">
        <button class="wp-calendar__nav-btn" @click="prevPeriod">
          <i :class="rtl ? 'mdi mdi-chevron-right' : 'mdi mdi-chevron-left'"></i>
        </button>
        <button class="wp-calendar__today-btn" @click="goToday">
          {{ $t('TODAY') }}
        </button>
        <button class="wp-calendar__nav-btn" @click="nextPeriod">
          <i :class="rtl ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right'"></i>
        </button>
        <span class="wp-calendar__date-label">{{ dateLabel }}</span>
      </div>
      <div class="wp-calendar__mode-switch">
        <button
          :class="['wp-calendar__mode-btn', { 'wp-calendar__mode-btn--active': mode === ViewMode.Day }]"
          @click="switchMode(ViewMode.Day)"
        >
          {{ $t('DAY_VIEW') }}
        </button>
        <button
          :class="['wp-calendar__mode-btn', { 'wp-calendar__mode-btn--active': mode === ViewMode.Week }]"
          @click="switchMode(ViewMode.Week)"
        >
          {{ $t('WEEK_VIEW') }}
        </button>
        <button
          :class="['wp-calendar__mode-btn', { 'wp-calendar__mode-btn--active': mode === ViewMode.Month }]"
          @click="switchMode(ViewMode.Month)"
        >
          {{ $t('MONTH_VIEW') }}
        </button>
      </div>
    </div>

    <!-- Day/Week Grid -->
    <div v-if="mode !== ViewMode.Month && days" class="wp-calendar__grid">
      <div class="wp-calendar__grid-inner">
        <!-- Time column -->
        <div :class="['wp-calendar__time-col', rtl ? 'wp-calendar__time-col--right' : 'wp-calendar__time-col--left']">
          <div class="wp-calendar__header-cell wp-calendar__header-cell--time"></div>
          <div
            v-for="hour in hours"
            :key="'th-' + hour"
            class="wp-calendar__hour-cell wp-calendar__hour-cell--label"
          >
            {{ padHour(hour) }}:00
          </div>
        </div>
        <!-- Day columns -->
        <div
          v-for="(day, idx) in days"
          :key="'dc-' + idx"
          :class="['wp-calendar__day-col', { 'wp-calendar__day-col--wide': mode === ViewMode.Day }]"
        >
          <div class="wp-calendar__header-cell">
            {{ day.date }}
          </div>
          <div
            v-for="hour in hours"
            :key="'hc-' + idx + '-' + hour"
            class="wp-calendar__hour-cell"
          >
            <template v-for="task in day.events" :key="task.id + '-' + hour">
              <div
                v-if="getTaskHour(task) === hour"
                class="wp-calendar__event"
                :style="{ backgroundColor: stateColor(task.state) }"
                @click.stop="$emit('open-task', task.id)"
              >
                <span class="wp-calendar__event-indicator" :style="{ backgroundColor: stateIndicatorColor(task.state) }"></span>
                {{ truncate(task.title, 40) }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Month Grid -->
    <div v-if="mode === ViewMode.Month && monthRows" class="wp-calendar__month">
      <!-- Header row with day names -->
      <div class="wp-calendar__month-header">
        <div
          v-for="(name, idx) in dayNames"
          :key="'dn-' + idx"
          class="wp-calendar__month-header-cell"
        >
          {{ name }}
        </div>
      </div>
      <!-- Date rows -->
      <div
        v-for="(row, rowIdx) in monthRows"
        :key="'mr-' + rowIdx"
        class="wp-calendar__month-row"
      >
        <div
          v-for="(cell, colIdx) in row"
          :key="'mc-' + rowIdx + '-' + colIdx"
          :class="['wp-calendar__month-cell', { 'wp-calendar__month-cell--empty': cell.old, 'wp-calendar__month-cell--today': cell.isToday }]"
        >
          <template v-if="!cell.old">
            <span class="wp-calendar__month-date">{{ cell.day }}</span>
            <div v-if="cell.tasks.length" class="wp-calendar__month-tasks">
              <div
                v-for="task in cell.tasks.slice(0, 3)"
                :key="task.id"
                class="wp-calendar__month-pill"
                :style="{ backgroundColor: stateColor(task.state) }"
                @click.stop="$emit('open-task', task.id)"
              >
                <span class="wp-calendar__month-pill-dot" :style="{ backgroundColor: stateIndicatorColor(task.state) }"></span>
                {{ truncate(task.title, 20) }}
              </div>
              <div v-if="cell.tasks.length > 3" class="wp-calendar__month-more">
                +{{ cell.tasks.length - 3 }} more
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  type WorkPackageViewModel,
  type WorkPackageTaskViewModel,
  WorkPackageTaskState,
} from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';

enum ViewMode {
  Day = 1,
  Week = 2,
  Month = 3,
}

interface DayData {
  date: string;
  events: WorkPackageTaskViewModel[];
}

interface MonthCell {
  old: boolean;
  month: number;
  day: number;
  isToday: boolean;
  tasks: WorkPackageTaskViewModel[];
}

const props = defineProps<{
  workPackage: WorkPackageViewModel;
}>();

const emit = defineEmits<{
  (e: 'open-task', id: string): void;
}>();

const cultureStore = useCultureStore();
const { formatDate: culturedFormat, getConverter } = useCulturedDate();

const mode = ref<ViewMode>(ViewMode.Month);
const beginDate = ref<Date>(new Date());
const endDate = ref<Date>(new Date());

const hours = Array(24).fill(0).map((_, i) => i);

const days = ref<DayData[] | null>(null);
const monthRows = ref<MonthCell[][] | null>(null);

const rtl = computed(() => cultureStore.current.rtl);
const dayNames = computed(() => cultureStore.current.dayNames);

const dateLabel = computed(() => {
  if (mode.value === ViewMode.Day) {
    return culturedFormat(beginDate.value);
  }
  return `${culturedFormat(beginDate.value)} - ${culturedFormat(endDate.value)}`;
});

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

const LIGHT_TEXT_STATES = new Set([
  WorkPackageTaskState.ToDo,
  WorkPackageTaskState.Done,
  WorkPackageTaskState.Incomplete,
  WorkPackageTaskState.Blocker,
]);

function stateColor(state: WorkPackageTaskState): string {
  return STATE_COLORS[state] || '#cccccc';
}

function stateIndicatorColor(state: WorkPackageTaskState): string {
  return LIGHT_TEXT_STATES.has(state) ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)';
}

function padHour(h: number): string {
  return String(h).padStart(2, '0');
}

function truncate(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

function getTaskHour(task: WorkPackageTaskViewModel): number {
  if (!task.dueAt) return 0;
  const d = new Date(task.dueAt);
  return d.getHours();
}

function getAllTasks(): WorkPackageTaskViewModel[] {
  return (props.workPackage.lists || [])
    .map(l => l.tasks || [])
    .reduce((prev, curr) => prev.concat(curr), []);
}

function getFilteredTasks(): WorkPackageTaskViewModel[] {
  const converter = getConverter();
  return getAllTasks()
    .filter(f => f.dueAt || f.beginAt || f.endAt)
    .map(t => {
      const effectiveDate = t.dueAt || t.beginAt || t.endAt;
      const copy = { ...t };
      copy.dueAt = new Date(effectiveDate!);
      copy.dueAtFormatted = converter.Format(copy.dueAt, 'yyyy/MM/dd');
      return copy;
    });
}

function buildDays(): void {
  const converter = getConverter();
  const tasks = getFilteredTasks();
  const data: Record<string, WorkPackageTaskViewModel[]> = {};

  let condition = true;
  const begin = new Date(beginDate.value);
  const endParsed = converter.Format(endDate.value, 'yyyy/MM/dd');

  do {
    const beginParsed = converter.Format(begin, 'yyyy/MM/dd');
    data[beginParsed] = tasks.filter(f => f.dueAtFormatted === beginParsed);
    condition = beginParsed !== endParsed;
    begin.setDate(begin.getDate() + 1);
  } while (condition);

  days.value = Object.keys(data).map(k => ({
    date: k,
    events: data[k],
  }));
}

function buildMonthView(): void {
  const converter = getConverter();
  const tasks = getFilteredTasks();

  const year = beginDate.value.getFullYear();
  const month = beginDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = firstDay.getDay(); // 0=Sun

  const today = new Date();
  const todayStr = converter.Format(today, 'yyyy/MM/dd');

  const totalWeeks = Math.ceil((daysInMonth + startDow) / 7);
  const rows: MonthCell[][] = [];

  for (let week = 0; week < totalWeeks; week++) {
    const row: MonthCell[] = [];
    for (let col = 0; col < 7; col++) {
      const dayIndex = week * 7 + col - startDow + 1;
      if (dayIndex < 1 || dayIndex > daysInMonth) {
        row.push({ old: true, month: 0, day: 0, isToday: false, tasks: [] });
      } else {
        const cellDate = new Date(year, month, dayIndex);
        const cellFormatted = converter.Format(cellDate, 'yyyy/MM/dd');
        const cellTasks = tasks.filter(t => t.dueAtFormatted === cellFormatted);
        row.push({
          old: false,
          month: month + 1,
          day: dayIndex,
          isToday: cellFormatted === todayStr,
          tasks: cellTasks,
        });
      }
    }
    rows.push(row);
  }

  monthRows.value = rows;
}

function setDayRange(): void {
  const d = new Date(beginDate.value);
  d.setHours(0, 0, 0, 0);
  beginDate.value = new Date(d);
  endDate.value = new Date(d);
}

function setWeekRange(): void {
  const d = new Date(beginDate.value);
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  beginDate.value = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  endDate.value = new Date(end);
}

function setMonthRange(): void {
  const d = new Date(beginDate.value);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  beginDate.value = first;
  endDate.value = last;
}

function switchMode(newMode: ViewMode): void {
  mode.value = newMode;
  refreshView();
}

function refreshView(): void {
  if (mode.value === ViewMode.Day) {
    setDayRange();
    buildDays();
  } else if (mode.value === ViewMode.Week) {
    setWeekRange();
    buildDays();
  } else if (mode.value === ViewMode.Month) {
    setMonthRange();
    buildMonthView();
  }
}

function prevPeriod(): void {
  const d = new Date(beginDate.value);
  if (mode.value === ViewMode.Day) {
    d.setDate(d.getDate() - 1);
  } else if (mode.value === ViewMode.Week) {
    d.setDate(d.getDate() - 7);
  } else {
    d.setMonth(d.getMonth() - 1);
  }
  beginDate.value = d;
  refreshView();
}

function nextPeriod(): void {
  const d = new Date(beginDate.value);
  if (mode.value === ViewMode.Day) {
    d.setDate(d.getDate() + 1);
  } else if (mode.value === ViewMode.Week) {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  beginDate.value = d;
  refreshView();
}

function goToday(): void {
  beginDate.value = new Date();
  refreshView();
}

onMounted(() => {
  refreshView();
});

watch(() => props.workPackage, () => {
  refreshView();
}, { deep: true });

watch(mode, () => {
  refreshView();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables';

.wp-calendar {
  background: $surface;
  border-radius: $border-radius-md;
  overflow: hidden;

  // ── Toolbar ──
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 $spacing-md;
    border-bottom: 1px solid $divider;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__nav-btn {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: $border-radius-sm;
    color: $text-secondary;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: $text-primary;
    }

    i {
      font-size: 1.1rem;
    }
  }

  &__today-btn {
    height: 28px;
    padding: 0 12px;
    background: transparent;
    border: 1px solid $divider;
    border-radius: 14px;
    font-size: 0.8rem;
    font-weight: 500;
    color: $text-secondary;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast, border-color $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
      border-color: $text-secondary;
      color: $text-primary;
    }
  }

  &__date-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: $text-primary;
    margin-inline-start: $spacing-sm;
    user-select: none;
  }

  // ── Mode Switch (segmented control) ──
  &__mode-switch {
    display: flex;
    border: 1px solid $divider;
    border-radius: $border-radius-sm;
    overflow: hidden;
  }

  &__mode-btn {
    padding: 0 14px;
    height: 28px;
    border: none;
    background: transparent;
    font-size: 0.75rem;
    font-weight: 500;
    color: $text-secondary;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;
    white-space: nowrap;

    &:not(:last-child) {
      border-inline-end: 1px solid $divider;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    &--active {
      background: $primary;
      color: #ffffff;

      &:hover {
        background: $primary-dark;
      }
    }
  }

  // ── Day/Week Grid ──
  &__grid {
    overflow: auto;
    max-height: calc(100vh - 200px);
  }

  &__grid-inner {
    display: flex;
    min-width: max-content;
  }

  &__time-col {
    width: 60px;
    min-width: 60px;
    flex-shrink: 0;
    z-index: 2;
    background: $surface;

    &--left {
      position: sticky;
      left: 0;
    }

    &--right {
      position: sticky;
      right: 0;
    }
  }

  &__day-col {
    flex: 1;
    min-width: 140px;

    &--wide {
      min-width: 400px;
    }
  }

  &__header-cell {
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 500;
    color: $text-secondary;
    border-bottom: 1px solid $divider;
    border-inline-end: 1px solid $divider;
    position: sticky;
    top: 0;
    background: $surface;
    z-index: 3;

    &--time {
      border-inline-end: 1px solid $divider;
    }
  }

  &__hour-cell {
    height: 48px;
    border-bottom: 1px solid $divider;
    border-inline-end: 1px solid $divider;
    position: relative;
    padding: 2px 4px;

    &--label {
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding-inline-end: 6px;
      font-size: 0.7rem;
      font-weight: 500;
      color: $text-secondary;
    }
  }

  // ── Task events (day/week) ──
  &__event {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    margin-bottom: 2px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
    color: #ffffff;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity $transition-fast, box-shadow $transition-fast;

    &:hover {
      opacity: 0.88;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  &__event-indicator {
    width: 3px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  // ── Month Grid ──
  &__month {
    overflow: auto;
    max-height: calc(100vh - 200px);
  }

  &__month-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid $divider;
    position: sticky;
    top: 0;
    background: $surface;
    z-index: 2;
  }

  &__month-header-cell {
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 500;
    color: $text-secondary;
    border-inline-end: 1px solid $divider;

    &:last-child {
      border-inline-end: none;
    }
  }

  &__month-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  &__month-cell {
    min-height: 80px;
    padding: $spacing-xs;
    border-bottom: 1px solid $divider;
    border-inline-end: 1px solid $divider;
    position: relative;
    transition: background $transition-fast;

    &:last-child {
      border-inline-end: none;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    &--empty {
      background: rgba(0, 0, 0, 0.02);
    }

    &--today {
      background: rgba($primary, 0.06);
    }
  }

  &__month-date {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: $text-secondary;
    margin-bottom: $spacing-xs;

    .wp-calendar__month-cell--today & {
      color: $primary;
      font-weight: 600;
    }
  }

  &__month-tasks {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__month-pill {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 500;
    color: #ffffff;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity $transition-fast;

    &:hover {
      opacity: 0.88;
    }
  }

  &__month-pill-dot {
    width: 3px;
    height: 10px;
    border-radius: 1px;
    flex-shrink: 0;
  }

  &__month-more {
    font-size: 0.6rem;
    color: $text-secondary;
    padding: 1px 4px;
    cursor: default;
  }
}

// ── Dark Mode ──
body.dark-mode {
  .wp-calendar {
    background: $dark-card;

    &__toolbar {
      border-bottom-color: $dark-divider;
    }

    &__nav-btn {
      color: $dark-text-secondary;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: $dark-text-primary;
      }
    }

    &__today-btn {
      border-color: $dark-divider;
      color: $dark-text-secondary;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: $dark-text-secondary;
        color: $dark-text-primary;
      }
    }

    &__date-label {
      color: $dark-text-primary;
    }

    &__mode-switch {
      border-color: $dark-divider;
    }

    &__mode-btn {
      color: $dark-text-secondary;

      &:not(:last-child) {
        border-inline-end-color: $dark-divider;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      &--active {
        background: $primary;
        color: #ffffff;

        &:hover {
          background: $primary-dark;
        }
      }
    }

    &__time-col {
      background: $dark-card;
    }

    &__header-cell {
      background: $dark-card;
      color: $dark-text-secondary;
      border-bottom-color: $dark-divider;
      border-inline-end-color: $dark-divider;
    }

    &__hour-cell {
      border-bottom-color: $dark-divider;
      border-inline-end-color: $dark-divider;

      &--label {
        color: $dark-text-secondary;
      }
    }

    &__month-header {
      background: $dark-card;
      border-bottom-color: $dark-divider;
    }

    &__month-header-cell {
      color: $dark-text-secondary;
      border-inline-end-color: $dark-divider;
    }

    &__month-cell {
      border-bottom-color: $dark-divider;
      border-inline-end-color: $dark-divider;

      &:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      &--empty {
        background: rgba(255, 255, 255, 0.02);
      }

      &--today {
        background: rgba($primary-light, 0.1);
      }
    }

    &__month-date {
      color: $dark-text-secondary;

      .wp-calendar__month-cell--today & {
        color: $primary-light;
      }
    }

    &__month-more {
      color: $dark-text-secondary;
    }
  }
}

// ── Responsive ──
@media (max-width: $breakpoint-sm) {
  .wp-calendar {
    &__toolbar {
      flex-direction: column;
      height: auto;
      padding: $spacing-sm $spacing-md;
      gap: $spacing-sm;
      align-items: stretch;
    }

    &__nav {
      justify-content: center;
    }

    &__mode-switch {
      justify-content: center;
    }
  }
}
</style>
