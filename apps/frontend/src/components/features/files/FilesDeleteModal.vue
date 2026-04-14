<template>
  <AppConfirm
    v-model="internalVisible"
    :title="$t('REMOVE_FILES_FOLDERS')"
    :message="$t('REMOVE_FILES_FOLDERS_CONFIRM')"
    :confirm-text="$t('REMOVE_FILES_FOLDERS')"
    tone="danger"
    @close="$emit('close')"
    @confirm="$emit('confirm')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppConfirm from '../../core/AppConfirm.vue';
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: []; confirm: [] }>();

const internalVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) emit('close');
  },
});
</script>
