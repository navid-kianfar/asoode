<template>
  <div
    class="wp-board-col"
    :style="columnStyle"
  >
    <!-- Column header: normal (Pill style) -->
    <div
      v-if="!list._renaming"
      class="wp-board-col__header"
    >
      <div class="wp-board-col__status-pill" :style="{ backgroundColor: statusColor }">
        <v-icon size="14" color="white" class="mr-2">mdi-circle-outline</v-icon>
        <span class="wp-board-col__status-title">
          {{ list.title.toUpperCase() }}
        </span>
      </div>
      <span class="wp-board-col__status-count" :style="{ color: statusColor }">{{ list.tasks?.length || 0 }}</span>

      <div class="wp-board-col__header-actions">
        <v-btn
          icon="mdi-plus"
          variant="text"
          size="x-small"
          class="wp-board__icon-btn mr-1"
          :style="{ color: statusColor }"
          @click="$emit('prepare-task', list)"
        />

        <v-menu
          v-model="list._menuOpen"
          transition="scale-transition"
          offset="8"
          min-width="180"
          @update:model-value="val => val && $emit('toggle-menu', list, true)"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-horizontal"
              variant="text"
              size="x-small"
              class="wp-board__icon-btn"
              :style="{ color: statusColor }"
            />
          </template>

          <v-card class="wp-board-menu-card">
            <v-list density="compact" class="pa-1">
              <!-- Rename -->
              <v-list-item
                v-if="canEditList"
                class="rounded-lg mb-1"
                @click="$emit('start-rename', list)"
              >
                <template #prepend>
                  <v-icon size="18" class="mr-2">mdi-pencil-outline</v-icon>
                </template>
                <v-list-item-title>{{ $t('RENAME') }}</v-list-item-title>
              </v-list-item>

              <!-- Clone -->
              <v-list-item
                v-if="canCreateList"
                class="rounded-lg mb-1"
                @click="$emit('clone', list)"
              >
                <template #prepend>
                  <v-icon size="18" class="mr-2">mdi-content-copy</v-icon>
                </template>
                <v-list-item-title>{{ $t('CLONE') }}</v-list-item-title>
              </v-list-item>

              <!-- Archive Tasks -->
              <v-list-item
                v-if="canArchiveList"
                class="rounded-lg mb-1"
                @click="requestConfirm(
                  $t('ARCHIVE_TASKS'),
                  $t('ARCHIVE_TASKS_CONFIRM'),
                  () => $emit('archive-tasks', list)
                )"
              >
                <template #prepend>
                  <v-icon size="18" class="mr-2">mdi-archive-check-outline</v-icon>
                </template>
                <v-list-item-title>{{ $t('ARCHIVE_TASKS') }}</v-list-item-title>
              </v-list-item>

              <!-- Clear Tasks -->
              <v-list-item
                v-if="canClearList"
                class="rounded-lg mb-1"
                @click="requestConfirm(
                  $t('CLEAR_TASKS'),
                  $t('CLEAR_TASKS_CONFIRM'),
                  () => $emit('clear', list)
                )"
              >
                <template #prepend>
                  <v-icon size="18" class="mr-2">mdi-broom</v-icon>
                </template>
                <v-list-item-title>{{ $t('CLEAR_TASKS') }}</v-list-item-title>
              </v-list-item>

              <v-divider class="my-1" />

              <!-- Archive List -->
              <v-list-item
                v-if="canArchiveList"
                class="rounded-lg"
                @click="requestConfirm(
                  $t('ARCHIVE_LIST'),
                  $t('ARCHIVE_LIST_CONFIRM'),
                  () => $emit('archive', list)
                )"
              >
                <template #prepend>
                  <v-icon size="18" class="mr-2" color="error">mdi-delete-outline</v-icon>
                </template>
                <v-list-item-title class="text-error">{{ $t('ARCHIVE_LIST') }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </div>

    <!-- Column header: rename mode -->
    <div v-else class="wp-board-col__rename-wrapper">
      <v-card class="wp-board-col__rename-field" :style="{ borderColor: list._tempColor || statusColor }">
        <!-- Color Picker Activator -->
        <v-menu offset="8">
          <template #activator="{ props: menuProps }">
            <div
              v-bind="menuProps"
              class="wp-board-col__rename-color"
              :style="{ backgroundColor: list._tempColor || statusColor }"
            ></div>
          </template>
          <v-card class="wp-board-menu-card pa-3" width="220">
            <div class="text-caption text-disabled mb-2">Column Color</div>
            <div class="wp-board-col__color-grid">
              <div
                v-for="c in availableColors"
                :key="c"
                class="wp-board-col__color-opt"
                :class="{ 'wp-board-col__color-opt--active': list._tempColor === c }"
                :style="{ backgroundColor: c }"
                @click="list._tempColor = c"
              ></div>
            </div>
          </v-card>
        </v-menu>

        <input
          v-model="list._tempName"
          v-focus
          class="wp-board-col__rename-input"
          :placeholder="$t('STATUS_NAME')"
          @keydown.enter="$emit('save-rename', list)"
          @keydown.escape="$emit('cancel-rename', list)"
        />

        <div 
          class="wp-board-col__rename-save" 
          :class="{ 'wp-board-col__rename-save--disabled': !list._tempName.trim() || list._waiting }"
          :style="{ backgroundColor: list._tempColor || statusColor }"
          @click="$emit('save-rename', list)"
        >
          <v-icon v-if="list._waiting" size="14" class="mdi-spin">mdi-loading</v-icon>
          <span v-else>Save</span>
        </div>
      </v-card>
    </div>

    <!-- Cards area -->
    <div class="wp-board-col__cards" :id="list.id">
      <VueDraggable
        v-model="localTasks"
        class="wp-board-col__task-drag"
        group="tasks"
        :animation="200"
        :disabled="!canEditTask"
        ghost-class="wp-board-col__ghost"
        @end="$emit('task-drag-end', $event, list)"
      >
        <WpBoardCard
          v-for="task in localTasks"
          :key="task.id"
          :task="task"
          :labels="labels"
          class="wp-board-col__card-item"
          @click="$emit('open-task', task)"
        />
      </VueDraggable>

      <!-- New task inline form (at the bottom of the list) -->
      <div 
        v-if="list._addingTask" 
        v-click-outside="handleTaskCreationOutside" 
        class="wp-board-col__new-task"
      >
        <div class="wp-board-col__new-task-inner">
          <div class="wp-board-col__creation-header">
            <div class="wp-board-col__creation-main">
              <v-text-field
                v-model="newTaskTitle"
                class="wp-board-col__creation-input"
                placeholder="Task name or type / for commands"
                autofocus
                variant="plain"
                density="compact"
                hide-details
                @keydown.enter.exact.prevent="onSubmit"
                @keydown.escape="$emit('cancel-new-task', list)"
              />
              <div class="wp-board-col__creation-sub">{{ list.title }}</div>
            </div>
            
            <div class="wp-board-col__creation-save" @click="onSubmit">
              <span>Save</span>
              <v-icon size="14" class="ml-1">mdi-keyboard-return</v-icon>
            </div>
          </div>

          <!-- Vertical Meta List -->
          <div class="wp-board-col__creation-vertical-meta">
            <!-- Assignee Row -->
            <v-menu :close-on-content-click="false" offset="8">
              <template #activator="{ props: menuProps }">
                <div v-bind="menuProps" class="wp-board-col__meta-row" :class="{ 'wp-board-col__meta-row--active': selectedAssignees.length }">
                  <v-icon size="18" class="mr-3">mdi-account-circle-outline</v-icon>
                  <div v-if="!selectedAssignees.length" class="text-disabled">Add assignee</div>
                  <div v-else class="d-flex align-center ga-1">
                    <div v-for="id in selectedAssignees" :key="id" class="wp-board-col__avatar-mini" :style="{ backgroundColor: getAvatarColor(id) }" :title="resolveUserName(id)">
                      {{ resolveUserInitials(id) }}
                    </div>
                  </div>
                </div>
              </template>
              <v-card width="280" class="pa-0 wp-board-menu-card">
                <div class="px-3 py-2">
                  <v-text-field 
                    v-model="assigneeSearch" 
                    placeholder="Search or enter email..." 
                    variant="plain" 
                    density="compact" 
                    hide-details 
                    prepend-inner-icon="mdi-magnify"
                    class="wp-board-menu-search-input"
                  />
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

            <!-- Date Row -->
            <v-menu :close-on-content-click="false" offset="8">
              <template #activator="{ props: menuProps }">
                <div v-bind="menuProps" class="wp-board-col__meta-row" :class="{ 'wp-board-col__meta-row--active': startAt || dueAt }">
                  <v-icon size="18" class="mr-3">mdi-calendar-blank-outline</v-icon>
                  <span>{{ (startAt || dueAt) ? (startAt ? formatDate(startAt) : '') + (startAt && dueAt ? ' - ' : '') + (dueAt ? formatDate(dueAt) : '') : 'Add dates' }}</span>
                </div>
              </template>
              <v-card width="400" class="pa-0 wp-board-date-card">
                <!-- Dual Date Header -->
                <div class="wp-board-date-header">
                  <div class="wp-board-date-field" :class="{ 'wp-board-date-field--active': dateFocus === 'start' }" @click="dateFocus = 'start'">
                    <v-icon size="20" class="mr-2">mdi-calendar-import-outline</v-icon>
                    <div class="wp-board-date-field-inner">
                      <div class="wp-board-date-label">Start date</div>
                      <div class="wp-board-date-value">{{ startAt ? formatDate(startAt) : '' }}</div>
                    </div>
                    <v-icon v-if="startAt" size="14" class="wp-board-date-clear" @click.stop="startAt = undefined">mdi-close</v-icon>
                  </div>
                  <div class="wp-board-date-field" :class="{ 'wp-board-date-field--active': dateFocus === 'due' }" @click="dateFocus = 'due'">
                    <v-icon size="20" class="mr-2">mdi-calendar-export-outline</v-icon>
                    <div class="wp-board-date-field-inner">
                      <div class="wp-board-date-label">Due date</div>
                      <div class="wp-board-date-value">{{ dueAt ? formatDate(dueAt) : '' }}</div>
                    </div>
                    <v-icon v-if="dueAt" size="14" class="wp-board-date-clear" @click.stop="dueAt = undefined">mdi-close</v-icon>
                  </div>
                </div>

                  <div class="d-flex flex-grow-1 align-stretch">
                    <!-- Sidebar Shortcuts -->
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

            <!-- Priority Row -->
            <v-menu :close-on-content-click="true" offset="8">
              <template #activator="{ props: menuProps }">
                <div v-bind="menuProps" class="wp-board-col__meta-row" :class="{ 'wp-board-col__meta-row--active': priority }">
                  <v-icon size="18" class="mr-3">mdi-flag-outline</v-icon>
                  <span>{{ priority ? priorityOptions.find(o => o.value === priority)?.label : 'Add priority' }}</span>
                </div>
              </template>
              <v-card width="260" class="pa-0 wp-board-menu-card">
                <div class="px-4 pt-3 pb-1 text-caption text-disabled" style="font-weight: 600">Priority</div>
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

            <!-- Tag Row -->
            <v-menu :close-on-content-click="false" offset="8">
              <template #activator="{ props: menuProps }">
                <div v-bind="menuProps" class="wp-board-col__meta-row" :class="{ 'wp-board-col__meta-row--active': selectedLabels.length }">
                  <v-icon size="18" class="mr-3">mdi-tag-outline</v-icon>
                  <div v-if="!selectedLabels.length" class="text-disabled">Add tag</div>
                  <div v-else class="d-flex flex-wrap ga-1">
                    <v-chip v-for="id in selectedLabels" :key="id" size="x-small" :color="labels.find(l => l.id === id)?.color" variant="flat">
                      {{ labels.find(l => l.id === id)?.title }}
                    </v-chip>
                  </div>
                </div>
              </template>
              <v-card width="280" class="pa-0 wp-board-menu-card">
                <div class="px-3 py-2">
                  <v-text-field 
                    v-model="tagSearch" 
                    placeholder="Search or add tags..." 
                    variant="plain" 
                    density="compact" 
                    hide-details 
                    class="wp-board-menu-search-input"
                  />
                </div>
                <v-divider />
                <div class="pa-3 d-flex flex-wrap ga-2">
                  <v-chip v-for="label in filteredLabels" :key="label.id" :color="label.color" size="small" class="cursor-pointer" :variant="selectedLabels.includes(label.id) ? 'elevated' : 'tonal'" @click="toggleLabel(label.id)">
                    {{ label.title }}
                  </v-chip>
                </div>
              </v-card>
            </v-menu>
          </div>
        </div>
      </div>

      <!-- Add task trigger (Moved back to bottom) -->
      <div
        v-if="!list._addingTask && canCreateTask"
        class="wp-board-col__add-task-trigger"
        @click="$emit('prepare-task', list)"
      >
        <v-icon size="20" class="mr-2" :style="{ color: statusColor }">mdi-plus</v-icon>
        <span :style="{ color: statusColor }">{{ $t('ADD_TASK') }}</span>
      </div>
    </div>
  </div>

  <AppConfirm
    v-model="confirmData.show"
    :title="confirmData.title"
    :message="confirmData.message"
    :tone="confirmData.tone"
    @confirm="executeAction"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import {
  type WorkPackageTaskViewModel,
  type WorkPackageLabelViewModel,
  WorkPackageTaskState,
} from '@asoode/shared';
import WpBoardCard from './WpBoardCard.vue';
import AppInput from '@/components/core/AppInput.vue';
import AppCalendar from '@/components/core/AppCalendar.vue';
import AppConfirm from '@/components/core/AppConfirm.vue';
import { useUserCache } from '@/composables/useUserCache';
import { useCulturedDate } from '@/composables/useCulturedDate';

// ── Props & Emits ───────────────────────────────────────────────────
const props = defineProps<{
  list: any;
  members: any[];
  canEditList: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canCreateList: boolean;
  canArchiveList: boolean;
  canClearList: boolean;
  creatingTask: boolean;
  labels: WorkPackageLabelViewModel[];
}>();

const emit = defineEmits<{
  'open-task': [task: WorkPackageTaskViewModel];
  'save-rename': [list: any];
  'cancel-rename': [list: any];
  'start-rename': [list: any];
  'clone': [list: any];
  'archive': [list: any];
  'archive-tasks': [list: any];
  'clear': [list: any];
  'toggle-menu': [list: any, val?: boolean];
  'prepare-task': [list: any];
  'create-task': [list: any, title: string, metadata: any];
  'cancel-new-task': [list: any];
  'task-drag-end': [evt: any, list: any];
  'update:tasks': [tasks: WorkPackageTaskViewModel[]];
}>();

// ── Composables ──────────────────────────────────────────────────────
const { resolveUserName, resolveUserInitials } = useUserCache();
const { formatDate } = useCulturedDate();

// ── Reactive State ───────────────────────────────────────────────────
const newTaskTitle = ref('');
const assigneeSearch = ref('');
const tagSearch = ref('');
const priority = ref<number | undefined>(undefined);
const selectedAssignees = ref<string[]>([]);
const selectedLabels = ref<string[]>([]);
const startAt = ref<Date | undefined>(undefined);
const dueAt = ref<Date | undefined>(undefined);
const dateFocus = ref<'start' | 'due'>('due');

const availableColors = [
  '#626971', '#2196f3', '#59a8ef', '#20b2aa', '#4caf50', 
  '#fbb900', '#ff9800', '#f44336', '#e91e63', '#9c27b0', '#795548', '#9e9e9e'
];

const confirmData = ref({
  show: false,
  title: '',
  message: '',
  action: null as (() => void) | null,
  tone: 'danger' as 'danger' | 'warn',
});

function requestConfirm(title: string, message: string, action: () => void, tone: 'danger' | 'warn' = 'danger') {
  confirmData.value = { show: true, title, message, action, tone };
}

function executeAction() {
  if (confirmData.value.action) {
    confirmData.value.action();
  }
  confirmData.value.show = false;
}

// ── Constants / Options ──────────────────────────────────────────────
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

// ── Computed Properties ──────────────────────────────────────────────
const localTasks = computed({
  get: () => props.list.tasks || [],
  set: (val) => emit('update:tasks', val),
});

const filteredMembers = computed(() => {
  if (!assigneeSearch.value) return props.members || [];
  const q = assigneeSearch.value.toLowerCase();
  return (props.members || []).filter(m => resolveUserName(m.recordId).toLowerCase().includes(q));
});

const filteredLabels = computed(() => {
  if (!tagSearch.value) return props.labels || [];
  const q = tagSearch.value.toLowerCase();
  return (props.labels || []).filter(l => l.title.toLowerCase().includes(q));
});

const stateColors: Record<number, string> = {
  [WorkPackageTaskState.ToDo]: '#9e9e9e',
  [WorkPackageTaskState.InProgress]: '#2196f3',
  [WorkPackageTaskState.Done]: '#4caf50',
  [WorkPackageTaskState.Blocked]: '#f44336',
};

const statusColor = computed(() => {
  return props.list._tempColor || props.list.color || '#90a4ae';
});

function hexToRgba(hex: string, opacity: number) {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity})`;
  }
  return hex;
}

const columnStyle = computed(() => ({
  backgroundColor: hexToRgba(statusColor.value, 0.05),
  '--col-color': statusColor.value,
  '--col-bg-hover': hexToRgba(statusColor.value, 0.1),
}));

// ── Utility Methods ──────────────────────────────────────────────────
function getPriorityColor(val?: number): string {
  return priorityOptions.find(o => o.value === val)?.color || 'inherit';
}

function getAvatarColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return `hsl(${hash % 360}, 60%, 50%)`;
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
    dateFocus.value = 'due'; // Auto-focus due date after setting start
  } else {
    dueAt.value = val;
  }
}

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

function handleTaskCreationOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  // If clicking an overlay (menus, date picker, etc.), do not cancel
  if (target?.closest('.v-overlay-container')) return;
  emit('cancel-new-task', props.list);
}

function onSubmit() {
  const metadata = {
    assignees: [...selectedAssignees.value],
    labels: [...selectedLabels.value],
    beginAt: startAt.value,
    dueAt: dueAt.value,
    objectiveValue: priority.value,
  };
  emit('create-task', props.list, newTaskTitle.value, metadata);
  selectedAssignees.value = [];
  selectedLabels.value = [];
  startAt.value = undefined;
  dueAt.value = undefined;
  priority.value = undefined;
  newTaskTitle.value = '';
}
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-board-col {
  width: 280px;
  min-width: 280px;
  flex-shrink: 0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  height: fit-content;
  max-height: 100%;
  align-self: flex-start;
  transition: all 0.2s;
  border-top: 4px solid var(--status-color, transparent);
  margin-right: 12px;

  &__header {
    display: flex;
    align-items: center;
    padding: 16px 16px 12px;
    position: relative;
  }

  &__status-pill {
    display: flex;
    align-items: center;
    padding: 0 8px;
    height: 24px;
    border-radius: 4px;
    color: white;
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
    margin-right: 10px;
  }

  &__status-count {
    font-size: 0.85rem;
    color: #87909e;
    font-weight: 500;
  }

  &__header-actions {
    margin-left: auto;
    color: #87909e;
    display: flex;
    align-items: center;

    .wp-board__icon-btn {
      padding: 4px;
      border-radius: 6px;
      transition: all 0.2s;
      &:hover {
        background: var(--col-bg-hover);
      }
    }
  }

  &__cards {
    padding: 0 10px;
    overflow-y: auto;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  &__task-drag {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 10px;
    margin-bottom: 8px;
  }

  &__add-task-trigger {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    margin: 4px 0 16px;
    color: #7c5e3d;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 10px;
    background: transparent;
    transition: all 0.2s;
    &:hover { background: var(--col-bg-hover); }
  }

  &__new-task {
    padding-bottom: 12px;
    width: 100%;
  }

  &__new-task-inner {
    background: white;
    border-radius: 12px;
    border: 1px solid #7b68ee;
    padding: 12px 14px;
    box-shadow: 0 4px 15px rgba(123, 104, 238, 0.1);
    transition: all 0.2s;
  }

  &__creation-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__add-status-trigger {
    border-radius: 10px;
    background: #f0f0f0;
    padding: 10px;
    cursor: pointer;
    width: fit-content;
    display: flex;
  }

  &__status-add-form {
    border-radius: 10px;
    background: #f0f0f0;
    padding: 10px;
  }

  &__creation-main {
    flex: 1;
  }

  &__rename-wrapper {
    padding: 12px 16px 8px;
  }

  &__rename-field {
    display: flex;
    align-items: center;
    background: white;
    border: 2px solid #a29bfe;
    border-radius: 8px;
    padding: 3px 6px;
    gap: 6px;
    transition: box-shadow 0.2s, border-color 0.2s;
    overflow: hidden;
    &:focus-within {
      box-shadow: 0 0 0 3px rgba(162, 155, 254, 0.15);
    }
  }

  &__rename-color {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s;
    &:hover { transform: scale(1.1); }
  }

  &__rename-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.95rem;
    font-weight: 500;
    color: #333;
    padding: 2px 0;
    background: transparent;
  }

  &__rename-save {
    color: white;
    padding: 2px 10px;
    position: relative;
    right: 3px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    flex-shrink: 0;
    &:hover { filter: brightness(0.9); }
    &--disabled {
      opacity: 0.5 !important;
      cursor: not-allowed;
    }
  }

  &__color-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }

  &__color-opt {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
    &:hover { transform: scale(1.2); }
    &--active {
      border-color: #333;
      transform: scale(1.1);
    }
  }

  &__creation-sub {
    font-size: 0.85rem;
    color: #87909e;
    margin-top: 0px;
  }

  &__creation-input {
    .v-field__input {
      padding: 0;
      min-height: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      line-height: 1.5;
    }
  }

  &__creation-save {
    background-color: #7b68ee;
    color: white;
    padding: 4px 14px;
    border-radius: 99px;
    font-weight: 500;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    margin-top: 2px;
    letter-spacing: 0.2px;
    &:hover { background-color: #6a5acd; transform: translateY(-1px); }
    &:active { transform: translateY(0); }
  }

  &__creation-vertical-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__meta-row {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    height: 34px;
    border-radius: 8px;
    cursor: pointer;
    color: #87909e;
    font-size: 0.85rem;
    transition: background-color 0.2s;
    &:hover { background-color: #f3f5f7; }
    &--active { color: #a29bfe; font-weight: 500; }
    
    .v-icon {
      color: #87909e;
    }
  }

  &__avatar-wrapper {
    position: relative;
    display: flex;
  }

  &__online-dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 8px;
    height: 8px;
    background: #4caf50;
    border: 1.5px solid white;
    border-radius: 50%;
  }

  &__avatar-mini {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: 700;
  }
}

.wp-board-menu-card {
  box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
  border-radius: 10px !important;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.08);

  .v-list-item {
    font-size: 0.8rem;
    min-height: 32px !important;
    padding: 2px 10px !important;
    
    &__prepend {
      width: 24px;
      .v-icon { font-size: 16px; }
    }
  }

  .v-list-item-title {
    font-weight: 500;
  }

  .wp-board-menu-search-input {
    :deep(.v-field__input) {
      font-size: 0.8rem;
      min-height: 24px !important;
      padding-top: 2px !important;
      padding-bottom: 2px !important;
      color: #333;
    }
    :deep(.v-field__prepend-inner) .v-icon {
      font-size: 16px;
      color: #87909e;
      margin-top: 2px;
    }
  }
}

// ── Date Card & Specific Styles ──────────────────────────────────────
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
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &--active {
    border-color: #7b68ee;
    box-shadow: 0 0 0 3px rgba(123, 104, 238, 0.1);
  }

  i { color: #87909e; }
}

.wp-board-date-field-inner {
  display: flex;
  flex-direction: column;
  margin-left: 4px;
}

.wp-board-date-label {
  font-size: 0.65rem;
  color: #87909e;
  font-weight: 600;
  text-transform: uppercase;
}

.wp-board-date-value {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  min-height: 18px;
}

.wp-board-date-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #ccc;
  &:hover { color: #999; }
}

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #f3f5f7; }
}

.wp-board-date-opt-label {
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
}

.wp-board-date-opt-side {
  font-size: 0.75rem;
  color: #87909e;
}


.wp-board-date-calendar {
  flex: 1;
  padding: 8px;
}

// ── Drag Ghost Styling ───────────────────────────────────────────────
.wp-board-col__ghost {
  background: rgba(var(--v-theme-primary), 0.05) !important;
  border: 1px dashed rgba(var(--v-theme-primary), 0.3) !important;
  border-radius: 8px !important;
  height: 80px !important;
  box-shadow: none !important;
  * { visibility: hidden !important; }
}

.sortable-drag {
  opacity: 0.95;
  transform: rotate(2deg);
  box-shadow: $shadow-4 !important;
}

body.dark-mode {
  .wp-board-col {
    &__new-task-inner { background: #2c2c2c; border-color: #3f3e5b; }
    &__creation-input .v-field__input { color: #eee; }
    &__meta-row:hover { background-color: #333; }
    &__add-task-trigger { color: #d4a76a; }
  }
}
</style>
