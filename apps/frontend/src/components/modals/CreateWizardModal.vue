<template>
  <AppModal
    v-model="visible"
    :title="stepTitle"
    :subtitle="stepSubtitle"
    :width="680"
    :persistent="true"
    :loading="waiting"
    @close="$emit('close')"
  >
    <template #header>
      <div v-if="canGoBack" class="cw-header-back-wrap">
        <v-btn
          icon
          size="small"
          variant="tonal"
          class="mr-3"
          @click="goBack"
        >
          <v-icon size="18">mdi-arrow-left</v-icon>
        </v-btn>
      </div>
      <div class="app-modal__header-content">
        <h3 class="app-modal__title">{{ stepTitle }}</h3>
        <p v-if="stepSubtitle" class="app-modal__subtitle">{{ stepSubtitle }}</p>
      </div>
    </template>

    <!-- Step indicator -->
    <div v-if="totalSteps > 1" class="cw-steps">
      <div
        v-for="i in totalSteps"
        :key="i"
        class="cw-steps__dot"
        :class="{ active: i <= currentStep, current: i === currentStep }"
      ></div>
    </div>

    <!-- Content -->
    <div class="cw-body-inner">
      <!-- ═══ STEP: CHOOSE TYPE ═══ -->
      <div v-if="mode === 'choose'" class="cw-choose">
        <div class="cw-cards">
          <div
            v-for="opt in typeOptions"
            :key="opt.value"
            class="cw-card"
            :class="{ selected: continueAs === opt.value }"
            @click="continueAs = opt.value"
          >
            <div class="cw-card__icon" :style="{ background: opt.bg, color: opt.color }">
              <i class="mdi" :class="opt.icon"></i>
            </div>
            <div class="cw-card__text">
              <span class="cw-card__name">
                {{ opt.label }}
                <i v-if="opt.premium" class="mdi mdi-crown cw-card__premium"></i>
              </span>
              <span class="cw-card__desc">{{ opt.desc }}</span>
            </div>
            <div class="cw-card__check">
              <v-icon v-if="continueAs === opt.value" color="primary">mdi-check-circle</v-icon>
              <v-icon v-else color="grey-lighten-1">mdi-circle-outline</v-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ PROJECT: DETAILS FORM ═══ -->
      <div v-if="mode === 'projectForm'" class="cw-form">
        <AppInput
          v-model="projectTitle"
          :label="$t('PROJECT_TITLE') + ' *'"
          :placeholder="$t('PROJECT_TITLE')"
          :error-text="projectTitleError ? $t(projectTitleError) : undefined"
          dense
          autofocus
          @keydown.enter="nextStep"
        />
        <AppInput
          v-model="projectDescription"
          textArea
          :rows="3"
          :label="$t('DESCRIPTION')"
          :placeholder="$t('DESCRIPTION')"
          dense
        />
      </div>

      <!-- ═══ PROJECT: INVITE MEMBERS ═══ -->
      <div v-if="mode === 'projectInvite'" class="cw-invite">
        <p class="cw-invite__hint">{{ $t('NEW_PROJECT_MEMBERS') }}</p>
        <div class="cw-invite__input-row">
          <AppInput
            v-model="inviteEmail"
            :placeholder="$t('EMAIL_OR_PHONE')"
            dense
            @keydown.enter="addInvitee"
          />
          <v-btn
            color="primary"
            variant="tonal"
            :disabled="!inviteEmail.trim()"
            @click="addInvitee"
          >
            <v-icon start>mdi-plus</v-icon> {{ $t('ADD') }}
          </v-btn>
        </div>
        <div v-if="invitees.length" class="cw-invite__list">
          <div v-for="(inv, idx) in invitees" :key="idx" class="cw-invite__item">
            <v-icon size="18">mdi-account-outline</v-icon>
            <span class="cw-invite__email">{{ inv }}</span>
            <v-btn icon size="x-small" variant="text" color="error" @click="invitees.splice(idx, 1)">
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
        <div v-else class="cw-invite__empty">
          <v-icon size="40">mdi-account-group-outline</v-icon>
          <span>{{ $t('SKIP_OR_ADD_MEMBERS') }}</span>
        </div>
      </div>

      <!-- ═══ SIMPLE PROJECT: BOARD TEMPLATE ═══ -->
      <div v-if="mode === 'boardTemplate'" class="cw-templates">
        <div class="cw-tmpl-grid">
          <div
            v-for="tmpl in boardTemplates"
            :key="tmpl.value"
            class="cw-tmpl"
            :class="{ selected: selectedBoardTemplate === tmpl.value }"
            @click="selectedBoardTemplate = tmpl.value"
          >
            <div class="cw-tmpl__icon">
              <v-icon size="24">{{ tmpl.icon }}</v-icon>
            </div>
            <span class="cw-tmpl__name">{{ tmpl.label }}</span>
            <div class="cw-tmpl__lists">
              <span v-for="(list, i) in tmpl.lists" :key="i" class="cw-tmpl__list-chip">{{ list }}</span>
            </div>
            <v-icon v-if="selectedBoardTemplate === tmpl.value" color="primary" class="cw-tmpl__check">mdi-check-circle</v-icon>
          </div>
        </div>
      </div>

      <!-- ═══ GROUP: FORM ═══ -->
      <div v-if="mode === 'groupForm'" class="cw-form">
        <AppInput
          v-model="groupTitle"
          :label="$t('TITLE') + ' *'"
          :placeholder="$t('GROUP_TITLE')"
          :error-text="groupTitleError ? $t(groupTitleError) : undefined"
          dense
          autofocus
          @keydown.enter="nextStep"
        />
        <div class="cw-field">
          <label class="cw-field__label">{{ $t('TYPE') }}</label>
          <AppSelect v-model="groupType" :items="groupTypeItems" :disabled="waiting" compact />
        </div>
        <AppInput
          v-model="groupDescription"
          textArea
          :rows="3"
          :label="$t('DESCRIPTION')"
          :placeholder="$t('DESCRIPTION')"
          dense
        />
      </div>

      <!-- ═══ GROUP: INVITE MEMBERS ═══ -->
      <div v-if="mode === 'groupInvite'" class="cw-invite">
        <p class="cw-invite__hint">{{ $t('NEW_GROUP_MEMBERS') }}</p>
        <div class="cw-invite__input-row">
          <AppInput
            v-model="inviteEmail"
            :placeholder="$t('EMAIL_OR_PHONE')"
            dense
            @keydown.enter="addInvitee"
          />
          <v-btn
            color="primary"
            variant="tonal"
            :disabled="!inviteEmail.trim()"
            @click="addInvitee"
          >
            <v-icon start>mdi-plus</v-icon> {{ $t('ADD') }}
          </v-btn>
        </div>
        <div v-if="invitees.length" class="cw-invite__list">
          <div v-for="(inv, idx) in invitees" :key="idx" class="cw-invite__item">
            <v-icon size="18">mdi-account-outline</v-icon>
            <span class="cw-invite__email">{{ inv }}</span>
            <v-btn icon size="x-small" variant="text" color="error" @click="invitees.splice(idx, 1)">
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
        <div v-else class="cw-invite__empty">
          <v-icon size="40">mdi-account-group-outline</v-icon>
          <span>{{ $t('SKIP_OR_ADD_MEMBERS') }}</span>
        </div>
      </div>

      <!-- ═══ IMPORT ═══ -->
      <div v-if="mode === 'import'" class="cw-import">
        <div class="cw-import__sources">
          <div
            v-for="src in importSources"
            :key="src.value"
            class="cw-import__source"
            :class="{ selected: importSource === src.value, disabled: src.disabled }"
            @click="!src.disabled && (importSource = src.value)"
          >
            <v-icon :icon="src.icon" size="24" class="mb-1" />
            <span>{{ src.label }}</span>
            <span v-if="src.disabled" class="cw-import__soon">{{ $t('COMING_SOON') }}</span>
          </div>
        </div>
        <div v-if="importSource" class="cw-import__upload">
          <div class="cw-import__dropzone" @click="triggerImportFile">
            <v-icon size="32">mdi-cloud-upload-outline</v-icon>
            <span class="mt-2">{{ importFile ? importFile.name : $t('CLICK_TO_UPLOAD') }}</span>
            <span class="cw-import__filetype">{{ importSource === 'trello' ? '.json' : '.zip' }}</span>
          </div>
          <input
            ref="importFileInput"
            type="file"
            hidden
            :accept="importSource === 'trello' ? '.json' : '.zip'"
            @change="onImportFileChange"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <v-btn v-if="canSkip" variant="text" @click="skipStep">
        {{ $t('SKIP') }}
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        elevation="2"
        :disabled="!canProceed || waiting"
        :loading="waiting"
        @click="nextStep"
      >
        <template v-if="!waiting">
          {{ isLastStep ? $t('CREATE') : $t('CONTINUE') }}
          <v-icon v-if="!isLastStep" end>mdi-arrow-right</v-icon>
        </template>
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGroupStore } from '@/stores/group.store';
import { useProjectStore } from '@/stores/project.store';
import { useProjectNavigation } from '@/composables/useProjectNavigation';
import { OperationResultStatus, BoardTemplate, GroupType } from '@asoode/shared';
import AppModal from '../core/AppModal.vue';
import AppInput from '../core/AppInput.vue';
import AppSelect from '../core/AppSelect.vue';

