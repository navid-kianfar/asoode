<template>
  <v-card class="pa-6" max-width="720" style="margin: 0 auto">
    <!-- Stepper header -->
    <div class="d-flex align-center mb-6">
      <div
        v-for="(s, idx) in steps"
        :key="s.key"
        class="d-flex align-center"
        :class="{ 'flex-grow-1': idx < steps.length - 1 }"
      >
        <div
          class="wizard-step-indicator d-flex align-center justify-center"
          :class="{
            'wizard-step--active': step === idx + 1,
            'wizard-step--done': step > idx + 1,
          }"
        >
          <v-icon v-if="step > idx + 1" size="18" color="white">mdi-check</v-icon>
          <span v-else class="text-body-2">{{ idx + 1 }}</span>
        </div>
        <span
          class="text-body-2 ml-2"
          :class="step >= idx + 1 ? 'font-weight-medium' : 'text-medium-emphasis'"
        >
          {{ $t(s.label) }}
        </span>
        <v-divider v-if="idx < steps.length - 1" class="mx-3" />
      </div>
    </div>

    <!-- Step 1: Project type -->
    <template v-if="step === 1">
      <h3 class="text-h6 mb-4">{{ $t('SELECT_PROJECT_TYPE') }}</h3>
      <div class="d-flex flex-wrap ga-4 mb-6">
        <v-card
          v-for="opt in projectTypes"
          :key="opt.value"
          variant="outlined"
          class="wizard-type-card pa-4 flex-grow-1 cursor-pointer text-center"
          :class="{ 'wizard-type-card--selected': selectedType === opt.value }"
          @click="selectedType = opt.value"
        >
          <v-icon size="40" :color="selectedType === opt.value ? 'primary' : undefined">{{ opt.icon }}</v-icon>
          <div class="text-body-1 font-weight-medium mt-3">{{ $t(opt.label) }}</div>
          <div class="text-caption text-medium-emphasis mt-1">{{ $t(opt.description) }}</div>
        </v-card>
      </div>
      <div class="d-flex justify-end">
        <v-btn color="primary" :disabled="!selectedType" @click="step = 2">
          {{ $t('NEXT') }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </div>
    </template>

    <!-- Step 2: Template selection (for complex projects) -->
    <template v-if="step === 2">
      <h3 class="text-h6 mb-4">{{ $t('SELECT_TEMPLATE') }}</h3>

      <AppWaiting v-if="loadingTemplates" />

      <template v-else>
        <!-- Blank template option -->
        <v-card
          variant="outlined"
          class="wizard-template-card pa-3 mb-3 cursor-pointer d-flex align-center"
          :class="{ 'wizard-template-card--selected': !selectedTemplate }"
          @click="selectedTemplate = null"
        >
          <v-icon size="24" class="mr-3" :color="!selectedTemplate ? 'primary' : undefined">
            mdi-file-outline
          </v-icon>
          <div class="flex-grow-1">
            <div class="text-body-2 font-weight-medium">{{ $t('BLANK_PROJECT') }}</div>
            <div class="text-caption text-medium-emphasis">{{ $t('BLANK_PROJECT_HINT') }}</div>
          </div>
          <v-icon v-if="!selectedTemplate" color="primary">mdi-check-circle</v-icon>
        </v-card>

        <!-- Available templates -->
        <v-card
          v-for="tpl in templates"
          :key="tpl.id"
          variant="outlined"
          class="wizard-template-card pa-3 mb-3 cursor-pointer d-flex align-center"
          :class="{ 'wizard-template-card--selected': selectedTemplate?.id === tpl.id }"
          @click="selectedTemplate = tpl"
        >
          <v-avatar v-if="tpl.image" size="40" rounded class="mr-3">
            <v-img :src="tpl.image" />
          </v-avatar>
          <v-icon v-else size="24" class="mr-3" :color="selectedTemplate?.id === tpl.id ? 'primary' : undefined">
            {{ tpl.icon || 'mdi-view-dashboard-outline' }}
          </v-icon>
          <div class="flex-grow-1">
            <div class="text-body-2 font-weight-medium">{{ tpl.title }}</div>
            <div v-if="tpl.description" class="text-caption text-medium-emphasis">{{ tpl.description }}</div>
            <div class="d-flex ga-2 mt-1">
              <v-chip v-if="tpl.workPackages?.length" size="x-small" variant="tonal">
                {{ tpl.workPackages.length }} {{ $t('WORK_PACKAGES') }}
              </v-chip>
              <v-chip v-if="tpl.seasons?.length" size="x-small" variant="tonal">
                {{ tpl.seasons.length }} {{ $t('SEASONS') }}
              </v-chip>
              <v-chip v-if="tpl.subProjects?.length" size="x-small" variant="tonal">
                {{ tpl.subProjects.length }} {{ $t('SUB_PROJECTS') }}
              </v-chip>
            </div>
          </div>
          <v-icon v-if="selectedTemplate?.id === tpl.id" color="primary">mdi-check-circle</v-icon>
        </v-card>

        <div v-if="!templates.length" class="text-center text-medium-emphasis text-body-2 pa-4">
          {{ $t('NO_TEMPLATES_AVAILABLE') }}
        </div>
      </template>

      <div class="d-flex justify-space-between mt-4">
        <v-btn variant="text" @click="step = 1">
          <v-icon start>mdi-arrow-left</v-icon>{{ $t('BACK') }}
        </v-btn>
        <v-btn color="primary" @click="step = 3">
          {{ $t('NEXT') }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </div>
    </template>

    <!-- Step 3: Project details -->
    <template v-if="step === 3">
      <h3 class="text-h6 mb-4">{{ $t('PROJECT_DETAILS') }}</h3>
      <v-text-field
        v-model="title"
        :label="$t('TITLE')"
        density="compact"
        autofocus
        :disabled="creating"
        :error-messages="titleError ? [$t(titleError)] : []"
        class="mb-3"
      />
      <v-textarea
        v-model="description"
        :label="$t('DESCRIPTION')"
        density="compact"
        rows="3"
        :disabled="creating"
        class="mb-3"
      />

      <!-- Group selector (optional) -->
      <v-select
        v-if="groups.length"
        v-model="selectedGroupId"
        :items="groupItems"
        item-title="text"
        item-value="value"
        :label="$t('GROUP')"
        density="compact"
        clearable
        :disabled="creating"
        class="mb-3"
      />

      <!-- Summary -->
      <v-card variant="tonal" class="pa-3 mb-4">
        <div class="text-caption text-medium-emphasis mb-1">{{ $t('SUMMARY') }}</div>
        <div class="d-flex ga-3 flex-wrap">
          <v-chip size="small" variant="outlined">
            <v-icon start size="16">{{ selectedType === 'complex' ? 'mdi-briefcase' : 'mdi-briefcase-outline' }}</v-icon>
            {{ selectedType === 'complex' ? $t('COMPLEX_PROJECT') : $t('SIMPLE_PROJECT') }}
          </v-chip>
          <v-chip v-if="selectedTemplate" size="small" variant="outlined">
            <v-icon start size="16">mdi-file-document-outline</v-icon>
            {{ selectedTemplate.title }}
          </v-chip>
          <v-chip v-else size="small" variant="outlined">
            <v-icon start size="16">mdi-file-outline</v-icon>
            {{ $t('BLANK_PROJECT') }}
          </v-chip>
        </div>
      </v-card>

      <div class="d-flex justify-space-between">
        <v-btn variant="text" :disabled="creating" @click="step = 2">
          <v-icon start>mdi-arrow-left</v-icon>{{ $t('BACK') }}
        </v-btn>
        <v-btn color="primary" :loading="creating" :disabled="!title.trim()" @click="onCreate">
          <v-icon start>mdi-check</v-icon>{{ $t('CREATE_PROJECT') }}
        </v-btn>
      </div>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  type ProjectTemplateViewModel, type ProjectViewModel,
  OperationResultStatus,
} from '@asoode/shared';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import { useRouter } from 'vue-router';
import { useProjectNavigation } from '@/composables/useProjectNavigation';
import AppWaiting from '@/components/core/AppWaiting.vue';

const emit = defineEmits<{ created: [project: ProjectViewModel] }>();

const projectStore = useProjectStore();
const groupStore = useGroupStore();
const router = useRouter();
const { navigateToProject } = useProjectNavigation();

const step = ref(1);
const selectedType = ref<'simple' | 'complex' | ''>('');
const selectedTemplate = ref<ProjectTemplateViewModel | null>(null);
const title = ref('');
const description = ref('');
const selectedGroupId = ref<string | null>(null);
const titleError = ref('');
const creating = ref(false);
const loadingTemplates = ref(false);

const steps = [
  { key: 'type', label: 'PROJECT_TYPE' },
  { key: 'template', label: 'TEMPLATE' },
  { key: 'details', label: 'DETAILS' },
];

const projectTypes = [
  {
    value: 'simple' as const,
    label: 'SIMPLE_PROJECT',
    description: 'SIMPLE_PROJECT_DESC',
    icon: 'mdi-briefcase-outline',
  },
  {
    value: 'complex' as const,
    label: 'COMPLEX_PROJECT',
    description: 'COMPLEX_PROJECT_DESC',
    icon: 'mdi-briefcase',
  },
];

const templates = computed(() => projectStore.templates || []);
const groups = computed(() => groupStore.groups || []);

const groupItems = computed(() =>
  groups.value.map((g) => ({ text: g.title, value: g.id })),
);

async function loadTemplates() {
  if (templates.value.length) return;
  loadingTemplates.value = true;
  // Templates are loaded into projectStore.templates
  // The store may populate them on load or we rely on existing data
  loadingTemplates.value = false;
}

async function onCreate() {
  titleError.value = '';
  if (!title.value.trim()) {
    titleError.value = 'REQUIRED';
    return;
  }

  creating.value = true;
  const result = await projectStore.create({
    title: title.value,
    description: description.value,
    complex: selectedType.value === 'complex',
    groupId: selectedGroupId.value || undefined,
    templateId: selectedTemplate.value?.id,
  });

  if (result.status === OperationResultStatus.Success && result.data) {
    emit('created', result.data);
    navigateToProject(result.data);
  }
  creating.value = false;
}

onMounted(() => {
  loadTemplates();
});
</script>

<style scoped lang="scss">
.wizard-step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  flex-shrink: 0;
  transition: all 0.2s ease;

  &.wizard-step--active {
    background-color: rgb(var(--v-theme-primary));
    color: white;
  }

  &.wizard-step--done {
    background-color: rgb(var(--v-theme-success));
  }
}

.wizard-type-card {
  min-width: 200px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &--selected {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
  }
}

.wizard-template-card {
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.02);
  }

  &--selected {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: rgba(var(--v-theme-primary), 0.04);
  }
}
</style>
