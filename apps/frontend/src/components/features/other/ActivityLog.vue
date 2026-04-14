<template>
  <div class="activity-log">
    <div v-if="activities?.length">
      <div v-for="activity in activities" :key="activity.id" class="d-flex align-start pa-3 mb-1 rounded activity-item">
        <v-avatar size="32" color="primary" class="mr-3 mt-1 flex-shrink-0">
          <v-img v-if="activity.member?.avatar" :src="activity.member.avatar" />
          <span v-else class="text-white text-caption">{{ activity.member?.initials || '?' }}</span>
        </v-avatar>
        <div class="flex-grow-1">
          <div class="d-flex align-center">
            <span class="text-body-2 font-weight-medium mr-1">
              {{ activity.member?.fullName || $t('SYSTEM') }}
            </span>
            <v-icon v-if="getActivityIcon(activity.type)" size="14" class="mr-1 text-medium-emphasis">
              {{ getActivityIcon(activity.type) }}
            </v-icon>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ activity.description }}</div>
          <div class="text-caption text-medium-emphasis mt-1">{{ fromNow(activity.createdAt) }}</div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-medium-emphasis text-body-2 pa-8">
      {{ $t('NO_ACTIVITIES') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActivityLogViewModel } from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';

defineProps<{ activities: ActivityLogViewModel[] }>();

const { fromNow } = useCulturedDate();

function getActivityIcon(type: number): string {
  // Map common activity types to icons
  switch (type) {
    case 1: return 'mdi-plus-circle-outline';       // Created
    case 2: return 'mdi-pencil-outline';             // Updated
    case 3: return 'mdi-delete-outline';             // Deleted
    case 4: return 'mdi-archive-outline';            // Archived
    case 5: return 'mdi-comment-outline';            // Commented
    case 6: return 'mdi-paperclip';                  // Attached
    case 7: return 'mdi-account-plus-outline';       // Member added
    case 8: return 'mdi-account-minus-outline';      // Member removed
    case 9: return 'mdi-swap-horizontal';            // Moved
    case 10: return 'mdi-check-circle-outline';      // Completed
    default: return 'mdi-information-outline';
  }
}
</script>

<style scoped lang="scss">
.activity-item {
  transition: background-color 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}
</style>
