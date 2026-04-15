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
      <AppAutoComplete
        v-model="identifier"
        v-model:search="identifierSearch"
        :items="allPossibleMembers"
        :label="$t('EMAIL_OR_USERNAME')"
        horizontal
        dense
        class="mb-4"
        @keydown.enter="invite"
      />

      <AppSelect 
        v-model="access" 
        :items="accessItems" 
        :label="$t('ACCESS_LEVEL')"
        horizontal
        dense
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
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import {
  OperationResultStatus,
  AccessType,
  type WorkPackageViewModel,
} from '@asoode/shared';
import AppModal from '../core/AppModal.vue';
import AppAutoComplete from '../core/AppAutoComplete.vue';
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
const projectStore = useProjectStore();
const groupStore = useGroupStore();

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
const identifierSearch = ref('');

const allPossibleMembers = computed(() => {
  const members: { text: string; value: string }[] = [];
  const seenIds = new Set<string>();

  // 1. Project Members
  const p = projectStore.projects.find((x) => x.id === props.workPackage.projectId);
  if (p) {
    (p.members || []).forEach((m) => {
      const email = m.member?.email;
      if (email && !seenIds.has(email)) {
        seenIds.add(email);
        members.push({
          text: `${m.member.fullName || m.member.firstName || ''} (${email})`,
          value: email,
        });
      }
    });
  }

  // 2. Group Members
  groupStore.groups.forEach((g) => {
    (g.members || []).forEach((m) => {
      const email = m.member?.email;
      if (email && !seenIds.has(email)) {
        seenIds.add(email);
        members.push({
          text: `${m.member.fullName || m.member.firstName || ''} (${email})`,
          value: email,
        });
      }
    });
  });

  return members.sort((a, b) => a.text.localeCompare(b.text));
});

async function invite() {
  const finalIdentifier = (identifier.value || identifierSearch.value || '').trim();
  if (!finalIdentifier || saving.value) return;

  saving.value = true;
  successMessage.value = '';

  const op = await wpStore.addAccess(props.workPackage.id, {
    members: [
      {
        id: finalIdentifier,
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
    identifierSearch.value = '';
  }
}
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.wp-invite-modal-body {
  padding: 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
