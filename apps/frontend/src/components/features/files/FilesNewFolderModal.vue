<template>
  <AppModal
    v-model="internalVisible"
    :title="$t('NEW_FOLDER')"
    :width="440"
    @close="$emit('close')"
  >
    <div class="fm-modal-body">
      <AppInput
        ref="inputRef"
        v-model="folderName"
        :label="$t('TITLE')"
        :placeholder="$t('TITLE')"
        :error-text="error ? $t(error) : undefined"
        dense
        autofocus
        @keydown.enter="submit"
      />
    </div>

    <template #footer>
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('CANCEL') }}
      </v-btn>
      <v-btn
        color="primary"
        elevation="2"
        :disabled="!folderName.trim()"
        @click="submit"
      >
        {{ $t('CREATE') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import AppModal from '../../core/AppModal.vue';
import AppInput from '../../core/AppInput.vue';

const props = defineProps<{ visible: boolean }>();

const emit = defineEmits<{
  close: [];
  create: [name: string];
}>();

const internalVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) emit('close');
  },
});

const folderName = ref('');
const error = ref('');
const inputRef = ref<any>(null);

watch(() => props.visible, (v) => {
  if (v) {
    folderName.value = '';
    error.value = '';
    nextTick(() => inputRef.value?.focus());
  }
});

function submit() {
  if (!folderName.value.trim()) {
    error.value = 'FIELD_REQUIRED';
    return;
  }
  emit('create', folderName.value.trim());
}

defineExpose({ setError: (e: string) => { error.value = e; } });
</script>

<style lang="scss">
.fm-modal-body {
  padding: 4px;
}
</style>
