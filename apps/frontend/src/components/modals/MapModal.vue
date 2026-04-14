<template>
  <AppModal
    v-model="visible"
    :title="$t('SELECT_LOCATION')"
    :width="700"
    @close="$emit('close')"
  >
    <AppMap :markers="markers" :center="center" height="400px" />

    <template #footer>
      <v-btn variant="text" @click="$emit('close')">{{ $t('CANCEL') }}</v-btn>
      <v-btn color="primary" elevation="2" @click="onConfirm">{{ $t('CONFIRM') }}</v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { MapMarker } from '@asoode/shared';
import AppMap from '@/components/core/AppMap.vue';
import AppModal from '../core/AppModal.vue';

defineProps<{
  markers?: MapMarker[];
  center?: MapMarker;
  mapLocation?: string;
}>();

const emit = defineEmits<{ close: []; confirm: [location: string] }>();
const visible = ref(true);

function onConfirm() {
  emit('confirm', '');
  emit('close');
}
</script>
