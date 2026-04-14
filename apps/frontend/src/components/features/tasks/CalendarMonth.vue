<template>
  <div class="calendar-month">
    <div class="grid-container">
      <div class="grid">
        <div v-for="(col, idx) in gridDays" :key="idx" class="grid-col">
          <div class="grid-item grid-item--header">
            {{ calendar.dayNames[idx] }}
          </div>
          <div v-for="(row, rIdx) in col" :key="rIdx" class="grid-item">
            <template v-if="!row.old">
              <div class="date">{{ row.month }}/{{ row.day }}</div>
              <div v-if="row.tasks.length" class="tasks-container">
                <div
                  v-for="task in row.tasks"
                  :key="task.id"
                  :class="['task-container', 'color-' + task.state]"
                  @click.stop.prevent="$emit('open-task', task.id)"
                >
                  <div class="title">
                    <div class="time-line"></div>
                    {{ truncateText(task.title, 150) }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';
import type { WorkPackageTaskViewModel, IDateTimeProperties, IDateConverter, ICulture } from '@asoode/shared';

interface CalendarNodeItem {
  year: number;
  month: number;
  day: number;
  old: boolean;
  disabled: boolean;
  date: Date | null;
  week: string;
  tasks: WorkPackageTaskViewModel[];
  events?: any[];
}

const props = defineProps<{
  beginDate: Date;
  endDate: Date;
  model: WorkPackageTaskViewModel[];
}>();

const emit = defineEmits<{
  (e: 'open-task', taskId: string): void;
}>();

const { getConverter } = useCulturedDate();
const cultureStore = useCultureStore();

const gridDays = ref<CalendarNodeItem[][]>([]);

const calendar = computed<ICulture>(() => cultureStore.current);

function pad(num: number, size: number): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function truncateText(text: string, length: number): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function truncateTime(date: IDateTimeProperties): string {
  return `${date.Year}/${pad(date.Month, 2)}/${pad(date.Day, 2)}`;
}

function getWeekMap(): Record<number, number> {
  const lang = cultureStore.lang;
  if (lang === 'fa') return { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
  if (lang === 'ar') return { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
  return { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
}

function partition(items: CalendarNodeItem[]): CalendarNodeItem[][] {
  const result: CalendarNodeItem[][] = [];
  const mapped: CalendarNodeItem[][] = [];
  for (let i = 0; i < items.length; i += 7) {
    mapped.push(items.slice(i, i + 7));
  }
  for (let i = 0; i < 7; i++) {
    result[i] = mapped.map((m) => m[i]).filter(Boolean);
  }
  return result;
}

function paintDays() {
  const converter = getConverter();
  const cal = calendar.value;
  const weekMap = getWeekMap();
  const tasks = (props.model || []).map(t => {
    const effectiveDate = t.dueAt || t.beginAt || t.endAt;
    if (!effectiveDate) return { ...t };
    const copy = { ...t };
    copy.dueAtFormatted = converter.Format(new Date(effectiveDate), 'yyyy/MM/dd');
    return copy;
  });

  const begin = new Date(props.beginDate);
  const cultured = converter.FromDateTime(begin);
  const tempYear = cultured.Year;
  const tempMonth = cultured.Month;

  const currentMonthIndex = tempMonth - 1;
  const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const prevMonthDays = cal.daysInMonths[prevMonthIndex];
  const currentMonthDays = cal.daysInMonths[currentMonthIndex];
  const nextMonthIndex = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
  const nextYear = nextMonthIndex === 0 ? tempYear + 1 : tempYear;
  const prevYear = prevMonthIndex === 11 ? tempYear - 1 : tempYear;

  const firstDayDate = converter.ToDateTime({
    Year: tempYear,
    Month: tempMonth,
    Day: 1,
  });
  const dayIndex = firstDayDate.getDay();
  let gap = (weekMap as any)[dayIndex] as number;
  if (gap === 7) gap = 0;

  const result: CalendarNodeItem[] = [];

  // Previous month padding days
  for (let i = 0; i < gap; i++) {
    const culturedScoped = converter.Parse({
      Year: prevYear,
      Month: prevMonthIndex + 1,
      Day: prevMonthDays - gap + i + 1,
    });
    const str = truncateTime(culturedScoped);
    result.push({
      year: prevYear,
      month: prevMonthIndex + 1,
      day: prevMonthDays - gap + i + 1,
      old: true,
      disabled: false,
      date: null,
      week: culturedScoped.WeekName || '',
      tasks: tasks.filter((t) => t.dueAtFormatted === str),
    });
  }

  // Current month days
  for (let i = 1; i <= currentMonthDays; i++) {
    const culturedScoped = converter.Parse({
      Year: tempYear,
      Month: tempMonth,
      Day: i,
    });
    const str = truncateTime(culturedScoped);
    result.push({
      year: tempYear,
      month: tempMonth,
      day: i,
      old: false,
      disabled: false,
      date: null,
      week: culturedScoped.WeekName || '',
      tasks: tasks.filter((t) => t.dueAtFormatted === str),
    });
  }

  // Next month padding days
  const remaining = 7 - (result.length % 7);
  if (remaining && remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const culturedScoped = converter.Parse({
        Year: nextYear,
        Month: nextMonthIndex + 1,
        Day: i,
      });
      const str = truncateTime(culturedScoped);
      result.push({
        year: nextYear,
        month: nextMonthIndex + 1,
        day: i,
        old: true,
        disabled: false,
        date: null,
        week: culturedScoped.WeekName || '',
        tasks: tasks.filter((t) => t.dueAtFormatted === str),
      });
    }
  }

  gridDays.value = partition(result);
}

watch(
  () => props.beginDate,
  () => paintDays(),
);

watch(
  () => props.model,
  () => paintDays(),
  { deep: true },
);

onMounted(() => {
  paintDays();
});
</script>

<style lang="scss">
.calendar-month {
  .grid-container {
    display: grid;
    overflow: auto;
    height: calc(100vh - 283px);
    max-width: 100%;
  }

  .grid {
    display: flex;
    flex-wrap: nowrap;
  }

  .grid-col {
    width: 250px;
    min-width: 250px;
  }

  .grid-item--header {
    height: 50px !important;
    min-height: 50px !important;
    align-items: center !important;
    justify-content: center !important;
    position: sticky;
    position: -webkit-sticky;
    background: white;
    top: 0;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .grid-item {
    height: 200px;
    border: 1px solid #e6e6e6;
    display: flex;
    flex-direction: column;

    .date {
      display: flex;
      font-weight: 400;
      width: 100%;
      justify-content: center;
      background: #e6e6e6;
      font-size: 0.8rem;
      padding: 3px 0;
    }

    .tasks-container {
      overflow-y: auto;

      .task-container {
        color: #fff;
        margin: 5px;
        padding: 5px;
        border-radius: 5px;
        font-size: 0.8rem;
        cursor: pointer;

        &.color-1 {
          background: #cccccc;
          color: #333333;
        }
        &.color-2 {
          background: #59a8ef;
        }
        &.color-3 {
          background: #5eb258;
          color: #333333;
        }
        &.color-4 {
          background: #666666;
        }
        &.color-5 {
          background: #b33634;
        }
        &.color-6 {
          background: #666666;
        }
        &.color-7 {
          background: #808080;
        }
        &.color-8 {
          background: #b3b3b3;
          color: #333333;
        }
        &.color-9 {
          background: #eb973e;
          color: #333333;
        }
      }
    }
  }
}

body.dark-mode {
  .calendar-month {
    .grid-item--header {
      background: #313131;
      color: #999999;
    }

    .grid-item {
      border-color: #444444;

      .date {
        background: #3b3b3b;
        color: #999999;
      }
    }
  }
}
</style>
