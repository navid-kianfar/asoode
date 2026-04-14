<template>
  <section class="group-members">
    <header class="group-members__header">
      <div class="group-members__heading">
        <p class="group-members__eyebrow">{{ $t('MEMBERS') }}</p>
        <p class="group-members__summary">
          Review active members, manage invitations, and adjust access without leaving the page.
        </p>
      </div>

      <div class="group-members__meta">
        <span class="group-members__chip">
          <i class="mdi mdi-account-group-outline"></i>
          <strong>{{ props.group.members?.length || 0 }}</strong>
          <span class="group-members__chip-label">{{ $t('MEMBERS') }}</span>
        </span>
        <span class="group-members__chip">
          <i class="mdi mdi-email-fast-outline"></i>
          <strong>{{ props.group.pending?.length || 0 }}</strong>
          <span class="group-members__chip-label">{{ $t('PENDING') }}</span>
        </span>
      </div>
    </header>

    <article class="members-panel">
      <div class="members-panel__toolbar">
        <label class="members-search">
          <i class="mdi mdi-magnify"></i>
          <input
            v-model="filter"
            :placeholder="$t('MEMBER_SEARCH')"
            type="text"
          />
        </label>

        <button
          :disabled="isArchived"
          class="settings-btn settings-btn--secondary"
          @click="invite()"
        >
          <i class="mdi mdi-account-plus-outline"></i>
          {{ $t('INVITE_NEW_MEMBER') }}
        </button>
      </div>

      <div class="members-list">
        <div
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-row"
        >
          <div class="member-row__identity">
            <div v-if="member.member?.avatar" class="avatar">
              <img :src="member.member.avatar" alt="" />
            </div>
            <div v-else class="avatar avatar--fallback">
              <span class="initials">{{ getInitials(member) }}</span>
            </div>

            <div class="member-row__copy">
              <span class="member-row__name">
                {{ member.member?.fullName || $t('UNKNOWN') }}
              </span>
              <span
                v-if="member.member?.email && !member.member.email.includes('@asoode.user')"
                class="member-row__sub"
              >
                {{ member.member.email }}
              </span>
              <span v-else class="member-row__sub">
                {{ accessText(member.access) }}
              </span>
              <span v-if="member.member?.bio" class="member-row__bio">
                {{ member.member.bio }}
              </span>
            </div>
          </div>

          <div class="member-row__controls">
            <AppSelect
              :model-value="member.access"
              :items="accessItems"
              :disabled="member.waiting || !canChangeAccess(member)"
              compact
              @update:model-value="accessChange(member, $event)"
            />

            <button
              v-if="canRemoveAccess(member)"
              :disabled="member.waiting"
              class="settings-btn settings-btn--danger-ghost"
              @click="removeAccess(member)"
            >
              <i v-if="member.waiting" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-account-remove-outline"></i>
              {{ $t('REMOVE_ACCESS') }}
            </button>

            <button
              v-if="member.access !== AccessType.Owner && props.permission === AccessType.Owner"
              :disabled="member.waiting"
              class="settings-btn settings-btn--secondary"
              @click="transferOwnership(member)"
            >
              <i v-if="member.waiting" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-crown-outline"></i>
              {{ $t('TRANSFER_OWNERSHIP') }}
            </button>
          </div>
        </div>

        <div
          v-for="pending in props.group.pending"
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
              :disabled="pending.waiting || pending.deleting || !canRemovePendingAccess(pending)"
              compact
              @update:model-value="accessPendingChange(pending, $event)"
            />

            <button
              v-if="canRemovePendingAccess(pending)"
              :disabled="pending.waiting || pending.deleting"
              class="settings-btn settings-btn--danger-ghost"
              @click="removePendingAccess(pending)"
            >
              <i v-if="pending.deleting" class="mdi mdi-loading mdi-spin"></i>
              <i v-else class="mdi mdi-close-circle-outline"></i>
              {{ $t('REMOVE_ACCESS') }}
            </button>
          </div>
        </div>

        <div v-if="!filteredMembers.length && !props.group.pending.length" class="members-empty">
          <i class="mdi mdi-account-search-outline"></i>
          <span>{{ $t('NOT_FOUND') }}</span>
        </div>
      </div>
    </article>

    <div v-if="showInviteModal" class="invite-backdrop" @click.self="showInviteModal = false">
      <div class="invite-modal">
        <div class="invite-modal__header">
          <div>
            <p class="invite-modal__eyebrow">{{ $t('INVITE_NEW_MEMBER') }}</p>
            <h4>{{ $t('MEMBERS') }}</h4>
          </div>
          <button class="invite-modal__close" @click="showInviteModal = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <form class="invite-modal__body" @submit.prevent="onInvite()">
          <div class="invite-modal__field">
            <label>{{ $t('EMAIL_OR_USERNAME') }}</label>
            <input
              v-model="inviteIdentifier"
              type="text"
              :placeholder="$t('ENTER_EMAIL_OR_USERNAME')"
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
import { useGroupStore } from '@/stores/group.store';
import { useAuthStore } from '@/stores/auth.store';
import {
  AccessType,
  OperationResultStatus,
  type GroupViewModel,
  type GroupMemberViewModel,
  type PendingInvitationViewModel,
} from '@asoode/shared';
import { stringFormat } from '@/plugins/i18n';
import { useModal } from '@/composables/useModal';

