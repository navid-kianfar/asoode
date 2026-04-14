<template>
  <div class="d-flex align-center ga-2 pa-2 rounded bg-surface-variant">
    <v-btn icon variant="text" size="small" @click="togglePlay">
      <v-icon>{{ playing ? 'mdi-pause' : 'mdi-play' }}</v-icon>
    </v-btn>
    <v-progress-linear
      :model-value="progress"
      class="flex-grow-1 cursor-pointer"
      height="6"
      rounded
      @click="onSeek"
    />
    <span class="text-caption" style="min-width: 40px">{{ currentTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{ src: string }>();
const audio = ref<HTMLAudioElement | null>(null);
const playing = ref(false);
const progress = ref(0);
const currentTime = ref('0:00');

let animFrame = 0;

onMounted(() => {
  audio.value = new Audio(props.src);
  audio.value.addEventListener('ended', () => { playing.value = false; });
});

onUnmounted(() => {
  audio.value?.pause();
  cancelAnimationFrame(animFrame);
});

function togglePlay() {
  if (!audio.value) return;
  if (playing.value) {
    audio.value.pause();
    playing.value = false;
  } else {
    audio.value.play();
    playing.value = true;
    updateProgress();
  }
}

function updateProgress() {
  if (!audio.value || !playing.value) return;
  progress.value = (audio.value.currentTime / audio.value.duration) * 100;
  const secs = Math.floor(audio.value.currentTime);
  currentTime.value = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  animFrame = requestAnimationFrame(updateProgress);
}

function onSeek(e: MouseEvent) {
  if (!audio.value) return;
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.value.currentTime = pct * audio.value.duration;
}
</script>
