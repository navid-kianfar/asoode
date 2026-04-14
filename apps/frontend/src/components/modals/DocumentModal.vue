<template>
  <AppModal
    v-model="visible"
    :title="title || $t('DOCUMENT')"
    :width="900"
    @close="$emit('close')"
  >
    <AppDocViewer :url="url" :type="type" />
  </AppModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppDocViewer from '@/components/core/AppDocViewer.vue';
import AppModal from '../core/AppModal.vue';

defineProps<{
  url?: string;
  type?: string;
  title?: string;
}>();

defineEmits<{ close: [] }>();

const visible = ref(true);
</script>
