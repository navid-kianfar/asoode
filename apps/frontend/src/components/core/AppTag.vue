<template>
  <v-combobox
    :model-value="modelValue"
    :label="label"
    :items="items"
    :item-title="'text'"
    :item-value="'value'"
    multiple
    chips
    closable-chips
    :disabled="disabled"
    density="comfortable"
    hide-details
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import type { ListViewModel } from '@asoode/shared';

defineProps<{
  modelValue?: any[];
  label?: string;
  items?: ListViewModel[];
  disabled?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: any[]] }>();
</script>
