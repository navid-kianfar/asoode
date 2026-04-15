<template>
  <v-checkbox
    :model-value="modelValue"
    :label="label"
    :disabled="disabled"
    density="compact"
    hide-details
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean;
  label?: string;
  disabled?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: boolean | null] }>();
</script>
