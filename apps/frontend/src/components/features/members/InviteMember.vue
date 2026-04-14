<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('INVITE_MEMBER') }}</h4>
    <v-text-field
      v-model="memberIdentifier"
      :label="$t('EMAIL_OR_PHONE')"
      class="mb-3"
    />
    <v-btn color="primary" :disabled="!memberIdentifier" :loading="inviting" @click="onInvite">{{ $t('INVITE') }}</v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGroupStore } from '@/stores/group.store';

const props = defineProps<{ entityId: string }>();
const groupStore = useGroupStore();
const memberIdentifier = ref('');
const inviting = ref(false);

async function onInvite() {
  if (!memberIdentifier.value) return;
  inviting.value = true;
  await groupStore.addAccess(props.entityId, { members: [{ id: memberIdentifier.value, access: 2, isGroup: false }] });
  memberIdentifier.value = '';
  inviting.value = false;
}
</script>
