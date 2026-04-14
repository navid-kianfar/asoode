<template>
  <div class="tp">
    <!-- Hero Header -->
    <div class="tp-hero">
      <div class="tp-hero__left">
        <h1 class="tp-hero__title">{{ $t('TASKS_MANAGEMENT') }}</h1>
        <p class="tp-hero__subtitle">{{ $t('TASKS_SUBTITLE') }}</p>
      </div>
      <div class="tp-hero__actions">
        <!-- Duration picker -->
        <div class="tp-duration">
          <button class="tp-duration__nav" @click="prev">
            <i :class="rtl ? 'mdi mdi-chevron-right' : 'mdi mdi-chevron-left'"></i>
          </button>
          <span class="tp-duration__label">{{ formattedDate }}</span>
          <button class="tp-duration__nav" @click="next">
            <i :class="rtl ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right'"></i>
          </button>
          <button class="tp-duration__today" @click="goToday">{{ $t('GO_TODAY') }}</button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tp-tabs">
      <button
        v-for="t in tabs"
        :key="t.value"
        :class="['tp-tabs__item', { active: tab === t.value }]"
        @click="switchTab(t.value)"
      >
        <i class="mdi" :class="t.icon"></i>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="tp-content">
      <!-- Loading -->
      <TasksSkeleton v-if="waiting" />

      <template v-if="!waiting">
        <!-- Calendar Tab -->
        <div v-if="tab === 0" class="tp-panel">
          <CalendarMonth
            :beginDate="beginDate"
            :endDate="endDate"
            :model="calendarData"
            @open-task="onOpenTask"
          />
        </div>

        <!-- Time Spent Tab -->
        <div v-if="tab === 1" class="tp-panel">
          <TimeSpent
            :beginDate="beginDate"
            :endDate="endDate"
            :model="timeSpentData"
            @open-task="onOpenTask"
          />
        </div>

        <!-- Kartabl Tab -->
        <div v-if="tab === 2" class="tp-panel tp-panel--kartabl">
          <Kartabl
            :beginDate="beginDate"
            :endDate="endDate"
            :model="kartablData"
            @open-task="onOpenTask"
          />
        </div>
      </template>
    </div>
  </div>

  <!-- Task Modal -->
  <TaskModal
    v-if="openedTaskId"
    :taskId="openedTaskId"
    @close="openedTaskId = ''"
    @open-task="openedTaskId = $event"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '@/stores/task.store';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';
import {
  OperationResultStatus,
  type KartablViewModel,
  type WorkPackageTaskViewModel,
} from '@asoode/shared';
import CalendarMonth from '@/components/features/tasks/CalendarMonth.vue';
import TimeSpent from '@/components/features/tasks/TimeSpent.vue';
import Kartabl from '@/components/features/tasks/Kartabl.vue';
import TaskModal from '@/components/modals/TaskModal.vue';
import TasksSkeleton from '@/components/core/skeletons/TasksSkeleton.vue';

const { t } = useI18n();
const taskStore = useTaskStore();
const { getConverter } = useCulturedDate();
const cultureStore = useCultureStore();

const tab = ref<number | undefined>(undefined);
const waiting = ref(false);
const beginDate = ref<Date>(new Date());
const endDate = ref<Date>(new Date());
const openedTaskId = ref('');

const calendarData = ref<WorkPackageTaskViewModel[]>([]);
const timeSpentData = ref<any[]>([]);
const kartablData = ref<KartablViewModel>({ tasks: [] });

const rtl = computed(() => cultureStore.current.rtl);

const tabs = computed(() => [
  { value: 0, label: t('CALENDAR'), icon: 'mdi-calendar-month-outline' },
  { value: 1, label: t('TIME_SPENT'), icon: 'mdi-clock-outline' },
  { value: 2, label: t('KARTABL'), icon: 'mdi-view-dashboard-outline' },
]);

const formattedDate = computed(() => {
  if (!beginDate.value) return '';
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value);
  const monthNames = cultureStore.current.monthNames;
  const monthName = monthNames[parsed.Month - 1] || '';
  return `${monthName} ${parsed.Year}`;
});

function paintMonth() {
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value || new Date());
  beginDate.value = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: 1,
    Hours: 0,
    Minutes: 0,
  });
  const lastDayInMonth = cultureStore.current.daysInMonths[parsed.Month - 1];
  endDate.value = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: lastDayInMonth,
    Hours: 23,
    Minutes: 59,
  });
}

function prev() {
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value);
  let year = parsed.Year;
  let month = parsed.Month - 1;
  if (month === 0) { month = 12; year--; }
  beginDate.value = converter.ToDateTime({ Year: year, Month: month, Day: 1, Hours: 0, Minutes: 0 });
  paintMonth();
  switchTab(tab.value ?? 0);
}

