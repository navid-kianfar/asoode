<template>
  <AppModal
    v-model="visible"
    :title="$t('RENAME_WORK_PACKAGE')"
    :width="480"
    :loading="saving"
    @close="$emit('close')"
  >
    <div class="wp-rename-modal-body">
      <AppInput
        v-model="title"
        :label="$t('TITLE')"
        :placeholder="$t('TITLE')"
        dense
        autofocus
        @keydown.enter="save"
      />

      <div class="mt-4">
        <AppInput
          v-model="description"
          textArea
          :rows="4"
          :label="$t('DESCRIPTION')"
          :placeholder="$t('DESCRIPTION')"
          dense
        />
      </div>
    </div>

    <template #footer>
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('CANCEL') }}
      </v-btn>
      <v-btn
        color="primary"
        elevation="2"
        :disabled="saving || !title.trim()"
        :loading="saving"
        @click="save"
      >
        {{ $t('SAVE_CHANGES') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { OperationResultStatus, type WorkPackageViewModel } from '@asoode/shared';
import AppModal from '../core/AppModal.vue';
import AppInput from '../core/AppInput.vue';

const props = defineProps<{
  workPackage: WorkPackageViewModel;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', title: string, description: string): void;
}>();

const wpStore = useWorkPackageStore();
const visible = ref(true);
const saving = ref(false);

const title = ref(props.workPackage.title || '');
const description = ref(props.workPackage.description || '');

async function save() {
  if (!title.value.trim() || saving.value) return;
  saving.value = true;
  const op = await wpStore.edit(props.workPackage.id, {
    title: title.value.trim(),
    description: description.value,
  });
  saving.value = false;
  if (op.status === OperationResultStatus.Success) {
    emit('saved', title.value.trim(), description.value);
    emit('close');
  }
}
</script>

<style lang="scss">
.wp-rename-modal-body {
  padding: 4px;
}
</style>
