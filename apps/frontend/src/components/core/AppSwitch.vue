<template>
  <v-switch
    :model-value="modelValue"
    :label="label"
    :disabled="disabled"
    color="primary"
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
