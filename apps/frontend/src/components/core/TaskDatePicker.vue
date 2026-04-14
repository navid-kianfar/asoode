<template>
  <div class="tdp" ref="rootRef">
    <label v-if="label" class="tdp__label">{{ label }}</label>
    <button
      class="tdp__trigger"
      :class="{ open: isOpen, filled: !!modelValue, disabled }"
      :disabled="disabled"
      @click="toggle"
    >
      <i class="mdi mdi-calendar-outline tdp__icon"></i>
      <span class="tdp__text">{{ displayValue || placeholder || $t('SELECT_DATE') }}</span>
      <i v-if="modelValue && clearable" class="mdi mdi-close tdp__clear" @click.stop="clear"></i>
      <i v-else class="mdi mdi-chevron-down tdp__chevron"></i>
    </button>

    <Teleport to="body">
      <transition name="tdp-drop">
        <div v-if="isOpen" ref="dropdownRef" class="tdp__dropdown" :style="dropdownStyle">
          <AppCalendar
            :model-value="modelValue"
            :clearable="clearable"
            @update:model-value="onDateSelected"
          />
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useCultureStore } from '@/stores/culture.store';
import AppCalendar from './AppCalendar.vue';

const props = withDefaults(defineProps<{
  modelValue?: Date | string | null;
  label?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
}>(), {
  clearable: true,
  disabled: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: Date | null] }>();

const cultureStore = useCultureStore();
const rootRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();
const isOpen = ref(false);
const dropdownPos = ref({ top: 0, left: 0 });

const isJalali = computed(() => cultureStore.current.lang === 'fa');

// Parse the modelValue into a Date object
const selectedDate = computed((): Date | null => {
  if (!props.modelValue) return null;
  if (props.modelValue instanceof Date) return props.modelValue;
  const d = new Date(props.modelValue);
  return isNaN(d.getTime()) ? null : d;
});

