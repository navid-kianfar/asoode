<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('INVITE_PEOPLE') }}</h4>
    <v-form @submit.prevent="onInvite">
      <v-text-field v-model="email" :label="$t('EMAIL')" type="email" class="mb-2" />
      <v-select v-model="access" :items="accessLevels" :label="$t('ACCESS_LEVEL')" class="mb-2" />
      <v-btn color="primary" type="submit" :loading="inviting" block>{{ $t('SEND_INVITE') }}</v-btn>
    </v-form>
    <div v-if="pending.length" class="mt-4">
      <h5 class="text-subtitle-2 mb-2">{{ $t('PENDING_INVITATIONS') }}</h5>
      <v-chip v-for="inv in pending" :key="inv.id" size="small" closable class="mr-1 mb-1" @click:close="onCancel(inv)">
        {{ inv.email }}
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { OperationResultStatus } from '@asoode/shared';

const props = defineProps<{ entityId: string }>();
const groupStore = useGroupStore();
const email = ref('');
const access = ref(1);
const inviting = ref(false);
const pending = ref<any[]>([]);

const accessLevels = [
  { title: 'Viewer', value: 1 },
  { title: 'Editor', value: 2 },
  { title: 'Admin', value: 3 },
];

onMounted(async () => {
  const result = await groupStore.fetch(props.entityId);
  if (result.status === OperationResultStatus.Success) {
    pending.value = result.data?.pending || [];
  }
});

async function onInvite() {
  if (!email.value) return;
  inviting.value = true;
  await groupStore.addAccess(props.entityId, { members: [{ id: email.value, access: access.value, isGroup: false }] });
  email.value = '';
  inviting.value = false;
}

async function onCancel(inv: any) {
  await groupStore.removePendingAccess(inv.id);
  pending.value = pending.value.filter(i => i.id !== inv.id);
}
</script>
