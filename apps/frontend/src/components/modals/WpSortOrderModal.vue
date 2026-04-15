<template>
  <AppModal
    v-model="visible"
    :title="$t('SORT_ORDERS')"
    :width="480"
    :loading="saving"
    @close="$emit('close')"
  >
    <div class="wp-sort-order-modal-body">
      <AppSelect 
        v-model="sortForm.listsSort" 
        :items="sortTypeItems" 
        :label="$t('LISTS_SORT')" 
        horizontal 
      />

      <AppSelect 
        v-model="sortForm.tasksSort" 
        :items="sortTypeItems" 
        :label="$t('TASKS_SORT')" 
        horizontal 
      />

      <AppSelect 
        v-model="sortForm.subTasksSort" 
        :items="sortTypeItems" 
        :label="$t('SUB_TASKS_SORT')" 
        horizontal 
      />

      <AppSelect 
        v-model="sortForm.attachmentsSort" 
        :items="sortTypeItems" 
        :label="$t('ATTACHMENTS_SORT')" 
        horizontal 
        class="mb-0"
      />
    </div>

    <template #footer>
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('CANCEL') }}
      </v-btn>
      <v-btn
        color="primary"
        elevation="2"
        :disabled="saving"
        :loading="saving"
        @click="save"
      >
        {{ $t('SAVE_CHANGES') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkPackageStore } from '@/stores/work-package.store';
import {
  OperationResultStatus,
  SortType,
  type WorkPackageViewModel,
} from '@asoode/shared';
import AppModal from '../core/AppModal.vue';
import AppSelect from '../core/AppSelect.vue';

const props = defineProps<{
  workPackage: WorkPackageViewModel;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const wpStore = useWorkPackageStore();
const visible = ref(true);
const saving = ref(false);

const sortTypeItems = computed(() => [
  { text: t('SORT_MANUAL'), value: SortType.Manual },
  { text: t('SORT_DATE_ASC'), value: SortType.DateAsc },
  { text: t('SORT_DATE_DESC'), value: SortType.DateDesc },
  { text: t('SORT_NAME_ASC'), value: SortType.NameAsc },
  { text: t('SORT_NAME_DESC'), value: SortType.NameDesc },
]);

const sortForm = reactive({
  listsSort: props.workPackage.listsSort ?? SortType.Manual,
  tasksSort: props.workPackage.tasksSort ?? SortType.Manual,
  subTasksSort: props.workPackage.subTasksSort ?? SortType.Manual,
  attachmentsSort: props.workPackage.attachmentsSort ?? SortType.Manual,
});

async function save() {
  if (saving.value) return;
  saving.value = true;
  const op = await wpStore.editSortOrders(props.workPackage.id, { ...sortForm });
  saving.value = false;
  if (op.status === OperationResultStatus.Success) {
    emit('saved');
    emit('close');
  }
}
</script>

<style lang="scss">
.wp-sort-order-modal-body {
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
