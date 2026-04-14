<template>
  <v-radio-group
    :model-value="modelValue"
    :label="label"
    :disabled="disabled"
    hide-details
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-radio
      v-for="item in items"
      :key="item.value"
      :label="item.text"
      :value="item.value"
    />
  </v-radio-group>
</template>

<script setup lang="ts">
import type { ListViewModel } from '@asoode/shared';

defineProps<{
  modelValue?: any;
  label?: string;
  items?: ListViewModel[];
  disabled?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: any] }>();
</script>
