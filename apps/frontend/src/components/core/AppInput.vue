<template>
  <v-textarea
    v-if="textArea"
    :model-value="modelValue"
    :label="label"
    :type="type"
    :maxlength="maxLength"
    :placeholder="placeholder"
    :disabled="disabled"
    :error-messages="errors"
    :density="dense ? 'compact' : 'comfortable'"
    :hide-details="!errors?.length"
    :rows="rows || 3"
    variant="outlined"
    color="primary"
    rounded="lg"
    bg-color="surface"
    auto-grow
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <v-text-field
    v-else
    :model-value="modelValue"
    :label="label"
    :type="type"
    :maxlength="maxLength"
    :placeholder="placeholder"
    :disabled="disabled"
    :error-messages="errors"
    :density="dense ? 'compact' : 'comfortable'"
    :hide-details="!errors?.length"
    variant="outlined"
    color="primary"
    rounded="lg"
    bg-color="surface"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number;
  label?: string;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  errors?: string[];
  dense?: boolean;
  textArea?: boolean;
  rows?: number;
}>();

defineEmits<{ 'update:modelValue': [value: string | number] }>();
</script>
