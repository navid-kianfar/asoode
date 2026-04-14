<template>
  <div class="work-package-list-view">
    <div
      v-for="list in sortedLists"
      :key="list.id"
      class="list-item no-select"
    >
      <!-- List title bar -->
      <div
        class="title"
        @click="toggleList(list)"
      >
        <span>{{ list.title }}</span>
        <i
          v-if="list.expandedAlt !== false"
          class="mdi mdi-chevron-down"
        ></i>
        <i
          v-else
          :class="rtl ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right'"
        ></i>
      </div>

      <!-- Tasks -->
      <div v-if="list.expandedAlt !== false" class="tasks">
        <div
          v-for="task in list.tasks"
          :key="task.id"
          class="task"
          :class="{ archived: task.archivedAt }"
          @click="openTask(task)"
        >
          <!-- Status color bar -->
          <div :class="'label color-' + task.state"></div>

          <!-- Info column -->
          <div class="info">
            <div class="task-title">{{ task.title }}</div>
            <div class="detail">
              <div v-if="task.watching" class="detail-wrapper">
                <i class="mdi mdi-eye"></i>
              </div>
              <div v-if="task.targetCounts" class="detail-wrapper">
                <div class="target">
                  <i class="mdi mdi-target"></i>
                  <span>{{ task.targetCounts }}</span>
                </div>
              </div>
              <div v-if="task.hasDescription" class="detail-wrapper">
                <div class="inf">
                  <i class="mdi mdi-text"></i>
                </div>
              </div>
              <div v-if="task.commentCount" class="detail-wrapper">
                <div class="inf">
                  <i class="mdi mdi-comment-text"></i>
                  <span>{{ task.commentCount }}</span>
                </div>
              </div>
              <div v-if="task.attachmentCount" class="detail-wrapper">
                <div class="inf">
                  <i class="mdi mdi-paperclip"></i>
                  <span>{{ task.attachmentCount }}</span>
                </div>
              </div>
              <div
                v-if="task.voteNecessity !== WorkPackageTaskVoteNecessity.None || task.upVotes || task.downVotes"
                class="detail-wrapper"
              >
                <div class="vote">
                  <div class="sep up">
                    <span>{{ task.upVotes || 0 }}</span>
                    <i class="mdi mdi-thumb-up"></i>
                  </div>
                  <div class="sep down">
                    <i class="mdi mdi-thumb-down"></i>
                    <span>{{ task.downVotes || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Members column -->
          <div class="members">
            <template v-for="member in task.members" :key="member.id">
              <div v-if="!member.isGroup" class="member-avatar" :title="resolveUserName(member.recordId)">
                {{ resolveUserInitials(member.recordId) }}
              </div>
              <div v-if="member.isGroup" class="member-avatar group">
                <i class="mdi mdi-account-group"></i>
              </div>
            </template>
          </div>

          <!-- Date column -->
          <div class="date">
            <template v-if="task.dueAt || task.endAt || task.beginAt">
              <i class="mdi mdi-calendar"></i>&nbsp;
              <span>{{ formatDate(task.dueAt || task.endAt || task.beginAt) }}</span>
            </template>
          </div>

          <!-- State column -->
          <div class="state">
            {{ stateLabel(task.state) }}
          </div>

          <!-- Labels column -->
          <div class="labels">
            <template v-for="label in workPackage?.labels" :key="label.id">
              <div
                v-if="isLabelSelected(task, label)"
                class="label-item"
                :style="{ backgroundColor: label.color }"
              >
                {{ label.title }}
              </div>
            </template>
          </div>

          <!-- Time spent column -->
          <div class="time-spent">
            <template v-if="task.timeSpent">
              {{ formatDuration(task.timeSpent) }}
            </template>
          </div>
        </div>

        <!-- New task input -->
        <div
          v-if="!embed && canCreateTask"
          class="new-task"
        >
          <input
            type="text"
            :placeholder="$t('NEW_TASK_PLACEHOLDER')"
            :readonly="creatingNewTask"
            v-model="list.newTaskTitle"
            @keydown.enter="createNewTask(list)"
          />
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AccessType, SortType,
  OperationResultStatus,
  WorkPackageTaskState,
  WorkPackageTaskVoteNecessity,
  type WorkPackageViewModel,
  type WorkPackageListViewModel,
  type WorkPackageTaskViewModel,
  type WorkPackageLabelViewModel,
  type ProjectViewModel,
} from '@asoode/shared';
import { useTaskStore } from '@/stores/task.store';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';
import { useUserCache } from '@/composables/useUserCache';
import TaskModal from '@/components/modals/TaskModal.vue';

const props = withDefaults(
  defineProps<{
    workPackage: WorkPackageViewModel;
    embed?: boolean;
    project?: ProjectViewModel;
    permission?: AccessType;
  }>(),
  {
    embed: false,
    permission: AccessType.Visitor,
  },
);

const taskStore = useTaskStore();
const wpStore = useWorkPackageStore();
const cultureStore = useCultureStore();
const { formatDate } = useCulturedDate();
const { t } = useI18n();
const { resolveUserInitials, resolveUserName } = useUserCache();

const creatingNewTask = ref(false);
const openedTaskId = ref('');

const rtl = computed(() => cultureStore.current.rtl);

const canCreateTask = computed(() => isAdminOrHasPermission(props.workPackage.permissionCreateTask));

const stateI18nKeys: Record<number, string> = {
  [WorkPackageTaskState.ToDo]: 'ENUMS_WORK_PACKAGE_TASK_STATE_TO_DO',
  [WorkPackageTaskState.InProgress]: 'ENUMS_WORK_PACKAGE_TASK_STATE_IN_PROGRESS',
  [WorkPackageTaskState.Done]: 'ENUMS_WORK_PACKAGE_TASK_STATE_DONE',
  [WorkPackageTaskState.Paused]: 'ENUMS_WORK_PACKAGE_TASK_STATE_PAUSED',
  [WorkPackageTaskState.Blocked]: 'ENUMS_WORK_PACKAGE_TASK_STATE_BLOCKED',
  [WorkPackageTaskState.Cancelled]: 'ENUMS_WORK_PACKAGE_TASK_STATE_CANCELED',
  [WorkPackageTaskState.Duplicate]: 'ENUMS_WORK_PACKAGE_TASK_STATE_DUPLICATE',
  [WorkPackageTaskState.Incomplete]: 'ENUMS_WORK_PACKAGE_TASK_STATE_INCOMPLETE',
  [WorkPackageTaskState.Blocker]: 'ENUMS_WORK_PACKAGE_TASK_STATE_BLOCKER',
};

function stateLabel(state: WorkPackageTaskState): string {
  const key = stateI18nKeys[state];
  return key ? t(key) : '';
}

function applySortType<T extends Record<string, any>>(items: T[], sortType: SortType): T[] {
  const sorted = [...items];
  if (sortType === SortType.Manual) {
    return sorted.sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0));
  }
  return sorted.sort((a, b) => {
    switch (sortType) {
      case SortType.DateAsc:
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case SortType.DateDesc:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case SortType.NameAsc:
        return (a.title || '').localeCompare(b.title || '');
      case SortType.NameDesc:
        return (b.title || '').localeCompare(a.title || '');
      default:
        return 0;
    }
  });
}

