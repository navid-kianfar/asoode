<template>
  <div class="wp-toolbar">
    <!-- Left: Filter chips -->
    <div class="wp-toolbar__filters">
      <!-- My Tasks chip -->
      <button
        class="wp-toolbar__chip"
        :class="{ 'wp-toolbar__chip--active': filtersMine }"
        @click="$emit('toggle-mine')"
      >
        <i class="mdi mdi-account-check"></i>
        <span>{{ $t('MY_TASKS') }}</span>
      </button>

      <!-- Label chips -->
      <button
        v-for="label in labels"
        :key="label.id"
        class="wp-toolbar__chip wp-toolbar__chip--label"
        :class="{ 'wp-toolbar__chip--label-active': filtersLabels[label.id] }"
        :style="labelStyle(label, filtersLabels[label.id])"
        @click="$emit('toggle-label', label.id)"
      >
        <span class="wp-toolbar__chip-dot" :style="{ backgroundColor: label.color }"></span>
        <span>{{ label.title }}</span>
      </button>

      <!-- Active chip -->
      <button
        class="wp-toolbar__chip"
        :class="{ 'wp-toolbar__chip--active': filtersActive }"
        @click="$emit('toggle-active')"
      >
        <span>{{ $t('ACTIVE') }}</span>
      </button>

      <!-- Archived chip -->
      <button
        class="wp-toolbar__chip"
        :class="{ 'wp-toolbar__chip--active': filtersArchived }"
        @click="$emit('toggle-archived')"
      >
        <i class="mdi mdi-archive-outline"></i>
        <span>{{ $t('ARCHIVED') }}</span>
      </button>
    </div>

    <!-- Center: Members avatar stack -->
    <div class="wp-toolbar__members" @click="$emit('open-members')">
      <div
        v-for="(member, idx) in visibleMembers"
        :key="member.id"
        class="wp-toolbar__avatar"
        :style="{ zIndex: visibleMembers.length - idx }"
        :title="resolveUserName(member.recordId)"
      >
        {{ resolveUserInitials(member.recordId) }}
      </div>
      <div
        v-if="overflowCount > 0"
        class="wp-toolbar__avatar wp-toolbar__avatar--overflow"
        :style="{ zIndex: 0 }"
      >
        +{{ overflowCount }}
      </div>
      <button
        v-if="canInvite"
        class="wp-toolbar__avatar wp-toolbar__avatar--invite"
        :title="$t('INVITE')"
        @click.stop="$emit('open-invite')"
      >
        <i class="mdi mdi-plus"></i>
      </button>
    </div>

    <!-- Right: Progress ring + Objectives -->
    <div class="wp-toolbar__right">
      <!-- Progress ring -->
      <div class="wp-toolbar__progress" @mouseenter="showStats = true" @mouseleave="showStats = false">
        <svg
          class="wp-toolbar__progress-ring"
          width="40"
          height="40"
          viewBox="0 0 40 40"
        >
          <circle
            class="wp-toolbar__progress-track"
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke-width="3"
          />
          <circle
            class="wp-toolbar__progress-fill"
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke-width="3"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
            stroke-linecap="round"
          />
          <text
            x="20"
            y="20"
            text-anchor="middle"
            dominant-baseline="central"
            class="wp-toolbar__progress-text"
          >
            {{ progressPercent }}%
          </text>
        </svg>

        <!-- Stats popup on hover -->
        <div v-if="showStats" class="wp-toolbar__stats-popup">
          <div class="wp-toolbar__stats-row">
            <span class="wp-toolbar__stats-label">{{ $t('TOTAL') }}</span>
            <span class="wp-toolbar__stats-value">{{ progress.total }}</span>
          </div>
          <div class="wp-toolbar__stats-row">
            <span class="wp-toolbar__stats-label">{{ $t('DONE') }}</span>
            <span class="wp-toolbar__stats-value wp-toolbar__stats-value--done">{{ progress.done }}</span>
          </div>
          <div class="wp-toolbar__stats-row">
            <span class="wp-toolbar__stats-label">{{ $t('CANCELED') }}</span>
            <span class="wp-toolbar__stats-value wp-toolbar__stats-value--canceled">{{ progress.canceledOrDuplicate }}</span>
          </div>
        </div>
      </div>

      <!-- Objectives button -->
      <button class="wp-toolbar__objectives-btn" @click="$emit('open-objectives')">
        <i class="mdi mdi-bullseye-arrow"></i>
        <span v-if="objectivesCount > 0" class="wp-toolbar__objectives-badge">
          {{ objectivesCount }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, type Ref, type ComputedRef } from 'vue';