const props = defineProps<{
  group: GroupViewModel;
  permission: AccessType;
}>();

const { t } = useI18n();
const groupStore = useGroupStore();
const authStore = useAuthStore();
const modal = useModal();

const filter = ref('');
const showInviteModal = ref(false);
const inviteIdentifier = ref('');
const inviteAccess = ref<number>(AccessType.Editor);
const inviting = ref(false);
const inviteError = ref('');

const accessItems = computed(() => [
  { text: t('ADMIN'), value: AccessType.Admin },
  { text: t('EDITOR'), value: AccessType.Editor },
  { text: t('HIDDEN_EDITOR'), value: AccessType.HiddenEditor },
  { text: t('VISITOR'), value: AccessType.Visitor },
]);

const filteredMembers = computed(() => {
  if (!props.group.members) return [];
  if (!filter.value) return props.group.members;
  const query = filter.value.toLowerCase();
  return props.group.members.filter(member => {
    const name = (member.member?.fullName || '').toLowerCase();
    const email = (member.member?.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });
});

const isArchived = computed(() => props.group.archivedAt !== null && props.group.archivedAt !== undefined);

function getInitials(member: GroupMemberViewModel): string {
  const fullName = member.member?.fullName?.trim();
  if (fullName) {
    const parts = fullName.split(/\s+/).slice(0, 2);
    return parts.map(part => part[0]).join('').toUpperCase();
  }
  const email = member.member?.email || '';
  return email ? email.slice(0, 2).toUpperCase() : '?';
}

function accessText(access: AccessType): string {
  switch (access) {
    case AccessType.Admin:
      return t('ADMIN');
    case AccessType.Editor:
      return t('EDITOR');
    case AccessType.HiddenEditor:
      return t('HIDDEN_EDITOR');
    case AccessType.Owner:
      return t('OWNER');
    default:
      return t('VISITOR');
  }
}

function canRemoveAccess(member: GroupMemberViewModel): boolean {
  if (member.access === AccessType.Owner) return false;
  return (
    props.permission === AccessType.Owner ||
    props.permission === AccessType.Admin ||
    member.userId === authStore.userId
  );
}

function canChangeAccess(member: GroupMemberViewModel): boolean {
  if (member.access === AccessType.Owner) return false;
  return props.permission === AccessType.Owner || props.permission === AccessType.Admin;
}

function canRemovePendingAccess(member: PendingInvitationViewModel): boolean {
  if (member.access === AccessType.Owner) return false;
  return props.permission === AccessType.Owner || props.permission === AccessType.Admin;
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
  const result = await groupStore.addAccess(props.group.id, {
    members: [
      {
        id: inviteIdentifier.value,
        access: inviteAccess.value,
        isGroup: false,
      },
    ],
  });

  if (result.status === OperationResultStatus.Success) {
    showInviteModal.value = false;
    inviteIdentifier.value = '';
  } else {
    inviteError.value = 'INVITE_FAILED';
  }

  inviting.value = false;
}

function removeAccess(member: GroupMemberViewModel) {
  modal.confirm({
    title: 'REMOVE_ACCESS',
    heading: stringFormat(t('REMOVE_MEMBER_CONFIRM_HEADING'), member.member?.fullName || ''),
    message: 'REMOVE_MEMBER_CONFIRM',
    actionLabel: 'REMOVE_ACCESS',
    cancelLabel: 'CANCEL',
    action: async () => {
      member.waiting = true;
      const op = await groupStore.removeAccess(member.id);
      member.waiting = false;
      if (op.status === OperationResultStatus.Success) {
        const index = props.group.members.findIndex(item => item.id === member.id);
        if (index !== -1) props.group.members.splice(index, 1);
      }
    },
  });
}

async function accessChange(member: GroupMemberViewModel, access: number) {
  member.access = access as AccessType;
  member.waiting = true;
  await groupStore.changeAccess(member.id, { access });
  member.waiting = false;
}

async function transferOwnership(member: GroupMemberViewModel) {
  modal.confirm({
    title: 'TRANSFER_OWNERSHIP',
    heading: stringFormat(t('TRANSFER_OWNERSHIP_CONFIRM_HEADING'), member.member?.fullName || ''),
    message: 'TRANSFER_OWNERSHIP_CONFIRM',
    actionLabel: 'TRANSFER',
    cancelLabel: 'CANCEL',
    action: async () => {
      member.waiting = true;
      const op = await groupStore.changeAccess(member.id, { access: AccessType.Owner });
      member.waiting = false;
      if (op.status === OperationResultStatus.Success) {
        await groupStore.load();
      }
    },
  });
}

async function accessPendingChange(member: PendingInvitationViewModel, access: number) {
  member.access = access as AccessType;
  member.waiting = true;
  await groupStore.changePendingAccess(member.id, { access });
  member.waiting = false;
}

function removePendingAccess(member: PendingInvitationViewModel) {
  modal.confirm({
    title: 'REMOVE_ACCESS',
    heading: stringFormat(t('REMOVE_MEMBER_CONFIRM_HEADING'), member.identifier),
    message: 'REMOVE_MEMBER_CONFIRM',
    actionLabel: 'REMOVE_ACCESS',
    cancelLabel: 'CANCEL',
    action: async () => {
      member.deleting = true;
      const op = await groupStore.removePendingAccess(member.id);
      member.deleting = false;
      if (op.status === OperationResultStatus.Success) {
        const index = props.group.pending.findIndex(item => item.id === member.id);
        if (index !== -1) props.group.pending.splice(index, 1);
      }
    },
  });
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.group-members {
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
}

.members-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;

    @media (max-width: 760px) {
      flex-direction: column;
      align-items: stretch;
    }
  }
}

