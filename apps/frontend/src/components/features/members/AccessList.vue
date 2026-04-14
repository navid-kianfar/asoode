<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('ACCESS_CONTROL') }}</h4>
    <div v-for="member in members" :key="member.id" class="d-flex align-center mb-2">
      <v-avatar size="32" color="primary" class="mr-3">
        <span class="text-white" style="font-size: 11px">{{ member.initials || '?' }}</span>
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-body-2 font-weight-medium">{{ member.fullName }}</div>
        <div class="text-caption text-medium-emphasis">{{ member.email }}</div>
      </div>
      <v-select
        v-model="member.access"
        :items="accessLevels"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 150px"
        @update:model-value="onChangeAccess(member)"
      />
      <v-btn icon variant="text" size="small" color="error" class="ml-1" @click="onRemove(member)">
        <v-icon size="small">mdi-close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { OperationResultStatus } from '@asoode/shared';

const props = defineProps<{ entityId: string; entityType?: string }>();
const groupStore = useGroupStore();
const members = ref<any[]>([]);

const accessLevels = [
  { title: 'Viewer', value: 1 },
  { title: 'Editor', value: 2 },
  { title: 'Admin', value: 3 },
  { title: 'Owner', value: 4 },
];

onMounted(async () => {
  const result = await groupStore.fetch(props.entityId);
  if (result.status === OperationResultStatus.Success) {
    members.value = result.data?.members || [];
  }
});

async function onChangeAccess(member: any) {
  await groupStore.changeAccess(props.entityId, { recordId: member.id, access: member.access });
}

async function onRemove(member: any) {
  await groupStore.removeAccess(member.id);
  members.value = members.value.filter(m => m.id !== member.id);
}
</script>
