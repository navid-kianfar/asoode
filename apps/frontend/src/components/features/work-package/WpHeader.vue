<template>
  <div class="wp-header">
    <!-- Left: Breadcrumb -->
    <div class="wp-header__breadcrumb">
      <span class="wp-header__project-name" @click="goToProject">
        {{ projectData?.title || '' }}
      </span>
      <i class="mdi mdi-chevron-right wp-header__separator"></i>
      <span class="wp-header__package-title" @mouseenter="hoverTitle = true" @mouseleave="hoverTitle = false">
        {{ workPackage?.title || '' }}
        <i
          v-if="hoverTitle && canRename"
          class="mdi mdi-pencil wp-header__rename-icon"
          @click.stop="$emit('open-rename')"
        ></i>
      </span>
    </div>

    <!-- Center: View mode tabs with underline indicator -->
    <div class="wp-header__tabs" ref="tabsRef">
      <button
        v-for="(tab, index) in viewTabs"
        :key="tab.mode"
        :ref="el => setTabRef(el as HTMLElement, index)"
        class="wp-header__tab"
        :class="{ 'wp-header__tab--active': viewMode === tab.mode }"
        @click="$emit('switch-mode', tab.mode)"
      >
        <i :class="'mdi ' + tab.icon"></i>
        <span>{{ tab.label }}</span>
      </button>
      <div class="wp-header__indicator" :style="indicatorStyle"></div>
    </div>

    <!-- Right: Actions -->
    <div class="wp-header__actions">
      <button
        class="wp-header__action-btn"
        :title="$t('MESSENGER')"
        @click="$emit('open-channel')"
      >
        <i class="mdi mdi-chat-outline"></i>
      </button>
      <button
        class="wp-header__action-btn"
        :title="$t('SETTINGS')"
        @click="$emit('open-settings')"
      >
        <i class="mdi mdi-cog-outline"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, watch, nextTick, onMounted, type Ref, type ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  type WorkPackageViewModel,
  type ProjectViewModel,
  AccessType,
} from '@asoode/shared';

const router = useRouter();
const workPackage = inject<Ref<WorkPackageViewModel | null>>('workPackage')!;
const projectData = inject<Ref<ProjectViewModel | null>>('projectData')!;
const permission = inject<ComputedRef<AccessType>>('permission')!;

const props = defineProps<{
  viewMode: 'board' | 'list' | 'timespan' | 'calendar';
}>();

defineEmits<{
  (e: 'switch-mode', mode: 'board' | 'list' | 'timespan' | 'calendar'): void;
  (e: 'open-settings'): void;
  (e: 'open-rename'): void;
  (e: 'open-channel'): void;
}>();

const { t } = useI18n();

const hoverTitle = ref(false);
const tabRefs = ref<(HTMLElement | null)[]>([]);

const canRename = computed(() => {
  return (
    permission.value === AccessType.Owner ||
    permission.value === AccessType.Admin
  );
});

const viewTabs = computed(() => [
  { mode: 'board' as const, icon: 'mdi-view-column', label: t('BOARD') },
  { mode: 'list' as const, icon: 'mdi-format-list-bulleted', label: t('LIST') },
  { mode: 'calendar' as const, icon: 'mdi-calendar', label: t('CALENDAR') },
  { mode: 'timespan' as const, icon: 'mdi-chart-timeline-variant', label: t('TIMELINE') },
]);

function setTabRef(el: HTMLElement | null, index: number) {
  tabRefs.value[index] = el;
}

const activeTabIndex = computed(() => {
  return viewTabs.value.findIndex(tab => tab.mode === props.viewMode);
});

const indicatorStyle = ref<Record<string, string>>({});

function updateIndicator() {
  const idx = activeTabIndex.value;
  const el = tabRefs.value[idx];
  if (el) {
    indicatorStyle.value = {
      width: `${el.offsetWidth}px`,
      transform: `translateX(${el.offsetLeft}px)`,
    };
  }
}