const sortedLists = computed(() => {
  const listsSort = props.workPackage.listsSort ?? SortType.Manual;
  const tasksSort = props.workPackage.tasksSort ?? SortType.Manual;

  const mapped = (props.workPackage.lists || []).map(l => ({
    ...l,
    tasks: applySortType([...(l.tasks || [])], tasksSort),
  }));

  return applySortType(mapped, listsSort);
});

function isAdminOrHasPermission(permission: boolean): boolean {
  return (
    props.permission === AccessType.Owner ||
    props.permission === AccessType.Admin ||
    (props.permission !== AccessType.Visitor && permission)
  );
}

function isLabelSelected(task: WorkPackageTaskViewModel, label: WorkPackageLabelViewModel): boolean {
  return (task.labels || []).findIndex(i => i.labelId === label.id) !== -1;
}

function formatDuration(ms: number): string {
  if (!ms) return '';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function toggleList(list: WorkPackageListViewModel) {
  (list as any).expandedAlt = (list as any).expandedAlt === false;
}

function openTask(task: WorkPackageTaskViewModel) {
  openedTaskId.value = task.id;
}

async function createNewTask(list: WorkPackageListViewModel) {
  const name = (list.newTaskTitle || '').trim();
  if (!name) return;
  creatingNewTask.value = true;
  const op = await taskStore.create(list.id, {
    listId: list.id,
    title: name,
    parentId: undefined,
  });
  creatingNewTask.value = false;
  if (op.status === OperationResultStatus.Success) {
    list.newTaskTitle = '';
    await wpStore.fetch(props.workPackage.id);
  }
}
</script>

<style lang="scss">
.work-package-list-view {
  display: flex;
  flex-direction: column;
  padding: 30px;
  height: calc(100vh - 117px);
  overflow-y: auto;

  .list-item {
    display: flex;
    margin-bottom: 50px;
    flex-direction: column;

    > .title {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      cursor: pointer;
      user-select: none;

      span {
        font-size: 0.8rem;
        font-weight: 500;
        margin-inline-end: 10px;
        color: #333333;
      }

      i {
        font-size: 0.5rem;
        color: #666666;
      }
    }

    .tasks {
      display: flex;
      flex-direction: column;

      .task {
        min-width: 1300px;
        display: flex;
        background: #ffffff;
        border-bottom: 1px solid #ececec;
        cursor: pointer;

        &:hover {
          background: #fafafa;
        }

        .label {
          display: flex;
          min-width: 4px;

          &.color-1 {
            background: #cccccc;
          }
          &.color-2 {
            background: #59a8ef;
          }
          &.color-3 {
            background: #5eb258;
          }
          &.color-4 {
            background: #666666;
          }
          &.color-5 {
            background: #b33634;
          }
          &.color-6 {
            background: #666666;
          }
          &.color-7 {
            background: #808080;
          }
          &.color-8 {
            background: #b3b3b3;
          }
          &.color-9 {
            background: #eb973e;
          }
        }

        .info {
          display: flex;
          flex-direction: column;
          min-width: 500px;
          border-inline-end: 1px solid #ececec;
          padding: 5px;
          flex-grow: 1;

          .task-title {
            font-size: 0.9rem;
            font-weight: 400;
            color: #333333;
          }

          .detail {
            min-height: 20px;
            display: flex;
            align-items: center;
            margin-top: 5px;

            .detail-wrapper {
              display: flex;
              color: #70818c;
              font-size: 0.8rem;
              align-items: center;
              margin-inline-end: 15px;

              > div {
                display: flex;
                align-items: center;
              }

              i {
                font-size: 0.8rem;
              }

              span {
                margin: 0 5px;
              }

              .vote {
                display: flex;
                align-items: center;

                .sep {
                  display: flex;
                  align-items: center;

                  span {
                    margin: 0 3px;
                    font-size: 0.75rem;
                  }

                  &.up {
                    span {
                      color: #3d8f4d;
                    }
                  }

                  &.down {
                    span {
                      color: #b33634;
                    }
                  }
                }
              }
            }
          }
        }

        .members {
          display: flex;
          min-width: 250px;
          max-width: 250px;
          border-inline-end: 1px solid #ececec;
          align-items: center;
          padding: 0 5px;
          gap: 2px;
          flex-wrap: wrap;

          .member-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #e6e6e6;
            border: 1px solid #999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            font-weight: 500;
            color: #333;

            &.group {
              background: #d0d0d0;

              i {
                font-size: 0.7rem;
                color: #666;
              }
            }
          }
        }

        .date {
          display: flex;
          min-width: 100px;
          max-width: 100px;
          border-inline-end: 1px solid #ececec;
          align-items: center;
          padding: 0 5px;
          font-size: 0.75rem;
          color: #666;

          i {
            font-size: 0.8rem;
            color: #666;
          }

          span {
            font-size: 0.75rem;
          }
        }

        .state {
          display: flex;
          min-width: 100px;
          max-width: 100px;
          border-inline-end: 1px solid #ececec;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 500;
          justify-content: center;
          color: #333;
        }

        .labels {
          border-inline-end: 1px solid #ececec;
          display: flex;
          flex-wrap: wrap;
          margin-top: 5px;
          min-width: 150px;
          max-width: 150px;
          align-items: center;
          justify-content: center;

          .label-item {
            display: flex;
            margin-inline-end: 5px;
            border-radius: 5px;
            padding: 1px 10px;
            margin-bottom: 5px;
            font-size: 0.7rem;
            font-weight: 300;
            color: #fff;
            min-width: 40px;
            min-height: 10px;
            max-height: 30px;
          }
        }

        .time-spent {
          display: flex;
          min-width: 100px;
          max-width: 100px;
          border-inline-end: 1px solid #ececec;
          align-items: center;
          justify-content: center;
          color: #ef6a8c;
          font-size: 0.8rem;
          font-weight: 500;
        }

        &.archived {
          .info {
            background: #f7f7f7;
          }
        }
      }

      .new-task {
        input {
          width: 500px;
          max-width: 100%;
          font-size: 0.8rem;
          padding: 10px;
          border: 1px dashed #ccc;
          border-radius: 4px;
          outline: none;
          background: transparent;
          font-family: inherit;
          color: #333;

          &:focus {
            border-color: #6b3d8d;
          }
        }
      }
    }
  }
}

