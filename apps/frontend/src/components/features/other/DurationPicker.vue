<template>
  <div class="duration-picker">
    <div class="d-flex align-center ga-3">
      <AppDatePicker
        :model-value="startDate"
        :label="$t('START_DATE')"
        @update:model-value="onStartChange"
      />
      <AppDatePicker
        :model-value="endDate"
        :label="$t('END_DATE')"
        @update:model-value="onEndChange"
      />
    </div>

    <!-- Presets -->
    <div class="d-flex flex-wrap ga-2 mt-3">
      <v-chip
        v-for="preset in presets"
        :key="preset.key"
        size="small"
        variant="tonal"
        :color="activePreset === preset.key ? 'primary' : undefined"
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </v-chip>
    </div>

    <!-- Duration display -->
    <div v-if="durationText" class="text-caption text-medium-emphasis mt-2">
      <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
      {{ durationText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppDatePicker from '@/components/core/AppDatePicker.vue';

const props = defineProps<{
  modelValue?: { start: Date | string | null; end: Date | string | null };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: { start: Date | string | null; end: Date | string | null }];
}>();

const { t } = useI18n();

const startDate = ref<Date | string | null>(props.modelValue?.start || '');
const endDate = ref<Date | string | null>(props.modelValue?.end || '');
const activePreset = ref('');

interface Preset {
  key: string;
  label: string;
  start: () => Date;
  end: () => Date;
}

const presets: Preset[] = [
  {
    key: 'today',
    label: t('TODAY'),
    start: () => {
      const d = new Date(); d.setHours(0, 0, 0, 0); return d;
    },
    end: () => new Date(),
  },
  {
    key: 'week',
    label: t('THIS_WEEK'),
    start: () => {
      const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
    },
    end: () => new Date(),
  },
  {
    key: 'month',
    label: t('THIS_MONTH'),
    start: () => {
      const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
    },
    end: () => new Date(),
  },
  {
    key: 'last7',
    label: t('LAST_7_DAYS'),
    start: () => {
      const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d;
    },
    end: () => new Date(),
  },
  {
    key: 'last30',
    label: t('LAST_30_DAYS'),
    start: () => {
      const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d;
    },
    end: () => new Date(),
  },
  {
    key: 'last90',
    label: t('LAST_90_DAYS'),
    start: () => {
      const d = new Date(); d.setDate(d.getDate() - 90); d.setHours(0, 0, 0, 0); return d;
    },
    end: () => new Date(),
  },
];

const durationText = computed(() => {
  if (!startDate.value || !endDate.value) return '';
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return t('INVALID_RANGE');

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return t('TODAY');
  if (days === 1) return `1 ${t('DAY')}`;
  return `${days} ${t('DAYS')}`;
});

function onStartChange(val: Date | string | null) {
  startDate.value = val;
  activePreset.value = '';
  emitValue();
}

function onEndChange(val: Date | string | null) {
  endDate.value = val;
  activePreset.value = '';
  emitValue();
}

function applyPreset(preset: Preset) {
  activePreset.value = preset.key;
  startDate.value = preset.start();
  endDate.value = preset.end();
  emitValue();
}

function emitValue() {
  emit('update:modelValue', {
    start: startDate.value,
    end: endDate.value,
  });
}

watch(() => props.modelValue, (val) => {
  if (val) {
    startDate.value = val.start;
    endDate.value = val.end;
  }
}, { deep: true });
</script>
