<template>
  <div class="dur-input" :class="[`dur-input--${size}`, { 'dur-input--disabled': disabled }]">
    <label v-if="label" class="dur-input__label">{{ label }}</label>
    <div class="dur-input__segments">
      <!-- Days -->
      <div v-if="showDays" class="dur-input__segment">
        <button
          class="dur-input__btn"
          :disabled="disabled"
          @mousedown="startIncrement('days', 1)"
          @mouseup="stopRepeat"
          @mouseleave="stopRepeat"
        >
          <i class="mdi mdi-chevron-up"></i>
        </button>
        <span class="dur-input__value">{{ pad(days) }}</span>
        <button
          class="dur-input__btn"
          :disabled="disabled"
          @mousedown="startIncrement('days', -1)"
          @mouseup="stopRepeat"
          @mouseleave="stopRepeat"
        >
          <i class="mdi mdi-chevron-down"></i>
        </button>
        <span class="dur-input__unit">{{ $t('DAYS') }}</span>
      </div>

      <span v-if="showDays && showHours" class="dur-input__sep">:</span>

      <!-- Hours -->
      <div v-if="showHours" class="dur-input__segment">
        <button
          class="dur-input__btn"
          :disabled="disabled"
          @mousedown="startIncrement('hours', 1)"
          @mouseup="stopRepeat"
          @mouseleave="stopRepeat"
        >
          <i class="mdi mdi-chevron-up"></i>
        </button>
        <span class="dur-input__value">{{ pad(hours) }}</span>
        <button
          class="dur-input__btn"
          :disabled="disabled"
          @mousedown="startIncrement('hours', -1)"
          @mouseup="stopRepeat"
          @mouseleave="stopRepeat"
        >
          <i class="mdi mdi-chevron-down"></i>
        </button>
        <span class="dur-input__unit">{{ $t('HOURS') }}</span>
      </div>

      <span v-if="showHours && showMinutes" class="dur-input__sep">:</span>

      <!-- Minutes -->
      <div v-if="showMinutes" class="dur-input__segment">
        <button
          class="dur-input__btn"
          :disabled="disabled"
          @mousedown="startIncrement('minutes', 1)"
          @mouseup="stopRepeat"
          @mouseleave="stopRepeat"
        >
          <i class="mdi mdi-chevron-up"></i>
        </button>
        <span class="dur-input__value">{{ pad(minutes) }}</span>
        <button
          class="dur-input__btn"
          :disabled="disabled"
          @mousedown="startIncrement('minutes', -1)"
          @mouseup="stopRepeat"
          @mouseleave="stopRepeat"
        >
          <i class="mdi mdi-chevron-down"></i>
        </button>
        <span class="dur-input__unit">{{ $t('MINUTES') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: number;
  label?: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
}>(), {
  showDays: true,
  showHours: true,
  showMinutes: true,
  disabled: false,
  size: 'md',
});

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 8; // work day
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;

const days = computed(() => Math.floor((props.modelValue || 0) / MINUTES_PER_DAY));
const hours = computed(() => Math.floor(((props.modelValue || 0) % MINUTES_PER_DAY) / MINUTES_PER_HOUR));
const minutes = computed(() => (props.modelValue || 0) % MINUTES_PER_HOUR);

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function recompose(d: number, h: number, m: number): number {
  return d * MINUTES_PER_DAY + h * MINUTES_PER_HOUR + m;
}

function adjust(unit: 'days' | 'hours' | 'minutes', delta: number) {
  let d = days.value;
  let h = hours.value;
  let m = minutes.value;

  if (unit === 'days') {
    d = Math.max(0, Math.min(999, d + delta));
  } else if (unit === 'hours') {
    h += delta;
    if (h > 23) { h = 0; d = Math.min(999, d + 1); }
    else if (h < 0) { if (d > 0) { d--; h = 23; } else { h = 0; } }
  } else {
    m += delta;
    if (m > 59) { m = 0; h++; if (h > 23) { h = 0; d = Math.min(999, d + 1); } }
    else if (m < 0) { if (h > 0 || d > 0) { m = 59; h--; if (h < 0) { if (d > 0) { d--; h = 23; } else { h = 0; m = 0; } } } else { m = 0; } }
  }

  const total = recompose(d, h, m);
  emit('update:modelValue', Math.max(0, total));
}

// Hold-to-repeat
const repeatTimer = ref<ReturnType<typeof setInterval> | null>(null);
const repeatTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

function startIncrement(unit: 'days' | 'hours' | 'minutes', delta: number) {
  adjust(unit, delta);
  repeatTimeout.value = setTimeout(() => {
    repeatTimer.value = setInterval(() => adjust(unit, delta), 100);
  }, 400);
}

function stopRepeat() {
  if (repeatTimeout.value) { clearTimeout(repeatTimeout.value); repeatTimeout.value = null; }
  if (repeatTimer.value) { clearInterval(repeatTimer.value); repeatTimer.value = null; }
}

onBeforeUnmount(() => stopRepeat());
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.dur-input {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &__label {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: $text-secondary;
  }

  &__segments {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid $divider;
    border-radius: $border-radius-md;
    padding: 4px 8px;
  }

  &__segment {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    min-width: 36px;
  }

  &__btn {
    width: 28px;
    height: 20px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    border-radius: 4px;
    transition: all $transition-fast;
    padding: 0;

    i { font-size: 0.9rem; }

    &:hover {
      background: rgba($primary, 0.08);
      color: $primary;
    }

    &:active {
      background: rgba($primary, 0.15);
    }

    &:disabled {
      opacity: 0.3;
      cursor: default;
    }
  }

  &__value {
    font-size: 1.15rem;
    font-weight: 600;
    color: $text-primary;
    min-width: 28px;
    text-align: center;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    user-select: none;
  }

  &__unit {
    font-size: 0.5rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $text-disabled;
    margin-top: -2px;
  }

  &__sep {
    font-size: 1rem;
    font-weight: 700;
    color: $text-disabled;
    padding: 0 2px;
    user-select: none;
    align-self: center;
    margin-top: -16px;
  }

  // Size: small
  &--sm &__segments {
    padding: 2px 6px;
  }

  &--sm &__value {
    font-size: 0.95rem;
  }

  &--sm &__btn {
    width: 24px;
    height: 16px;
    i { font-size: 0.8rem; }
  }

  &--sm &__segment {
    min-width: 30px;
  }

  &--sm &__sep {
    font-size: 0.85rem;
    margin-top: -14px;
  }
}
</style>

<!-- Dark mode -->
<style lang="scss">
body.dark-mode {
  .dur-input__segments {
    background: rgba(255, 255, 255, 0.04);
    border-color: #555;
  }

  .dur-input__value { color: #ddd; }
  .dur-input__unit { color: #666; }
  .dur-input__sep { color: #555; }
  .dur-input__label { color: #888; }

  .dur-input__btn {
    color: #888;
    &:hover { background: rgba(#9575CD, 0.12); color: #9575CD; }
    &:active { background: rgba(#9575CD, 0.2); }
  }
}
</style>
