<template>
  <section class="group-setting">
    <header class="group-setting__header">
      <div class="group-setting__heading">
        <p class="group-setting__eyebrow">{{ $t('SETTINGS') }}</p>
        <p class="group-setting__summary">
          Manage exports, ownership, and lifecycle controls for this group from one place.
        </p>
      </div>
      <div class="group-setting__meta">
        <span class="group-setting__chip">
          <i class="mdi mdi-account-group-outline"></i>
          <strong>{{ props.group.members?.length || 0 }}</strong>
          <span class="group-setting__chip-label">{{ $t('MEMBERS') }}</span>
        </span>
        <span class="group-setting__chip">
          <i class="mdi mdi-email-fast-outline"></i>
          <strong>{{ props.group.pending?.length || 0 }}</strong>
          <span class="group-setting__chip-label">{{ $t('PENDING') }}</span>
        </span>
      </div>
    </header>

    <div class="group-setting__grid">
      <article class="settings-panel">
        <div class="settings-card__header">
          <div class="settings-card__title">
            <div class="settings-card__icon settings-card__icon--muted">
              <i class="mdi mdi-export-variant"></i>
            </div>
            <div>
              <h4>{{ $t('EXPORT_GROUP_TITLE') }}</h4>
              <p>{{ $t('EXPORT_GROUP_DESCRIPTION') }}</p>
            </div>
          </div>
          <button class="settings-btn settings-btn--secondary">
            <i class="mdi mdi-download-outline"></i>
            {{ $t('EXPORT_GROUP') }}
          </button>
        </div>

        <div class="settings-card__note settings-card__note--subtle">
          <i class="mdi mdi-clock-alert-outline"></i>
          <span>{{ $t('EXPORT_PROJECT_DESCRIPTION_MORE') }}</span>
        </div>
      </article>

      <article v-if="props.permission === AccessType.Owner" class="settings-panel">
        <div class="settings-card__header">
          <div class="settings-card__title">
            <div class="settings-card__icon">
              <i class="mdi mdi-account-switch-outline"></i>
            </div>
            <div>
              <h4>{{ $t('TRANSFER_OWNERSHIP') }}</h4>
              <p>{{ $t('TRANSFER_OWNERSHIP_DESCRIPTION') }}</p>
            </div>
          </div>
        </div>

        <div class="transfer-actions">
          <AppSelect
            v-model="transferTarget"
            :items="memberSelectItems"
            class="transfer-actions__select"
          />
          <button
            class="settings-btn settings-btn--primary"
            :disabled="!transferTarget || transferring"
            @click="prepareTransfer"
          >
            <i v-if="transferring" class="mdi mdi-loading mdi-spin"></i>
            <i v-else class="mdi mdi-crown-outline"></i>
            {{ $t('TRANSFER') }}
          </button>
        </div>
      </article>

      <article class="settings-panel settings-panel--danger">
        <div class="settings-card__header">
          <div class="settings-card__title">
            <div class="settings-card__icon settings-card__icon--danger">
              <i class="mdi mdi-alert-outline"></i>
            </div>
            <div>
              <h4>{{ $t('DELETE_GROUP') }}</h4>
              <p>{{ $t('ARCHIVE_GROUP_DESCRIPTION') }}</p>
            </div>
          </div>
        </div>

        <div class="danger-actions">
          <div class="danger-actions__copy">
            <span>{{ lifecycleDescription }}</span>
          </div>
          <div class="danger-actions__buttons">
            <button
              v-if="!props.group.archivedAt && canArchiveOrRestore"
              :disabled="working"
              class="settings-btn settings-btn--primary"
              @click="prepareArchive()"
            >
              <i v-if="working" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-archive-arrow-down-outline"></i>
              {{ $t('ARCHIVE_GROUP') }}
            </button>

            <button
              v-if="props.group.archivedAt && canArchiveOrRestore"
              :disabled="working"
              class="settings-btn settings-btn--secondary"
              @click="prepareRestore()"
            >
              <i v-if="working" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-archive-refresh-outline"></i>
              {{ $t('RESTORE_GROUP') }}
            </button>

            <button
              v-if="props.permission === AccessType.Owner"
              :disabled="working"
              class="settings-btn settings-btn--danger"
              @click="prepareDelete()"
            >
              <i v-if="deleting" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-trash-can-outline"></i>
              {{ $t('DELETE_GROUP') }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGroupStore } from '@/stores/group.store';