const { t } = useI18n();
const emit = defineEmits<{ close: [] }>();
const router = useRouter();
const groupStore = useGroupStore();
const projectStore = useProjectStore();
const { navigateToProject } = useProjectNavigation();

type WizardMode =
  | 'choose'
  | 'projectForm' | 'projectInvite' | 'boardTemplate'
  | 'groupForm' | 'groupInvite'
  | 'import';

const visible = ref(true);
const mode = ref<WizardMode>('choose');
const continueAs = ref('');
const waiting = ref(false);

// Project
const projectTitle = ref('');
const projectDescription = ref('');
const projectTitleError = ref('');
const selectedBoardTemplate = ref<number>(BoardTemplate.Kanban);
const isComplex = ref(false);

// Group
const groupTitle = ref('');
const groupDescription = ref('');
const groupTitleError = ref('');
const groupType = ref<number>(GroupType.Team);

// Invite
const inviteEmail = ref('');
const invitees = ref<string[]>([]);

// Import
const importSource = ref('');
const importFile = ref<File | null>(null);
const importFileInput = ref<HTMLInputElement>();

// ── Options ──────────────────────────────────────────────────────────────
const typeOptions = computed(() => [
  { value: 'simpleProject', label: t('SIMPLE_PROJECTS'), desc: t('SIMPLE_PROJECTS_DESCRIPTION'), icon: 'mdi-briefcase-outline', bg: 'rgba(89,168,239,0.12)', color: '#59a8ef', premium: false },
  { value: 'complexProject', label: t('WBS_PROJECTS'), desc: t('WBS_PROJECTS_DESCRIPTION'), icon: 'mdi-sitemap', bg: 'rgba(103,58,183,0.12)', color: '#673AB7', premium: true },
  { value: 'group', label: t('NEW_GROUP'), desc: t('NEW_GROUP_DESCRIPTION'), icon: 'mdi-account-group-outline', bg: 'rgba(94,178,88,0.12)', color: '#5eb258', premium: false },
  { value: 'import', label: t('IMPORT'), desc: t('IMPORT_DESCRIPTION'), icon: 'mdi-import', bg: 'rgba(235,151,62,0.12)', color: '#eb973e', premium: false },
]);

