<template>
  <AppModal
    v-model="visible"
    :title="isEditing ? $t('EDIT_OBJECTIVE') : $t('CREATE_OBJECTIVE')"
    :width="480"
    :loading="saving"
    @close="$emit('close')"
  >
    <div class="wp-objective-modal-body">
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
          :rows="3"
          :label="$t('DESCRIPTION')"
          :placeholder="$t('DESCRIPTION')"
          dense
        />
      </div>

      <div class="mt-4">
        <label class="wp-objective-modal__label">{{ $t('TYPE') }}</label>
        <AppSelect v-model="type" :items="objectiveTypeItems" compact />
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
        {{ isEditing ? $t('SAVE_CHANGES') : $t('CREATE') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkPackageStore } from '@/stores/work-package.store';
import {
  OperationResultStatus,
  WorkPackageObjectiveType,
  type WorkPackageViewModel,
  type WorkPackageObjectiveViewModel,
} from '@asoode/shared';
import AppModal from '../core/AppModal.vue';
import AppInput from '../core/AppInput.vue';
import AppSelect from '../core/AppSelect.vue';

const props = defineProps<{
  workPackage: WorkPackageViewModel;
  objective?: WorkPackageObjectiveViewModel;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', data: any): void;
}>();

const { t } = useI18n();
const wpStore = useWorkPackageStore();
const visible = ref(true);
const saving = ref(false);

const objectiveTypeItems = computed(() => [
  { text: t('MUST_HAVE'), value: WorkPackageObjectiveType.MustHave },
  { text: t('SHOULD_HAVE'), value: WorkPackageObjectiveType.ShouldHave },
  { text: t('NICE_TO_HAVE'), value: WorkPackageObjectiveType.NiceToHave },
]);

const isEditing = computed(() => !!props.objective);

const title = ref(props.objective?.title || '');
const description = ref(props.objective?.description || '');
const type = ref<WorkPackageObjectiveType>(
  props.objective?.type || WorkPackageObjectiveType.MustHave,
);

async function save() {
  if (!title.value.trim() || saving.value) return;

  saving.value = true;

  const payload = {
    title: title.value.trim(),
    description: description.value,
    type: type.value,
  };

  let op;
  if (isEditing.value && props.objective) {
    op = await wpStore.editObjective(props.objective.id, payload);
  } else {
    op = await wpStore.createObjective(props.workPackage.id, payload);
  }

  saving.value = false;

  if (op.status === OperationResultStatus.Success) {
    emit('saved', op.data ?? payload);
    emit('close');
  }
}
</script>

<style lang="scss">
.wp-objective-modal-body {
  padding: 4px;
}
.wp-objective-modal__label {
  display: block;
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 6px;
}
</style>