import {
  type WorkPackageViewModel,
  type WorkPackageLabelViewModel,
  AccessType,
} from '@asoode/shared';
import { useUserCache } from '@/composables/useUserCache';

const workPackage = inject<Ref<WorkPackageViewModel | null>>('workPackage')!;
const permission = inject<ComputedRef<AccessType>>('permission')!;

const props = defineProps<{
  filtersMine: boolean;
  filtersArchived: boolean;
  filtersActive: boolean;
  filtersLabels: Record<string, boolean>;
}>();

defineEmits<{
  (e: 'toggle-mine'): void;
  (e: 'toggle-archived'): void;
  (e: 'toggle-active'): void;
  (e: 'toggle-label', labelId: string): void;
  (e: 'open-objectives'): void;
  (e: 'open-members'): void;
  (e: 'open-invite'): void;
}>();

const { resolveUserInitials, resolveUserName } = useUserCache();

const showStats = ref(false);

const MAX_VISIBLE_MEMBERS = 5;
const RADIUS = 16;
const circumference = 2 * Math.PI * RADIUS;

// ── Computed ────────────────────────────────────────────────────────────

const labels = computed<WorkPackageLabelViewModel[]>(() => {
  return workPackage.value?.labels || [];
});

const members = computed(() => {
  return (workPackage.value?.members || []).filter(m => !m.isGroup);
});

const visibleMembers = computed(() => {
  return members.value.slice(0, MAX_VISIBLE_MEMBERS);
});

const overflowCount = computed(() => {
  return Math.max(0, members.value.length - MAX_VISIBLE_MEMBERS);
});

const canInvite = computed(() => {
  return (
    permission.value === AccessType.Owner ||
    permission.value === AccessType.Admin
  );
});

const progress = computed(() => {
  return workPackage.value?.progress || { percent: 0, total: 0, done: 0, canceledOrDuplicate: 0 };
});

const progressPercent = computed(() => {
  return Math.round(progress.value.percent || 0);
});

const progressOffset = computed(() => {
  const pct = Math.min(100, Math.max(0, progressPercent.value));
  return circumference - (pct / 100) * circumference;
});

const objectivesCount = computed(() => {
  return workPackage.value?.objectives?.length || 0;
});

// ── Helpers ─────────────────────────────────────────────────────────────