import { stringFormat } from '@/plugins/i18n';
import { AccessType, OperationResultStatus, type GroupViewModel } from '@asoode/shared';
import AppSelect from '@/components/core/AppSelect.vue';
import { useModal } from '@/composables/useModal';

const props = defineProps<{
  group: GroupViewModel;
  permission: AccessType;
}>();

const router = useRouter();
const { t } = useI18n();
const groupStore = useGroupStore();
const modal = useModal();

const deleting = ref(false);
const transferTarget = ref('');
const transferring = ref(false);
const archiving = ref(false);
const restoring = ref(false);

const transferableMembers = computed(() =>
  (props.group.members || []).filter(
    member => member.userId !== props.group.userId && member.access !== AccessType.Owner,
  ),
);

const memberSelectItems = computed(() => [
  { text: t('SELECT_MEMBER'), value: '' },
  ...transferableMembers.value.map(member => ({
    text: getMemberName(member),
    value: member.id,
  })),
]);

const canArchiveOrRestore = computed(() =>
  props.permission === AccessType.Owner || props.permission === AccessType.Admin,
);

const working = computed(() => deleting.value || archiving.value || restoring.value);

const lifecycleDescription = computed(() => (
  props.group.archivedAt
    ? t('RESTORE_GROUP_CONFIRM')
    : t('ARCHIVE_GROUP_CONFIRM')
));

function getMemberName(member: any): string {
  const info = member.member;
  if (info?.fullName) return info.fullName;
  if (info?.email) return info.email;
  return member.userId || '';
}

function prepareTransfer() {
  if (!transferTarget.value) return;
  const member = transferableMembers.value.find(item => item.id === transferTarget.value);
  if (!member) return;
  const name = getMemberName(member);

  modal.confirm({
    title: 'TRANSFER_OWNERSHIP',
    heading: name,
    message: 'TRANSFER_OWNERSHIP_CONFIRM',
    actionLabel: 'TRANSFER',
    cancelLabel: 'CANCEL',
    action: async () => {
      transferring.value = true;
      const op = await groupStore.changeAccess(member.id, { access: AccessType.Owner });
      transferring.value = false;
      if (op.status === OperationResultStatus.Success) {
        transferTarget.value = '';
      }
    },
  });
}

function prepareDelete() {
  modal.confirm({
    title: 'REMOVE_GROUP',
    heading: stringFormat(t('REMOVE_GROUP_CONFIRM_HEADING'), props.group.title),
    message: 'REMOVE_GROUP_CONFIRM',
    actionLabel: 'REMOVE_GROUP',
    cancelLabel: 'CANCEL',
    action: async () => {
      deleting.value = true;
      const op = await groupStore.remove(props.group.id);
      deleting.value = false;
      if (op.status === OperationResultStatus.Success) {
        router.push('/');
      }
    },
  });
}

function prepareArchive() {
  modal.confirm({
    title: 'ARCHIVE_GROUP',
    heading: stringFormat(t('ARCHIVE_GROUP_CONFIRM_HEADING'), props.group.title),
    message: 'ARCHIVE_GROUP_CONFIRM',
    actionLabel: 'ARCHIVE_GROUP',
    cancelLabel: 'CANCEL',
    action: async () => {
      archiving.value = true;
      const op = await groupStore.archive(props.group.id);
      archiving.value = false;
      if (op.status === OperationResultStatus.Success) {
        router.push('/');
      }
    },
  });
}

