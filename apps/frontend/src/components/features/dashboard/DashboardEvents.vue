<template>
  <div>
    <div class="month-view">
      <div class="calendar-mini">
        <div class="calendar-header">
          <span>{{ monthName }} {{ year }}</span>
        </div>
        <div class="day-names">
          <div v-for="day in dayNames" :key="day" class="day-name">{{ day }}</div>
        </div>
        <div class="days-grid">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            :class="['day-cell', {
              'other-month': !day.currentMonth,
              'today': day.isToday,
              'has-event': day.events.length > 0,
            }]"
          >
            <span class="day-number">{{ day.day }}</span>
            <div v-if="day.events.length" class="event-dots">
              <span
                v-for="(evt, eidx) in day.events.slice(0, 3)"
                :key="eidx"
                class="dot"
                :class="getEventClass(evt)"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="color-legend" style="margin-top: 10px">
      <div class="item">
        <div class="past color"></div>
        &nbsp;{{ $t('PAST') }}
      </div>
      <div class="item">
        <div class="in-time color"></div>
        &nbsp;{{ $t('IN_TIME') }}
      </div>
      <div class="item">
        <div class="upcoming color"></div>
        &nbsp;{{ $t('UPCOMING') }}
      </div>
      <div class="item">
        <div class="today-legend color"></div>
        &nbsp;{{ $t('TODAY') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IDateEvent } from '@asoode/shared';

const props = defineProps<{ events: IDateEvent[] }>();

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

const dayNames = computed(() => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);

const monthName = computed(() => {
  return new Date(year, month, 1).toLocaleString('default', { month: 'long' });
});

interface CalendarDay {
  day: number;
  currentMonth: boolean;
  isToday: boolean;
  date: Date;
  events: IDateEvent[];
}

const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days: CalendarDay[] = [];

  // Previous month padding
  const prevMonthLast = new Date(year, month, 0);
  for (let i = startPad - 1; i >= 0; i--) {
    const d = prevMonthLast.getDate() - i;
    days.push({
      day: d,
      currentMonth: false,
      isToday: false,
      date: new Date(year, month - 1, d),
      events: [],
    });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    const dayEvents = (props.events || []).filter((e) => {
      const eventDate = new Date(e.date);
      return (
        eventDate.getDate() === d &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
    days.push({ day: d, currentMonth: true, isToday, date, events: dayEvents });
  }

  // Next month padding
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      day: d,
      currentMonth: false,
      isToday: false,
      date: new Date(year, month + 1, d),
      events: [],
    });
  }

  return days;
});

function getEventClass(event: IDateEvent): string {
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate.getTime() === today.getTime()) return 'today-dot';
  if (eventDate < today) return 'past-dot';
  return 'upcoming-dot';
}
</script>

<style scoped lang="scss">
.calendar-mini {
  width: 100%;
}

.calendar-header {
  text-align: center;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 10px;
  color: #666;
}

.day-names {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.7rem;
  color: #999;
  margin-bottom: 5px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  text-align: center;
  padding: 4px 2px;
  font-size: 0.75rem;
  position: relative;
  min-height: 28px;
  color: #333;

  &.other-month {
    color: #ccc;
  }

  &.today .day-number {
    background-color: #2a70b6;
    color: #fff;
    border-radius: 50%;
    display: inline-block;
    width: 22px;
    height: 22px;
    line-height: 22px;
  }
}

.event-dots {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: 1px;

  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    display: inline-block;
  }

  .past-dot {
    background-color: #ee6285;
  }

  .today-dot {
    background-color: #2a70b6;
  }

  .upcoming-dot {
    background-color: #74d68c;
  }
}

// Legend uses global .color-legend from _dashboard.scss
// Dark mode handled in _dashboard.scss
</style>
