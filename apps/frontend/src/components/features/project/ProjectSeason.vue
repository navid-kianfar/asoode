<template>
  <section class="project-seasons">
    <div class="project-seasons__header">
      <div>
        <p class="project-seasons__eyebrow">{{ $t('SEASONS') }}</p>
        <p class="project-seasons__summary">
          Organize delivery phases and keep larger project milestones structured over time.
        </p>
      </div>
      <div class="project-seasons__actions">
        <span class="project-seasons__chip">
          <i class="mdi mdi-flag-outline"></i>
          <strong>{{ project.seasons?.length || 0 }}</strong>
          <span>{{ $t('SEASONS') }}</span>
        </span>
        <button
          v-if="canEditProject"
          class="season-btn season-btn--primary"
          @click="prepareCreate()"
        >
          <i class="mdi mdi-plus"></i>
          {{ $t('CREATE_SEASON') }}
        </button>
      </div>
    </div>

    <div v-if="!project.seasons?.length" class="project-seasons__empty">
      <div class="project-seasons__empty-icon">
        <i class="mdi mdi-flag-outline"></i>
      </div>
      <h4>{{ $t('SEASON_USE_TITLE') }}</h4>
      <p>{{ $t('SEASON_USE_DESCRIPTION') }}</p>
      <button
        v-if="canEditProject"
        class="season-btn season-btn--primary"
        @click="prepareCreate()"
      >
        <i class="mdi mdi-plus"></i>
        {{ $t('CREATE_SEASON') }}
      </button>
    </div>

    <div v-else class="project-seasons__list">
      <article
        v-for="season in project.seasons"
        :key="season.id"
        class="season-row"
      >
        <div class="season-row__main">
          <div class="season-row__icon">
            <i class="mdi mdi-flag-outline"></i>
          </div>
          <div class="season-row__content">
            <h4>{{ season.title }}</h4>
            <p class="season-row__description">
              {{ season.description || $t('SEASON_USE_DESCRIPTION') }}
            </p>
          </div>
        </div>

        <div v-if="canEditProject" class="season-row__actions">
          <button class="season-btn season-btn--secondary" @click="prepareEdit(season)">
            <i class="mdi mdi-pencil-outline"></i>
            {{ $t('EDIT_SEASON') }}
          </button>
          <button class="season-btn season-btn--danger" @click="prepareDelete(season)">
            <i class="mdi mdi-trash-can-outline"></i>
            {{ $t('REMOVE_SEASON') }}
          </button>
        </div>
      </article>
    </div>

    <AppModal
      v-model="showSeasonDialog"
      :title="$t(editingSeason ? 'EDIT_SEASON' : 'CREATE_SEASON')"
      :subtitle="$t('SEASONS')"
      :width="540"
      :loading="seasonSaving"
      @close="closeSeasonDialog"
    >
      <div class="season-modal-body">
        <AppInput
          v-model="seasonForm.title"
          :label="$t('TITLE')"
          :placeholder="$t('TITLE')"
          dense
          class="mb-4"
          @keydown.enter.prevent="saveSeason"
        />
        <AppInput
          v-model="seasonForm.description"
          textArea
          :rows="4"
          :label="$t('DESCRIPTION')"
          :placeholder="$t('DESCRIPTION')"
          dense
        />
      </div>

      <template #footer>
        <v-btn variant="text" @click="closeSeasonDialog">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          :loading="seasonSaving"
          :disabled="!seasonForm.title.trim()"
          @click="saveSeason"
        >
          {{ $t(editingSeason ? 'SAVE_CHANGES' : 'CREATE') }}
        </v-btn>
      </template>
    </AppModal>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import {
  type ProjectViewModel,
  type ProjectSeasonViewModel,
  OperationResultStatus,
} from '@asoode/shared';
import { useProjectStore } from '@/stores/project.store';
import { usePermission } from '@/composables/usePermission';
import { useModal } from '@/composables/useModal';

const props = defineProps<{ project: ProjectViewModel }>();

const projectStore = useProjectStore();
const { canAdmin } = usePermission();
const modal = useModal();

const showSeasonDialog = ref(false);
const seasonSaving = ref(false);
const editingSeason = ref<ProjectSeasonViewModel | null>(null);
const seasonForm = reactive({
  title: '',
  description: '',
});

const permission = computed(() => projectStore.getPermission(props.project));
const canEditProject = computed(() => canAdmin(permission.value));

