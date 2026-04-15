<template>
  <v-autocomplete
    :model-value="modelValue"
    :label="label"
    :items="items"
    :item-title="itemTitle || 'text'"
    :item-value="itemValue || 'value'"
    :multiple="multiple"
    :disabled="disabled"
    :loading="loading"
    :search="search"
    :error-messages="errors"
    density="comfortable"
    :hide-details="!errors?.length"
    variant="outlined"
    color="primary"
    rounded="lg"
    bg-color="surface"
    @update:model-value="$emit('update:modelValue', $event)"
    @update:search="$emit('update:search', $event)"
  />
</template>

<script setup lang="ts">
import type { ListViewModel } from '@asoode/shared';

defineProps<{
  modelValue?: any;
  label?: string;
  items?: any[];
  itemTitle?: string;
  itemValue?: string;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  search?: string;
  errors?: string[];
}>();

defineEmits<{
  'update:modelValue': [value: any];
  'update:search': [value: string];
}>();
</script>
