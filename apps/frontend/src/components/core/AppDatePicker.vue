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
        :model-value="displayValue"
        :label="label"
        :disabled="disabled"
        :error-messages="errors"
        :density="dense ? 'compact' : 'comfortable'"
        :hide-details="!errors?.length"
        variant="outlined"
        color="primary"
        rounded="lg"
        bg-color="surface"
        readonly
        prepend-inner-icon="mdi-calendar"
        class="app-date-picker"
        @click:clear="onClear"
      />
    </template>
    <div class="app-date-picker__dropdown">
      <AppCalendar
        :model-value="modelValue"
        @update:model-value="onDateSelected"
      />
    </div>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCultureStore } from '@/stores/culture.store';
import AppCalendar from './AppCalendar.vue';

const props = defineProps<{
  modelValue?: Date | string | null;
  label?: string;
  disabled?: boolean;
  errors?: string[];
  dense?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: Date | null] }>();

const cultureStore = useCultureStore();
const isOpen = ref(false);

const isJalali = computed(() => cultureStore.current.lang === 'fa');

const selectedDate = computed((): Date | null => {
  if (!props.modelValue) return null;
  if (props.modelValue instanceof Date) return props.modelValue;
  const d = new Date(props.modelValue);
  return isNaN(d.getTime()) ? null : d;
});

const displayValue = computed(() => {
  if (!selectedDate.value) return '';
  if (isJalali.value) {
    // Basic Jalali formatting
    const d = selectedDate.value;
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }
  return selectedDate.value.toLocaleDateString(cultureStore.current.culture, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

function onDateSelected(val: Date | null) {
  emit('update:modelValue', val);
  isOpen.value = false;
}

function onClear() {
  emit('update:modelValue', null);
}
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-date-picker {
  &__dropdown {
    width: 300px;
    background: $surface;
    border-radius: 12px;
    box-shadow: $shadow-4;
    padding: 12px;
    border: 1px solid $divider;
  }
}

body.dark-mode {
  .app-date-picker__dropdown {
    background: $dark-card;
    border-color: $dark-border;
  }
}
</style>
