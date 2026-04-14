<template>
  <AppModal
    v-model="dialogModel"
    :title="$t('CREATE_GROUP')"
    :width="600"
    :persistent="true"
    :loading="creating"
    @close="onClose"
  >
    <!-- Stepper indicators -->
    <div class="d-flex align-center justify-center mb-6">
      <div
        v-for="(s, index) in steps"
        :key="index"
        class="d-flex align-center"
      >
        <div
          class="wizard-step d-flex align-center justify-center rounded-circle"
          :class="{
            'wizard-step--active': step === index,
            'wizard-step--completed': step > index,
          }"
        >
          <v-icon v-if="step > index" size="18" color="white">mdi-check</v-icon>
          <span v-else class="text-caption font-weight-bold">{{ index + 1 }}</span>
        </div>
        <div v-if="index < steps.length - 1" class="wizard-line" :class="{ 'wizard-line--completed': step > index }" />
      </div>
    </div>

    <!-- Step 1: Group type -->
    <div v-if="step === 0">
      <h4 class="text-subtitle-1 mb-4">{{ $t('SELECT_GROUP_TYPE') }}</h4>
      <v-row dense>
        <v-col v-for="gType in groupTypes" :key="gType.value" cols="6" md="4">
          <v-card
            class="pa-3 text-center cursor-pointer"
            :variant="form.type === gType.value ? 'tonal' : 'outlined'"
            :color="form.type === gType.value ? 'primary' : undefined"
            @click="form.type = gType.value"
          >
            <v-icon size="32" class="mb-2" :color="form.type === gType.value ? 'primary' : 'grey'">
              {{ gType.icon }}
            </v-icon>
            <div class="text-body-2 font-weight-medium">{{ $t(gType.label) }}</div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Step 2: Group details -->
    <div v-if="step === 1">
      <h4 class="text-subtitle-1 mb-4">{{ $t('GROUP_DETAILS') }}</h4>
      <AppForm :form="detailsForm" :waiting="creating" />
    </div>

    <!-- Step 3: Parent group (optional) -->
    <div v-if="step === 2">
      <h4 class="text-subtitle-1 mb-4">{{ $t('PARENT_GROUP') }}</h4>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ $t('PARENT_GROUP_DESCRIPTION') }}</p>
      <v-list v-if="availableParents.length" density="compact" class="mb-4">
        <v-list-item
          v-for="parent in availableParents"
          :key="parent.id"
          :class="{ 'bg-primary-lighten-5': form.parentId === parent.id }"
          @click="form.parentId = form.parentId === parent.id ? undefined : parent.id"
        >
          <template #prepend>
            <v-avatar size="32" color="primary" class="mr-3">
              <v-img v-if="parent.avatar" :src="parent.avatar" />
              <span v-else class="text-white text-caption">{{ parent.title.charAt(0) }}</span>
            </v-avatar>
          </template>
          <v-list-item-title>{{ parent.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ groupTypeLabel(parent.type) }}</v-list-item-subtitle>
          <template #append>
            <v-icon v-if="form.parentId === parent.id" color="primary">mdi-check-circle</v-icon>
          </template>
        </v-list-item>
      </v-list>
      <v-alert v-else type="info" variant="tonal" density="compact">
        {{ $t('NO_PARENT_GROUPS_AVAILABLE') }}
      </v-alert>
      <v-btn
        v-if="form.parentId"
        variant="text"
        size="small"
        color="primary"
        @click="form.parentId = undefined"
      >
        {{ $t('CLEAR_SELECTION') }}
      </v-btn>
    </div>

    <!-- Step 4: Review -->
    <div v-if="step === 3">
      <h4 class="text-subtitle-1 mb-4">{{ $t('REVIEW') }}</h4>
      <v-table density="compact">
        <tbody>
          <tr>
            <td class="font-weight-medium">{{ $t('TYPE') }}</td>
            <td>{{ $t(selectedTypeLabel) }}</td>
          </tr>
          <tr>
            <td class="font-weight-medium">{{ $t('TITLE') }}</td>
            <td>{{ form.title }}</td>
          </tr>
          <tr>
            <td class="font-weight-medium">{{ $t('DESCRIPTION') }}</td>
            <td>{{ form.description || '-' }}</td>
          </tr>
          <tr>
            <td class="font-weight-medium">{{ $t('PARENT_GROUP') }}</td>
            <td>{{ parentGroupTitle || '-' }}</td>
          </tr>
        </tbody>
      </v-table>

      <v-alert v-if="createError" type="error" variant="tonal" class="mt-4" closable @click:close="createError = ''">
        {{ $t(createError) }}
      </v-alert>
    </div>

    <!-- Navigation buttons -->
    <template #footer>
      <v-btn v-if="step > 0" variant="text" @click="step--">
        <v-icon start>mdi-arrow-left</v-icon>
        {{ $t('BACK') }}
      </v-btn>
      <v-spacer />
      <v-btn v-if="step < steps.length - 1" color="primary" :disabled="!canProceed" @click="onNext">
        {{ $t('NEXT') }}
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn v-else color="primary" :loading="creating" :disabled="!canProceed" @click="onCreate" elevation="2">
        <v-icon start>mdi-check</v-icon>
        {{ $t('CREATE') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupStore } from '@/stores/group.store';
import { useForm } from '@/composables/useForm';
import {
  GroupType,
  OperationResultStatus,
  type CreateGroupDto,
} from '@asoode/shared';
import AppForm from '@/components/core/AppForm.vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; created: [id: string] }>();

const router = useRouter();
const groupStore = useGroupStore();
const { createInput, prepare, setModel } = useForm();

const step = ref(0);
const creating = ref(false);
const createError = ref('');

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const steps = ['TYPE', 'DETAILS', 'PARENT', 'REVIEW'];

const form = reactive<{
  type: GroupType;
  title: string;
  description: string;
  parentId?: string;
}>({
  type: GroupType.Team,
  title: '',
  description: '',
  parentId: undefined,
});

const detailsForm = reactive([
  createInput('title', 'TITLE', { required: true, maxLength: 100 }),
  createInput('description', 'DESCRIPTION', { maxLength: 500 }),
]);

const groupTypes = [
  { value: GroupType.Holding, label: 'HOLDING', icon: 'mdi-domain' },
  { value: GroupType.Organization, label: 'ORGANIZATION', icon: 'mdi-office-building' },
  { value: GroupType.Company, label: 'COMPANY', icon: 'mdi-briefcase-outline' },
  { value: GroupType.Committee, label: 'COMMITTEE', icon: 'mdi-account-group' },
  { value: GroupType.Branch, label: 'BRANCH', icon: 'mdi-source-branch' },
  { value: GroupType.Office, label: 'OFFICE', icon: 'mdi-office-building-marker' },
  { value: GroupType.Department, label: 'DEPARTMENT', icon: 'mdi-sitemap-outline' },
  { value: GroupType.Team, label: 'TEAM', icon: 'mdi-account-multiple' },
  { value: GroupType.Unit, label: 'UNIT', icon: 'mdi-cube-outline' },
  { value: GroupType.Quad, label: 'QUAD', icon: 'mdi-view-grid-outline' },
  { value: GroupType.Sbu, label: 'SBU', icon: 'mdi-chart-tree' },
  { value: GroupType.Individual, label: 'INDIVIDUAL', icon: 'mdi-account' },
];

const availableParents = computed(() => groupStore.groups);

const selectedTypeLabel = computed(() => {
  const found = groupTypes.find((t) => t.value === form.type);
  return found?.label || 'TEAM';
});

const parentGroupTitle = computed(() => {
  if (!form.parentId) return '';
  const parent = groupStore.groups.find((g) => g.id === form.parentId);
  return parent?.title || '';
});

const canProceed = computed(() => {
  switch (step.value) {
    case 0:
      return form.type !== undefined;
    case 1:
      return !!form.title.trim();
    case 2:
      return true; // Parent is optional
    case 3:
      return !!form.title.trim();
    default:
      return false;
  }
});

function groupTypeLabel(type: GroupType): string {
  const found = groupTypes.find((t) => t.value === type);
  return found?.label || 'GROUP';
}

function syncDetailsForm() {
  const titleField = detailsForm.find((f) => f.field === 'title');
  form.title = (titleField?.value as string) || '';
  const descField = detailsForm.find((f) => f.field === 'description');
  form.description = (descField?.value as string) || '';
}

function onNext() {
  if (step.value === 1) {
    syncDetailsForm();
  }
  step.value++;
}

async function onCreate() {
  syncDetailsForm();

  if (!form.title.trim()) {
    createError.value = 'TITLE_REQUIRED';
    return;
  }

  creating.value = true;
  createError.value = '';

  const dto: CreateGroupDto = {
    title: form.title,
    type: form.type,
    description: form.description || undefined,
    parentId: form.parentId,
  };

  const result = await groupStore.create(dto);
  if (result.status === OperationResultStatus.Success) {
    dialogModel.value = false;
    emit('created', result.data.id);
    resetWizard();
    router.push(`/group/${result.data.id}`);
  } else if (result.status === OperationResultStatus.OverCapacity) {
    createError.value = 'OVER_CAPACITY';
  } else {
    createError.value = 'CREATE_FAILED';
  }
  creating.value = false;
}

function resetWizard() {
  step.value = 0;
  form.type = GroupType.Team;
  form.title = '';
  form.description = '';
  form.parentId = undefined;
  createError.value = '';
  setModel(detailsForm, { title: '', description: '' });
}

function onClose() {
  dialogModel.value = false;
  resetWizard();
}
</script>

<style scoped lang="scss">
.wizard-step {
  width: 36px;
  height: 36px;
  background: rgba(var(--v-border-color), 0.2);
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.3s ease;

  &--active {
    background: rgb(var(--v-theme-primary));
    color: white;
  }

  &--completed {
    background: rgb(var(--v-theme-success));
    color: white;
  }
}

.wizard-line {
  width: 40px;
  height: 2px;
  background: rgba(var(--v-border-color), 0.2);
  margin: 0 8px;
  transition: background 0.3s ease;

  &--completed {
    background: rgb(var(--v-theme-success));
  }
}
</style>
