<template>
  <AppModal
    v-model="visible"
    :title="$t('INVITE_MEMBER')"
    :width="480"
    :loading="saving"
    @close="$emit('close')"
  >
    <!-- Success message -->
    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      density="compact"
    >
      {{ successMessage }}
    </v-alert>

    <div class="wp-invite-modal-body">
      <AppInput
        ref="identifierInput"
        v-model="identifier"
        :label="$t('EMAIL_OR_USERNAME')"
        horizontal
        dense
        @keydown.enter="invite"
      />

      <AppSelect 
        v-model="access" 
        :items="accessItems" 
        :label="$t('ACCESS_LEVEL')"
        horizontal
      />
    </div>

    <template #footer>
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('CLOSE') }}
      </v-btn>
      <v-btn
        color="primary"
        elevation="2"
        :disabled="saving || !identifier.trim()"
        :loading="saving"
        @click="invite"
      >
        <v-icon start>mdi-send</v-icon>
        {{ $t('INVITE') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkPackageStore } from '@/stores/work-package.store';
import {
  OperationResultStatus,
  AccessType,
  type WorkPackageViewModel,
} from '@asoode/shared';
import AppModal from '../core/AppModal.vue';
import AppInput from '../core/AppInput.vue';
import AppSelect from '../core/AppSelect.vue';

const props = defineProps<{
  workPackage: WorkPackageViewModel;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'invited'): void;
}>();

const { t } = useI18n();
const wpStore = useWorkPackageStore();

const visible = ref(true);

const accessItems = computed(() => [
  { text: t('ADMIN'), value: AccessType.Admin },
  { text: t('EDITOR'), value: AccessType.Editor },
  { text: t('HIDDEN_EDITOR'), value: AccessType.HiddenEditor },
  { text: t('VISITOR'), value: AccessType.Visitor },
]);

const saving = ref(false);
const identifier = ref('');
const access = ref<AccessType>(AccessType.Editor);
const successMessage = ref('');
const identifierInput = ref<any>(null);

async function invite() {
  if (!identifier.value.trim() || saving.value) return;

  saving.value = true;
  successMessage.value = '';

  const op = await wpStore.addAccess(props.workPackage.id, {
    members: [
      {
        id: identifier.value.trim(),
        access: access.value,
        isGroup: false,
      },
    ],
  });

  saving.value = false;

  if (op.status === OperationResultStatus.Success) {
    successMessage.value = t('INVITATION_SENT_SUCCESS');
    emit('invited');
    identifier.value = '';
    await nextTick();
    identifierInput.value?.focus();
  }
}
</script>

<style lang="scss">
.wp-invite-modal-body {
  padding: 4px;
}
</style>
