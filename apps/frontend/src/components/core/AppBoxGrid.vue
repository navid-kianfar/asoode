<template>
  <div class="app-box-grid" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  columns?: number;
  gap?: number;
}>();

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.columns || 3}, 1fr)`,
  gap: `${props.gap || 16}px`,
}));
</script>
