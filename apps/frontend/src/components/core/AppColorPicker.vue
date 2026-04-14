<template>
  <div class="app-color-picker">
    <label v-if="label" class="text-caption text-medium-emphasis mb-1 d-block">{{ label }}</label>
    <div class="d-flex flex-wrap ga-2">
      <div
        v-for="color in colors"
        :key="color"
        class="color-swatch cursor-pointer rounded-circle"
        :class="{ 'selected': modelValue === color }"
        :style="{ backgroundColor: color }"
        @click="$emit('update:modelValue', color)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  label?: string;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();

const colors = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#9E9E9E', '#607D8B', '#000000',
];
</script>

<style scoped lang="scss">
.color-swatch {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  transition: transform 0.15s, border-color 0.15s;

  &:hover {
    transform: scale(1.15);
  }

  &.selected {
    border-color: rgba(0, 0, 0, 0.5);
    transform: scale(1.15);
  }
}
</style>
