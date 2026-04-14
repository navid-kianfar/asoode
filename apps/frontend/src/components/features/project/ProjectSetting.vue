<template>
  <section class="project-setting">
    <header class="project-setting__header">
      <div class="project-setting__heading">
        <p class="project-setting__eyebrow">{{ $t('SETTINGS') }}</p>
        <p class="project-setting__summary">
          Manage project members, access, exports, and lifecycle settings from one place.
        </p>
      </div>
      <div class="project-setting__meta">
        <span class="project-setting__chip">
          <i class="mdi mdi-account-group-outline"></i>
          <strong>{{ memberCount }}</strong>
          <span class="project-setting__chip-label">{{ $t('PROJECT_MEMBERS') }}</span>
        </span>
        <span class="project-setting__chip">
          <i class="mdi mdi-timer-sand-empty"></i>
          <strong>{{ pendingCount }}</strong>
          <span class="project-setting__chip-label">{{ $t('PENDING') }}</span>
        </span>
        <button
          v-if="canEditProject"
          class="settings-btn settings-btn--secondary"
          @click="invite()"
        >
          <i class="mdi mdi-account-plus-outline"></i>
          {{ $t('INVITE_MEMBER') }}
        </button>
      </div>
    </header>

    <div class="project-setting__grid">
      <article class="settings-panel settings-panel--members">
        <div class="settings-card__header">
          <div class="settings-card__title">
            <div class="settings-card__icon">
              <i class="mdi mdi-account-group"></i>
            </div>
            <div>
              <h4>{{ $t('PROJECT_MEMBERS') }}</h4>
              <p>{{ $t('NEW_PROJECT_MEMBERS') }}</p>
            </div>
          </div>
        </div>

        <div class="members-list">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="member-row"
          >
            <div class="member-row__identity">
              <template v-if="!member.isGroup">
                <div class="avatar">
                  <span class="initials">{{ getInitials(member.member) }}</span>
                </div>
                <div class="member-row__copy">
                  <span class="member-row__name">{{ member.member?.fullName || '' }}</span>
                  <span class="member-row__sub">{{ member.member?.email || '' }}</span>
                </div>
              </template>

              <template v-else>
                <div class="avatar avatar--group">
                  <i class="mdi mdi-account-group"></i>
                </div>
                <div class="member-row__copy">
                  <span class="member-row__name">{{ resolveGroupName(member.recordId) }}</span>
                  <span class="member-row__sub">{{ $t('PROJECT_MEMBERS') }}</span>
                </div>
              </template>
            </div>

            <div class="member-row__controls">
              <AppSelect
                :model-value="member.access"
                :items="accessItemsFull"
                :disabled="(member as any).waiting || !canChangeAccess(member)"
                compact
                @update:model-value="accessChange(member, $event)"
              />

              <button
                v-if="canRemoveAccess(member)"
                :disabled="(member as any).waiting || (member as any).deleting"
                class="settings-btn settings-btn--danger-ghost"
                @click="removeAccess(member)"
              >
                <i v-if="(member as any).deleting" class="mdi mdi-loading mdi-spin"></i>
                <i v-else class="mdi mdi-account-remove-outline"></i>
                {{ $t('REMOVE_ACCESS') }}
              </button>

              <button
                v-if="member.access !== AccessType.Owner && permission === AccessType.Owner && !member.isGroup"
                :disabled="(member as any).waiting"
                class="settings-btn settings-btn--secondary"
                @click="transferOwnership(member)"
              >
                <i v-if="(member as any).waiting" class="mdi mdi-loading mdi-spin"></i>
                <i v-else class="mdi mdi-crown-outline"></i>
                {{ $t('TRANSFER_OWNERSHIP') }}
              </button>
            </div>
          </div>

          <div
            v-for="pending in project.pending"
            :key="pending.id"
            class="member-row member-row--pending"
          >
            <div class="member-row__identity">
              <div class="avatar avatar--pending">
                <i class="mdi mdi-email-fast-outline"></i>
              </div>
              <div class="member-row__copy">
                <span class="member-row__name">{{ pending.identifier }}</span>
                <span class="member-row__sub">{{ $t('PENDING') }}</span>
              </div>
            </div>

            <div class="member-row__controls">
              <AppSelect
                :model-value="pending.access"
                :items="accessItems"
                :disabled="(pending as any).waiting || (pending as any).deleting || !canRemovePendingAccess(pending)"
                compact
                @update:model-value="accessPendingChange(pending, $event)"
              />

              <button
                v-if="canRemovePendingAccess(pending)"
                :disabled="(pending as any).waiting || (pending as any).deleting"
                class="settings-btn settings-btn--danger-ghost"
                @click="removePendingAccess(pending)"
              >
                <i v-if="(pending as any).deleting" class="mdi mdi-loading mdi-spin"></i>
                <i v-else class="mdi mdi-close-circle-outline"></i>
                {{ $t('REMOVE_ACCESS') }}
              </button>
            </div>
          </div>
        </div>
      </article>

      <article v-if="canEditProject" class="settings-panel settings-panel--utility">
        <div class="settings-card__header">
          <div class="settings-card__title">
            <div class="settings-card__icon settings-card__icon--muted">
              <i class="mdi mdi-export-variant"></i>
            </div>
            <div>
              <h4>{{ $t('EXPORT_PROJECT_TITLE') }}</h4>
              <p>{{ $t('EXPORT_PROJECT_DESCRIPTION') }}</p>
            </div>
          </div>
          <button class="settings-btn settings-btn--secondary">
            <i class="mdi mdi-download-outline"></i>
            {{ $t('EXPORT_PROJECT') }}
          </button>
        </div>
        <div class="settings-card__note settings-card__note--subtle">
          <i class="mdi mdi-clock-alert-outline"></i>
          <span>{{ $t('EXPORT_PROJECT_DESCRIPTION_MORE') }}</span>
        </div>
      </article>

      <article v-if="canEditProject" class="settings-panel settings-panel--danger">
        <div class="settings-card__header">
          <div class="settings-card__title">
            <div class="settings-card__icon settings-card__icon--danger">
              <i class="mdi mdi-alert-outline"></i>
            </div>
            <div>
              <h4>{{ $t('DELETE_PROJECT') }}</h4>
              <p>{{ $t('ARCHIVE_PROJECT_DESCRIPTION') }}</p>
            </div>
          </div>
        </div>

        <div class="danger-actions">
          <div class="danger-actions__copy">
            <span>{{ $t('ARCHIVE_PROJECT_CONFIRM') }}</span>
          </div>
          <div class="danger-actions__buttons">
            <button
              :disabled="archiving || deleting"
              class="settings-btn settings-btn--primary"
              @click="prepareArchive()"
            >
              <i v-if="archiving" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-archive-arrow-down-outline"></i>
              {{ $t('ARCHIVE_PROJECT') }}
            </button>
            <button
              :disabled="deleting || archiving"
              class="settings-btn settings-btn--danger"
              @click="prepareDelete()"
            >
              <i v-if="deleting" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-trash-can-outline"></i>
              {{ $t('DELETE_PROJECT') }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showInviteModal" class="invite-backdrop" @click.self="showInviteModal = false">
      <div class="invite-modal">
        <div class="invite-modal__header">
          <div>
            <p class="invite-modal__eyebrow">{{ $t('INVITE_MEMBER') }}</p>
            <h4>{{ $t('PROJECT_MEMBERS') }}</h4>
          </div>
          <button class="invite-modal__close" @click="showInviteModal = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <form class="invite-modal__body" @submit.prevent="onInvite()">
          <div class="invite-modal__field">
            <label>{{ $t('EMAIL_OR_PHONE') }}</label>
            <input
              v-model="inviteIdentifier"
              type="text"
              :placeholder="$t('EMAIL_OR_PHONE')"
              autocomplete="off"
            />
            <div v-if="inviteError" class="invite-modal__error">{{ $t(inviteError) }}</div>
          </div>

          <div class="invite-modal__field">
            <label>{{ $t('ACCESS_LEVEL') }}</label>
            <AppSelect v-model="inviteAccess" :items="accessItems" />
          </div>

          <div class="invite-modal__actions">
            <button type="button" class="settings-btn settings-btn--secondary" @click="showInviteModal = false">
              {{ $t('CANCEL') }}
            </button>
            <button type="submit" class="settings-btn settings-btn--primary" :disabled="inviting">
              <i v-if="inviting" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-send-outline"></i>
              {{ $t('INVITE') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type ProjectViewModel,
  type ProjectMemberViewModel,
  type PendingInvitationViewModel,
  AccessType,
  OperationResultStatus,
} from '@asoode/shared';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import { usePermission } from '@/composables/usePermission';
import { useModal } from '@/composables/useModal';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'vue-router';

const props = defineProps<{ project: ProjectViewModel }>();

const { t } = useI18n();
const projectStore = useProjectStore();
const groupStore = useGroupStore();
const authStore = useAuthStore();
const { canAdmin } = usePermission();
const modal = useModal();
const router = useRouter();

const archiving = ref(false);
const deleting = ref(false);
const showInviteModal = ref(false);
const inviteIdentifier = ref('');
const inviteAccess = ref<number>(AccessType.Editor);
const inviting = ref(false);
const inviteError = ref('');

const accessItemsFull = computed(() => [
  { text: t('OWNER'), value: AccessType.Owner },
  { text: t('ADMIN'), value: AccessType.Admin },
  { text: t('EDITOR'), value: AccessType.Editor },
  { text: t('HIDDEN_EDITOR'), value: AccessType.HiddenEditor },
  { text: t('VISITOR'), value: AccessType.Visitor },
]);

const accessItems = computed(() => [
  { text: t('ADMIN'), value: AccessType.Admin },
  { text: t('EDITOR'), value: AccessType.Editor },
  { text: t('HIDDEN_EDITOR'), value: AccessType.HiddenEditor },
  { text: t('VISITOR'), value: AccessType.Visitor },
]);

const permission = computed(() => projectStore.getPermission(props.project));
const canEditProject = computed(() => canAdmin(permission.value));
const memberCount = computed(() => (props.project.members || []).length);
const pendingCount = computed(() => (props.project.pending || []).length);

function getInitials(member: any): string {
  if (member?.fullName) {
    const parts = member.fullName.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return member.fullName.charAt(0).toUpperCase();
  }
  return '?';
}

function invite() {
  inviteIdentifier.value = '';
  inviteAccess.value = AccessType.Editor;
  inviteError.value = '';
  showInviteModal.value = true;
}

async function onInvite() {
  if (!inviteIdentifier.value.trim()) {
    inviteError.value = 'REQUIRED';
    return;
  }
  inviteError.value = '';
  inviting.value = true;
  const op = await projectStore.addAccess(props.project.id, {
    members: [{ id: inviteIdentifier.value, access: inviteAccess.value, isGroup: false }],
  } as any);
  if (op.status === OperationResultStatus.Success) {
    showInviteModal.value = false;
    inviteIdentifier.value = '';
    await reload();
  } else {
    inviteError.value = 'INVITE_FAILED';
  }
  inviting.value = false;
}

function canRemoveAccess(member: ProjectMemberViewModel): boolean {
  if (member.access === AccessType.Owner) return false;
  const isMe = member.recordId === authStore.userId;
  return permission.value === AccessType.Owner || permission.value === AccessType.Admin || isMe;
}

function canChangeAccess(member: ProjectMemberViewModel): boolean {
  if (member.access === AccessType.Owner) return false;
  return permission.value === AccessType.Owner || permission.value === AccessType.Admin;
}

function canRemovePendingAccess(member: PendingInvitationViewModel): boolean {
  if (member.access === AccessType.Owner) return false;
  return permission.value === AccessType.Owner || permission.value === AccessType.Admin;
}

function getMemberDisplayName(member: ProjectMemberViewModel): string {
  if (member.isGroup) return resolveGroupName(member.recordId);
  return member.member?.fullName || member.member?.email || '';
}

function resolveGroupName(recordId: string): string {
  const group = groupStore.groups.find((g) => g.id === recordId);
  return group?.title || recordId;
}

function removeAccess(member: ProjectMemberViewModel) {
  const name = getMemberDisplayName(member);
  modal.confirm({
    title: 'REMOVE_ACCESS',
    heading: t('REMOVE_MEMBER_CONFIRM_HEADING', [name]),
    message: 'REMOVE_MEMBER_CONFIRM',
    actionLabel: 'REMOVE_ACCESS',
    cancelLabel: 'CANCEL',
    actionColor: 'error',
    action: async () => {
      (member as any).waiting = true;
      const op = await projectStore.removeAccess(member.id);
      (member as any).waiting = false;
      if (op.status === OperationResultStatus.Success) {
        await reload();
      }
    },
  });
}

async function accessChange(member: ProjectMemberViewModel, access: AccessType) {
  member.access = access;
  (member as any).waiting = true;
  await projectStore.changeAccess(member.id, { access });
  (member as any).waiting = false;
}

async function accessPendingChange(member: PendingInvitationViewModel, access: AccessType) {
  member.access = access;
  (member as any).waiting = true;
  await projectStore.changePendingAccess(member.id, { access });
  (member as any).waiting = false;
}

function removePendingAccess(member: PendingInvitationViewModel) {
  modal.confirm({
    title: 'REMOVE_ACCESS',
    heading: t('REMOVE_MEMBER_CONFIRM_HEADING', [member.identifier]),
    message: 'REMOVE_MEMBER_CONFIRM',
    actionLabel: 'REMOVE_ACCESS',
    cancelLabel: 'CANCEL',
    actionColor: 'error',
    action: async () => {
      (member as any).deleting = true;
      const op = await projectStore.removePendingAccess(member.id);
      (member as any).deleting = false;
      if (op.status === OperationResultStatus.Success) {
        props.project.pending = (props.project.pending || []).filter((g) => g !== member);
      }
    },
  });
}

async function transferOwnership(member: ProjectMemberViewModel) {
  modal.confirm({
    title: 'TRANSFER_OWNERSHIP',
    heading: t('TRANSFER_OWNERSHIP_CONFIRM_HEADING'),
    message: 'TRANSFER_OWNERSHIP_CONFIRM',
    actionLabel: 'TRANSFER_OWNERSHIP',
    cancelLabel: 'CANCEL',
    actionColor: 'warning',
    action: async () => {
      (member as any).waiting = true;
      const op = await projectStore.changeAccess(member.id, { access: AccessType.Owner });
      (member as any).waiting = false;
      if (op.status === OperationResultStatus.Success) {
        await reload();
      }
    },
  });
}

function prepareArchive() {
  modal.confirm({
    title: 'ARCHIVE_PROJECT',
    heading: t('ARCHIVE_PROJECT_CONFIRM_HEADING', [props.project.title]),
    message: 'ARCHIVE_PROJECT_CONFIRM',
    actionLabel: 'ARCHIVE_PROJECT',
    cancelLabel: 'CANCEL',
    actionColor: 'warning',
    action: async () => {
      archiving.value = true;
      const op = await projectStore.archiveProject(props.project.id);
      archiving.value = false;
      if (op.status === OperationResultStatus.Success) {
        router.push('/dashboard');
      }
    },
  });
}

function prepareDelete() {
  modal.confirm({
    title: 'DELETE_PROJECT',
    heading: t('REMOVE_PROJECT_CONFIRM_HEADING', [props.project.title]),
    message: 'REMOVE_PROJECT_DESCRIPTION',
    actionLabel: 'DELETE_PROJECT',
    cancelLabel: 'CANCEL',
    actionColor: 'error',
    action: async () => {
      deleting.value = true;
      const op = await projectStore.remove(props.project.id);
      deleting.value = false;
      if (op.status === OperationResultStatus.Success) {
        router.push('/dashboard');
      }
    },
  });
}

async function reload() {
  const result = await projectStore.fetchProject(props.project.id);
  if (result.status === OperationResultStatus.Success && result.data) {
    Object.assign(props.project, result.data);
  }
}
</script>

<style scoped lang="scss">
.project-setting {
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: #0f172a;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    padding: 6px 2px 10px;
    border-bottom: 1px solid #edf2f7;

    h3 {
      margin: 0;
      font-size: 1.85rem;
      line-height: 1.08;
      font-weight: 700;
    }
  }

  &__heading {
    min-width: 0;
  }

  &__eyebrow {
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.72rem;
    font-weight: 700;
    color: #64748b;
  }

  &__summary {
    margin: 0;
    max-width: 620px;
    color: #475569;
    line-height: 1.55;
    font-size: 0.92rem;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
  }

  &__chip {
    min-height: 34px;
    padding: 0 11px;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #64748b;
    white-space: nowrap;

    i {
      font-size: 0.88rem;
    }

    strong {
      font-size: 0.82rem;
      line-height: 1;
      font-weight: 700;
      color: #0f172a;
    }
  }

  &__chip-label {
    font-size: 0.78rem;
    font-weight: 600;
  }

  &__grid {
    display: grid;
    gap: 14px;
  }
}

.settings-panel {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
  padding: 18px 20px;
}

.settings-card {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
  }

  &__title {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;

    h4 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.25;
    }

    p {
      margin: 4px 0 0;
      color: #64748b;
      line-height: 1.45;
      font-size: 0.88rem;
    }
  }

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef2ff;
    color: #4f46e5;
    flex-shrink: 0;
    border: 1px solid #dbeafe;

    i {
      font-size: 1rem;
    }
  }

  &__icon--muted {
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #475569;
  }

  &__icon--danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }

  &__note {
    margin-top: 14px;
    padding: 11px 13px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  &__note--subtle {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.member-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  &--pending {
    background: #fffbeb;
    border-color: #fde68a;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-weight: 700;
    font-size: 0.95rem;
  }

  &__sub {
    color: #64748b;
    font-size: 0.8rem;
    margin-top: 2px;
    word-break: break-word;
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
  }
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #e2e8f0;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #cbd5e1;

  .initials {
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  &--group {
    background: #eef2ff;
    color: #4338ca;
    border-color: #c7d2fe;
  }

  &--pending {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fdba74;
  }
}

.settings-btn {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 9px 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font: inherit;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  &--primary {
    color: #fff;
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    box-shadow: 0 8px 18px rgba(67, 56, 202, 0.14);
  }

  &--secondary {
    color: #334155;
    background: #fff;
    border-color: #dbe3ee;
  }

  &--danger {
    color: #fff;
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    box-shadow: 0 8px 18px rgba(220, 38, 38, 0.14);
  }

  &--danger-ghost {
    color: #b91c1c;
    background: #fef2f2;
    border-color: #fecaca;
  }
}

.danger-actions {
  margin-top: 16px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;

  &__copy {
    max-width: 600px;
    color: #475569;
    line-height: 1.55;
    font-weight: 600;
    font-size: 0.9rem;
  }

  &__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
}

.invite-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.invite-modal {
  width: min(100%, 520px);
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 54px rgba(15, 23, 42, 0.16);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 20px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    h4 {
      margin: 4px 0 0;
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
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      color: #334155;
      font-size: 0.9rem;
      font-weight: 600;
    }

    input {
      width: 100%;
      border: 1px solid #dbe3ee;
      border-radius: 10px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;

      &:focus {
        outline: none;
        border-color: #818cf8;
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.16);
      }
    }
  }

  &__error {
    color: #dc2626;
    font-size: 0.82rem;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;
  }
}

@media (max-width: 900px) {
  .project-setting {
    &__header {
      flex-direction: column;
      align-items: stretch;
      padding-bottom: 12px;
    }

    &__meta {
      justify-content: flex-start;
      padding-top: 0;
    }
  }

  .settings-card__header,
  .danger-actions,
  .member-row {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .member-row__controls,
  .danger-actions__buttons {
    justify-content: stretch;
  }

  .settings-btn {
    width: 100%;
  }
}
</style>
