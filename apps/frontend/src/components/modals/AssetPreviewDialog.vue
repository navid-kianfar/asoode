<template>
  <AppModal
    v-model="visible"
    :title="current?.title"
    :width="1200"
    @close="$emit('close')"
  >
    <div class="apd-modal-body" @click.stop>
      <!-- Content area -->
      <div class="apd-content">
        <!-- Image -->
        <div v-if="assetType === 'image'" class="apd-image-wrap">
          <img
            :src="currentUrl"
            :alt="current.title"
            class="apd-image"
            :class="{ zoomed }"
            @click="zoomed = !zoomed"
          />
        </div>

        <!-- Video -->
        <div v-else-if="assetType === 'video'" class="apd-video-wrap">
          <video
            :key="current.id"
            :src="currentUrl"
            class="apd-video"
            controls
            autoplay
          />
        </div>

        <!-- Audio -->
        <div v-else-if="assetType === 'audio'" class="apd-audio-wrap">
          <div class="apd-audio-icon">
            <v-icon size="80" color="primary" opacity="0.3">mdi-music-circle-outline</v-icon>
          </div>
          <div class="apd-audio-player">
            <v-btn
              icon
              size="large"
              color="primary"
              variant="tonal"
              @click="toggleAudio"
            >
              <v-icon>{{ audioPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
            </v-btn>
            <v-slider
              v-model="audioProgress"
              hide-details
              color="primary"
              class="mx-4"
              @click="seekAudioSlider"
            />
            <span class="apd-audio-time">{{ audioTimeDisplay }}</span>
          </div>
        </div>

        <!-- PDF -->
        <div v-else-if="assetType === 'pdf'" class="apd-doc-wrap">
          <iframe :src="currentUrl" class="apd-iframe" frameborder="0" />
        </div>

        <!-- Document (Google Docs Viewer) -->
        <div v-else-if="assetType === 'document'" class="apd-doc-wrap">
          <iframe
            :src="`https://docs.google.com/viewer?url=${encodeURIComponent(currentUrl)}&embedded=true`"
            class="apd-iframe"
            frameborder="0"
          />
        </div>

        <!-- Unknown file -->
        <div v-else class="apd-unknown-wrap">
          <v-icon size="72" color="disabled">mdi-file-outline</v-icon>
          <span class="apd-unknown-name">{{ current?.title }}</span>
        </div>
      </div>

      <!-- Navigation arrows -->
      <template v-if="attachments.length > 1">
        <v-btn
          icon="mdi-chevron-left"
          variant="tonal"
          class="apd-nav apd-nav--prev"
          @click.stop="prev"
        />
        <v-btn
          icon="mdi-chevron-right"
          variant="tonal"
          class="apd-nav apd-nav--next"
          @click.stop="next"
        />
      </template>
    </div>

    <template #footer>
      <div v-if="attachments.length > 1" class="text-caption text-disabled mr-auto ml-2">
        {{ currentIndex + 1 }} / {{ attachments.length }}
      </div>
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('CLOSE') }}
      </v-btn>
      <v-btn
        color="primary"
        elevation="2"
        prepend-icon="mdi-download"
        :href="currentUrl"
        target="_blank"
        download
      >
        {{ $t('DOWNLOAD') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { WorkPackageTaskAttachmentViewModel } from '@asoode/shared';
import { resolveApiUrl } from '@/services/runtime-config.service';

const props = defineProps<{
  attachments: WorkPackageTaskAttachmentViewModel[];
  initialIndex: number;
}>();

const emit = defineEmits<{ close: [] }>();

const visible = ref(true);
const currentIndex = ref(props.initialIndex);
const zoomed = ref(false);

// Audio state
const audioEl = ref<HTMLAudioElement | null>(null);
const audioPlaying = ref(false);
const audioProgress = ref(0);
const audioTimeDisplay = ref('0:00');
let audioFrame = 0;

const current = computed(() => props.attachments[currentIndex.value]);
const currentUrl = computed(() => resolveApiUrl(current.value?.path || ''));

const assetType = computed(() => getAssetType(current.value?.path || current.value?.title));

const fileTypeIcon = computed(() => {
  switch (assetType.value) {
    case 'image': return 'mdi mdi-image-outline';
    case 'video': return 'mdi mdi-video-outline';
    case 'audio': return 'mdi mdi-music-note';
    case 'pdf': return 'mdi mdi-file-pdf-box';
    case 'document': return 'mdi mdi-file-document-outline';
    default: return 'mdi mdi-file-outline';
  }
});

function getAssetType(filename: string | undefined | null): 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'unknown' {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)) return 'document';
  return 'unknown';
}