function prepareRestore() {
  modal.confirm({
    title: 'RESTORE_GROUP',
    heading: stringFormat(t('RESTORE_GROUP_CONFIRM_HEADING'), props.group.title),
    message: 'RESTORE_GROUP_CONFIRM',
    actionLabel: 'RESTORE_GROUP',
    cancelLabel: 'CANCEL',
    action: async () => {
      restoring.value = true;
      await groupStore.restore(props.group.id);
      restoring.value = false;
    },
  });
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.group-setting {
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__heading {
    max-width: 620px;
  }

  &__eyebrow {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $text-secondary;
  }

  &__summary {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: $text-secondary;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
  }

  &__chip-label {
    color: $text-secondary;
  }

  &__grid {
    display: grid;
    gap: 14px;
  }
}

.settings-panel {
  padding: 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;

  &--danger {
    border-color: rgba(248, 113, 113, 0.35);
    background: linear-gradient(180deg, rgba(255, 251, 251, 0.96), #fff);
  }
}

.settings-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;

  @media (max-width: 760px) {
    flex-direction: column;
  }
}

.settings-card__title {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: $text-primary;
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: $text-secondary;
  }
}

.settings-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 70, 229, 0.12);
  color: #4f46e5;

  .mdi {
    font-size: 18px;
  }

  &--muted {
    background: rgba(148, 163, 184, 0.12);
    color: #475569;
  }

  &--danger {
    background: rgba(248, 113, 113, 0.12);
    color: #dc2626;
  }
}

.settings-card__note {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.45;

  &--subtle {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: $text-secondary;
  }

  .mdi {
    font-size: 16px;
    color: #6366f1;
    margin-top: 1px;
  }
}

.transfer-actions {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }

  &__select {
    flex: 1;
  }
}

.danger-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 760px) {
    flex-direction: column;
  }

  &__copy {
    max-width: 560px;
    font-size: 13px;
    line-height: 1.5;
    color: $text-secondary;
  }

  &__buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;

    @media (max-width: 760px) {
      justify-content: flex-start;
    }
  }
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  border-radius: 10px;
  padding: 0 14px;
  border: 1px solid transparent;
  background: transparent;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &--primary {
    color: #fff;
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    box-shadow: 0 12px 24px rgba(67, 56, 202, 0.18);
  }

  &--secondary {
    background: #fff;
    border-color: #dbe3ee;
    color: $text-secondary;

    &:hover:not(:disabled) {
      background: #f8fafc;
      color: $text-primary;
    }
  }

  &--danger {
    color: #fff;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 12px 24px rgba(220, 38, 38, 0.16);
  }
}
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .group-setting {
    &__eyebrow,
    &__summary,
    &__chip,
    &__chip-label {
      color: $dark-text-muted;
    }

    &__chip {
      background: rgba(30, 41, 59, 0.85);
      border-color: rgba(71, 85, 105, 0.7);
    }
  }

  .settings-panel {
    background: rgba(30, 41, 59, 0.72);
    border-color: rgba(71, 85, 105, 0.68);

    &--danger {
      background: linear-gradient(180deg, rgba(69, 26, 26, 0.45), rgba(30, 41, 59, 0.82));
      border-color: rgba(248, 113, 113, 0.3);
    }
  }

  .settings-card__title {
    h4 {
      color: $dark-text-light;
    }

    p {
      color: $dark-text-muted;
    }
  }

  .settings-card__icon--muted {
    background: rgba(148, 163, 184, 0.16);
    color: #cbd5e1;
  }

  .settings-card__note--subtle {
    background: rgba(15, 23, 42, 0.46);
    border-color: rgba(71, 85, 105, 0.68);
    color: $dark-text-muted;
  }

  .danger-actions__copy {
    color: $dark-text-muted;
  }

  .group-setting .settings-btn {
    &--secondary {
      background: rgba(30, 41, 59, 0.9);
      color: $dark-text-muted;
      border-color: rgba(71, 85, 105, 0.8);

      &:hover:not(:disabled) {
        background: rgba(51, 65, 85, 0.92);
        color: $dark-text-light;
      }
    }
  }
}
</style>
