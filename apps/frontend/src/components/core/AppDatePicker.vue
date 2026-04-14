<template>
  <v-text-field
    :model-value="formattedValue"
    :label="label"
    :disabled="disabled"
    :error-messages="errors"
    type="date"
    density="comfortable"
    :hide-details="!errors?.length"
    @update:model-value="onInput"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: Date | string;
  label?: string;
  disabled?: boolean;
  errors?: string[];
}>();

const emit = defineEmits<{ 'update:modelValue': [value: Date | string] }>();

const formattedValue = computed(() => {
  if (!props.modelValue) return '';
  const d = typeof props.modelValue === 'string' ? new Date(props.modelValue) : props.modelValue;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
});

function onInput(val: string) {
  if (val) {
    emit('update:modelValue', new Date(val));
  }
}
</script>