watch(() => props.viewMode, () => nextTick(updateIndicator));
onMounted(() => nextTick(updateIndicator));

function goToProject() {
  if (projectData.value) {
    router.push(`/project/${projectData.value.id}`);
  }
}
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  gap: 16px;
  background: $surface;
  border-bottom: 1px solid $divider;

  // ── Breadcrumb (left) ──────────────────────────────────────────────
  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    min-width: 0;
  }

  &__project-name {
    font-size: 13px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover {
      color: $primary;
    }
  }

  &__separator {
    font-size: 12px;
    color: $text-disabled;
    flex-shrink: 0;
  }

  &__package-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    position: relative;
  }

  &__rename-icon {
    font-size: 13px;
    color: $text-secondary;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover {
      color: $primary;
    }
  }

  // ── View mode tabs (center) ────────────────────────────────────────
  &__tabs {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 0 auto;
    position: relative;
    height: 100%;
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 100%;
    border: none;
    background: transparent;
    color: $text-secondary;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: color $transition-fast, background-color $transition-fast;
    font-family: inherit;
    white-space: nowrap;
    position: relative;

    i {
      font-size: 16px;
    }

    &:hover {
      color: $text-primary;
      background: rgba(0, 0, 0, 0.03);
    }

    &--active {
      color: $primary;
      font-weight: 600;

      &:hover {
        color: $primary;
        background: rgba($primary, 0.04);
      }
    }
  }

  &__indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: $primary;
    border-radius: 2px 2px 0 0;
    transition: transform 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, width;
  }

  // ── Actions (right) ────────────────────────────────────────────────
  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  &__action-btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: $border-radius-sm;
    background: transparent;
    color: $text-secondary;
    font-size: 18px;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: $primary;
    }
  }
}

// ── Responsive ─────────────────────────────────────────────────────────

// Tablet breakpoint
@media (max-width: 768px) {
  .wp-header {
    padding: 0 14px;
    gap: 10px;

    &__project-name {
      max-width: 120px;
    }

    &__package-title {
      max-width: 160px;
    }

    &__tab {
      padding: 0 12px;
    }

    // Ensure touch-friendly sizing for action buttons
    &__action-btn {
      width: 44px;
      height: 44px;
      font-size: 20px;
    }
  }
}

// Mobile breakpoint
@media (max-width: $breakpoint-sm) {
  .wp-header {
    padding: 0 10px;
    gap: 6px;

    &__breadcrumb {
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
    }

    &__project-name {
      display: none;
    }

    &__separator {
      display: none;
    }

    &__package-title {
      max-width: 100px;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // Icons only — hide label text
    &__tab span {
      display: none;
    }

    &__tab {
      padding: 0 10px;
      min-width: 44px;
      min-height: 44px;
      justify-content: center;

      i {
        font-size: 18px;
      }
    }

    // Touch-friendly action buttons (44px minimum)
    &__action-btn {
      width: 44px;
      height: 44px;
      font-size: 20px;
    }
  }
}

// ── Dark mode ──────────────────────────────────────────────────────────
body.dark-mode {
  .wp-header {
    background: #2d2d2d;
    border-bottom-color: $dark-divider;

    &__project-name {
      color: $dark-text-secondary;

      &:hover {
        color: $primary-light;
      }
    }

    &__separator {
      color: rgba(255, 255, 255, 0.3);
    }

    &__package-title {
      color: $dark-text-primary;
    }

    &__rename-icon {
      color: $dark-text-secondary;

      &:hover {
        color: $primary-light;
      }
    }

    &__tab {
      color: $dark-text-secondary;

      &:hover {
        color: $dark-text-primary;
        background: rgba(255, 255, 255, 0.04);
      }

      &--active {
        color: $primary-light;

        &:hover {
          color: $primary-light;
          background: rgba($primary-light, 0.06);
        }
      }
    }

    &__indicator {
      background: $primary-light;
    }

    &__action-btn {
      color: $dark-text-secondary;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: $primary-light;
      }
    }
  }
}
</style>