.members-search {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  flex: 1;

  .mdi {
    font-size: 18px;
    color: #94a3b8;
  }

  input {
    width: 100%;
    border: 0;
    background: transparent;
    outline: none;
    color: $text-primary;
    font: inherit;
    font-size: 13px;
  }
}

.members-list {
  display: flex;
  flex-direction: column;
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #eef2f7;

  &:first-child {
    border-top: 0;
    padding-top: 4px;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }

  &--pending .avatar {
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  &__copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__name {
    color: $text-primary;
    font-size: 14px;
    font-weight: 700;
  }

  &__sub,
  &__bio {
    color: $text-secondary;
    font-size: 12px;
    line-height: 1.45;
    word-break: break-word;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;

    @media (max-width: 900px) {
      justify-content: flex-start;
    }
  }
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(79, 70, 229, 0.12);
  color: #4f46e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(199, 210, 254, 0.8);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &--fallback {
    background: rgba(148, 163, 184, 0.12);
    color: #475569;
    border-color: #dbe3ee;
  }
}

.initials {
  font-size: 12px;
  font-weight: 700;
}

.members-empty {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: $text-secondary;

  .mdi {
    font-size: 28px;
    color: $text-disabled;
  }
}

.invite-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.invite-modal {
  width: min(500px, calc(100vw - 32px));
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #eef2f7;

    h4 {
      margin: 4px 0 0;
      font-size: 16px;
      font-weight: 700;
      color: $text-primary;
    }
  }

  &__eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: $text-secondary;
  }

  &__close {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: $text-secondary;
    cursor: pointer;

    &:hover {
      background: #f8fafc;
      color: $text-primary;
    }
  }

  &__body {
    padding: 18px 20px 20px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;

    label {
      font-size: 12px;
      font-weight: 700;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    input {
      width: 100%;
      min-height: 42px;
      border-radius: 12px;
      border: 1px solid #dbe3ee;
      background: #f8fafc;
      padding: 0 14px;
      font: inherit;
      font-size: 13px;
      color: $text-primary;
      outline: none;

      &:focus {
        border-color: #a5b4fc;
        background: #fff;
      }
    }
  }

  &__error {
    font-size: 12px;
    color: #dc2626;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
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

  &--danger-ghost {
    background: rgba(254, 242, 242, 0.8);
    border-color: rgba(248, 113, 113, 0.26);
    color: #dc2626;

    &:hover:not(:disabled) {
      background: rgba(254, 226, 226, 0.95);
    }
  }
}
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .group-members {
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

  .members-panel {
    background: rgba(30, 41, 59, 0.72);
    border-color: rgba(71, 85, 105, 0.68);
  }

  .members-search {
    background: rgba(15, 23, 42, 0.46);
    border-color: rgba(71, 85, 105, 0.68);

    input {
      color: $dark-text-light;
    }
  }

  .member-row {
    border-top-color: rgba(71, 85, 105, 0.4);

    &__name {
      color: $dark-text-light;
    }

    &__sub,
    &__bio {
      color: $dark-text-muted;
    }
  }

  .avatar {
    border-color: rgba(99, 102, 241, 0.26);

    &--fallback {
      background: rgba(148, 163, 184, 0.14);
      border-color: rgba(71, 85, 105, 0.8);
      color: #cbd5e1;
    }
  }

  .members-empty {
    color: $dark-text-muted;

    .mdi {
      color: rgba(148, 163, 184, 0.9);
    }
  }

  .invite-backdrop {
    background: rgba(2, 6, 23, 0.58);
  }

  .invite-modal {
    background: $dark-card;
    border-color: rgba(71, 85, 105, 0.72);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);

    &__header {
      border-bottom-color: rgba(71, 85, 105, 0.5);

      h4 {
        color: $dark-text-light;
      }
    }

    &__eyebrow {
      color: $dark-text-muted;
    }

    &__close {
      color: $dark-text-muted;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        color: $dark-text-light;
      }
    }

    &__field {
      label {
        color: $dark-text-muted;
      }

      input {
        background: rgba(15, 23, 42, 0.5);
        border-color: rgba(71, 85, 105, 0.72);
        color: $dark-text-light;

        &:focus {
          background: rgba(15, 23, 42, 0.7);
          border-color: rgba(129, 140, 248, 0.7);
        }
      }
    }
  }

  .group-members .settings-btn {
    &--secondary {
      background: rgba(30, 41, 59, 0.9);
      color: $dark-text-muted;
      border-color: rgba(71, 85, 105, 0.8);

      &:hover:not(:disabled) {
        background: rgba(51, 65, 85, 0.92);
        color: $dark-text-light;
      }
    }

    &--danger-ghost {
      background: rgba(127, 29, 29, 0.25);
      border-color: rgba(248, 113, 113, 0.24);
      color: #fca5a5;
    }
  }
}
</style>