function prepareCreate() {
  editingSeason.value = null;
  seasonForm.title = '';
  seasonForm.description = '';
  showSeasonDialog.value = true;
}

function prepareDelete(season: ProjectSeasonViewModel) {
  modal.confirm({
    title: 'REMOVE_SEASON',
    message: 'REMOVE_SEASON_CONFIRM',
    actionLabel: 'REMOVE_SEASON',
    cancelLabel: 'CANCEL',
    action: async () => {
      await projectStore.removeSeason(season.id);
      await reload();
    },
  });
}

function prepareEdit(season: ProjectSeasonViewModel) {
  editingSeason.value = season;
  seasonForm.title = season.title || '';
  seasonForm.description = season.description || '';
  showSeasonDialog.value = true;
}

function closeSeasonDialog() {
  if (seasonSaving.value) return;
  showSeasonDialog.value = false;
  editingSeason.value = null;
  seasonForm.title = '';
  seasonForm.description = '';
}

async function saveSeason() {
  const title = seasonForm.title.trim();
  if (!title) return;

  seasonSaving.value = true;
  const payload = {
    title,
    description: seasonForm.description?.trim() || '',
  };

  const op = editingSeason.value
    ? await projectStore.editSeason(editingSeason.value.id, payload)
    : await projectStore.createSeason(props.project.id, payload);

  seasonSaving.value = false;
  if (op.status === OperationResultStatus.Success) {
    closeSeasonDialog();
    await reload();
  }
}

async function reload() {
  const result = await projectStore.fetchProject(props.project.id);
  if (result.status === OperationResultStatus.Success && result.data) {
    Object.assign(props.project, result.data);
  }
}
</script>

<style scoped lang="scss">
.project-seasons {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    padding: 6px 2px 10px;
    border-bottom: 1px solid #edf2f7;
  }

  &__eyebrow {
    margin: 0 0 6px;
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__summary {
    margin: 0;
    max-width: 720px;
    color: #475569;
    line-height: 1.55;
    font-size: 0.92rem;
  }

  &__actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding-top: 4px;
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
      line-height: 1;
      font-weight: 700;
      color: #0f172a;
    }
  }

  &__list,
  &__empty {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
  }

  &__list {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__empty {
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 32px;

    h4 {
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 1.15rem;
    }

    p {
      margin: 0 0 18px;
      color: #64748b;
      max-width: 420px;
      line-height: 1.6;
    }
  }

  &__empty-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef2ff;
    color: #4f46e5;
    margin-bottom: 18px;

    .mdi {
      font-size: 24px;
    }
  }
}

.season-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;

  &__main {
    display: flex;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  &__icon {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    background: #eef2ff;
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__content {
    min-width: 0;

    h4 {
      margin: 0 0 4px;
      color: #0f172a;
      font-size: 0.95rem;
      line-height: 1.35;
    }
  }

  &__description {
    margin: 0;
    color: #64748b;
    line-height: 1.45;
    font-size: 0.84rem;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

.season-btn {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font: inherit;
  font-size: 0.82rem;
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
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    color: #fff;
    box-shadow: 0 8px 18px rgba(67, 56, 202, 0.14);
  }

  &--secondary {
    background: #fff;
    border-color: #dbe3ee;
    color: #334155;
  }

  &--danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }
}

.season-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.season-dialog {
  width: min(100%, 560px);
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 24px 18px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    h3 {
      margin: 4px 0 0;
      color: #111827;
    }
  }

  &__eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.74rem;
    font-weight: 700;
    color: #64748b;
  }

  &__close {
    border: none;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    font-size: 1.1rem;
  }

  &__body {
    padding: 20px 24px 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #334155;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid #dbe3ee;
      border-radius: 12px;
      padding: 12px 14px;
      font: inherit;
      color: #111827;
      background: #fff;

      &:focus {
        outline: none;
        border-color: #818cf8;
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.16);
      }
    }

    textarea {
      resize: vertical;
      min-height: 110px;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px 24px;
  }
}

@media (max-width: 900px) {
  .project-seasons {
    &__header {
      flex-direction: column;
      align-items: stretch;
    }

    &__actions {
      justify-content: flex-start;
      padding-top: 0;
    }
  }

  .season-row {
    flex-direction: column;
    align-items: stretch;

    &__actions {
      justify-content: flex-start;
    }
  }
}
</style>