function next() {
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value);
  let year = parsed.Year;
  let month = parsed.Month + 1;
  if (month === 13) { month = 1; year++; }
  beginDate.value = converter.ToDateTime({ Year: year, Month: month, Day: 1, Hours: 0, Minutes: 0 });
  paintMonth();
  switchTab(tab.value ?? 0);
}

function goToday() {
  beginDate.value = new Date();
  paintMonth();
  switchTab(tab.value ?? 0);
}

async function switchTab(newTab: number) {
  waiting.value = true;
  tab.value = newTab;
  try {
    switch (newTab) {
      case 0: {
        const op = await taskStore.calendar({ from: beginDate.value, to: endDate.value });
        calendarData.value = op.status === OperationResultStatus.Success ? (op.data || []) : [];
        break;
      }
      case 1: {
        const op = await taskStore.timeSpents({ from: beginDate.value, to: endDate.value });
        timeSpentData.value = op.status === OperationResultStatus.Success ? (op.data || []) : [];
        break;
      }
      case 2: {
        const op = await taskStore.kartabl({ begin: beginDate.value, end: endDate.value });
        kartablData.value = op.status === OperationResultStatus.Success && op.data ? op.data : { tasks: [] };
        break;
      }
    }
  } catch (e) {
    console.error('Tasks tab load error:', e);
  }
  waiting.value = false;
}

function onOpenTask(taskId: string) {
  openedTaskId.value = taskId;
}

onMounted(() => {
  paintMonth();
  switchTab(0);
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.tp {
  min-height: calc(100vh - 48px);
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
}

// Hero
.tp-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  flex-wrap: wrap;
  gap: 12px;

  &__title {
    font-size: 1.3rem;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  &__subtitle {
    font-size: 0.8rem;
    color: $text-secondary;
    margin: 4px 0 0;
  }
}

// Duration picker
.tp-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  background: $surface;
  border: 1px solid $divider;
  border-radius: 10px;
  padding: 4px;

  &__label {
    font-size: 0.82rem;
    font-weight: 600;
    color: $text-primary;
    min-width: 120px;
    text-align: center;
    white-space: nowrap;
  }

  &__nav {
    width: 30px;
    height: 30px;
    border: none;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $text-secondary;
    transition: all 0.15s;

    i { font-size: 0.85rem; }
    &:hover { background: rgba($primary, 0.08); color: $primary; }
  }

  &__today {
    border: none;
    background: none;
    font-size: 0.72rem;
    font-weight: 500;
    color: $primary;
    cursor: pointer;
    padding: 4px 8px;
    font-family: inherit;
    text-decoration: underline;
    white-space: nowrap;
  }
}

// Tabs
.tp-tabs {
  display: flex;
  gap: 2px;
  padding: 16px 24px 0;
  border-bottom: 1px solid $divider;

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    background: none;
    font-size: 0.8rem;
    font-weight: 500;
    color: $text-secondary;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.15s;
    font-family: inherit;
    white-space: nowrap;

    i { font-size: 1rem; }

    &:hover { color: $text-primary; }

    &.active {
      color: $primary;
      border-bottom-color: $primary;
      font-weight: 600;
    }
  }
}

// Content
.tp-content {
  flex: 1;
  padding: 20px 24px 24px;
}

.tp-panel {
  background: $surface;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 20px;
  min-height: 400px;

  &--kartabl {
    background: none;
    border: none;
    padding: 0;
  }
}

// Responsive
@media (max-width: 700px) {
  .tp-hero {
    padding: 16px 16px 0;
    flex-direction: column;
    align-items: flex-start;
  }
  .tp-tabs { padding: 12px 12px 0; }
  .tp-content { padding: 12px; }
  .tp-hero__title { font-size: 1.1rem; }
  .tp-tabs__item span { display: none; }
  .tp-tabs__item { padding: 10px 12px; min-height: 44px; }
  .tp-panel { padding: 12px; min-height: 300px; }
  .tp-duration__nav { width: 36px; height: 36px; }
}

@media (max-width: 400px) {
  .tp-hero { padding: 12px 10px 0; }
  .tp-content { padding: 8px; }
  .tp-panel { padding: 8px; border-radius: 8px; }
}
</style>

<!-- Dark mode -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .tp {
    background: $dark-background;
  }

  .tp-hero__title { color: $dark-text-bright; }
  .tp-hero__subtitle { color: $dark-text-muted; }

  .tp-duration {
    background: $dark-card;
    border-color: $dark-border;

    &__label { color: $dark-text-light; }
    &__nav { background: rgba(255, 255, 255, 0.06); color: $dark-text-muted; &:hover { background: rgba($primary-light, 0.12); color: $primary-light; } }
    &__today { color: $primary-light; }
  }

  .tp-tabs {
    border-color: $dark-border;

    &__item {
      color: $dark-text-muted;
      &:hover { color: $dark-text-light; }
      &.active { color: $primary-light; border-bottom-color: $primary-light; }
    }
  }

  .tp-panel {
    background: $dark-card;
    border-color: $dark-border;

    &--kartabl { background: none; border: none; }
  }

}
</style>
