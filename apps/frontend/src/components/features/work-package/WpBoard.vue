<template>
  <div class="wp-board" :class="{ 'wp-board--embed': embed }">
    <!-- List-level drag: reorder entire lists horizontally -->
    <VueDraggable
      v-model="boardLists"
      class="wp-board__columns"
      group="lists"
      handle=".wp-board-col__header"
      filter=".wp-board__icon-btn, .wp-board-col--add"
      :prevent-on-filter="false"
      :disabled="!canEditList"
      :animation="200"
      direction="horizontal"
      ghost-class="wp-board__ghost"
      @end="onListDragEnd"
    >
      <WpBoardColumn
        v-for="list in boardLists"
        :key="list.id"
        :list="list"
        :can-edit-list="canEditList"
        :can-create-task="canCreateTask"
        :can-edit-task="canEditTask"
        :can-create-list="canCreateList"
        :can-archive-list="canArchiveList"
        :can-clear-list="canClearList"
        :creating-task="creatingTask"
        :labels="workPackage.labels"
        :members="workPackage.members"
        @open-task="$emit('open-task', $event)"
        @start-rename="startRename"
        @save-rename="saveRename"
        @cancel-rename="cancelRename"
        @toggle-menu="toggleMenu"
        @clone="cloneList"
        @archive="archiveList"
        @archive-tasks="archiveListTasks"
        @clear="clearList"
        @prepare-task="prepareNewTask"
        @create-task="createTask"
        @cancel-new-task="cancelNewTask"
        @task-drag-end="onTaskDragEnd"
        @update:tasks="list.tasks = $event"
      />

      <div class="wp-board__col wp-board-col--add wp-board__col--add">
        <!-- Trigger: + Add Column -->
        <div
          v-if="!addingList && canCreateList"
          class="wp-board-col__add-status-trigger"
          @click="startAddList"
        >
          <v-icon size="20" class="mr-2">mdi-plus</v-icon>
          <span>Add Column</span>
        </div>

        <!-- Creation Form -->
        <v-card
          v-else-if="addingList"
          v-click-outside="cancelAddList"
          class="wp-board-col__status-add-form"
          elevation="0"
        >
          <div class="wp-board-col__rename-field mb-2" style="border-color: #a29bfe">
            <input
              v-model="newListName"
              v-focus
              class="wp-board-col__rename-input"
              placeholder="Column Name"
              :readonly="creatingList"
              @keydown.enter="confirmAddList"
              @keydown.escape="cancelAddList"
            />
            <div 
              class="wp-board-col__rename-save" 
              :class="{ 'wp-board-col__rename-save--disabled': !newListName.trim() || creatingList }"
              style="background-color: #a29bfe"
              @click="confirmAddList"
            >
              <v-icon v-if="creatingList" size="14" class="mdi-spin">mdi-loading</v-icon>
              <span v-else>Save</span>
            </div>
          </div>

          <div class="wp-board-col__color-grid px-2 pb-3">
            <div
              v-for="c in availableColors"
              :key="c"
              class="wp-board-col__color-opt"
              :class="{ 'wp-board-col__color-opt--active': newListColor === c }"
              :style="{ backgroundColor: c }"
              @click="newListColor = c"
            ></div>
          </div>
        </v-card>
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import {
  AccessType,
  SortType,
  OperationResultStatus,
  type WorkPackageViewModel,
  type WorkPackageTaskViewModel,
  type WorkPackageListViewModel,
} from '@asoode/shared';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { useTaskStore } from '@/stores/task.store';
import WpBoardColumn from './WpBoardColumn.vue';
import AppColorPicker from '@/components/core/AppColorPicker.vue';

// ── Props & emits ────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  workPackage: WorkPackageViewModel;
  embed?: boolean;
  permission?: AccessType;
}>(), {
  embed: false,
  permission: AccessType.Visitor,
});

const emit = defineEmits<{
  'open-task': [task: WorkPackageTaskViewModel];
  'refetch': [];
}>();

// ── Stores ───────────────────────────────────────────────────────────
const wpStore = useWorkPackageStore();
const taskStore = useTaskStore();

// ── Local state ──────────────────────────────────────────────────────
const newTaskTitle = ref('');
const creatingTask = ref(false);
const addingList = ref(false);
const newListName = ref('');
const newListColor = ref('#1e88e5');
const creatingList = ref(false);
const availableColors = [
  '#626971', '#2196f3', '#59a8ef', '#20b2aa', '#4caf50', 
  '#fbb900', '#ff9800', '#f44336', '#e91e63', '#9c27b0', '#795548', '#9e9e9e'
];

// ── Extended list type for UI state ──────────────────────────────────
interface BoardList extends WorkPackageListViewModel {
  _menuOpen: boolean;
  _renaming: boolean;
  _tempName: string;
  _tempColor: string;
  _waiting: boolean;
  _addingTask: boolean;
}

// ── Reactive board lists ─────────────────────────────────────────────
const boardLists = ref<BoardList[]>([]);

