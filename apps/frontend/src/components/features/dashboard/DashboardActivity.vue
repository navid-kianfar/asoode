<template>
  <div class="da">
    <AppWaiting v-if="waiting" />

    <div v-if="!waiting && !logs.length" class="da-empty">
      <i class="mdi mdi-bell-outline"></i>
      <span>{{ $t('NO_ACTIVITY_LOG') }}</span>
    </div>

    <div v-if="logs.length" class="da-timeline">
      <div
        v-for="log in logs"
        :key="log.id"
        class="da-item"
        @click="openTask(log)"
      >
        <!-- Timeline dot -->
        <span class="da-item__dot" :style="{ background: stateColor(log.state) }"></span>

        <!-- Content -->
        <div class="da-item__body">
          <div class="da-item__title">{{ log.title }}</div>

          <div v-if="log.labels?.length" class="da-item__labels">
            <span
              v-for="label in log.labels.slice(0, 5)"
              :key="label.id"
              class="da-item__label-dot"
              :style="{ background: label.color }"
            ></span>
          </div>

          <div class="da-item__row">
            <div class="da-item__meta">
              <span v-if="log.subTasksCount" class="da-item__tag">
                <i class="mdi mdi-checkbox-marked-outline"></i>
                {{ log.subTasksDone }}/{{ log.subTasksCount }}
              </span>
              <span v-if="log.commentCount" class="da-item__tag">
                <i class="mdi mdi-comment-outline"></i>
                {{ log.commentCount }}
              </span>
              <span v-if="log.attachmentCount" class="da-item__tag">
                <i class="mdi mdi-paperclip"></i>
                {{ log.attachmentCount }}
              </span>
            </div>
            <span class="da-item__time">{{ fromNow(log.updatedAt) }}</span>
          </div>

          <div v-if="log.members?.length" class="da-item__members">
            <span
              v-for="member in log.members.slice(0, 3)"
              :key="member.id"
              class="da-item__avatar"
              :title="resolveUserName(member.recordId)"
            >{{ resolveUserInitials(member.recordId) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Modal -->
    <TaskModal
      v-if="openedTaskId"
      :taskId="openedTaskId"
      @close="openedTaskId = ''"
      @open-task="openedTaskId = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { httpService } from '@/services/http.service';
import { API, OperationResultStatus, WorkPackageTaskState } from '@asoode/shared';
import type { WorkPackageTaskViewModel } from '@asoode/shared';
import AppWaiting from '@/components/core/AppWaiting.vue';
import TaskModal from '@/components/modals/TaskModal.vue';
import { useUserCache } from '@/composables/useUserCache';
import { useCulturedDate } from '@/composables/useCulturedDate';

const props = defineProps<{ groupId: string }>();
const { resolveUserInitials, resolveUserName } = useUserCache();
const { fromNow } = useCulturedDate();

const waiting = ref(false);
const logs = ref<WorkPackageTaskViewModel[]>([]);
const openedTaskId = ref('');

function stateColor(state: WorkPackageTaskState | undefined): string {
  switch (state) {
    case WorkPackageTaskState.Done: return '#74d68c';
    case WorkPackageTaskState.InProgress: return '#59a8ef';
    case WorkPackageTaskState.Blocked:
    case WorkPackageTaskState.Cancelled: return '#ee6285';
    case WorkPackageTaskState.Paused: return '#ffc107';
    default: return '#b977f7';
  }
}

async function fetchData() {
  logs.value = [];
  waiting.value = true;
  const op = await httpService.post<WorkPackageTaskViewModel[]>(
    API.REPORT_RECENT_ACTIVITIES,
    { groupId: props.groupId || undefined },
  );
  waiting.value = false;
  if (op.status === OperationResultStatus.Success) {
    logs.value = op.data || [];
  }
}

function openTask(log: WorkPackageTaskViewModel) {
  openedTaskId.value = log.id;
}

watch(() => props.groupId, () => {
  fetchData();
}, { immediate: true });
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.da {
  min-height: 60px;
}

.da-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: $text-disabled;

  i { font-size: 1.8rem; }
  span { font-size: 0.78rem; }
}

// ─── Timeline ───
.da-timeline {
  display: flex;
  flex-direction: column;
  position: relative;
  padding-inline-start: 20px;

  // Vertical line
  &::before {
    content: '';
    position: absolute;
    inset-inline-start: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: $divider;
    border-radius: 1px;
  }
}

.da-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 10px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
    margin-inline-start: -16px;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 0 3px $surface;
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 0.8rem;
    font-weight: 500;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__labels {
    display: flex;
    gap: 3px;
  }

  &__label-dot {
    width: 20px;
    height: 4px;
    border-radius: 2px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__meta {
    display: flex;
    gap: 8px;
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.68rem;
    color: $text-disabled;

    i { font-size: 0.78rem; }
  }

  &__time {
    font-size: 0.65rem;
    color: $text-disabled;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__members {
    display: flex;
    gap: 3px;
    margin-top: 2px;
  }

  &__avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ded4e4;
    color: #6b3d8d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.5rem;
    font-weight: 600;
  }
}
</style>

<!-- Dark mode -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .da-empty { color: #555; }

  .da-timeline::before { background: $dark-border; }

  .da-item {
    &:hover { background: rgba(255, 255, 255, 0.03); }
    &__dot { box-shadow: 0 0 0 3px $dark-card; }
    &__title { color: $dark-text-bright; }
    &__tag { color: #666; }
    &__time { color: #555; }
    &__avatar { background: #4a3d5c; color: $primary-light; }
  }
}
</style>
