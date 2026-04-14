<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('ORG_CHART') }}</h4>
    <AppWaiting v-if="loading" />
    <div v-else class="org-chart-container">
      <OrgChartNode v-if="rootNode" :node="rootNode" />
      <div v-else class="text-medium-emphasis">{{ $t('NO_DATA') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { OperationResultStatus } from '@asoode/shared';
import AppWaiting from '@/components/core/AppWaiting.vue';
import OrgChartNode from './OrgChartNode.vue';

const props = defineProps<{ groupId: string }>();
const groupStore = useGroupStore();
const loading = ref(true);
const rootNode = ref<any>(null);

onMounted(async () => {
  const result = await groupStore.fetch(props.groupId);
  if (result.status === OperationResultStatus.Success) {
    rootNode.value = result.data;
  }
  loading.value = false;
});
</script>

<style scoped>
.org-chart-container {
  overflow-x: auto;
  padding: 16px;
}
</style>