const boardTemplates = computed(() => [
  { value: BoardTemplate.Kanban, label: 'Kanban', icon: 'mdi-view-column-outline', lists: [t('TO_DO'), t('IN_PROGRESS'), t('DONE')] },
  { value: BoardTemplate.Blank, label: t('BLANK'), icon: 'mdi-border-none-variant', lists: [t('LIST') + ' 1', t('LIST') + ' 2', t('LIST') + ' 3'] },
  { value: BoardTemplate.WeekDay, label: t('WEEK_DAYS'), icon: 'mdi-calendar-week', lists: [t('SATURDAY'), t('SUNDAY'), t('MONDAY')] },
  { value: BoardTemplate.TeamMembers, label: t('TEAM_MEMBERS'), icon: 'mdi-account-group', lists: [t('MEMBER') + ' 1', t('MEMBER') + ' 2', t('MEMBER') + ' 3'] },
  { value: BoardTemplate.Departments, label: t('DEPARTMENTS'), icon: 'mdi-domain', lists: [t('DEPARTMENT') + ' 1', t('DEPARTMENT') + ' 2', t('DEPARTMENT') + ' 3'] },
]);

const groupTypeItems = computed(() => [
  { text: t('TEAM'), value: GroupType.Team },
  { text: t('DEPARTMENT'), value: GroupType.Department },
  { text: t('COMPANY'), value: GroupType.Company },
  { value: GroupType.Organization, text: t('ORGANIZATION') },
  { value: GroupType.Branch, text: t('BRANCH') },
  { value: GroupType.Unit, text: t('UNIT') },
  { value: GroupType.Committee, text: t('COMMITTEE') },
]);

