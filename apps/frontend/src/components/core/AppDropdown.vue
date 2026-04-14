<template>
  <v-select
    :model-value="modelValue"
    :label="label"
    :items="items"
    :item-title="'text'"
    :item-value="'value'"
    :multiple="multiple"
    :disabled="disabled"
    :error-messages="errors"
    :density="dense ? 'compact' : 'comfortable'"
    :hide-details="!errors?.length"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import type { ListViewModel } from '@asoode/shared';

defineProps<{
  modelValue?: any;
  label?: string;
  items?: ListViewModel[];
  multiple?: boolean;
  disabled?: boolean;
  errors?: string[];
  dense?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: any] }>();
</script>
