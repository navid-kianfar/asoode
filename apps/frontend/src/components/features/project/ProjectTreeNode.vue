<template>
  <div :class="['project-tree-node', 'level-' + level]">
    <div class="project-tree-node__row">
      <div class="project-tree-node__cell project-tree-node__cell--title">
        <button
          type="button"
          class="project-tree-node__toggle"
          :class="{ 'project-tree-node__toggle--empty': !(nodeSubProjects.length || nodeWorkPackages.length) }"
          @click="expanded = !expanded"
        >
          <i
            v-if="!expanded && (nodeSubProjects.length || nodeWorkPackages.length)"
            :class="isRtl ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right'"
          ></i>
          <i
            v-if="expanded && (nodeSubProjects.length || nodeWorkPackages.length)"
            class="mdi mdi-chevron-down"
          ></i>
        </button>

        <div class="project-tree-node__title-wrap" :style="{ '--tree-level': String(level - 1) }">
          <div class="project-tree-node__type-icon">
            <i :class="'mdi ' + (subProject ? 'mdi-file-tree-outline' : 'mdi-package-variant-closed')"></i>
          </div>
          <div class="project-tree-node__title-copy">
            <div class="project-tree-node__title">
              {{ subProject ? subProject.title : workPackage?.title }}
            </div>
            <div class="project-tree-node__actions">
              <template v-if="subProject">
                <button
                  ref="addButtonRef"
                  class="tree-icon-btn"
                  :title="$t('ADD')"
                  @click.stop="toggleAddMenu"
                >
                  <i class="mdi mdi-plus"></i>
                </button>
                <button class="tree-icon-btn" :title="$t('EDIT')" @click.stop="$emit('editSubProject', subProject.id)">
                  <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button class="tree-icon-btn tree-icon-btn--danger" :title="$t('DELETE')" @click.stop="$emit('deleteSubProject', subProject.id)">
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </template>
              <template v-if="workPackage">
                <button class="tree-icon-btn" :title="$t('EDIT')" @click.stop="$emit('editWorkPackage', workPackage.id)">
                  <i class="mdi mdi-open-in-new"></i>
                </button>
                <button class="tree-icon-btn tree-icon-btn--danger" :title="$t('DELETE')" @click.stop="$emit('deleteWorkPackage', workPackage.id)">
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="project-tree-node__cell project-tree-node__cell--description">
        {{ subProject ? subProject.description : workPackage?.description || '-' }}
      </div>

      <div class="project-tree-node__cell project-tree-node__cell--members">
        <template v-if="reportViewModel.members.length">
          <div
            v-for="member in reportViewModel.members.slice(0, 5)"
            :key="member.recordId"
            class="project-tree-node__avatar"
            :title="member.recordId"
          >
            <span>{{ getInitials(member) }}</span>
          </div>
          <div v-if="reportViewModel.members.length > 5" class="project-tree-node__avatar project-tree-node__avatar--extra">
            +{{ reportViewModel.members.length - 5 }}
          </div>
        </template>
        <span v-else class="project-tree-node__muted">-</span>
      </div>

      <div class="project-tree-node__cell project-tree-node__cell--progress">
        <div class="project-tree-node__progress">
          <div class="project-tree-node__progress-bar">
            <div class="project-tree-node__progress-fill" :style="{ width: reportViewModel.progress + '%' }"></div>
          </div>
          <span>{{ reportViewModel.progress }}%</span>
        </div>
      </div>

      <div class="project-tree-node__cell project-tree-node__cell--span">
        <template v-if="reportViewModel.from">{{ formatDate(reportViewModel.from) }}</template>
        <template v-if="reportViewModel.from && reportViewModel.to"> - </template>
        <template v-if="reportViewModel.to">{{ formatDate(reportViewModel.to) }}</template>
        <template v-if="!reportViewModel.from && !reportViewModel.to">-</template>
      </div>

      <div class="project-tree-node__cell project-tree-node__cell--time">
        {{ msToDuration(reportViewModel.timeSpent) }}
      </div>
    </div>

    <template v-if="expanded">
      <ProjectTreeNode
        v-for="sub in nodeSubProjects"
        :key="sub.id"
        :data="data"
        :permission="permission"
        :level="level + 1"
        :project="project"
        :sub-project="sub"
        :re-create="reCreate"
        @delete-sub-project="$emit('deleteSubProject', $event)"
        @edit-sub-project="$emit('editSubProject', $event)"
        @create-sub-project="$emit('createSubProject', $event)"
        @create-work-package="$emit('createWorkPackage', $event)"
        @drop-sub-project="$emit('dropSubProject', $event)"
        @drop-work-package="$emit('dropWorkPackage', $event)"
        @delete-work-package="$emit('deleteWorkPackage', $event)"
        @edit-work-package="$emit('editWorkPackage', $event)"
      />

      <ProjectTreeNode
        v-for="wp in nodeWorkPackages"
        :key="wp.id"
        :data="data"
        :permission="permission"
        :level="level + 1"
        :project="project"
        :work-package="wp"
        :re-create="reCreate"
        @drop-work-package="$emit('dropWorkPackage', $event)"
        @delete-work-package="$emit('deleteWorkPackage', $event)"
        @edit-work-package="$emit('editWorkPackage', $event)"
      />
    </template>
  </div>

  <Teleport to="body">
    <div
      v-if="showAddMenu && subProject"
      ref="menuRef"
      class="project-tree-node__menu project-tree-node__menu--floating"
      :style="menuStyle"
    >
      <button
        v-if="level < 4"
        class="project-tree-node__menu-item"
        @click="createSubProjectFromMenu"
      >
        <i class="mdi mdi-file-tree-outline"></i>
        {{ $t('NEW_SUB_PROJECT') }}
      </button>
      <button
        class="project-tree-node__menu-item"
        @click="createWorkPackageFromMenu"
      >
        <i class="mdi mdi-package-variant-closed-plus"></i>
        {{ $t('NEW_WORK_PACKAGE') }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import {
  type ProjectViewModel,
  type SubProjectViewModel,
  type WorkPackageViewModel,
  type TreeViewModel,
  type TreeReportViewModel,
  AccessType,
} from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';

const props = defineProps<{
  data: TreeViewModel;
  permission: AccessType;
  workPackage?: WorkPackageViewModel;
  project: ProjectViewModel;
  subProject?: SubProjectViewModel;
  level: number;
  reCreate: number;
}>();

const emit = defineEmits<{
  (e: 'createSubProject', id: string): void;
  (e: 'createWorkPackage', id: string): void;
  (e: 'editSubProject', id: string): void;
  (e: 'deleteSubProject', id: string): void;
  (e: 'dropSubProject', event: any): void;
  (e: 'dropWorkPackage', event: any): void;
  (e: 'editWorkPackage', id: string): void;
  (e: 'deleteWorkPackage', id: string): void;
}>();

const cultureStore = useCultureStore();
const { formatDate } = useCulturedDate();

const expanded = ref(false);
const showAddMenu = ref(false);
const addButtonRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const nodeSubProjects = ref<SubProjectViewModel[]>([]);
const nodeWorkPackages = ref<WorkPackageViewModel[]>([]);
const menuPosition = ref({ top: 0, left: 0 });
const reportViewModel = ref<TreeReportViewModel>({
  done: 0,
  timeSpent: 0,
  total: 0,
  progress: 0,
  from: undefined,
  to: undefined,
  members: [],
  doneWorkPackages: 0,
  workPackages: 0,
  workPackageProgress: 0,
});

const isRtl = computed(() => cultureStore.current.rtl);
const menuStyle = computed(() => ({
  top: `${menuPosition.value.top}px`,
  left: `${menuPosition.value.left}px`,
}));

watch(() => props.reCreate, () => {
  createTree();
});

watch(showAddMenu, async (value) => {
  if (!value) return;
  await nextTick();
  updateMenuPosition();
});

onMounted(() => {
  createTree();
  expanded.value = props.level < 2;
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('resize', updateMenuPosition);
  window.addEventListener('scroll', updateMenuPosition, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('resize', updateMenuPosition);
  window.removeEventListener('scroll', updateMenuPosition, true);
});

function createTree() {
  reportViewModel.value = {
    done: 0,
    timeSpent: 0,
    total: 0,
    progress: 0,
    from: undefined,
    to: undefined,
    members: [],
    doneWorkPackages: 0,
    workPackages: 0,
    workPackageProgress: 0,
  };

  if (props.workPackage) {
    nodeSubProjects.value = [];
    nodeWorkPackages.value = [];
    reportViewModel.value.doneWorkPackages = 0;
    reportViewModel.value.workPackages = 0;
    if (props.data?.tree && props.data.tree[props.workPackage.id]) {
      reportViewModel.value = { ...props.data.tree[props.workPackage.id] };
      reportViewModel.value.members = [...(props.workPackage.members || [])];
    }
  } else if (props.subProject) {
    nodeSubProjects.value = (props.project.subProjects || [])
      .filter((s) => (s.parentId || null) === props.subProject!.id)
      .sort((a, b) => a.order - b.order);
    nodeWorkPackages.value = (props.project.workPackages || [])
      .filter((w) => (w.subProjectId || null) === props.subProject!.id)
      .sort((a, b) => a.order - b.order);
    reportViewModel.value.doneWorkPackages = 0;
    reportViewModel.value.workPackages = nodeWorkPackages.value.length;

    findAllSubs(props.subProject.id).forEach((p: any) => {
      const report = props.data?.tree ? props.data.tree[p.id] : null;
      if (!report) return;
      reportViewModel.value.members = [
        ...reportViewModel.value.members,
        ...(p.members || []),
      ];
      reportViewModel.value.timeSpent += report.timeSpent;
      reportViewModel.value.done += report.done;
      reportViewModel.value.total += report.total;
      if (report.done === report.total) {
        reportViewModel.value.doneWorkPackages++;
      }
      if (report.from) {
        const fromDate = new Date(report.from as any);
        if (!reportViewModel.value.from) {
          reportViewModel.value.from = fromDate as any;
        } else if (fromDate.getTime() < new Date(reportViewModel.value.from as any).getTime()) {
          reportViewModel.value.from = fromDate as any;
        }
      }
      if (report.to) {
        const toDate = new Date(report.to as any);
        if (!reportViewModel.value.to) {
          reportViewModel.value.to = toDate as any;
        } else if (toDate.getTime() > new Date(reportViewModel.value.to as any).getTime()) {
          reportViewModel.value.to = toDate as any;
        }
      }
    });
  }

  const duplicates: Record<string, boolean> = {};
  reportViewModel.value.progress = reportViewModel.value.total
    ? Math.floor((reportViewModel.value.done * 100) / reportViewModel.value.total)
    : 0;
  reportViewModel.value.members = (reportViewModel.value.members || []).filter((m: any) => {
    if (duplicates[m.recordId]) return false;
    duplicates[m.recordId] = true;
    return true;
  });
}

function findAllSubs(id: string): WorkPackageViewModel[] {
  const subs = (props.project.subProjects || []).filter((s) => s.parentId === id);
  const packages = (props.project.workPackages || []).filter((w) => w.subProjectId === id);
  const include = subs.map((s) => findAllSubs(s.id));
  return [...packages, ...include.flat()];
}

function getInitials(member: any): string {
  if (member.member?.fullName) {
    return member.member.fullName.charAt(0).toUpperCase();
  }
  return '?';
}

function msToDuration(ms: number): string {
  if (!ms) return '0h';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function toggleAddMenu() {
  showAddMenu.value = !showAddMenu.value;
}

function createSubProjectFromMenu() {
  if (!props.subProject) return;
  showAddMenu.value = false;
  emit('createSubProject', props.subProject.id);
}

function createWorkPackageFromMenu() {
  if (!props.subProject) return;
  showAddMenu.value = false;
  emit('createWorkPackage', props.subProject.id);
}

function updateMenuPosition() {
  if (!showAddMenu.value || !addButtonRef.value) return;

  const rect = addButtonRef.value.getBoundingClientRect();
  const menuWidth = menuRef.value?.offsetWidth || 240;
  const menuHeight = menuRef.value?.offsetHeight || 120;
  const gap = 8;

  let left = rect.left;
  let top = rect.bottom + gap;

  if (left + menuWidth > window.innerWidth - 16) {
    left = window.innerWidth - menuWidth - 16;
  }
  if (left < 16) left = 16;

  if (top + menuHeight > window.innerHeight - 16) {
    top = Math.max(16, rect.top - menuHeight - gap);
  }

  menuPosition.value = { top, left };
}

function handleDocumentClick(event: MouseEvent) {
  if (!showAddMenu.value) return;
  const target = event.target as Node | null;
  if (addButtonRef.value?.contains(target) || menuRef.value?.contains(target)) return;
  showAddMenu.value = false;
}
</script>

<style scoped lang="scss">
.project-tree-node {
  --tree-grid-columns: minmax(320px, 3.6fr) minmax(190px, 1.35fr) minmax(110px, 0.8fr) minmax(160px, 0.95fr) minmax(120px, 0.75fr) minmax(72px, 0.42fr);

  border-bottom: 1px solid #eef2f7;

  &:last-child {
    border-bottom: none;
  }

  &__row {
    display: grid;
    grid-template-columns: var(--tree-grid-columns);
    align-items: stretch;
    min-height: 64px;
    transition: background-color 0.18s ease;
    position: relative;
    border-bottom: 1px solid #ededed;

    &:hover {
      background: #fafcff;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 8px auto 8px 6px;
      width: 2px;
      border-radius: 999px;
      background: transparent;
      transition: background-color 0.18s ease;
    }

    &:hover::before {
      background: #c7d2fe;
    }
  }

  &__cell {
    padding: 10px 8px;
    display: flex;
    align-items: center;
    min-width: 0;
    color: #334155;
    font-size: 0.8rem;

    &--title {
      padding-left: 8px;
      position: relative;
    }

    &--description,
    &--span,
    &--time {
      color: #64748b;
      line-height: 1.4;
      font-size: 0.76rem;
    }

    &--description {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }

    &--members {
      gap: 6px;
      flex-wrap: nowrap;
    }

    &--progress,
    &--time {
      justify-content: flex-end;
    }

    &--span {
      font-size: 0.74rem;
    }
  }

  &__toggle {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    margin-right: 4px;

    &:hover {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    &--empty {
      opacity: 0;
      pointer-events: none;
    }
  }

  &__title-wrap {
    position: relative;
    min-width: 0;
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    column-gap: 10px;
    padding-left: calc(var(--tree-level) * 16px);
  }

  &__type-icon {
    width: 48px;
    height: 48px;
    border-radius: 9px;
    background: #f3f5ff;
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.5rem;
  }

  &__title-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__title {
    color: #0f172a;
    font-weight: 600;
    font-size: 0.85rem;
    line-height: 1.28;
    word-break: break-word;
    white-space: normal;
  }

  &__actions {
    display: flex;
    gap: 5px;
    margin-left: 0;
    position: relative;
    flex-shrink: 0;
    flex-wrap: wrap;
    opacity: 0.72;
    transition: opacity 0.18s ease;
  }

  &__row:hover &__actions {
    opacity: 1;
  }

  &__menu {
    position: fixed;
    top: 0;
    left: 0;
    min-width: 240px;
    width: max-content;
    max-width: min(320px, calc(100vw - 48px));
    border-radius: 14px;
    background: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.1);
    padding: 6px;
    z-index: 1200;
    overflow: hidden;
    pointer-events: auto;
  }

  &__menu--floating {
    transform: translate3d(0, 0, 0);
  }

  &__menu-item {
    width: 100%;
    border: none;
    background: transparent;
    padding: 10px 12px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #334155;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      background: #f8fafc;
    }
  }

  &__avatar {
    width: 22px;
    height: 22px;
    border-radius: 7px;
    background: #e2e8f0;
    color: #334155;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.68rem;
    font-weight: 700;
    margin-left: -6px;

    &:first-child {
      margin-left: 0;
    }

    &--extra {
      background: #f1f5f9;
      color: #64748b;
    }
  }

  &__progress {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.75rem;
  }

  &__progress-bar {
    flex: 1;
    height: 4px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4f46e5, #818cf8);
    border-radius: 999px;
    transition: width 0.25s ease;
  }

  &__muted {
    color: #94a3b8;
  }
}

.tree-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.74rem;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  &--danger {
    color: #b91c1c;
    background: #fff7f7;
    border-color: #fecaca;
  }
}

</style>
