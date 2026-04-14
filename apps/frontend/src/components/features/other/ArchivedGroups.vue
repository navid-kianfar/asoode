<template>
  <div class="archived-groups">
    <AppWaiting v-if="loading" />
    <template v-else>
      <div v-if="groups.length" class="pa-4">
        <h4 class="text-subtitle-1 mb-4">
          {{ $t('ARCHIVED_GROUPS') }}
          <v-chip size="small" variant="tonal" class="ml-2">{{ groups.length }}</v-chip>
        </h4>

        <v-list density="comfortable">
          <v-list-item
            v-for="group in groups"
            :key="group.id"
            class="rounded mb-2"
            variant="outlined"
          >
            <template #prepend>
              <v-avatar size="36" color="grey-lighten-1">
                <v-img v-if="group.avatar" :src="group.avatar" />
                <v-icon v-else color="grey-darken-1" size="20">mdi-domain</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="text-body-2 font-weight-medium">{{ group.title }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption text-medium-emphasis">
              <span v-if="group.archivedAt">{{ $t('ARCHIVED') }}: {{ formatDate(group.archivedAt) }}</span>
              <span v-if="group.membersUsed"> &middot; {{ group.membersUsed }} {{ $t('MEMBERS') }}</span>
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                :loading="group.restoring"
                @click="restoreGroup(group)"
              >
                <v-icon start size="16">mdi-restore</v-icon>
                {{ $t('RESTORE') }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <div v-else class="text-center text-medium-emphasis text-body-2 pa-8">
        {{ $t('NO_ARCHIVED_GROUPS') }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { OperationResultStatus, type GroupViewModel } from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';
import AppWaiting from '@/components/core/AppWaiting.vue';

const groupStore = useGroupStore();
const { formatDate } = useCulturedDate();

const loading = ref(true);
const groups = ref<(GroupViewModel & { restoring?: boolean })[]>([]);

async function restoreGroup(group: GroupViewModel & { restoring?: boolean }) {
  group.restoring = true;
  const result = await groupStore.restore(group.id);
  if (result.status === OperationResultStatus.Success) {
    groups.value = groups.value.filter((g) => g.id !== group.id);
  }
  group.restoring = false;
}

onMounted(async () => {
  const result = await groupStore.archived();
  if (result.status === OperationResultStatus.Success && result.data) {
    groups.value = result.data;
  }
  loading.value = false;
});
</script>
