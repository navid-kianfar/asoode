<template>
  <div class="kartabl">
    <div v-if="!projects.length" class="kartabl__empty">
      <i class="mdi mdi-clipboard-text-outline kartabl__empty-icon"></i>
      <h3>{{ $t('KARTABL_EMPTY') }}</h3>
      <p>{{ $t('KARTABL_EMPTY_NOTE') }}</p>
    </div>

    <template v-else>
      <div class="kartabl__toolbar">
        <AppSelect
          :model-value="selectedPkgId"
          :items="projects"
          :placeholder="$t('CHOOSE_WORK_PACKAGE')"
          @update:model-value="switchProject($event)"
        />
      </div>
      <div class="kartabl__lists">
        <WorkPackageList
          v-if="pkg"
          :workPackage="pkg"
          :embed="true"
          :project="project || undefined"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import type {
  KartablViewModel,
  WorkPackageTaskViewModel,
  WorkPackageListViewModel,
  ProjectViewModel,
} from '@asoode/shared';
import WorkPackageList from '@/components/features/work-package/WorkPackageList.vue';

interface DropdownItem {
  text: string;
  value: string;
  payload: { pkg: any; project: ProjectViewModel };
}

const props = defineProps<{
  beginDate?: Date;
  endDate?: Date;
  model: KartablViewModel;
}>();

const projectStore = useProjectStore();

const projects = ref<DropdownItem[]>([]);
const selectedPkgId = ref<string>('');
const pkg = ref<any>(null);
const project = ref<ProjectViewModel | null>(null);

function switchProject(selected: string) {
  const duplicates: Record<string, boolean> = {};
  const item = projects.value.find((p) => p.value === selected);
  if (!item) return;

  selectedPkgId.value = selected;
  const payload = item.payload;
  const filteredTasks = props.model.tasks.filter((t) => t.packageId === selected);

  project.value = payload.project;
  pkg.value = { ...payload.pkg, lists: [] as WorkPackageListViewModel[] };

  pkg.value.lists = filteredTasks
    .filter((f) => {
      if (duplicates[f.listId]) return false;
      duplicates[f.listId] = true;
      return true;
    })
    .map((t) => ({
      id: t.listId,
      tasks: [] as WorkPackageTaskViewModel[],
      title: t.listName,
      packageId: t.packageId,
    }));

  pkg.value.lists.forEach((l: any) => {
    l.tasks = filteredTasks.filter((t) => t.listId === l.id);
  });
}

function init() {
  const ddItems: DropdownItem[] = [];
  (props.model.tasks || []).forEach((t) => {
    const proj = projectStore.projects.find((p) => p.id === t.projectId);
    if (!proj) return;
    const found = (proj as any).workPackages?.find((w: any) => w.id === t.packageId);
    if (!found) return;
    const pkgData = { ...found, list: [] };
    if (ddItems.findIndex((i) => i.value === pkgData.id) !== -1) return;
    ddItems.push({
      text: `${proj.title} - ${pkgData.title}`,
      value: pkgData.id,
      payload: { pkg: pkgData, project: proj },
    });
  });
  projects.value = ddItems;
  if (ddItems.length) {
    switchProject(ddItems[0].value);
  }
}

watch(
  () => props.model,
  () => init(),
  { deep: true },
);

onMounted(() => {
  init();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.kartabl {
  display: flex;
  flex-direction: column;
}

// ── Empty state ─────────────────────────────────────────────────────
.kartabl__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: $surface;
  border-radius: 12px;
  border: 1px solid $divider;

  h3 {
    font-size: 0.9rem;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 4px;
  }

  p {
    font-size: 0.8rem;
    color: $text-secondary;
    margin: 0;
  }

  body.dark-mode & {
    background: $dark-card;
    border-color: $dark-border;

    h3 { color: $dark-text-light; }
    p { color: $dark-text-muted; }
  }
}

.kartabl__empty-icon {
  font-size: 2.4rem;
  color: $text-disabled;
  margin-bottom: 12px;

  body.dark-mode & {
    color: $dark-text-muted;
  }
}

// ── Toolbar ─────────────────────────────────────────────────────────
.kartabl__toolbar {
  display: flex;
  padding-bottom: 12px;
  max-width: 360px;
}

// ── Lists ───────────────────────────────────────────────────────────
.kartabl__lists {
  flex: 1;
  min-width: 0;
}
</style>