const importSources = [
  { value: 'trello', label: 'Trello', icon: 'mdi-trello', disabled: false },
  { value: 'taskulu', label: 'Taskulu', icon: 'mdi-clipboard-check-outline', disabled: false },
  { value: 'monday', label: 'Monday.com', icon: 'mdi-view-dashboard', disabled: true },
  { value: 'taskworld', label: 'TaskWorld', icon: 'mdi-earth', disabled: true },
];

// ── Step logic ───────────────────────────────────────────────────────────
const projectSteps: WizardMode[] = ['projectForm', 'projectInvite', 'boardTemplate'];
const complexProjectSteps: WizardMode[] = ['projectForm', 'projectInvite'];
const groupSteps: WizardMode[] = ['groupForm', 'groupInvite'];

function getSteps(): WizardMode[] {
  if (isComplex.value) return complexProjectSteps;
  if (continueAs.value === 'simpleProject') return projectSteps;
  if (continueAs.value === 'group') return groupSteps;
  return [];
}

const currentStep = computed(() => {
  if (mode.value === 'choose' || mode.value === 'import') return 1;
  const steps = getSteps();
  const idx = steps.indexOf(mode.value);
  return idx >= 0 ? idx + 1 : 1;
});

const totalSteps = computed(() => {
  if (mode.value === 'choose' || mode.value === 'import') return 1;
  return getSteps().length;
});

const isLastStep = computed(() => {
  if (mode.value === 'choose') return false;
  if (mode.value === 'import') return true;
  const steps = getSteps();
  return steps.indexOf(mode.value) === steps.length - 1;
});

const canGoBack = computed(() => mode.value !== 'choose');

const canSkip = computed(() => {
  return mode.value === 'projectInvite' || mode.value === 'groupInvite';
});

const canProceed = computed(() => {
  switch (mode.value) {
    case 'choose': return !!continueAs.value;
    case 'projectForm': return !!projectTitle.value.trim();
    case 'groupForm': return !!groupTitle.value.trim();
    case 'boardTemplate': return selectedBoardTemplate.value > 0;
    case 'projectInvite':
    case 'groupInvite': return true;
    case 'import': return !!importFile.value;
    default: return true;
  }
});