function applySortType<T extends Record<string, any>>(items: T[], sortType: SortType): T[] {
  if (!items) return [];
  if (sortType === SortType.Manual) {
    return items.sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0));
  }
  return items.sort((a, b) => {
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

function syncBoardLists() {
  const listsSort = props.workPackage.listsSort ?? SortType.Manual;
  const tasksSort = props.workPackage.tasksSort ?? SortType.Manual;

  const mapped: BoardList[] = (props.workPackage.lists || []).map(l => ({
    ...l,
    tasks: applySortType([...(l.tasks || [])], tasksSort),
    _renaming: false,
    _menuOpen: false,
    _tempName: l.title,
    _tempColor: l.color || '',
    _addingTask: false,
    _waiting: false,
  }));

  boardLists.value = applySortType(mapped, listsSort);
}

syncBoardLists();
watch(() => props.workPackage.lists, syncBoardLists, { deep: true });
watch(() => [props.workPackage.listsSort, props.workPackage.tasksSort], syncBoardLists);

// ── Permissions ──────────────────────────────────────────────────────
function isAdminOrHasPermission(perm: boolean): boolean {
  return (
    props.permission === AccessType.Owner ||
    props.permission === AccessType.Admin ||
    (props.permission !== AccessType.Visitor && perm)
  );
}

const canCreateTask = computed(() => isAdminOrHasPermission(props.workPackage.permissionCreateTask));
const canEditList = computed(() => isAdminOrHasPermission(props.workPackage.permissionEditList));
const canEditTask = computed(() => isAdminOrHasPermission(props.workPackage.permissionEditTask));
const canCreateList = computed(() => isAdminOrHasPermission(props.workPackage.permissionCreateList));
const canArchiveList = computed(() => isAdminOrHasPermission(props.workPackage.permissionArchiveList));
const canClearList = computed(() => isAdminOrHasPermission(props.workPackage.permissionClearList));

// ── Column menu ──────────────────────────────────────────────────────
function closeAllMenus() {
  boardLists.value.forEach(l => { l._menuOpen = false; });
}

function toggleMenu(list: BoardList, val?: boolean) {
  // Clear others if we are opening
  const targetVal = typeof val === 'boolean' ? val : !list._menuOpen;
  
  if (targetVal) {
    boardLists.value.forEach(l => {
      if (l.id !== list.id) l._menuOpen = false;
    });
  }

  list._menuOpen = targetVal;
}

// ── Rename list ──────────────────────────────────────────────────────
function startRename(list: BoardList) {
  list._tempName = list.title;
  list._tempColor = list.color || '';
  list._renaming = true;
  list._menuOpen = false;
}

function cancelRename(list: BoardList) {
  list._renaming = false;
  list._tempName = '';
}

async function saveRename(list: BoardList) {
  if (!list._tempName.trim()) return;
  list._waiting = true;
  try {
    await wpStore.editList(list.id, {
      title: list._tempName,
      color: list._tempColor,
    });
    list.title = list._tempName;
    list.color = list._tempColor;
    list._renaming = false;
  } catch (e) {
    console.error(e);
  } finally {
    list._waiting = false;
  }
}

// ── List actions ─────────────────────────────────────────────────────
async function cloneList(list: BoardList) {
  list._waiting = true;
  await wpStore.cloneList(list.id);
  list._waiting = false;
  emit('refetch');
}

async function archiveList(list: BoardList) {
  list._waiting = true;
  await wpStore.archiveList(list.id);
  list._waiting = false;
  emit('refetch');
}

async function archiveListTasks(list: BoardList) {
  list._waiting = true;
  await wpStore.archiveListTasks(list.id);
  list._waiting = false;
  emit('refetch');
}

async function clearList(list: BoardList) {
  list._waiting = true;
  await wpStore.clearListTasks(list.id);
  list._waiting = false;
  emit('refetch');
}

// ── New list ─────────────────────────────────────────────────────────
function startAddList() {
  addingList.value = true;
  newListName.value = '';
}

function cancelAddList() {
  addingList.value = false;
}

async function confirmAddList() {
  const name = newListName.value.trim();
  if (!name) return;
  creatingList.value = true;
  const op = await wpStore.createList(props.workPackage.id, {
    title: name,
    color: newListColor.value,
  });
  creatingList.value = false;
  if (op.status === OperationResultStatus.Success) {
    newListName.value = '';
    addingList.value = false;
    emit('refetch');
  }
}

// ── New task ─────────────────────────────────────────────────────────
function prepareNewTask(list: BoardList) {
  boardLists.value.forEach(l => { l._addingTask = false; });
  list._addingTask = true;
  list._menuOpen = false;
  newTaskTitle.value = '';
}

function cancelNewTask(list: BoardList) {
  list._addingTask = false;
}

async function createTask(list: BoardList, title: string, metadata?: any) {
  if (!title.trim()) return;
  creatingTask.value = true;
  const op = await taskStore.create(list.id, {
    listId: list.id,
    title,
    parentId: undefined,
  });
  
  if (op.status === OperationResultStatus.Success && metadata) {
    const taskId = op.data.id;
    
    // Apply Assignees
    if (metadata.assignees?.length) {
      await Promise.all(metadata.assignees.map((recordId: string) => 
        taskStore.addMember(taskId, { recordId, isGroup: false })
      ));
    }

    // Apply Dates
    if (metadata.dueAt) {
      await taskStore.setDate(taskId, { dueAt: metadata.dueAt });
    }

    // Apply Labels
    if (metadata.labels?.length) {
      await Promise.all(metadata.labels.map((labelId: string) => 
        taskStore.addLabel(taskId, labelId)
      ));
    }

    // Apply Priority (Objective Value)
    if (metadata.objectiveValue !== undefined) {
      await taskStore.changePriority(taskId, { objectiveValue: metadata.objectiveValue });
    }
  }

  creatingTask.value = false;
  if (op.status === OperationResultStatus.Success) {
    list._addingTask = false;
    emit('refetch');
  }
}

// ── Drag-and-drop: list reorder ──────────────────────────────────────
function onListDragEnd(evt: any) {
  const { oldIndex, newIndex } = evt;
  if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;

  const movedList = boardLists.value[newIndex];
  if (!movedList) return;

  wpStore.repositionList(movedList.id, { order: newIndex + 1 });
}

// ── Drag-and-drop: task reorder / move ───────────────────────────────
function onTaskDragEnd(evt: any, _fromList: BoardList) {
  const { oldIndex, newIndex, from, to } = evt;
  if (oldIndex == null || newIndex == null) return;

  const fromListId = from?.parentElement?.id;
  const toListId = to?.parentElement?.id;
  if (!fromListId || !toListId) return;

  const destList = boardLists.value.find(l => l.id === toListId);
  if (!destList) return;

  const task = destList.tasks[newIndex];
  if (!task) return;

  if (fromListId === toListId) {
    if (oldIndex === newIndex) return;
    taskStore.reposition(task.id, { listId: fromListId, order: newIndex + 1 });
  } else {
    task.listId = toListId;
    taskStore.reposition(task.id, { listId: toListId, order: newIndex + 1 });
  }
}
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-board {
  padding: $spacing-md;
  height: calc(100vh - 138px);

  &--embed {
    height: 100%;
  }

  // ── Columns container ──────────────────────────────────────────
  &__columns {
    display: flex;
    flex-direction: row;
    gap: 12px;
    overflow-x: auto;
    height: 100%;
    padding-bottom: $spacing-sm;

    &::-webkit-scrollbar {
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }
  }

    &--add {
      width: 280px !important;
      min-width: 280px !important;
      flex-shrink: 0;
      background: rgba(0, 0, 0, 0.02) !important;
      border-radius: 12px;
      height: fit-content;
      min-height: 100px;
      border-top: 4px solid #e0e0e0;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      
      &:hover {
        background: rgba(0, 0, 0, 0.04) !important;
      }
    }
  
  &__add-status-trigger {
    display: flex;
    align-items: center;
    padding: 16px;
    color: #4c5462;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 12px;
    background: transparent;
    transition: all 0.2s;
    
    i {
      margin-right: 8px;
    }

    &:hover { 
      color: var(--v-theme-primary);
    }
  }

  &__status-add-form {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 12px !important;
    width: 100%;
    background: #f0f0f0;
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

  &__rename-input {
    flex-grow: 1;
    border: none;
    outline: none;
    padding: 4px 8px;
    font-size: 0.85rem;
    font-weight: 500;
    background: transparent;
    color: #333;
  }

  &__rename-save {
    color: white;
    padding: 2px 10px;
    margin-right: 5px;
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
    &--add {
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      border: 1px dashed #ddd;
    }
  }
}

// ── Sortable ghost / drag styling ────────────────────────────────────
.wp-board .sortable-ghost {
  opacity: 0.1;
}

.wp-board__ghost {
  background: rgba(var(--v-theme-primary), 0.05) !important;
  border: 2px dashed rgba(var(--v-theme-primary), 0.3) !important;
  border-radius: 12px !important;
  height: auto !important;
  min-height: 200px !important;
  box-shadow: none !important;
  * { visibility: hidden !important; }
}

.wp-board .sortable-drag {
  opacity: 0.95;
  transform: rotate(2deg);
  box-shadow: $shadow-4 !important;
}

// ── Responsive ───────────────────────────────────────────────────────
@media (max-width: 768px) {
  .wp-board {
    &__columns {
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
    }

    &__col {
      scroll-snap-align: start;
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .wp-board {
    height: calc(100vh - 190px);
    padding: $spacing-sm;

    &__columns {
      gap: 10px;
    }

    &__col {
      scroll-snap-align: start;
    }
  }
}

// ── Dark mode ────────────────────────────────────────────────────────
body.dark-mode {
  .wp-board {
    &__columns {
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    &__col--add .wp-board__add-list {
      border-color: rgba(255, 255, 255, 0.1);
      color: $dark-text-secondary;

      &:hover {
        border-color: $primary-light;
        color: $primary-light;
        background: rgba($primary-light, 0.06);
      }
    }
  }
}
</style>
