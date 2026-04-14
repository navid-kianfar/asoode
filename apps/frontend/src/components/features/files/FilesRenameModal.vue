<template>
  <AppModal
    v-model="internalVisible"
    :title="$t('RENAME')"
    :width="440"
    @close="$emit('close')"
  >
    <div class="fm-modal-body">
      <AppInput
        ref="inputRef"
        v-model="localName"
        :label="$t('TITLE')"
        :placeholder="$t('TITLE')"
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
        :disabled="!localName.trim()"
        @click="submit"
      >
        {{ $t('SAVE_CHANGES') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import AppModal from '../../core/AppModal.vue';
import AppInput from '../../core/AppInput.vue';

const props = defineProps<{
  visible: boolean;
  name: string;
}>();

const emit = defineEmits<{
  close: [];
  rename: [name: string];
}>();

const internalVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) emit('close');
  },
});

const localName = ref('');
const inputRef = ref<any>(null);

watch(() => props.visible, (v) => {
  if (v) {
    localName.value = props.name;
    nextTick(() => inputRef.value?.focus());
  }
});

function submit() {
  if (localName.value.trim()) {
    emit('rename', localName.value.trim());
  }
}
</script>

<style lang="scss">
.fm-modal-body {
  padding: 4px;
}
</style>
