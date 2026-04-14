<template>
  <div class="video-player">
    <video ref="videoEl" :src="src" class="w-100 rounded" controls />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ src: string }>();
const videoEl = ref<HTMLVideoElement | null>(null);
</script>
