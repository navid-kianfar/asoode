<template>
  <div class="wp-list-view">
    <!-- Table header row -->
    <div class="wp-list-view__header-row">
      <div class="wp-list-view__col wp-list-view__col--drag"></div>
      <div class="wp-list-view__col wp-list-view__col--title">{{ $t('NAME') }}</div>
      <div class="wp-list-view__col wp-list-view__col--members justify-center">{{ $t('ASSIGNEE') }}</div>
      <div class="wp-list-view__col wp-list-view__col--due justify-center">{{ $t('DUE_DATE') }}</div>
      <div class="wp-list-view__col wp-list-view__col--priority justify-center">{{ $t('PRIORITY') }}</div>
      <div class="wp-list-view__col wp-list-view__col--actions">
        <i class="mdi mdi-plus-circle-outline"></i>
      </div>
    </div>

    <!-- Grouped by list -->
    <div v-for="list in localLists" :key="list.id" class="wp-list-view__group">
      <!-- Group header (collapsible) -->
      <div class="wp-list-view__group-header" :style="{ '--group-color': list.color || '#888' }" @click="toggleGroup(list.id)">
        <i :class="expanded[list.id] !== false ? 'mdi mdi-menu-down' : 'mdi mdi-menu-right'"></i>
        <div class="wp-list-view__status-pill" :style="{ backgroundColor: list.color || '#888' }">
          {{ list.title }}
        </div>
        <span class="wp-list-view__group-count">{{ list.tasks?.length || 0 }}</span>
        <div class="wp-list-view__actions">
          <i class="mdi mdi-dots-horizontal"></i>
          <i class="mdi mdi-plus"></i>
        </div>
      </div>

      <!-- Task rows (draggable) -->
      <VueDraggable
        v-if="expanded[list.id] !== false"
        v-model="list.tasks"
        class="wp-list-view__drag-zone"
        group="list-tasks"
        :animation="200"
        :disabled="!canEditTask"
        handle=".wp-list-view__drag-handle"
        :data-list-id="list.id"
        @end="(evt: any) => onTaskDragEnd(evt, list)"
      >
        <div
          v-for="task in list.tasks"
          :key="task.id"
          class="wp-list-view__row"
          :class="{ 'wp-list-view__row--archived': task.archivedAt }"
          @click="$emit('open-task', task.id)"
        >
          <!-- Drag handle -->
          <div v-if="canEditTask" class="wp-list-view__col wp-list-view__col--drag wp-list-view__drag-handle" @click.stop>
            <i class="mdi mdi-drag-vertical"></i>
          </div>
          <div v-else class="wp-list-view__col wp-list-view__col--drag"></div>
          
          <!-- State Icon (Circle/Dot) -->
          <div class="wp-list-view__col wp-list-view__col--status-icon">
             <i class="mdi mdi-circle-outline" :style="{ color: stateColor(task.state) }"></i>
          </div>

          <!-- Title -->
          <div class="wp-list-view__col wp-list-view__col--title">
            <span class="wp-list-view__task-name">{{ task.title }}</span>
            <div class="wp-list-view__badges">
              <i v-if="task.watching" class="mdi mdi-eye-outline" title="Watching"></i>
              <span v-if="task.commentCount" class="wp-list-view__badge">
                <i class="mdi mdi-comment-outline"></i>
              </span>
              <span v-if="task.attachmentCount" class="wp-list-view__badge">
                <i class="mdi mdi-paperclip"></i>
              </span>
              <span v-if="task.subTasksCount" class="wp-list-view__badge">
                <i class="mdi mdi-checkbox-marked-outline"></i> {{ task.subTasksDone }}/{{ task.subTasksCount }}
              </span>
            </div>
          </div>

          <!-- Members -->
          <div class="wp-list-view__col wp-list-view__col--members justify-center">
            <div class="wp-list-view__avatars">
              <template v-if="task.members?.length">
                <div v-for="m in (task.members || []).slice(0, 1)" :key="m.id" class="wp-list-view__avatar" :title="resolveUserName(m.recordId)">
                  {{ resolveUserInitials(m.recordId) }}
                </div>
                <span v-if="(task.members?.length || 0) > 1" class="wp-list-view__avatar-more">
                  +{{ task.members.length - 1 }}
                </span>
              </template>
              <i v-else class="mdi mdi-account-outline text-disabled" style="font-size: 1.1rem"></i>
            </div>
          </div>

          <!-- Due date -->
          <div class="wp-list-view__col wp-list-view__col--due justify-center">
            <div v-if="task.dueAt" class="d-flex align-center ga-1" :class="{ overdue: isOverdue(task) }">
              <i class="mdi mdi-calendar-blank-outline"></i>
              <span>{{ formatDate(task.dueAt) }}</span>
            </div>
            <i v-else class="mdi mdi-calendar-blank-outline text-disabled" style="font-size: 1.1rem"></i>
          </div>

          <!-- Priority Indicator -->
          <div class="wp-list-view__col wp-list-view__col--priority justify-center">
            <i 
              class="mdi mdi-flag" 
              :style="{ color: getPriorityColor(task.objectiveValue) }"
              style="font-size: 1.1rem"
            ></i>
          </div>

          <!-- Actions -->
          <div class="wp-list-view__col wp-list-view__col--actions"></div>
        </div>
      </VueDraggable>

      <!-- Inline new task -->
      <div v-if="canCreateTask && expanded[list.id] !== false" class="wp-list-view__new-task">
        <!-- Not adding state: simple trigger -->
        <div v-if="addingListId !== list.id" class="wp-list-view__new-task-trigger" @click="startAdding(list.id)">
          <i class="mdi mdi-plus"></i>
          <span>{{ $t('ADD_TASK') }}</span>
        </div>

        <!-- Adding state: complex row -->
        <div 
          v-else 
          class="wp-list-view__new-task-row"
          v-click-outside="{ 
            handler: cancelAdding,
            include: () => Array.from(document.querySelectorAll('.v-overlay-container')) 
          }"
        >
          <div class="wp-list-view__col wp-list-view__col--drag"></div>
          <div class="wp-list-view__col wp-list-view__col--status-icon">
             <i class="mdi mdi-circle-outline" style="color: #ccc"></i>
          </div>
          <div class="wp-list-view__col wp-list-view__col--title ga-2">
            <v-text-field
              v-model="newTaskTitle"
              class="wp-list-view__creation-input"
              placeholder="Task name or type / for commands"
              autofocus
              variant="plain"
              density="compact"
              hide-details
              @keydown.enter.exact.prevent="createTask(list.id)"
              @keydown.escape="cancelAdding"
            />

            <!-- Inline Meta Icons -->
            <div class="wp-list-view__inline-meta">
              <!-- Assignee -->
              <v-menu :close-on-content-click="false" offset="8">
                <template #activator="{ props: menuProps }">
                  <div v-bind="menuProps" class="wp-list-view__meta-btn" :class="{ 'wp-list-view__meta-btn--active': selectedAssignees.length }">
                    <v-icon v-if="!selectedAssignees.length" size="18">mdi-account-plus-outline</v-icon>
                    <div v-else class="d-flex align-center ga-1">
                      <div v-for="id in selectedAssignees" :key="id" class="wp-board-col__avatar-mini" :style="{ backgroundColor: getAvatarColor(id) }" :title="resolveUserName(id)">
                        {{ resolveUserInitials(id) }}
                      </div>
                    </div>
                  </div>
                </template>
                <v-card width="280" class="pa-0 wp-board-menu-card">
                  <div class="px-3 py-2">
                    <v-text-field v-model="assigneeSearch" placeholder="Search or enter email..." variant="plain" density="compact" hide-details prepend-inner-icon="mdi-magnify" class="wp-board-menu-search-input" />
                  </div>
                  <v-divider />
                  <v-list density="compact" class="pa-1">
                    <v-list-item v-for="member in filteredMembers" :key="member.recordId" :active="selectedAssignees.includes(member.recordId)" class="rounded-lg mb-1" @click="toggleAssignee(member.recordId)">
                      <template #prepend>
                        <div class="wp-board-col__avatar-wrapper">
                          <div class="wp-board-col__avatar-mini" :style="{ backgroundColor: getAvatarColor(member.recordId) }">
                            {{ resolveUserInitials(member.recordId) }}
                          </div>
                          <div class="wp-board-col__online-dot"></div>
                        </div>
                      </template>
                      <v-list-item-title class="ml-2">{{ resolveUserName(member.recordId) }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>

              <!-- Date Picker -->
              <v-menu :close-on-content-click="false" offset="8">
                <template #activator="{ props: menuProps }">
                  <div v-bind="menuProps" class="wp-list-view__meta-btn" :class="{ 'wp-list-view__meta-btn--active': startAt || dueAt }">
                    <v-icon size="18">mdi-calendar-plus-outline</v-icon>
                  </div>
                </template>
                <v-card width="400" class="pa-0 wp-board-date-card">
                  <div class="wp-board-date-header">
                    <div class="wp-board-date-field" :class="{ 'wp-board-date-field--active': dateFocus === 'start' }" @click="dateFocus = 'start'">
                      <v-icon size="20" class="mr-2">mdi-calendar-import-outline</v-icon>
                      <div class="wp-board-date-field-inner">
                        <div class="wp-board-date-label">Start date</div>
                        <div class="wp-board-date-value">{{ formatDate(startAt) }}</div>
                      </div>
                      <v-icon v-if="startAt" size="14" class="wp-board-date-clear" @click.stop="startAt = undefined">mdi-close</v-icon>
                    </div>
                    <div class="wp-board-date-field" :class="{ 'wp-board-date-field--active': dateFocus === 'due' }" @click="dateFocus = 'due'">
                      <v-icon size="20" class="mr-2">mdi-calendar-export-outline</v-icon>
                      <div class="wp-board-date-field-inner">
                        <div class="wp-board-date-label">Due date</div>
                        <div class="wp-board-date-value">{{ formatDate(dueAt) }}</div>
                      </div>
                      <v-icon v-if="dueAt" size="14" class="wp-board-date-clear" @click.stop="dueAt = undefined">mdi-close</v-icon>
                    </div>
                  </div>
                  <div class="d-flex flex-grow-1 align-stretch">
                    <div class="wp-board-date-sidebar">
                      <div v-for="opt in dateOptions" :key="opt.label" class="wp-board-date-opt" @click="setDateOption(opt.value)">
                        <span class="wp-board-date-opt-label">{{ opt.label }}</span>
                        <span class="wp-board-date-opt-side">{{ opt.side }}</span>
                      </div>
                    </div>
                    <!-- Calendar -->
                    <div class="wp-board-date-calendar">
                      <AppCalendar :model-value="dateFocus === 'start' ? startAt : dueAt" hide-footer @update:model-value="onDateSelected" />
                    </div>
                  </div>
                </v-card>
              </v-menu>

              <!-- Priority -->
              <v-menu offset="8">
                <template #activator="{ props: menuProps }">
                  <div v-bind="menuProps" class="wp-list-view__meta-btn" :class="{ 'wp-list-view__meta-btn--active': priority }">
                    <v-icon size="18" :color="priority ? priorityOptions.find(o => o.value === priority)?.color : 'inherit'">mdi-flag-plus-outline</v-icon>
                  </div>
                </template>
                <v-card width="260" class="pa-0 wp-board-menu-card">
                  <v-list density="compact" class="pa-1">
                    <v-list-item v-for="p in priorityOptions" :key="p.value" @click="priority = p.value">
                       <template #prepend><v-icon :color="p.color" size="20" class="mr-3">mdi-flag</v-icon></template>
                       <v-list-item-title>{{ p.label }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="priority = undefined">
                       <template #prepend><v-icon size="20" class="mr-3" color="disabled">mdi-cancel</v-icon></template>
                       <v-list-item-title>Clear</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>

              <!-- Tags -->
              <v-menu :close-on-content-click="false" offset="8">
                <template #activator="{ props: menuProps }">
                  <div v-bind="menuProps" class="wp-list-view__meta-btn" :class="{ 'wp-list-view__meta-btn--active': selectedLabels.length }">
                    <v-icon v-if="!selectedLabels.length" size="18">mdi-tag-plus-outline</v-icon>
                    <div v-else class="d-flex align-center ga-1 px-1">
                      <div v-for="id in selectedLabels" :key="id" class="wp-list-view__label-dot" :style="{ backgroundColor: workPackage.labels.find(l => l.id === id)?.color }" :title="workPackage.labels.find(l => l.id === id)?.title"></div>
                    </div>
                  </div>
                </template>
                <v-card width="280" class="pa-0 wp-board-menu-card">
                  <div class="px-3 py-2">
                    <v-text-field v-model="tagSearch" placeholder="Search or add tags..." variant="plain" density="compact" hide-details class="wp-board-menu-search-input" />
                  </div>
                  <v-divider />
                  <div class="pa-3 d-flex flex-wrap ga-2">
                    <v-chip v-for="label in filteredLabels" :key="label.id" :color="label.color" size="small" class="cursor-pointer" :variant="selectedLabels.includes(label.id) ? 'elevated' : 'tonal'" @click="toggleLabel(label.id)">
                      {{ label.title }}
                    </v-chip>
                  </div>
                </v-card>
              </v-menu>

              <v-divider vertical class="mx-2" style="height: 18px" />

              <!-- Action Buttons -->
              <div class="wp-list-view__creation-actions">
                <button class="wp-list-view__btn-cancel" @click="cancelAdding">Cancel</button>
                <button class="wp-list-view__btn-save" @click="createTask(list.id)">
                  Save
                  <v-icon size="14" class="ml-1">mdi-keyboard-return</v-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!localLists.length" class="wp-list-view__empty">
      <i class="mdi mdi-format-list-bulleted"></i>
      <p>{{ $t('NO_DATA') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, type Ref, type ComputedRef, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import AppInput from '@/components/core/AppInput.vue';
import AppCalendar from '@/components/core/AppCalendar.vue';
import {
  type WorkPackageViewModel,
  type WorkPackageTaskViewModel,
  type WorkPackageListViewModel,
  WorkPackageTaskState,
  AccessType,
  SortType,
} from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useUserCache } from '@/composables/useUserCache';
import { useTaskStore } from '@/stores/task.store';
import { WorkPackageTaskObjectiveValue } from '@asoode/shared';

// ── Emits ──────────────────────────────────────────────────────────────
const emit = defineEmits<{
  'open-task': [id: string];
  'create-task': [payload: { listId: string; title: string; metadata?: any }];
}>();

// ── Injections ─────────────────────────────────────────────────────────
const workPackage = inject<Ref<WorkPackageViewModel | null>>('workPackage')!;
const permission = inject<ComputedRef<AccessType>>('permission')!;

// ── Composables / Stores ──────────────────────────────────────────────
const { t } = useI18n();
const { formatDate: culturedFormatDate } = useCulturedDate();
const { resolveUserInitials, resolveUserName } = useUserCache();
const taskStore = useTaskStore();

// ── Reactive state ─────────────────────────────────────────────────────
const expanded = reactive<Record<string, boolean>>({});
const addingListId = ref<string | null>(null);
const newTaskTitle = ref('');
const assigneeSearch = ref('');
const tagSearch = ref('');
const priority = ref<number | undefined>(undefined);
const selectedAssignees = ref<string[]>([]);
const selectedLabels = ref<string[]>([]);
const startAt = ref<Date | undefined>(undefined);
const dueAt = ref<Date | undefined>(undefined);
const dateFocus = ref<'start' | 'due'>('due');

// ── Reactive lists for UI state & dragging ──────────────────────────
const localLists = ref<WorkPackageListViewModel[]>([]);

function syncLocalLists() {
  const wp = workPackage.value;
  if (!wp || !wp.lists) return;
  const listsSort = wp.listsSort ?? SortType.Manual;
  const tasksSort = wp.tasksSort ?? SortType.Manual;
  
  const mapped = (wp.lists || []).map(l => ({
    ...l,
    tasks: applySortType([...(l.tasks || [])], tasksSort),
  }));

  localLists.value = applySortType(mapped, listsSort);
}

syncLocalLists();
watch(() => workPackage.value?.lists, syncLocalLists, { deep: true });
watch(() => [workPackage.value?.listsSort, workPackage.value?.tasksSort], syncLocalLists);

// ── State color mapping ───────────────────────────────────────────────
const stateColors: Record<number, string> = {
  [WorkPackageTaskState.ToDo]: '#cccccc',
  [WorkPackageTaskState.InProgress]: '#59a8ef',
  [WorkPackageTaskState.Done]: '#5eb258',
  [WorkPackageTaskState.Paused]: '#666666',
  [WorkPackageTaskState.Blocked]: '#b33634',
  [WorkPackageTaskState.Cancelled]: '#666666',
  [WorkPackageTaskState.Duplicate]: '#808080',
  [WorkPackageTaskState.Incomplete]: '#b3b3b3',
  [WorkPackageTaskState.Blocker]: '#eb973e',
};

function stateColor(state: WorkPackageTaskState): string {
  return stateColors[state] || '#cccccc';
}

// ── State label mapping ───────────────────────────────────────────────
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

// ── Sorting helpers ───────────────────────────────────────────────────
function applySortType<T extends Record<string, any>>(items: T[], sortType: SortType): T[] {
  if (!items) return [];
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


// ── Group collapse toggle ─────────────────────────────────────────────
function toggleGroup(listId: string) {
  expanded[listId] = expanded[listId] === false;
}

// ── Date formatting ───────────────────────────────────────────────────
function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  return culturedFormatDate(date);
}

// ── Time formatting ───────────────────────────────────────────────────
function formatTime(ms: number): string {
  if (!ms) return '';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ── Priority helper ──────────────────────────────────────────────────
function getPriorityColor(val?: number): string {
  switch (val) {
    case WorkPackageTaskObjectiveValue.BarelyValuable: return '#87909e';
    case WorkPackageTaskObjectiveValue.SlightlyValuable: return '#59a8ef';
    case WorkPackageTaskObjectiveValue.ModeratelyValuable: return '#fbb900';
    case WorkPackageTaskObjectiveValue.VeryValuable: return '#f06a6a';
    case WorkPackageTaskObjectiveValue.ExtremelyValuable: return '#d50102';
    default: return '#87909e';
  }
}

// ── Overdue check ─────────────────────────────────────────────────────
function isOverdue(task: WorkPackageTaskViewModel): boolean {
  if (!task.dueAt) return false;
  const dueDate = typeof task.dueAt === 'string' ? new Date(task.dueAt) : task.dueAt;
  if (isNaN(dueDate.getTime())) return false;
  if (
    task.state === WorkPackageTaskState.Done ||
    task.state === WorkPackageTaskState.Cancelled ||
    task.state === WorkPackageTaskState.Duplicate
  ) {
    return false;
  }
  return dueDate.getTime() < Date.now();
}

// ── Permission helpers ────────────────────────────────────────────────
function isAdminOrHasPermission(perm: boolean): boolean {
  const p = permission.value;
  return (
    p === AccessType.Owner ||
    p === AccessType.Admin ||
    (p !== AccessType.Visitor && perm)
  );
}

const canCreateTask = computed(() => {
  const wp = workPackage.value;
  if (!wp) return false;
  return isAdminOrHasPermission(wp.permissionCreateTask);
});

const canEditTask = computed(() => {
  const wp = workPackage.value;
  if (!wp) return false;
  return isAdminOrHasPermission(wp.permissionEditTask);
});

// ── Drag-and-drop ─────────────────────────────────────────────────────
function onTaskDragEnd(evt: any, _fromList: WorkPackageListViewModel) {
  const { oldIndex, newIndex, from, to } = evt;
  if (oldIndex == null || newIndex == null) return;

  const fromListId = from?.getAttribute('data-list-id');
  const toListId = to?.getAttribute('data-list-id');
  if (!fromListId || !toListId) return;

  const wp = workPackage.value;
  if (!wp) return;

  const destList = wp.lists?.find(l => l.id === toListId);
  if (!destList) return;

  const task = destList.tasks?.[newIndex];
  if (!task) return;

  if (fromListId === toListId) {
    if (oldIndex === newIndex) return;
    taskStore.reposition(task.id, { listId: fromListId, order: newIndex + 1 });
  } else {
    taskStore.reposition(task.id, { listId: toListId, order: newIndex + 1 });
  }
}

// ── Create task ───────────────────────────────────────────────────────
function startAdding(listId: string) {
  addingListId.value = listId;
  newTaskTitle.value = '';
  selectedAssignees.value = [];
  selectedLabels.value = [];
  priority.value = undefined;
  startAt.value = undefined;
  dueAt.value = undefined;
}

function cancelAdding() {
  addingListId.value = null;
  newTaskTitle.value = '';
}

function createTask(listId: string) {
  const title = newTaskTitle.value.trim();
  if (!title) return;
  
  const metadata = {
    assignees: [...selectedAssignees.value],
    labels: [...selectedLabels.value],
    beginAt: startAt.value,
    dueAt: dueAt.value,
    objectiveValue: priority.value,
  };

  emit('create-task', { listId, title, metadata });
  
  // Keep open but reset title for next task
  newTaskTitle.value = '';
  selectedAssignees.value = [];
  selectedLabels.value = [];
  priority.value = undefined;
  startAt.value = undefined;
  dueAt.value = undefined;
}

// ── Metadata logic ──────────────────────────────────────────────────
const priorityOptions = [
  { label: 'Urgent', value: 5, color: '#f06a6a' },
  { label: 'High', value: 4, color: '#fbb900' },
  { label: 'Normal', value: 3, color: '#59a8ef' },
  { label: 'Low', value: 2, color: '#87909e' },
];

const dateOptions = [
  { label: 'Today', value: 'today', side: 'Tue' },
  { label: 'Later', value: 'later', side: '5:24 am' },
  { label: 'Tomorrow', value: 'tomorrow', side: 'Wed' },
  { label: 'This weekend', value: 'weekend', side: 'Sat' },
  { label: 'Next week', value: 'next_week', side: 'Mon' },
  { label: 'Next weekend', value: 'next_weekend', side: '25 Apr' },
  { label: '2 weeks', value: '2_weeks', side: '28 Apr' },
  { label: '4 weeks', value: '4_weeks', side: '12 May' },
];

const filteredMembers = computed(() => {
  const wp = workPackage.value;
  if (!wp || !wp.members) return [];
  if (!assigneeSearch.value) return wp.members;
  const q = assigneeSearch.value.toLowerCase();
  return wp.members.filter(m => resolveUserName(m.recordId).toLowerCase().includes(q));
});

const filteredLabels = computed(() => {
  const wp = workPackage.value;
  if (!wp || !wp.labels) return [];
  if (!tagSearch.value) return wp.labels;
  const q = tagSearch.value.toLowerCase();
  return wp.labels.filter(l => l.title.toLowerCase().includes(q));
});

function toggleAssignee(recordId: string) {
  const index = selectedAssignees.value.indexOf(recordId);
  if (index === -1) selectedAssignees.value.push(recordId);
  else selectedAssignees.value.splice(index, 1);
}

function toggleLabel(labelId: string) {
  const index = selectedLabels.value.indexOf(labelId);
  if (index === -1) selectedLabels.value.push(labelId);
  else selectedLabels.value.splice(index, 1);
}

function setDateOption(val: string) {
  const d = new Date();
  if (val === 'tomorrow') d.setDate(d.getDate() + 1);
  else if (val === 'weekend') d.setDate(d.getDate() + (6 - d.getDay()));
  else if (val === 'next_week') d.setDate(d.getDate() + (8 - d.getDay()));
  else if (val === 'next_weekend') d.setDate(d.getDate() + (13 - d.getDay()));
  else if (val === '2_weeks') d.setDate(d.getDate() + 14);
  else if (val === '4_weeks') d.setDate(d.getDate() + 28);
  
  if (dateFocus.value === 'start') startAt.value = d;
  else dueAt.value = d;
}

function onDateSelected(val: any) {
  if (dateFocus.value === 'start') {
    startAt.value = val;
    dateFocus.value = 'due';
  } else {
    dueAt.value = val;
  }
}

function getAvatarColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return `hsl(${hash % 360}, 60%, 50%)`;
}
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-list-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 138px);
  overflow-y: auto;
  overflow-x: auto;
  padding: $spacing-md;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 3px;
  }

  // ── Header row ──────────────────────────────────────────────────────
  &__header-row {
    display: flex;
    align-items: center;
    height: 36px;
    min-height: 36px;
    border-bottom: 2px solid $divider;
    font-size: 0.75rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    user-select: none;
    min-width: fit-content;
  }

  // ── Column layout ───────────────────────────────────────────────────
  &__col {
    display: flex;
    align-items: center;
    padding: 0 12px;
    min-height: inherit;

    &--drag {
      width: 20px;
      min-width: 20px;
      padding: 0;
      justify-content: center;
    }

    &--status-icon {
      width: 24px;
      min-width: 24px;
      padding: 0;
      justify-content: center;
      i { font-size: 0.9rem; }
    }

    &--title {
      flex: 1 1 auto;
      min-width: 300px;
      overflow: hidden;
    }

    &--members {
      width: 120px;
      min-width: 120px;
    }

    &--due {
      width: 140px;
      min-width: 140px;
    }

    &--priority {
      width: 100px;
      min-width: 100px;
    }

    &--actions {
      width: 40px;
      min-width: 40px;
      justify-content: center;
      color: $text-disabled;
    }
  }

  // ── Group ───────────────────────────────────────────────────────────
  &__group {
    margin-bottom: $spacing-sm;
  }

  // ── Group header ────────────────────────────────────────────────────
  &__group-header {
    display: flex;
    align-items: center;
    height: 38px;
    padding: 0 4px;
    cursor: pointer;
    user-select: none;
    gap: 8px;
    border-bottom: 1px solid $divider;
    margin-top: 12px;

    &:hover {
      .wp-list-view__actions { opacity: 1; }
    }

    i {
      font-size: 1.25rem;
      color: $text-secondary;
    }
  }

  &__status-pill {
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    min-width: 60px;
    text-align: center;
  }

  &__group-count {
    font-size: 0.8rem;
    color: $text-secondary;
    margin-left: 2px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    opacity: 0;
    color: $text-disabled;
    transition: opacity 0.2s;
    padding-right: 12px;

    i { font-size: 1.1rem; &:hover { color: $text-secondary; } }
  }

  // ── Task row ────────────────────────────────────────────────────────
  &__row {
    display: flex;
    align-items: center;
    min-height: 40px;
    border-bottom: 1px solid $divider;
    cursor: pointer;
    transition: background $transition-fast;
    min-width: fit-content;

    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    &--archived {
      opacity: 0.5;
    }
  }

  // ── Drag handle ─────────────────────────────────────────────────────
  &__drag-handle {
    cursor: grab;
    color: $text-disabled;
    transition: color $transition-fast;

    &:hover {
      color: $text-secondary;
    }

    &:active {
      cursor: grabbing;
    }

    i {
      font-size: 1rem;
    }
  }

  &__drag-zone {
    min-height: 4px;
  }

  // ── Sortable ghost ─────────────────────────────────────────────────
  .sortable-ghost {
    opacity: 0.35;
  }

  // ── Status bar ──────────────────────────────────────────────────────
  &__status-bar {
    width: 4px;
    height: 100%;
    min-height: 40px;
    border-radius: 2px;
  }

  // ── Badges (inline task indicators) ─────────────────────────────────
  &__badges {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: $text-secondary;

    i {
      font-size: 0.8rem;
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;

    i {
      font-size: 0.75rem;
    }
  }

  // ── Title text ──────────────────────────────────────────────────────
  &__col--title > span {
    font-size: 0.85rem;
    font-weight: 400;
    color: $text-primary;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  // ── Avatars ─────────────────────────────────────────────────────────
  &__avatars {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: $primary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__avatar-more {
    font-size: 0.65rem;
    font-weight: 600;
    color: $text-secondary;
    margin-inline-start: 2px;
  }

  // ── Due date ────────────────────────────────────────────────────────
  &__col--due {
    font-size: 0.75rem;
    color: $text-secondary;

    .overdue {
      color: $warn;
      font-weight: 500;
    }
  }

  // ── State chip ──────────────────────────────────────────────────────
  &__state-chip {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 500;
    border-radius: 12px;
    padding: 4px 8px;
    white-space: nowrap;
    line-height: 1;
  }

  // ── Labels ──────────────────────────────────────────────────────────
  &__label {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 500;
    color: #fff;
    border-radius: 10px;
    padding: 2px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
    line-height: 1.3;
  }

  // ── Time spent ──────────────────────────────────────────────────────
  &__col--time {
    font-size: 0.75rem;
    color: $text-secondary;
  }

  // ── New task input ──────────────────────────────────────────────────
  &__new-task {
    border-bottom: 1px solid $divider;
    background: #fff;
  }

  &__new-task-trigger {
    display: flex;
    align-items: center;
    height: 40px;
    padding-left: 50px;
    color: #87909e;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: background 0.2s;
    &:hover { background: rgba($primary, 0.04); color: $primary; }
    i { margin-right: 8px; font-size: 1.1rem; }
  }

  &__new-task-row {
    display: flex;
    align-items: center;
    min-height: 40px;
    background: rgba($primary, 0.02);
    
    .wp-list-view__col--title {
      display: flex;
      align-items: center;
      padding-right: 16px;
    }
  }

  &__creation-input {
    flex: 1;
    min-width: 200px;
    .v-field__input {
      font-size: 0.85rem !important;
      padding: 8px 0 !important;
      color: #333;
      &::placeholder { color: #aaa; }
    }
  }

  &__inline-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  &__meta-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: #87909e;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;

    &:hover {
      background: #f0f1f3;
      color: #333;
    }

    &--active {
      background: rgba($primary, 0.08);
      color: $primary !important;
      border-color: rgba($primary, 0.2);
    }
  }

  &__meta-count-badge {
    background: $primary;
    color: #fff;
    font-size: 0.55rem;
    font-weight: 700;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 2px;
  }

  &__meta-count {
    position: absolute;
    top: -4px;
    right: -4px;
    background: $primary;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2px;
    border: 1.5px solid #fff;
  }

  &__label-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__creation-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 8px;
  }

  &__btn-cancel {
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #666;
    background: #f0f1f3;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    &:hover { background: #e5e6e8; }
  }

  &__btn-save {
    padding: 4px 14px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
    background: #7b68ee;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 6px rgba(123, 104, 238, 0.3);
    transition: all 0.2s;
    &:hover { background: #6a5acd; transform: translateY(-1px); }
    &:active { transform: translateY(0); }
  }

  // ── Empty state ─────────────────────────────────────────────────────
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px $spacing-lg;
    color: $text-secondary;

    i {
      font-size: 3rem;
      margin-bottom: $spacing-md;
      opacity: 0.3;
    }

    p {
      font-size: 0.9rem;
      margin: 0;
    }
  }
}

// ── Responsive ────────────────────────────────────────────────────────
@media (max-width: $breakpoint-sm) {
  .wp-list-view {
    &__col--labels,
    &__col--time {
      display: none;
    }
  }
}

// ── Dark mode ─────────────────────────────────────────────────────────
body.dark-mode {
  .wp-list-view {
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
    }

    &__header-row {
      border-bottom-color: $dark-divider;
      color: $dark-text-secondary;
    }

    &__group-header {
      background: #2b2b2b;

      &:hover {
        background: #333;
      }

      i {
        color: $dark-text-secondary;
      }
    }

    &__group-title {
      color: $dark-text-primary;
    }

    &__group-count {
      color: $dark-text-secondary;
      background: rgba(255, 255, 255, 0.08);
    }

    &__row {
      border-bottom-color: $dark-divider;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      &--archived {
        opacity: 0.4;
      }
    }

    &__col--title > span {
      color: $dark-text-primary;
    }

    &__badges {
      color: $dark-text-secondary;
    }

    &__avatar {
      background: $primary-light;
    }

    &__avatar-more {
      color: $dark-text-secondary;
    }

    &__col--due {
      color: $dark-text-secondary;

      .overdue {
        color: $warn;
      }
    }

    &__col--time {
      color: $dark-text-secondary;
    }

    &__new-task {
      background: #2b2b2b;
      border-color: $dark-divider;
    }
    
    &__new-task-trigger {
      color: #d4a76a;
      &:hover { background: rgba(212, 167, 106, 0.1); }
    }

    &__new-task-row {
      background: rgba(255, 255, 255, 0.03);
    }

    &__creation-input .v-field__input {
      color: #eee;
    }

    &__meta-btn {
      color: #888;
      &:hover { background: #444; color: #fff; }
      &--active { background: rgba($primary-light, 0.1); color: $primary-light !important; }
    }

    &__meta-count {
      border-color: #2b2b2b;
      background: $primary-light;
    }

    &__btn-cancel { background: #444; color: #ccc; &:hover { background: #555; } }
    &__btn-save { background: #7b68ee; color: #fff; }

    &__empty {
      color: $dark-text-secondary;
    }
  }
}

// ── Shared Menu & Date Card Styles (Replicated from Board) ──────────
.wp-board-menu-card {
  box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
  border-radius: 10px !important;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.08);

  .v-list-item {
    font-size: 0.8rem;
    min-height: 32px !important;
    padding: 2px 10px !important;
    &__prepend { width: 24px; .v-icon { font-size: 16px; } }
  }
  .v-list-item-title { font-weight: 500; }
  .wp-board-menu-search-input {
    :deep(.v-field__input) {
      font-size: 0.8rem;
      min-height: 24px !important;
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }
    :deep(.v-field__prepend-inner) .v-icon { font-size: 16px; color: #87909e; margin-top: 2px; }
  }
}

.wp-board-date-card {
  box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
  border-radius: 12px !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 340px;
}

.wp-board-date-header {
  display: flex;
  padding: 8px 10px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  gap: 8px;
}

.wp-board-date-field {
  flex: 1; display: flex; align-items: center; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: all 0.2s; position: relative;
  &--active { border-color: #7b68ee; box-shadow: 0 0 0 3px rgba(123, 104, 238, 0.1); }
  i { color: #87909e; }
}

.wp-board-date-field-inner { display: flex; flex-direction: column; margin-left: 4px; }
.wp-board-date-label { font-size: 0.65rem; color: #87909e; font-weight: 600; text-transform: uppercase; }
.wp-board-date-value { font-size: 0.85rem; font-weight: 500; color: #333; min-height: 18px; }
.wp-board-date-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #ccc; &:hover { color: #999; } }
.wp-board-date-sidebar { 
  width: 150px; 
  border-right: 1px solid #eee; 
  padding: 8px 0;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  flex: 0 0 150px;
}
.wp-board-date-opt {
  display: flex; align-items: center; justify-content: space-between; padding: 6px 16px; cursor: pointer; transition: background 0.2s;
  &:hover { background: #f3f5f7; }
}
.wp-board-date-opt-label { font-size: 0.8rem; color: #333; font-weight: 500; }
.wp-board-date-opt-side { font-size: 0.7rem; color: #87909e; }
.wp-board-date-calendar { flex: 1; padding: 8px; }

.wp-board-col__avatar-wrapper { position: relative; display: flex; }
.wp-board-col__online-dot { position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px; background: #4caf50; border: 1.5px solid white; border-radius: 50%; }
.wp-board-col__avatar-mini { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 700; }

body.dark-mode {
  .wp-board-menu-card, .wp-board-date-card { background: #2c2c2c !important; border-color: #444 !important; }
  .wp-board-date-header { background: #333; border-bottom-color: #444; }
  .wp-board-date-field { background: #222; border-color: #444; }
  .wp-board-date-value { color: #eee; }
  .wp-board-date-sidebar { border-right-color: #444; }
  .wp-board-date-opt:hover { background: #444; }
  .wp-board-date-opt-label { color: #eee; }
  .v-divider { border-color: #444; }
}
</style>
