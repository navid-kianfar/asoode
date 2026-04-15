<template>
  <div :class="{ 'app-dropdown--horizontal': horizontal }">
    <label v-if="horizontal && label" class="app-dropdown__label">{{ label }}</label>
  <v-select
    :model-value="modelValue"
    :label="horizontal ? undefined : label"
    :items="items"
    :item-title="itemTitle || 'text'"
    :item-value="itemValue || 'value'"
    :multiple="multiple"
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
  </div>
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
  errors?: string[];
  dense?: boolean;
  horizontal?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: any] }>();
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-dropdown--horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  width: 100%;

  .app-dropdown__label {
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.82);
    flex: 1;
    min-width: 0;
  }

  .v-select {
    width: 260px;
    flex-shrink: 0;
    flex: none;
  }
}
</style>
