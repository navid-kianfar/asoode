<template>
  <AppModal
    v-model="internalVisible"
    :title="title"
    :width="1000"
    @close="$emit('close')"
  >
    <div class="fpm-modal-body">
      <img v-if="isImage" :src="url" :alt="title" class="fpm-image" />
      <video v-else-if="isVideo" :src="url" controls autoplay class="fpm-video" />
      <audio v-else-if="isAudio" :src="url" controls class="fpm-audio" />
      <iframe v-else-if="isPdf" :src="url" frameborder="0" class="fpm-iframe" sandbox="allow-same-origin" />
      <div v-else class="fpm-unsupported">
        <v-icon size="64" color="grey-lighten-1">mdi-file-document-outline</v-icon>
        <p class="mt-4">{{ $t('PREVIEW_NOT_AVAILABLE') }}</p>
      </div>
    </div>

    <template #footer>
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('CANCEL') }}
      </v-btn>
      <v-btn
        color="primary"
        elevation="2"
        prepend-icon="mdi-download"
        :href="url"
        target="_blank"
        download
      >
        {{ $t('DOWNLOAD') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppModal from '../../core/AppModal.vue';

const props = defineProps<{
  visible: boolean;
  url: string;
  title: string;
  extension: string;
}>();

const emit = defineEmits<{ close: [] }>();

const internalVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) emit('close');
  },
});

const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
const videoExts = ['mp4', 'webm', 'mov', 'avi'];
const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
const pdfExts = ['pdf'];

const ext = computed(() => (props.extension || '').toLowerCase());
const isImage = computed(() => imageExts.includes(ext.value));
const isVideo = computed(() => videoExts.includes(ext.value));
const isAudio = computed(() => audioExts.includes(ext.value));
const isPdf = computed(() => pdfExts.includes(ext.value));
</script>

<style lang="scss">
.fpm-modal-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  overflow: auto;
}

.fpm-image, .fpm-video {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
}

.fpm-iframe {
  width: 100%;
  height: 70vh;
  border: none;
}

.fpm-audio {
  width: 100%;
}

.fpm-unsupported {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
