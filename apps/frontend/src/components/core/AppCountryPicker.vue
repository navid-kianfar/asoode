<template>
  <v-autocomplete
    :model-value="modelValue"
    :label="label || $t('COUNTRY')"
    :items="countries"
    item-title="text"
    item-value="code"
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

const countries = [
  { code: 'US', text: 'United States' }, { code: 'GB', text: 'United Kingdom' },
  { code: 'IR', text: 'Iran' }, { code: 'TR', text: 'Turkey' },
  { code: 'SA', text: 'Saudi Arabia' }, { code: 'AE', text: 'UAE' },
  { code: 'DE', text: 'Germany' }, { code: 'FR', text: 'France' },
  { code: 'CA', text: 'Canada' }, { code: 'AU', text: 'Australia' },
];
</script>