function labelStyle(label: WorkPackageLabelViewModel, isActive: boolean) {
  if (isActive) {
    return {
      backgroundColor: label.color,
      color: label.darkColor ? '#fff' : '#333',
      borderColor: label.color,
    };
  }
  return {};
}
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-toolbar {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 20px;
  gap: 12px;
  background: transparent;

  // ── Filter chips (left) ────────────────────────────────────────────
  &__filters {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    overflow-x: auto;

    // Hide scrollbar
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border: 1px solid $divider;
    border-radius: 16px;
    background: transparent;
    color: $text-secondary;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background $transition-fast, color $transition-fast, border-color $transition-fast;
    font-family: inherit;
    flex-shrink: 0;

    i {
      font-size: 0.85rem;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.2);
    }

    &--active {
      background: $primary;
      color: #fff;
      border-color: $primary;

      &:hover {
        background: $primary-dark;
        border-color: $primary-dark;
      }
    }

    &--label {
      gap: 5px;
    }

    &--label-active {
      border-color: transparent;
    }
  }

  &__chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  // ── Members avatar stack (center) ──────────────────────────────────
  &__members {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
  }

  &__avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e6e6e6;
    border: 2px solid $surface;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 600;
    color: $text-primary;
    position: relative;
    transition: transform $transition-fast;

    // Stack overlap: each avatar after the first overlaps the previous
    & + & {
      margin-inline-start: -6px;
    }

    &:hover {
      transform: translateY(-2px);
    }

    &--overflow {
      background: #d0d0d0;
      font-size: 0.6rem;
      font-weight: 700;
      color: $text-secondary;
    }

    &--invite {
      background: transparent;
      border: 2px dashed $divider;
      color: $text-secondary;
      cursor: pointer;
      transition: border-color $transition-fast, color $transition-fast;

      i {
        font-size: 0.9rem;
      }

      &:hover {
        border-color: $primary;
        color: $primary;
      }
    }
  }

  // ── Right section ──────────────────────────────────────────────────
  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  // ── Progress ring ──────────────────────────────────────────────────
  &__progress {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
  }

  &__progress-ring {
    display: block;
    transform: rotate(-90deg);
  }

  &__progress-track {
    stroke: $divider;
  }

  &__progress-fill {
    stroke: $success;
    transition: stroke-dashoffset 400ms ease;
  }

  &__progress-text {
    font-size: 0.55rem;
    font-weight: 600;
    fill: $text-primary;
    // Counteract the SVG rotation so text reads upright
    transform-origin: 20px 20px;
    transform: rotate(90deg);
  }

  // ── Stats popup ────────────────────────────────────────────────────
  &__stats-popup {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 6px;
    background: $surface;
    border: 1px solid $divider;
    border-radius: $border-radius-md;
    box-shadow: $shadow-2;
    padding: 10px 14px;
    z-index: 100;
    min-width: 140px;
  }

  &__stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
    font-size: 0.75rem;
  }

  &__stats-label {
    color: $text-secondary;
  }

  &__stats-value {
    font-weight: 600;
    color: $text-primary;

    &--done {
      color: $success;
    }

    &--canceled {
      color: $warn;
    }
  }

  // ── Objectives button ──────────────────────────────────────────────
  &__objectives-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: $border-radius-sm;
    background: transparent;
    color: $text-secondary;
    font-size: 1.15rem;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: $text-primary;
    }
  }

  &__objectives-badge {
    position: absolute;
    top: 2px;
    right: 0;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    background: $primary;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    line-height: 1;
  }
}

// ── Responsive ─────────────────────────────────────────────────────────

// Tablet breakpoint
@media (max-width: 768px) {
  .wp-toolbar {
    padding: 0 14px;
    gap: 10px;

    // Touch-friendly chip sizing
    &__chip {
      min-height: 44px;
      padding: 6px 12px;
    }

    // Touch-friendly objectives button
    &__objectives-btn {
      width: 44px;
      height: 44px;
    }
  }
}

// Mobile breakpoint
@media (max-width: $breakpoint-sm) {
  .wp-toolbar {
    padding: 0 10px;
    gap: 6px;

    // Collapse filter layout
    &__filters {
      gap: 4px;
    }

    // Icons only on filter chips — hide labels
    &__chip {
      min-height: 44px;
      padding: 6px 8px;

      span {
        display: none;
      }

      // Keep icon visible
      i {
        display: inline-flex;
        font-size: 1rem;
      }

      // Keep the color dot visible on label chips
      .wp-toolbar__chip-dot {
        display: inline-block;
      }
    }

    // Hide member avatars
    &__members {
      display: none;
    }

    // Touch-friendly objectives button
    &__objectives-btn {
      width: 44px;
      height: 44px;
    }
  }
}

// ── Dark mode ──────────────────────────────────────────────────────────
body.dark-mode {
  .wp-toolbar {
    &__chip {
      border-color: $dark-divider;
      color: $dark-text-secondary;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.2);
      }

      &--active {
        background: $primary;
        color: #fff;
        border-color: $primary;

        &:hover {
          background: $primary-light;
          border-color: $primary-light;
        }
      }
    }

    &__avatar {
      background: $dark-card;
      border-color: $dark-background;
      color: $dark-text-primary;

      &--overflow {
        background: $dark-card-inner;
        color: $dark-text-secondary;
      }

      &--invite {
        background: transparent;
        border-color: $dark-divider;
        color: $dark-text-secondary;

        &:hover {
          border-color: $primary-light;
          color: $primary-light;
        }
      }
    }

    &__progress-track {
      stroke: $dark-divider;
    }

    &__progress-text {
      fill: $dark-text-primary;
    }

    &__stats-popup {
      background: $dark-card;
      border-color: $dark-border;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    &__stats-label {
      color: $dark-text-secondary;
    }

    &__stats-value {
      color: $dark-text-primary;
    }

    &__objectives-btn {
      color: $dark-text-secondary;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: $dark-text-primary;
      }
    }
  }
}
</style>
