<template>
  <div class="app-number" :class="{ 'app-number--horizontal': horizontal }">
    <label v-if="horizontal && label" class="app-number__label">{{ label }}</label>
    <div class="d-flex align-center">
    <v-btn size="small" icon variant="text" :disabled="disabled || (min !== undefined && (modelValue ?? 0) <= min)" @click="decrement">
      <v-icon>mdi-minus</v-icon>
    </v-btn>
    <v-text-field
      :model-value="modelValue"
      type="number"
      :min="min"
      :max="max"
      :disabled="disabled"
      density="compact"
      hide-details
      :label="horizontal ? undefined : label"
      variant="outlined"
      color="primary"
      rounded="lg"
      bg-color="surface"
      class="mx-2"
      style="max-width: 100px"
      @update:model-value="onInput"
    />
    <v-btn size="small" icon variant="text" :disabled="disabled || (max !== undefined && (modelValue ?? 0) >= max)" @click="increment">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: number;
  label?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  horizontal?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

function onInput(val: string | number) {
  emit('update:modelValue', Number(val));
}

function increment() {
  const val = (props.modelValue ?? 0) + 1;
  if (props.max === undefined || val <= props.max) {
    emit('update:modelValue', val);
  }
}

function decrement() {
  const val = (props.modelValue ?? 0) - 1;
  if (props.min === undefined || val >= props.min) {
    emit('update:modelValue', val);
  }
}
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-number--horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  width: 100%;

  .app-number__label {
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.82);
    flex: 1;
    min-width: 0;
  }
}
</style>
