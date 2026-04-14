<template>
  <div class="d-flex align-center">
    <v-btn size="small" icon variant="text" :disabled="disabled || (min !== undefined && (modelValue ?? 0) <= min)" @click="decrement">
      <v-icon>mdi-minus</v-icon>
    </v-btn>
    <v-text-field
      :model-value="modelValue"
      :label="label"
      type="number"
      :min="min"
      :max="max"
      :disabled="disabled"
      density="compact"
      hide-details
      class="mx-2"
      style="max-width: 100px"
      @update:model-value="onInput"
    />
    <v-btn size="small" icon variant="text" :disabled="disabled || (max !== undefined && (modelValue ?? 0) >= max)" @click="increment">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: number;
  label?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
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
