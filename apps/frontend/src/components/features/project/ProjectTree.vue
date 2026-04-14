<template>
  <section class="project-tree no-select">
    <div class="project-tree__header">
      <div class="project-tree__header-copy">
        <p class="project-tree__eyebrow">{{ $t('TREE_VIEW') }}</p>
        <p class="project-tree__summary">{{ $t('PROGRESS_REPORT') }}</p>
      </div>

      <div class="project-tree__toolbar">
        <span class="project-tree__chip">
          <i class="mdi mdi-package-variant-closed"></i>
          <strong>{{ project.workPackages?.length || 0 }}</strong>
          <span>{{ $t('WORK_PACKAGES') }}</span>
        </span>
        <span class="project-tree__chip">
          <i class="mdi mdi-file-tree-outline"></i>
          <strong>{{ project.subProjects?.length || 0 }}</strong>
          <span>{{ $t('SUB_PROJECTS') }}</span>
        </span>

        <div class="project-tree__menu-wrap">
          <button :disabled="waiting" class="tree-btn tree-btn--primary" @click="showMenu = !showMenu">
            <i class="mdi mdi-plus"></i>
            {{ $t('CREATE') }}
          </button>
          <div v-if="showMenu" class="project-tree__menu">
            <button class="project-tree__menu-item" @click="newSubProject(); showMenu = false">
              <i class="mdi mdi-file-tree-outline"></i>
              {{ $t('NEW_SUB_PROJECT') }}
            </button>
            <button class="project-tree__menu-item" @click="newWorkPackage(); showMenu = false">
              <i class="mdi mdi-package-variant-closed-plus"></i>
              {{ $t('NEW_WORK_PACKAGE') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="waiting" class="project-tree__loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="project-tree__table">
      <div class="project-tree__scroller">
        <div class="project-tree__columns">
          <div class="project-tree__col project-tree__col--title">{{ $t('TITLE') }}</div>
          <div class="project-tree__col">{{ $t('DESCRIPTION') }}</div>
          <div class="project-tree__col">{{ $t('MEMBERS') }}</div>
          <div class="project-tree__col">{{ $t('PROGRESS_REPORT') }}</div>
          <div class="project-tree__col">{{ $t('TIME_SPAN') }}</div>
          <div class="project-tree__col">{{ $t('TIME_SPENT') }}</div>
        </div>

        <div class="project-tree__rows">
          <ProjectTreeNode
            v-for="subProject in subProjects"
            :key="subProject.id"
            :permission="permission"
            :data="data"
            :level="1"
            :project="project"
            :sub-project="subProject"
            :re-create="reCreate"
            @drop-work-package="dropWorkPackage"
            @drop-sub-project="dropSubProject"
            @delete-sub-project="deleteSubProject"
            @edit-sub-project="editSubProject"
            @create-sub-project="newSubProject"
            @create-work-package="newWorkPackage"
            @delete-work-package="deleteWorkPackage"
            @edit-work-package="editWorkPackage"
          />

          <ProjectTreeNode
            v-for="workPackage in workPackages"
            :key="workPackage.id"
            :data="data"
            :permission="permission"
            :level="1"
            :project="project"
            :work-package="workPackage"
            :re-create="reCreate"
            @drop-work-package="dropWorkPackage"
            @delete-work-package="deleteWorkPackage"
            @edit-work-package="editWorkPackage"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  type ProjectViewModel,
  type SubProjectViewModel,
  type WorkPackageViewModel,
  type TreeViewModel,
  OperationResultStatus,
  FormElementType,
} from '@asoode/shared';
import { useProjectStore } from '@/stores/project.store';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { usePermission } from '@/composables/usePermission';
import { useModal } from '@/composables/useModal';
import { useRouter } from 'vue-router';
import ProjectTreeNode from './ProjectTreeNode.vue';

const props = defineProps<{ project: ProjectViewModel }>();

const projectStore = useProjectStore();
const wpStore = useWorkPackageStore();
const { canAdmin } = usePermission();
const modal = useModal();
const router = useRouter();

const waiting = ref(false);
const showMenu = ref(false);
const data = ref<TreeViewModel>({ tree: {} } as TreeViewModel);
const subProjects = ref<SubProjectViewModel[]>([]);
const workPackages = ref<WorkPackageViewModel[]>([]);
const reCreate = ref(0);

const permission = computed(() => projectStore.getPermission(props.project));

onMounted(() => {
  fetch(true);
});

watch(
  () => [
    (props.project.subProjects || []).map((item) => `${item.id}:${item.parentId || ''}:${item.order}:${item.title}`).join('|'),
    (props.project.workPackages || []).map((item) => `${item.id}:${item.subProjectId || ''}:${item.order}:${item.title}`).join('|'),
  ],
  async () => {
    createTree();
    reCreate.value++;
    await fetch(false);
  },
);

async function fetch(showLoading = false) {
  if (showLoading) waiting.value = true;
  const op = await projectStore.tree(props.project.id);
  if (op.status !== OperationResultStatus.Success) {
    if (showLoading) waiting.value = false;
    return;
  }
  data.value = op.data;
  if (showLoading) waiting.value = false;
  createTree();
}

function createTree(subId: string | null = null) {
  workPackages.value = (props.project.workPackages || [])
    .filter((w) => (w.subProjectId || null) === subId)
    .sort((a, b) => a.order - b.order);
  subProjects.value = (props.project.subProjects || [])
    .filter((s) => (s.parentId || null) === subId)
    .sort((a, b) => a.order - b.order);
}

function newSubProject(parentId?: string) {
  modal.prompt({
    icon: 'mdi-file-tree',
    title: 'NEW_SUB_PROJECT',
    form: [
      { field: 'title', value: '', placeholder: 'TITLE', type: FormElementType.Input, required: true },
      { field: 'description', value: '', placeholder: 'DESCRIPTION', type: FormElementType.Input, params: { textArea: true } },
    ],
    action: async (params: any) => {
      if (parentId) params.parentId = parentId;
      const op = await projectStore.createSubProject(props.project.id, params);
      if (op.status === OperationResultStatus.Success && op.data) {
        props.project.subProjects = [...(props.project.subProjects || []), op.data];
      }
    },
    actionLabel: 'CREATE',
    actionColor: 'primary',
  });
}

function newWorkPackage(parentId?: string) {
  modal.prompt({
    icon: 'mdi-package-variant',
    title: 'NEW_WORK_PACKAGE',
    form: [
      { field: 'title', value: '', placeholder: 'TITLE', type: FormElementType.Input, required: true },
    ],
    action: async (params: any) => {
      params.boardTemplate = 1;
      if (parentId) params.subProjectId = parentId;
      const op = await projectStore.createWorkPackage(props.project.id, params);
      if (op.status === OperationResultStatus.Success && op.data) {
        props.project.workPackages = [...(props.project.workPackages || []), op.data];
      }
    },
    actionLabel: 'CREATE',
    actionColor: 'primary',
  });
}

function deleteSubProject(id: string) {
  modal.confirm({
    title: 'REMOVE_SUB',
    message: 'REMOVE_SUB_CONFIRM',
    actionLabel: 'REMOVE_SUB',
    cancelLabel: 'CANCEL',
    action: async () => {
      const op = await projectStore.removeSubProject(id);
      if (op.status === OperationResultStatus.Success) {
        props.project.subProjects = (props.project.subProjects || []).filter((sub) => sub.id !== id && sub.parentId !== id);
        props.project.workPackages = (props.project.workPackages || []).filter((wp) => wp.subProjectId !== id);
      }
    },
  });
}

function deleteWorkPackage(id: string) {
  const wp = (props.project.workPackages || []).find((s) => s.id === id);
  if (!wp) return;
  modal.confirm({
    title: 'REMOVE_WORK_PACKAGE',
    heading: wp.title,
    message: 'REMOVE_WORK_PACKAGE_CONFIRM',
    actionLabel: 'REMOVE',
    cancelLabel: 'CANCEL',
    action: async () => {
      const op = await wpStore.remove(id);
      if (op.status === OperationResultStatus.Success) {
        props.project.workPackages = (props.project.workPackages || []).filter((item) => item.id !== id);
      }
    },
  });
}

function editWorkPackage(id: string) {
  router.push(`/work-package/${id}`);
}

function editSubProject(id: string) {
  const sub = (props.project.subProjects || []).find((s) => s.id === id);
  if (!sub) return;
  modal.prompt({
    icon: 'mdi-file-tree',
    title: 'EDIT_SUB_PROJECT',
    form: [
      { field: 'title', value: sub.title, placeholder: 'TITLE', type: FormElementType.Input, required: true },
      { field: 'description', value: sub.description, placeholder: 'DESCRIPTION', type: FormElementType.Input, params: { textArea: true } },
    ],
    action: async (params: any) => {
      const op = await projectStore.editSubProject(id, params);
      if (op.status === OperationResultStatus.Success) {
        Object.assign(sub, params);
      }
    },
    actionLabel: 'SAVE_CHANGES',
    actionColor: 'primary',
  });
}

function dropSubProject(event: any) {
  if (event && event.item && event.item.data) {
    projectStore.changeSubProjectOrder(event.item.data.id, {
      order: event.currentIndex + 1,
    });
    subProjects.value.forEach((sub, index) => {
      sub.order = index + 1;
    });
  }
}

function dropWorkPackage(event: any) {
  if (event && event.item && event.item.data) {
    return;
  }
}

</script>

<style scoped lang="scss">
.project-tree {
  --tree-grid-columns: minmax(320px, 3.6fr) minmax(190px, 1.35fr) minmax(110px, 0.8fr) minmax(160px, 0.95fr) minmax(120px, 0.75fr) minmax(72px, 0.42fr);

  display: flex;
  flex-direction: column;
  gap: 14px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 2px 4px 18px;
    border-bottom: 1px solid #e2e8f0;
  }

  &__header-copy {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  &__eyebrow {
    margin: 0;
    color: #64748b;
    font-size: 0.74rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__summary {
    margin: 0;
    max-width: 420px;
    color: #475569;
    line-height: 1.5;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__chip {
    min-height: 34px;
    padding: 0 11px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid #e2e8f0;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #64748b;
    white-space: nowrap;

    i {
      font-size: 0.88rem;
    }

    span {
      font-size: 0.78rem;
      font-weight: 600;
    }

    strong {
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
    }
  }

  &__menu-wrap {
    position: relative;
  }

  &__menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 250px;
    width: max-content;
    max-width: min(320px, calc(100vw - 32px));
    border-radius: 14px;
    background: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.1);
    padding: 6px;
    z-index: 20;
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
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: #f8fafc;
    }
  }

  &__loading {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    display: flex;
    justify-content: center;
    padding: 44px 0;

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  &__table {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: visible;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  }

  &__scroller {
    overflow-x: auto;
    overflow-y: visible;
    border-radius: 16px;

    &::-webkit-scrollbar {
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: #f8fafc;
      border-radius: 999px;
    }

    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 999px;
    }
  }

  &__columns {
    display: grid;
    grid-template-columns: var(--tree-grid-columns);
    gap: 0;
    padding: 10px 18px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    min-width: 972px;
  }

  &__col {
    color: #64748b;
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0 8px;

    &--title {
      padding-left: 8px;
    }
  }

  &__rows {
    display: flex;
    flex-direction: column;
    min-width: 972px;
  }
}

.tree-btn {
  min-height: 34px;
  padding: 0 11px;
  border-radius: 10px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: #fff;
    color: #0f172a;
    border-color: #d9e2ef;
    box-shadow: none;
  }
}

@media (max-width: 1120px) {
  .project-tree {
    &__header {
      flex-direction: column;
      align-items: stretch;
      padding-bottom: 16px;
    }

    &__toolbar {
      justify-content: flex-start;
    }

    &__table {
      overflow: visible;
    }

    &__columns,
    &__rows {
      min-width: 972px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
