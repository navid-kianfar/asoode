<template>
  <AppModal
    v-model="visible"
    :title="$t('MEMBERS_PERMISSIONS')"
    :width="540"
    :loading="saving"
    @close="$emit('close')"
  >
    <div class="wp-permission-grid">
      <AppCheckbox v-model="permissions.permissionCreateList" :label="$t('CAN_CREATE_LIST')" />
      <AppCheckbox v-model="permissions.permissionEditList" :label="$t('CAN_EDIT_LIST')" />
      <AppCheckbox v-model="permissions.permissionArchiveList" :label="$t('CAN_ARCHIVE_LIST')" />
      <v-divider class="my-2 grid-full-width" />
      <AppCheckbox v-model="permissions.permissionCreateTask" :label="$t('CAN_CREATE_TASK')" />
      <AppCheckbox v-model="permissions.permissionEditTask" :label="$t('CAN_EDIT_TASK')" />
      <AppCheckbox v-model="permissions.permissionArchiveTask" :label="$t('CAN_ARCHIVE_TASK')" />
      <AppCheckbox v-model="permissions.permissionChangeTaskState" :label="$t('CAN_EDIT_TASK_STATE')" />
      <v-divider class="my-2 grid-full-width" />
      <AppCheckbox v-model="permissions.permissionAssignLabels" :label="$t('CAN_EDIT_TASK_LABEL')" />
      <AppCheckbox v-model="permissions.permissionAssignMembers" :label="$t('CAN_EDIT_TASK_MEMBER')" />
      <AppCheckbox v-model="permissions.permissionCreateAttachment" :label="$t('CAN_CREATE_TASK_ATTACHMENT')" />
      <AppCheckbox v-model="permissions.permissionEditAttachment" :label="$t('CAN_EDIT_TASK_ATTACHMENT')" />
      <AppCheckbox v-model="permissions.permissionComment" :label="$t('CAN_COMMENT_TASK')" />
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
import { ref, reactive } from 'vue';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { OperationResultStatus, type WorkPackageViewModel } from '@asoode/shared';
import AppModal from '../core/AppModal.vue';
import AppCheckbox from '../core/AppCheckbox.vue';

const props = defineProps<{
  workPackage: WorkPackageViewModel;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const wpStore = useWorkPackageStore();
const visible = ref(true);
const saving = ref(false);

const permissions = reactive({
  permissionCreateList: props.workPackage.permissionCreateList,
  permissionEditList: props.workPackage.permissionEditList,
  permissionArchiveList: props.workPackage.permissionArchiveList,
  permissionCreateTask: props.workPackage.permissionCreateTask,
  permissionArchiveTask: props.workPackage.permissionArchiveTask,
  permissionEditTask: props.workPackage.permissionEditTask,
  permissionChangeTaskState: props.workPackage.permissionChangeTaskState,
  permissionAssignLabels: props.workPackage.permissionAssignLabels,
  permissionAssignMembers: props.workPackage.permissionAssignMembers,
  permissionCreateAttachment: props.workPackage.permissionCreateAttachment,
  permissionEditAttachment: props.workPackage.permissionEditAttachment,
  permissionComment: props.workPackage.permissionComment,
});

async function save() {
  saving.value = true;
  const op = await wpStore.changePermissions(props.workPackage.id, { ...permissions });
  saving.value = false;
  if (op.status === OperationResultStatus.Success) {
    emit('saved');
    emit('close');
  }
}
</script>

<style lang="scss">
.wp-permission-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 4px;

  .grid-full-width {
    grid-column: 1 / -1;
  }
}

@media (min-width: 600px) {
  .wp-permission-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}
</style>