const stepTitle = computed(() => {
  switch (mode.value) {
    case 'choose': return t('CREATE') + '...';
    case 'projectForm': return isComplex.value ? t('CREATE_COMPLEX_PROJECT') : t('CREATE_SIMPLE_PROJECT');
    case 'projectInvite': return t('NEW_PROJECT_MEMBERS');
    case 'boardTemplate': return t('NEW_PROJECT_TEMPLATE');
    case 'groupForm': return t('CREATE_NEW_GROUP');
    case 'groupInvite': return t('NEW_GROUP_MEMBERS');
    case 'import': return t('IMPORT');
    default: return '';
  }
});

const stepSubtitle = computed(() => {
  switch (mode.value) {
    case 'choose': return t('CHOOSE_WHAT_TO_CREATE');
    case 'projectInvite':
    case 'groupInvite': return t('INVITE_MEMBERS_HINT');
    case 'boardTemplate': return t('CHOOSE_BOARD_TEMPLATE_HINT');
    default: return '';
  }
});

// ── Navigation ───────────────────────────────────────────────────────────
function goBack() {
  const steps = getSteps();
  const idx = steps.indexOf(mode.value);
  if (idx > 0) {
    mode.value = steps[idx - 1];
  } else {
    mode.value = 'choose';
  }
}

function skipStep() {
  const steps = getSteps();
  const idx = steps.indexOf(mode.value);
  if (idx >= 0 && idx < steps.length - 1) {
    mode.value = steps[idx + 1];
  } else {
    finalize();
  }
}

async function nextStep() {
  switch (mode.value) {
    case 'choose':
      if (!continueAs.value) return;
      if (continueAs.value === 'simpleProject') {
        isComplex.value = false;
        mode.value = 'projectForm';
      } else if (continueAs.value === 'complexProject') {
        isComplex.value = true;
        mode.value = 'projectForm';
      } else if (continueAs.value === 'group') {
        mode.value = 'groupForm';
      } else if (continueAs.value === 'import') {
        mode.value = 'import';
      }
      break;

    case 'projectForm':
      projectTitleError.value = '';
      if (!projectTitle.value.trim()) {
        projectTitleError.value = 'PROJECT_TITLE_REQUIRED';
        return;
      }
      mode.value = 'projectInvite';
      break;

    case 'projectInvite':
      if (isComplex.value) {
        await finalize();
      } else {
        mode.value = 'boardTemplate';
      }
      break;

    case 'boardTemplate':
      await finalize();
      break;

    case 'groupForm':
      groupTitleError.value = '';
      if (!groupTitle.value.trim()) {
        groupTitleError.value = 'REQUIRED';
        return;
      }
      mode.value = 'groupInvite';
      break;

    case 'groupInvite':
      await finalize();
      break;

    case 'import':
      await handleImport();
      break;
  }
}

// ── Invite helpers ───────────────────────────────────────────────────────
function addInvitee() {
  const val = inviteEmail.value.trim();
  if (!val) return;
  if (!invitees.value.includes(val)) {
    invitees.value.push(val);
  }
  inviteEmail.value = '';
}

// ── Import helpers ───────────────────────────────────────────────────────
function triggerImportFile() {
  importFileInput.value?.click();
}

function onImportFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    importFile.value = target.files[0];
  }
}

async function handleImport() {
  waiting.value = true;
  setTimeout(() => {
    waiting.value = false;
    emit('close');
  }, 1000);
}

// ── Finalize ─────────────────────────────────────────────────────────────
async function finalize() {
  waiting.value = true;
  try {
    if (continueAs.value === 'simpleProject' || continueAs.value === 'complexProject') {
      const result = await projectStore.create({
        title: projectTitle.value,
        description: projectDescription.value,
        complex: isComplex.value,
      });
      if (result.status === OperationResultStatus.Success) {
        if (invitees.value.length && result.data?.id) {
          for (const email of invitees.value) {
            await projectStore.addAccess(result.data.id, {
              members: [{ id: email, access: 4, isGroup: false }],
            }).catch(() => {});
          }
        }
        navigateToProject(result.data);
        emit('close');
      }
    } else if (continueAs.value === 'group') {
      const result = await groupStore.create({
        title: groupTitle.value,
        description: groupDescription.value,
        type: groupType.value,
      });
      if (result.status === OperationResultStatus.Success) {
        if (invitees.value.length && result.data?.id) {
          for (const email of invitees.value) {
            await groupStore.addAccess(result.data.id, {
              members: [{ id: email, access: 4, isGroup: false }],
            }).catch(() => {});
          }
        }
        router.push(`/group/${result.data.id}`);
        emit('close');
      }
    }
  } finally {
    waiting.value = false;
  }
}
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.cw-header-back-wrap {
  flex-shrink: 0;
}

