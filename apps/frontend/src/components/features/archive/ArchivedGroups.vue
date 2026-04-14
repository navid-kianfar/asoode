<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('ARCHIVED_GROUPS') }}</h4>
    <AppWaiting v-if="loading" />
    <div v-else>
      <v-card v-for="group in groups" :key="group.id" variant="outlined" class="pa-3 mb-2">
        <div class="d-flex align-center">
          <div>
            <div class="font-weight-medium">{{ group.title }}</div>
            <div class="text-caption text-medium-emphasis">{{ group.archivedAt }}</div>
          </div>
          <v-spacer />
          <v-btn size="small" variant="outlined" @click="onRestore(group)">{{ $t('RESTORE') }}</v-btn>
        </div>
      </v-card>
      <div v-if="!groups.length" class="text-medium-emphasis text-body-2">{{ $t('NO_DATA') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { OperationResultStatus } from '@asoode/shared';
import AppWaiting from '@/components/core/AppWaiting.vue';

const groupStore = useGroupStore();
const loading = ref(true);
const groups = ref<any[]>([]);

onMounted(async () => {
  const result = await groupStore.archived();
  if (result.status === OperationResultStatus.Success) {
    groups.value = result.data || [];
  }
  loading.value = false;
});

async function onRestore(group: any) {
  await groupStore.restore(group.id);
  groups.value = groups.value.filter(g => g.id !== group.id);
}
</script>
