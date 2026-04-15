<template>
  <div :class="{ 'app-input--horizontal': horizontal }">
    <label v-if="horizontal && label" class="app-input__label">{{ label }}</label>
  <v-textarea
    v-if="textArea"
    :model-value="modelValue"
    :type="type"
    :maxlength="maxLength"
    :placeholder="placeholder"
    :disabled="disabled"
    :error-messages="errors"
    :density="dense ? 'compact' : 'comfortable'"
    :hide-details="!errors?.length"
    :label="horizontal ? undefined : label"
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
    :type="type"
    :maxlength="maxLength"
    :placeholder="placeholder"
    :disabled="disabled"
    :error-messages="errors"
    :density="dense ? 'compact' : 'comfortable'"
    :hide-details="!errors?.length"
    :label="horizontal ? undefined : label"
    variant="outlined"
    color="primary"
    rounded="lg"
    bg-color="surface"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  </div>
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
  horizontal?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: string | number] }>();
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-input--horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  width: 100%;

  .app-input__label {
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.82);
    flex: 1;
    min-width: 0;
  }

  .v-input {
    width: 260px; // Default width for horizontal inputs
    flex-shrink: 0;
    flex: none;
  }
}
</style>
