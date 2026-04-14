<template>
  <v-autocomplete
    :model-value="modelValue"
    :label="label || $t('TIMEZONE')"
    :items="zones"
    :disabled="disabled"
    density="comfortable"
    hide-details
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  label?: string;
  disabled?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();

const zones = (Intl as any).supportedValuesOf?.('timeZone') || [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tehran', 'Asia/Dubai',
  'Asia/Riyadh', 'Asia/Istanbul', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
];
</script>
