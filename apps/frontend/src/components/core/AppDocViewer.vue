<template>
  <div class="app-doc-viewer">
    <iframe v-if="url" :src="viewerUrl" class="doc-frame" frameborder="0" />
    <div v-else class="text-center pa-8 text-medium-emphasis">{{ $t('NO_DOCUMENT') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  url?: string;
  type?: string;
}>();

const viewerUrl = computed(() => {
  if (!props.url) return '';
  if (props.type === 'pdf' || props.url.endsWith('.pdf')) {
    return props.url;
  }
  return `https://docs.google.com/viewer?url=${encodeURIComponent(props.url)}&embedded=true`;
});
</script>

<style scoped>
.doc-frame {
  width: 100%;
  height: 80vh;
  border: none;
  border-radius: 8px;
}
</style>
