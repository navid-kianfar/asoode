<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('INVITE_NEW_MEMBER') }}</h4>
    <v-text-field v-model="email" :label="$t('EMAIL')" type="email" class="mb-2" />
    <v-text-field v-model="fullName" :label="$t('FULL_NAME')" class="mb-2" />
    <v-btn color="primary" :disabled="!email" :loading="inviting" @click="onInvite">{{ $t('SEND_INVITE') }}</v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGroupStore } from '@/stores/group.store';

const props = defineProps<{ entityId: string }>();
const groupStore = useGroupStore();
const email = ref('');
const fullName = ref('');
const inviting = ref(false);

async function onInvite() {
  if (!email.value) return;
  inviting.value = true;
  await groupStore.addAccess(props.entityId, { members: [{ id: email.value, access: 2, isGroup: false }] });
  email.value = '';
  fullName.value = '';
  inviting.value = false;
}
</script>
