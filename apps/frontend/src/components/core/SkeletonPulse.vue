<template>
  <div
    class="skeleton-pulse"
    :style="{
      width: width,
      height: height,
      borderRadius: radius,
    }"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    radius?: string;
  }>(),
  {
    width: '100%',
    height: '16px',
    radius: '4px',
  },
);
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-pulse {
  display: block;
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;

  body.dark-mode & {
    background: linear-gradient(90deg, $dark-card 25%, $dark-card-inner 50%, $dark-card 75%);
    background-size: 200% 100%;
  }
}
</style>
