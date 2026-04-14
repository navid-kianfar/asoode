<template>
    <AppModal
      v-model="visible"
      :title="$t('MEMBERS')"
      :subtitle="workPackage?.title"
      :width="440"
      @close="$emit('close')"
    >
      <div class="wp-members-modal">
        <!-- Members list -->
        <div v-for="member in members" :key="member.id" class="wp-member-row">
          <v-avatar color="primary" size="36" class="mr-3">
            <span class="text-white text-caption">{{ getInitial(member) }}</span>
          </v-avatar>
          <div class="wp-member-info">
            <div class="wp-member-name">{{ resolveUserName(member.recordId) || member.recordId }}</div>
            <div class="wp-member-access">
              <span
                v-if="member.access === AccessType.Owner"
                class="text-primary font-weight-bold text-caption"
              >
                {{ $t('OWNER') }}
              </span>
              <AppSelect
                v-else-if="canAdmin"
                :model-value="member.access"
                :items="accessItems"
                :disabled="member.waiting"
                compact
                @update:model-value="$emit('change-access', member, $event)"
              />
              <span v-else class="text-disabled text-caption">
                {{ getAccessLabel(member.access) }}
              </span>
            </div>
          </div>
          <v-btn
            v-if="member.access !== AccessType.Owner && canAdmin"
            icon="mdi-close-circle-outline"
            size="small"
            variant="text"
            color="error"
            :disabled="member.waiting"
            @click="$emit('remove-member', member)"
          />
        </div>

        <!-- Pending invitations -->
        <template v-if="pending.length">
          <v-divider class="my-4" />
          <div class="text-overline text-disabled mb-2">{{ $t('PENDING_INVITATIONS') }}</div>
          <div
            v-for="p in pending"
            :key="p.id"
            class="wp-member-row wp-member-row--pending"
          >
            <v-avatar color="grey-lighten-2" size="36" class="mr-3">
              <span class="text-caption">{{ p.identifier?.charAt(0)?.toUpperCase() || '?' }}</span>
            </v-avatar>
            <div class="wp-member-info">
              <div class="wp-member-name">{{ p.identifier }}</div>
              <div class="wp-member-access">
                <AppSelect
                  v-if="canAdmin"
                  :model-value="p.access"
                  :items="accessItems"
                  :disabled="p.waiting"
                  compact
                  @update:model-value="$emit('change-pending', p, $event)"
                />
              </div>
            </div>
            <v-btn
              v-if="canAdmin"
              icon="mdi-close-circle-outline"
              size="small"
              variant="text"
              color="error"
              :disabled="p.waiting"
              @click="$emit('remove-pending', p)"
            />
          </div>
        </template>
      </div>

      <template v-if="canAdmin" #footer>
        <v-btn variant="text" @click="$emit('close')">
          {{ $t('CLOSE') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          prepend-icon="mdi-plus"
          @click="$emit('invite')"
        >
          {{ $t('INVITE_MEMBER') }}
        </v-btn>
      </template>
    </AppModal>
</template>

<script setup lang="ts">
import { ref, inject, computed, type Ref, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type WorkPackageViewModel,
  type WorkPackageMemberViewModel,
  type PendingInvitationViewModel,
  AccessType,
} from '@asoode/shared';
import { useUserCache } from '@/composables/useUserCache';

const { t } = useI18n();
const { resolveUserName, resolveUserInitials } = useUserCache();
const visible = ref(true);

const workPackage = inject<Ref<WorkPackageViewModel | null>>('workPackage')!;
const permission = inject<ComputedRef<AccessType>>('permission')!;

defineEmits<{
  (e: 'close'): void;
  (e: 'change-access', member: WorkPackageMemberViewModel, access: number): void;
  (e: 'remove-member', member: WorkPackageMemberViewModel): void;
  (e: 'change-pending', pending: PendingInvitationViewModel, access: number): void;
  (e: 'remove-pending', pending: PendingInvitationViewModel): void;
  (e: 'invite'): void;
}>();

const accessItems = computed(() => [
  { text: t('ADMIN'), value: AccessType.Admin },
  { text: t('EDITOR'), value: AccessType.Editor },
  { text: t('HIDDEN_EDITOR'), value: AccessType.HiddenEditor },
  { text: t('VISITOR'), value: AccessType.Visitor },
]);

const members = computed(() => workPackage.value?.members || []);
const pending = computed(() => workPackage.value?.pending || []);

const canAdmin = computed(
  () => permission.value === AccessType.Owner || permission.value === AccessType.Admin,
);

const popoverStyle = computed(() => ({
  position: 'relative' as const,
}));

function getInitial(member: WorkPackageMemberViewModel): string {
  return resolveUserInitials(member.recordId) || member.recordId?.charAt(0)?.toUpperCase() || '?';
}

function getAccessLabel(access: AccessType): string {
  switch (access) {
    case AccessType.Owner:
      return t('OWNER');
    case AccessType.Admin:
      return t('ADMIN');
    case AccessType.Editor:
      return t('EDITOR');
    case AccessType.HiddenEditor:
      return t('HIDDEN_EDITOR');
    case AccessType.Visitor:
      return t('VISITOR');
    default:
      return t('VISITOR');
  }
}
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-members-popover-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wp-members-popover {
  width: 320px;
  max-height: 400px;
  background: $surface;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-4;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // ── Header ──────────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid $divider;
    flex-shrink: 0;

    h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }
  }

  &__close {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: $border-radius-sm;
    background: transparent;
    color: $text-secondary;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: $text-primary;
    }
  }

  // ── Body ────────────────────────────────────────────────────────────
  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 3px;
    }
  }

  // ── Member item ─────────────────────────────────────────────────────
  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    transition: background $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.03);

      .wp-members-popover__remove {
        opacity: 1;
      }
    }

    &--pending {
      opacity: 0.75;
    }
  }

  // ── Avatar ──────────────────────────────────────────────────────────
  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $primary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    flex-shrink: 0;
    text-transform: uppercase;

    &--pending {
      background: $text-secondary;
    }
  }

  // ── Info ─────────────────────────────────────────────────────────────
  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: 0.8rem;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ── Role badge ──────────────────────────────────────────────────────
  &__role {
    font-size: 0.7rem;
    color: $text-secondary;

    &--owner {
      color: $primary;
      font-weight: 600;
    }
  }

  // ── Remove button ───────────────────────────────────────────────────
  &__remove {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: $text-secondary;
    font-size: 1rem;
    cursor: pointer;
    opacity: 0;
    flex-shrink: 0;
    transition: opacity $transition-fast, color $transition-fast, background $transition-fast;

    &:hover {
      color: $warn;
      background: rgba($warn, 0.08);
    }

    &:disabled {
      opacity: 0.3 !important;
      cursor: not-allowed;
    }
  }

  // ── Divider ─────────────────────────────────────────────────────────
  &__divider {
    height: 1px;
    background: $divider;
    margin: 8px 16px;
  }

  // ── Section label ───────────────────────────────────────────────────
  &__section-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $text-secondary;
    padding: 4px 16px 8px;
  }

  // ── Footer ──────────────────────────────────────────────────────────
  &__footer {
    padding: 10px 16px;
    border-top: 1px solid $divider;
    flex-shrink: 0;
  }

  &__invite-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px;
    background: $primary;
    color: #fff;
    border: none;
    border-radius: $border-radius-sm;
    font-size: 0.8rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    justify-content: center;
    transition: background $transition-fast;

    i {
      font-size: 1rem;
    }

    &:hover {
      background: $primary-dark;
    }
  }
}

// ── Dark Mode ─────────────────────────────────────────────────────────
body.dark-mode {
  .wp-members-popover-backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .wp-members-popover {
    background: #313131;

    &__header {
      border-bottom-color: $dark-divider;

      h4 {
        color: $dark-text-primary;
      }
    }

    &__close {
      color: $dark-text-secondary;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: $dark-text-primary;
      }
    }

    &__body {
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    &__item {
      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }
    }

    &__avatar {
      background: $primary-light;

      &--pending {
        background: $dark-text-secondary;
      }
    }

    &__name {
      color: $dark-text-primary;
    }

    &__role {
      color: $dark-text-secondary;

      &--owner {
        color: $primary-light;
      }
    }

    &__remove {
      color: $dark-text-secondary;

      &:hover {
        color: $warn;
        background: rgba($warn, 0.12);
      }
    }

    &__divider {
      background: $dark-divider;
    }

    &__section-label {
      color: $dark-text-secondary;
    }

    &__footer {
      border-top-color: $dark-divider;
    }

    &__invite-btn {
      background: $primary-light;

      &:hover {
        background: $primary;
      }
    }
  }
}
</style>
