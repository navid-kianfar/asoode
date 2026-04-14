<template>
  <v-text-field
    :model-value="modelValue"
    :label="label"
    type="time"
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
</script>
