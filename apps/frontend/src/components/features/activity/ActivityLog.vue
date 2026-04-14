<template>
  <div>
    <h4 class="text-subtitle-1 mb-3">{{ $t('ACTIVITY_LOG') }}</h4>
    <AppWaiting v-if="loading" />
    <div v-else>
      <div v-for="activity in activities" :key="activity.id" class="d-flex align-start mb-3">
        <v-avatar size="28" color="primary" class="mr-2 mt-1">
          <span class="text-white" style="font-size: 10px">{{ activity.member?.initials || '?' }}</span>
        </v-avatar>
        <div>
          <div class="text-body-2">
            <span class="font-weight-medium">{{ activity.member?.fullName }}</span>
            {{ activity.description }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ activity.createdAt }}</div>
        </div>
      </div>
      <div v-if="!activities.length" class="text-medium-emphasis text-body-2">{{ $t('NO_ACTIVITY') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { OperationResultStatus, API } from '@asoode/shared';
import { httpService } from '@/services/http.service';
import AppWaiting from '@/components/core/AppWaiting.vue';

const props = defineProps<{ entityId: string }>();
const loading = ref(true);
const activities = ref<any[]>([]);

onMounted(async () => {
  const result = await httpService.post<any>(API.PROJECTS_FETCH(props.entityId));
  if (result.status === OperationResultStatus.Success) {
    activities.value = result.data?.activities || [];
  }
  loading.value = false;
});
</script>
