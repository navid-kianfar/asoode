<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('INVITE_GROUP') }}</h4>
    <v-select v-model="selectedGroup" :items="groups" item-title="title" item-value="id" :label="$t('SELECT_GROUP')" class="mb-3" />
    <v-btn color="primary" :disabled="!selectedGroup" :loading="inviting" @click="onInvite">{{ $t('INVITE') }}</v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGroupStore } from '@/stores/group.store';

const props = defineProps<{ projectId: string }>();
const groupStore = useGroupStore();
const selectedGroup = ref('');
const groups = computed(() => groupStore.groups);
const inviting = ref(false);

async function onInvite() {
  if (!selectedGroup.value) return;
  inviting.value = true;
  await groupStore.addAccess(props.projectId, { members: [{ id: selectedGroup.value, access: 2, isGroup: true }] });
  inviting.value = false;
}
</script>
