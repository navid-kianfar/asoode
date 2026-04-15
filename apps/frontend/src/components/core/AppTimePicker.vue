<template>
  <v-menu
    v-model="isOpen"
    :close-on-content-click="false"
    transition="scale-transition"
    min-width="auto"
  >
    <template #activator="{ props: menu }">
      <v-text-field
        v-bind="menu"
        :model-value="modelValue"
        :label="label"
        :disabled="disabled"
        :density="dense ? 'compact' : 'comfortable'"
        variant="outlined"
        color="primary"
        rounded="lg"
        bg-color="surface"
        readonly
        prepend-inner-icon="mdi-clock-outline"
        class="app-time-picker"
        hide-details
      />
    </template>
    <div class="app-time-picker__dropdown">
      <div class="app-time-picker__header">
        <v-icon size="18" class="mr-2">mdi-clock-outline</v-icon>
        <span>{{ $t('SELECT_TIME') }}</span>
      </div>
      
      <div class="app-time-picker__selectors">
        <!-- Hour -->
        <div class="app-time-picker__col">
          <span class="app-time-picker__col-label">{{ $t('HOUR') }}</span>
          <div class="app-time-picker__list">
            <div
              v-for="h in 24"
              :key="h"
              class="app-time-picker__item"
              :class="{ active: currentHour === h - 1 }"
              @click="setHour(h - 1)"
            >
              {{ String(h - 1).padStart(2, '0') }}
            </div>
          </div>
        </div>

        <div class="app-time-picker__divider">:</div>

        <!-- Minute -->
        <div class="app-time-picker__col">
          <span class="app-time-picker__col-label">{{ $t('MINUTE') }}</span>
          <div class="app-time-picker__list">
            <div
              v-for="m in minutes"
              :key="m"
              class="app-time-picker__item"
              :class="{ active: currentMinute === m }"
              @click="setMinute(m)"
            >
              {{ String(m).padStart(2, '0') }}
            </div>
          </div>
        </div>
      </div>

      <div class="app-time-picker__footer">
        <v-btn variant="text" size="small" @click="isOpen = false">{{ $t('CLOSE') }}</v-btn>
        <v-btn color="primary" variant="tonal" size="small" @click="onSetNow">{{ $t('NOW') }}</v-btn>
      </div>
    </div>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue?: string;
  label?: string;
  disabled?: boolean;
  dense?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const isOpen = ref(false);
const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const currentHour = computed(() => {
  if (!props.modelValue) return 0;
  return parseInt(props.modelValue.split(':')[0]) || 0;
});

const currentMinute = computed(() => {
  if (!props.modelValue) return 0;
  const m = parseInt(props.modelValue.split(':')[1]) || 0;
  // Snap to nearest 5 for the UI, but allow custom if passed
  return m;
});

function setHour(h: number) {
  const m = String(currentMinute.value).padStart(2, '0');
  emit('update:modelValue', `${String(h).padStart(2, '0')}:${m}`);
}

function setMinute(m: number) {
  const h = String(currentHour.value).padStart(2, '0');
  emit('update:modelValue', `${h}:${String(m).padStart(2, '0')}`);
  isOpen.value = false;
}

function onSetNow() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
  emit('update:modelValue', `${h}:${m}`);
  isOpen.value = false;
}
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-time-picker {
  &__dropdown {
    width: 220px;
    background: $surface;
    border-radius: 12px;
    box-shadow: $shadow-4;
    padding: 12px;
    border: 1px solid $divider;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__header {
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-secondary;
    padding-bottom: 8px;
    border-bottom: 1px solid $divider;
  }

  &__selectors {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 8px;
  }

  &__col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  &__col-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: $text-disabled;
    text-transform: uppercase;
  }

  &__list {
    height: 160px;
    overflow-y: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 2px; }
  }

  &__item {
    padding: 6px;
    text-align: center;
    font-size: 0.9rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba(0,0,0,0.04); }
    &.active { background: $primary; color: #fff; font-weight: 700; }
  }

  &__divider {
    font-size: 1.2rem;
    font-weight: 700;
    padding-top: 20px;
    color: $text-disabled;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px solid $divider;
  }
}

body.dark-mode {
  .app-time-picker {
    &__dropdown { background: $dark-card; border-color: $dark-border; }
    &__header { border-bottom-color: $dark-border; color: #888; }
    &__item:hover { background: rgba(255,255,255,0.05); }
    &__item.active { background: $primary-light; }
    &__divider { color: #444; }
    &__footer { border-top-color: $dark-border; }
  }
}
</style>