// === Dark mode ===
body.dark-mode {
  .work-package-list-view {
    .list-item {
      > .title {
        span {
          color: #999999 !important;
        }

        i {
          color: #999999 !important;
        }
      }

      .tasks {
        .task {
          background: #313131 !important;
          border-bottom-color: #3b3b3b !important;

          &:hover {
            background: #3b3b3b !important;
          }

          .info {
            border-inline-end-color: #3b3b3b !important;

            .task-title {
              color: #999999 !important;
            }

            .detail .detail-wrapper {
              color: #808080 !important;
            }
          }

          .members {
            border-inline-end-color: #3b3b3b !important;

            .member-avatar {
              background: #3b3b3b !important;
              border-color: #666 !important;
              color: #999 !important;

              &.group i {
                color: #999 !important;
              }
            }
          }

          .date {
            border-inline-end-color: #3b3b3b !important;
            color: #808080 !important;

            i {
              color: #808080 !important;
            }
          }

          .state {
            border-inline-end-color: #3b3b3b !important;
            color: #999999 !important;
          }

          .labels {
            border-inline-end-color: #3b3b3b !important;
          }

          .time-spent {
            border-inline-end-color: #3b3b3b !important;
          }

          &.archived {
            .info {
              background: #555 !important;
            }
          }
        }

        .new-task input {
          background: #3b3b3b !important;
          border-color: transparent !important;
          color: #999999 !important;

          &:focus {
            border-color: #59a8ef !important;
          }
        }
      }
    }
  }
}
</style>