function prev() {
  zoomed.value = false;
  cleanupAudio();
  currentIndex.value = (currentIndex.value - 1 + props.attachments.length) % props.attachments.length;
}

function next() {
  zoomed.value = false;
  cleanupAudio();
  currentIndex.value = (currentIndex.value + 1) % props.attachments.length;
}

// Audio controls
function initAudio() {
  cleanupAudio();
  if (assetType.value !== 'audio') return;
  audioEl.value = new Audio(currentUrl.value);
  audioEl.value.addEventListener('ended', () => { audioPlaying.value = false; });
}

function cleanupAudio() {
  if (audioEl.value) {
    audioEl.value.pause();
    audioEl.value = null;
  }
  audioPlaying.value = false;
  audioProgress.value = 0;
  audioTimeDisplay.value = '0:00';
  cancelAnimationFrame(audioFrame);
}

function toggleAudio() {
  if (!audioEl.value) return;
  if (audioPlaying.value) {
    audioEl.value.pause();
    audioPlaying.value = false;
  } else {
    audioEl.value.play();
    audioPlaying.value = true;
    updateAudioProgress();
  }
}

function updateAudioProgress() {
  if (!audioEl.value || !audioPlaying.value) return;
  audioProgress.value = (audioEl.value.currentTime / audioEl.value.duration) * 100;
  const secs = Math.floor(audioEl.value.currentTime);
  audioTimeDisplay.value = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  audioFrame = requestAnimationFrame(updateAudioProgress);
}

function seekAudioSlider(val: any) {
  if (!audioEl.value) return;
  const pct = (typeof val === 'number' ? val : val.target?.value || 0) / 100;
  audioEl.value.currentTime = pct * audioEl.value.duration;
}

// Re-init audio when navigating
watch(currentIndex, () => {
  if (assetType.value === 'audio') initAudio();
});

// Keyboard
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
  else if (e.key === 'ArrowLeft') prev();
  else if (e.key === 'ArrowRight') next();
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  if (assetType.value === 'audio') initAudio();
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  cleanupAudio();
});
</script>

<style scoped lang="scss">
.apd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

// Top bar
.apd-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2;
}

.apd-topbar-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.apd-topbar-icon {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
}

.apd-topbar-name {
  color: #fff;
  font-size: 0.88rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apd-topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.apd-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  transition: background 0.15s, color 0.15s;
  text-decoration: none;

  i { font-size: 1.2rem; }

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
}

.apd-close-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #ef5350;
}

// Content
.apd-content {
  max-width: 90vw;
  max-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
}

// Image
.apd-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.apd-image {
  max-width: 90vw;
  max-height: calc(100vh - 120px);
  object-fit: contain;
  border-radius: 6px;
  cursor: zoom-in;
  transition: transform 0.25s ease;

  &.zoomed {
    max-width: none;
    max-height: none;
    transform: scale(1.8);
    cursor: zoom-out;
  }
}

// Video
.apd-video-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.apd-video {
  max-width: 90vw;
  max-height: calc(100vh - 120px);
  border-radius: 8px;
  background: #000;
}

// Audio
.apd-audio-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 48px;
}

.apd-audio-icon {
  i {
    font-size: 80px;
    color: rgba(255, 255, 255, 0.3);
  }
}

.apd-audio-player {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 400px;
  max-width: 90vw;
}

.apd-audio-play {
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  transition: background 0.15s;

  i { font-size: 1.4rem; }

  &:hover { background: rgba(255, 255, 255, 0.2); }
}

.apd-audio-progress {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.apd-audio-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #4fc3f7;
  border-radius: 3px;
  transition: width 0.1s linear;
}

.apd-audio-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

// PDF & Document
.apd-doc-wrap {
  width: 90vw;
  height: calc(100vh - 100px);
}

.apd-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  background: #fff;
}

// Unknown
.apd-unknown-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
}

.apd-unknown-icon {
  font-size: 72px;
  color: rgba(255, 255, 255, 0.25);
}

.apd-unknown-name {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

.apd-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 0.88rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.18); }
}

// Navigation arrows
.apd-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  z-index: 2;
  transition: background 0.15s, color 0.15s;

  i { font-size: 1.6rem; }

  &:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
  }

  &--prev { left: 16px; }
  &--next { right: 16px; }
}

// Counter
.apd-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 14px;
  border-radius: 12px;
}

// Transition
.apd-fade-enter-active { transition: opacity 0.2s ease; }
.apd-fade-leave-active { transition: opacity 0.15s ease; }
.apd-fade-enter-from,
.apd-fade-leave-to { opacity: 0; }
</style>
