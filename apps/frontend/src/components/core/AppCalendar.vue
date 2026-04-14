<template>
  <div class="app-calendar">
    <!-- Header -->
    <div class="ac-header">
      <button class="ac-nav" @click="prevMonth">
        <v-icon size="18">mdi-chevron-left</v-icon>
      </button>
      <span class="ac-month-year">{{ monthYearLabel }}</span>
      <button class="ac-nav" @click="nextMonth">
        <v-icon size="18">mdi-chevron-right</v-icon>
      </button>
    </div>

    <!-- Day names -->
    <div class="ac-weekdays">
      <span v-for="d in weekdayLabels" :key="d" class="ac-weekday">{{ d }}</span>
    </div>

    <!-- Day grid -->
    <div class="ac-grid">
      <button
        v-for="(cell, i) in calendarCells"
        :key="i"
        class="ac-day"
        :class="{
          'ac-day--other': cell.otherMonth,
          'ac-day--today': cell.isToday,
          'ac-day--selected': cell.isSelected,
        }"
        @click="selectDay(cell)"
      >
        {{ cell.day }}
      </button>
    </div>

    <div v-if="!hideFooter" class="ac-footer">
      <button class="ac-today-btn" @click="goToday">{{ $t('GO_TODAY') }}</button>
      <button v-if="clearable && modelValue" class="ac-clear-btn" @click="clear">{{ $t('CLEAR') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCultureStore } from '@/stores/culture.store';

const props = withDefaults(defineProps<{
  modelValue?: Date | string | null;
  clearable?: boolean;
  hideFooter?: boolean;
}>(), {
  clearable: true,
  hideFooter: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: Date | null] }>();

const cultureStore = useCultureStore();

// Current calendar view month/year
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth()); // 0-indexed for Gregorian

const isJalali = computed(() => cultureStore.current.lang === 'fa');

// Parse the modelValue into a Date object
const selectedDate = computed((): Date | null => {
  if (!props.modelValue) return null;
  if (props.modelValue instanceof Date) return props.modelValue;
  const d = new Date(props.modelValue);
  return isNaN(d.getTime()) ? null : d;
});

// Month/year header label
const monthYearLabel = computed(() => {
  if (isJalali.value) {
    const jd = gregorianToJalali(viewYear.value, viewMonth.value + 1, 15);
    return `${cultureStore.current.monthNames[jd.jm - 1]} ${jd.jy}`;
  }
  const d = new Date(viewYear.value, viewMonth.value, 1);
  return d.toLocaleDateString(cultureStore.current.culture, { year: 'numeric', month: 'long' });
});

// Weekday labels
const weekdayLabels = computed(() => cultureStore.current.dayNamesShort);

// Calendar grid cells
interface CalendarCell {
  day: number;
  date: Date;
  otherMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

const calendarCells = computed((): CalendarCell[] => {
  const cells: CalendarCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(viewYear.value, viewMonth.value, 1);
  const lastDay = new Date(viewYear.value, viewMonth.value + 1, 0);

  // Determine start day of week
  let startDow = firstDay.getDay(); // 0=Sunday
  // Adjust for culture's start day
  const cultureStart = getCultureStartDow();
  let offset = (startDow - cultureStart + 7) % 7;

  // Previous month days
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(viewYear.value, viewMonth.value, -i);
    cells.push(makeCell(d, true, today));
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(viewYear.value, viewMonth.value, day);
    cells.push(makeCell(d, false, today));
  }

  // Next month fill to 42 cells (6 weeks)
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear.value, viewMonth.value + 1, i);
    cells.push(makeCell(d, true, today));
  }

  return cells;
});

function getCultureStartDow(): number {
  const lang = cultureStore.current.lang;
  if (lang === 'fa') return 6; // Saturday
  if (lang === 'ar') return 1; // Monday
  if (lang === 'fr') return 1; // Monday
  return 0; // Sunday (en)
}

function makeCell(date: Date, otherMonth: boolean, today: Date): CalendarCell {
  const isToday = date.getTime() === today.getTime();
  const sel = selectedDate.value;
  const isSelected = !!sel && date.getFullYear() === sel.getFullYear() && date.getMonth() === sel.getMonth() && date.getDate() === sel.getDate();

  let displayDay = date.getDate();
  if (isJalali.value) {
    const jd = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    displayDay = jd.jd;
  }

  return { day: displayDay, date, otherMonth, isToday, isSelected };
}

function selectDay(cell: CalendarCell) {
  emit('update:modelValue', cell.date);
}

function clear() {
  emit('update:modelValue', null);
}

function goToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  viewYear.value = today.getFullYear();
  viewMonth.value = today.getMonth();
  emit('update:modelValue', today);
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value--;
  } else {
    viewMonth.value--;
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value++;
  } else {
    viewMonth.value++;
  }
}

// --- Jalali helpers ---
function gregorianToJalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

// Sync view to selected value when it changes
watch(() => props.modelValue, () => {
  if (selectedDate.value) {
    viewYear.value = selectedDate.value.getFullYear();
    viewMonth.value = selectedDate.value.getMonth();
  }
}, { immediate: true });
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.app-calendar {
  width: 100%;
  user-select: none;
}

.ac-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ac-month-year {
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-primary;
}

.ac-nav {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  transition: all $transition-fast;
  &:hover { background: rgba(0, 0, 0, 0.06); color: $text-primary; }
}

.ac-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.ac-weekday {
  text-align: center;
  font-size: 0.62rem;
  font-weight: 600;
  color: $text-disabled;
  text-transform: uppercase;
  padding: 4px 0;
}

.ac-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.ac-day {
  width: 100%;
  aspect-ratio: 1;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  color: $text-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;

  &:hover { background: rgba($primary, 0.1); }

  &--other {
    color: $text-disabled;
    &:hover { background: rgba(0, 0, 0, 0.04); }
  }

  &--today {
    background: rgba($primary, 0.1);
    color: $primary;
    font-weight: 700;
  }

  &--selected {
    background: $primary !important;
    color: #fff !important;
    font-weight: 700;
  }
}

.ac-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $divider;
}

.ac-today-btn,
.ac-clear-btn {
  border: none;
  background: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all $transition-fast;
  font-family: inherit;
}

.ac-today-btn {
  color: $primary;
  &:hover { background: rgba($primary, 0.08); }
}

.ac-clear-btn {
  color: $text-secondary;
  &:hover { background: rgba(0, 0, 0, 0.04); }
}

body.dark-mode {
  .ac-month-year { color: #ddd; }
  .ac-nav { color: #888; &:hover { background: rgba(255, 255, 255, 0.06); color: #ccc; } }
  .ac-weekday { color: #666; }
  .ac-day {
    color: #ccc;
    &:hover { background: rgba($primary, 0.15); }
    &--other { color: #555; &:hover { background: rgba(255, 255, 255, 0.04); } }
    &--today { background: rgba($primary, 0.15); color: $primary; }
    &--selected { background: $primary !important; color: #fff !important; }
  }
  .ac-footer { border-color: #555; }
  .ac-today-btn { color: $primary; &:hover { background: rgba($primary, 0.15); } }
  .ac-clear-btn { color: #888; &:hover { background: rgba(255, 255, 255, 0.06); } }
}
</style>