// Display value
const displayValue = computed(() => {
  if (!selectedDate.value) return '';
  if (isJalali.value) {
    const jd = gregorianToJalali(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, selectedDate.value.getDate());
    const monthName = cultureStore.current.monthNames[jd.jm - 1] || '';
    return `${jd.jd} ${monthName} ${jd.jy}`;
  }
  return selectedDate.value.toLocaleDateString(cultureStore.current.culture, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

const dropdownStyle = computed(() => ({
  position: 'fixed' as const,
  top: dropdownPos.value.top + 'px',
  left: dropdownPos.value.left + 'px',
  zIndex: 9999,
}));

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    // Calculate fixed position relative to trigger
    if (rootRef.value) {
      const rect = rootRef.value.getBoundingClientRect();
      const dropdownWidth = 280;
      const dropdownHeight = 340;
      let top = rect.bottom + 4;
      let left = rect.left;
      // Keep within viewport
      if (left + dropdownWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropdownWidth - 8;
      }
      if (top + dropdownHeight > window.innerHeight - 8) {
        top = rect.top - dropdownHeight - 4;
      }
      dropdownPos.value = { top, left };
    }
  }
}

function onDateSelected(val: Date | null) {
  emit('update:modelValue', val);
  isOpen.value = false;
}

function clear() {
  emit('update:modelValue', null);
  isOpen.value = false;
}

// Close on click outside
onClickOutside(rootRef, () => { isOpen.value = false; }, { ignore: [dropdownRef] });

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
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.tdp {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;

  &__label {
    font-size: 0.65rem;
    font-weight: 500;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: 1px solid $divider;
    border-radius: $border-radius-sm;
    background: $surface;
    cursor: pointer;
    font-size: 0.78rem;
    font-family: inherit;
    color: $text-primary;
    transition: all $transition-fast;
    text-align: start;
    width: 100%;

    &:hover { border-color: rgba(0, 0, 0, 0.24); }
    &.open { border-color: $primary; box-shadow: 0 0 0 2px rgba($primary, 0.12); }
    &.disabled { opacity: 0.5; cursor: default; }
    &:not(.filled) .tdp__text { color: $text-disabled; }
  }

  &__icon {
    font-size: 0.9rem;
    color: $text-secondary;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chevron {
    font-size: 0.7rem;
    color: $text-disabled;
    flex-shrink: 0;
    transition: transform $transition-fast;

    .open & { transform: rotate(180deg); }
  }

  &__clear {
    font-size: 0.75rem;
    color: $text-disabled;
    flex-shrink: 0;
    border-radius: 50%;
    padding: 2px;
    transition: all $transition-fast;

    &:hover { color: $warn; background: rgba($warn, 0.08); }
  }

}
</style>

<!-- Dropdown + dark mode (global, teleported to body) -->
<style lang="scss">
@import '@/styles/variables';

// Dropdown panel (teleported to body)
.tdp__dropdown {
  width: 280px;
  background: $surface;
  border: 1px solid $divider;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 12px;
  user-select: none;
}

.tdp__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tdp__month-year {
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-primary;
}

.tdp__nav {
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

  i { font-size: 1rem; }

  &:hover { background: rgba(0, 0, 0, 0.06); color: $text-primary; }
}

.tdp__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.tdp__weekday {
  text-align: center;
  font-size: 0.62rem;
  font-weight: 600;
  color: $text-disabled;
  text-transform: uppercase;
  padding: 4px 0;
}

.tdp__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.tdp__day {
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

  &:hover { background: rgba($primary, 0.08); }

  &--other {
    color: $text-disabled;
    &:hover { background: rgba(0, 0, 0, 0.04); }
  }

  &--today {
    background: rgba($primary, 0.08);
    color: $primary;
    font-weight: 700;
  }

  &--selected {
    background: $primary !important;
    color: #fff !important;
    font-weight: 700;
  }
}

.tdp__footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid $divider;
}

.tdp__today-btn,
.tdp__clear-btn {
  border: none;
  background: none;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all $transition-fast;
  font-family: inherit;
}

.tdp__today-btn {
  color: $primary;
  &:hover { background: rgba($primary, 0.08); }
}

.tdp__clear-btn {
  color: $text-secondary;
  &:hover { background: rgba(0, 0, 0, 0.04); }
}

// Dropdown animation
.tdp-drop-enter-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.tdp-drop-leave-active {
  transition: opacity 100ms ease, transform 100ms ease;
}
.tdp-drop-enter-from,
.tdp-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// Dark mode
body.dark-mode {
  .tdp__trigger {
    background: #3b3b3b;
    border-color: #555;
    color: #ddd;

    &:hover { border-color: #777; }
    &.open { border-color: #9575CD; box-shadow: 0 0 0 2px rgba(#9575CD, 0.15); }
    &:not(.filled) .tdp__text { color: #666; }
  }

  .tdp__icon { color: #888; }
  .tdp__chevron { color: #666; }
  .tdp__clear { color: #666; &:hover { color: #ef5350; } }
  .tdp__label { color: #888; }

  .tdp__dropdown {
    background: #3b3b3b;
    border-color: #555;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  }

  .tdp__month-year { color: #ddd; }
  .tdp__nav { color: #888; &:hover { background: rgba(255, 255, 255, 0.06); color: #ccc; } }
  .tdp__weekday { color: #666; }

  .tdp__day {
    color: #ccc;
    &:hover { background: rgba(#9575CD, 0.12); }
    &--other { color: #555; &:hover { background: rgba(255, 255, 255, 0.04); } }
    &--today { background: rgba(#9575CD, 0.12); color: #9575CD; }
    &--selected { background: #9575CD !important; color: #fff !important; }
  }

  .tdp__footer { border-color: #555; }
  .tdp__today-btn { color: #9575CD; &:hover { background: rgba(#9575CD, 0.12); } }
  .tdp__clear-btn { color: #888; &:hover { background: rgba(255, 255, 255, 0.06); } }
}
</style>