.cw-steps {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 0 0 $spacing-md;
  flex-shrink: 0;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &.active { background: $primary; }
    &.current { width: 18px; border-radius: 4px; }
  }
}

.cw-body-inner {
  padding: 4px;
}

.cw-cards {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.cw-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.02);

  &:hover { 
    background: rgba(0, 0, 0, 0.04); 
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  &.selected {
    border-color: $primary;
    background: rgba($primary, 0.05);
    box-shadow: 0 4px 12px rgba($primary, 0.1);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    i { font-size: 1.5rem; }
  }

  &__text { flex: 1; min-width: 0; }

  &__name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.95rem;
    font-weight: 700;
    color: $text-primary;
  }

  &__desc {
    display: block;
    font-size: 0.8rem;
    color: $text-secondary;
    margin-top: 2px;
    line-height: 1.4;
  }

  &__premium { color: #cfaf4e; }
}

.cw-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cw-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  &__label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $text-secondary;
  }
}

.cw-invite {
  &__hint { font-size: 0.9rem; color: $text-secondary; margin-bottom: 16px; }
  &__input-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 20px; }
  &__list { display: flex; flex-direction: column; gap: 8px; }
  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
  }
  &__email { flex: 1; font-size: 0.9rem; font-weight: 500; }
  &__empty {
    text-align: center;
    padding: 40px;
    color: $text-secondary;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    opacity: 0.5;
  }
}

.cw-tmpl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.cw-tmpl {
  position: relative;
  padding: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0,0,0,0.02);

  &:hover { background: rgba(0,0,0,0.04); }
  &.selected { border-color: $primary; background: rgba($primary, 0.04); }

  &__icon { margin-bottom: 12px; color: $primary; }
  &__name { display: block; font-weight: 700; margin-bottom: 8px; font-size: 0.9rem; }
  &__lists { display: flex; flex-wrap: wrap; gap: 4px; }
  &__list-chip {
    padding: 2px 8px;
    background: rgba(0,0,0,0.05);
    border-radius: 4px;
    font-size: 0.7rem;
    color: $text-secondary;
  }
  &__check { position: absolute; top: 12px; right: 12px; }
}

.cw-import {
  &__sources { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  &__source {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    border-radius: 12px;
    border: 1px solid rgba(var(--v-border-color), 0.1);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;

    &:hover { background: rgba(0,0,0,0.03); }
    &.selected { border-color: $primary; background: rgba($primary, 0.05); color: $primary; }
    &.disabled { opacity: 0.4; cursor: not-allowed; }
  }
  &__soon { font-size: 0.6rem; color: $text-secondary; opacity: 0.7; }
  &__upload {
    padding: 32px;
    border: 2px dashed rgba(var(--v-border-color), 0.15);
    border-radius: 16px;
    text-align: center;
    cursor: pointer;
    &:hover { border-color: $primary; background: rgba($primary, 0.02); }
  }
  &__dropzone { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  &__filetype { font-size: 0.7rem; color: $text-secondary; opacity: 0.6; }
}

body.dark-mode {
  .cw-card, .cw-tmpl, .cw-import__source { border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.03); }
  .cw-card:hover, .cw-tmpl:hover, .cw-import__source:hover { background: rgba(255, 255, 255, 0.05); }
  .cw-invite__item, .cw-tmpl__list-chip, .cw-breadcrumb { background: rgba(255, 255, 255, 0.05); }
}
</style>
