<template>
  <div class="wp-list-skeleton">
    <!-- Header skeleton (mimics WpHeader) -->
    <div class="wp-list-skeleton__header">
      <div class="wp-list-skeleton__breadcrumb">
        <SkeletonPulse width="90px" height="14px" radius="3px" />
        <span class="wp-list-skeleton__sep"></span>
        <SkeletonPulse width="130px" height="14px" radius="3px" />
      </div>
      <div class="wp-list-skeleton__tabs">
        <SkeletonPulse v-for="i in 4" :key="i" width="68px" height="26px" radius="4px" />
      </div>
      <div class="wp-list-skeleton__actions">
        <SkeletonPulse width="28px" height="28px" radius="6px" />
        <SkeletonPulse width="28px" height="28px" radius="6px" />
      </div>
    </div>

    <!-- Toolbar skeleton -->
    <div class="wp-list-skeleton__toolbar">
      <div class="wp-list-skeleton__chips">
        <SkeletonPulse width="78px" height="26px" radius="13px" />
        <SkeletonPulse width="60px" height="26px" radius="13px" />
        <SkeletonPulse width="72px" height="26px" radius="13px" />
      </div>
      <div class="wp-list-skeleton__members">
        <SkeletonPulse v-for="i in 4" :key="i" width="28px" height="28px" radius="50%" />
      </div>
      <SkeletonPulse width="100px" height="6px" radius="3px" />
    </div>

    <!-- Table header -->
    <div class="wp-list-skeleton__table-header">
      <SkeletonPulse width="16px" height="12px" radius="2px" />
      <SkeletonPulse width="180px" height="12px" radius="2px" />
      <div class="wp-list-skeleton__table-spacer"></div>
      <SkeletonPulse width="70px" height="12px" radius="2px" />
      <SkeletonPulse width="60px" height="12px" radius="2px" />
      <SkeletonPulse width="50px" height="12px" radius="2px" />
      <SkeletonPulse width="50px" height="12px" radius="2px" />
      <SkeletonPulse width="60px" height="12px" radius="2px" />
    </div>

    <!-- Groups with rows -->
    <div class="wp-list-skeleton__content">
      <div v-for="group in groups" :key="group.id" class="wp-list-skeleton__group">
        <!-- Group header -->
        <div class="wp-list-skeleton__group-header">
          <SkeletonPulse width="12px" height="12px" radius="2px" />
          <SkeletonPulse :width="group.titleWidth" height="14px" radius="3px" />
          <SkeletonPulse width="22px" height="14px" radius="8px" />
        </div>

        <!-- Task rows -->
        <div
          v-for="row in group.rows"
          :key="row.id"
          class="wp-list-skeleton__row"
        >
          <div class="wp-list-skeleton__status-bar"></div>
          <div class="wp-list-skeleton__row-title">
            <SkeletonPulse :width="row.titleWidth" height="12px" radius="3px" />
            <div class="wp-list-skeleton__row-badges">
              <SkeletonPulse v-for="b in row.badgeCount" :key="b" width="28px" height="10px" radius="2px" />
            </div>
          </div>
          <div class="wp-list-skeleton__row-avatars">
            <SkeletonPulse
              v-for="n in row.avatarCount"
              :key="n"
              width="22px"
              height="22px"
              radius="50%"
            />
          </div>
          <SkeletonPulse width="60px" height="12px" radius="3px" />
          <SkeletonPulse width="50px" height="20px" radius="10px" />
          <SkeletonPulse width="32px" height="12px" radius="6px" />
          <SkeletonPulse width="40px" height="12px" radius="3px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

const groups = [
  {
    id: 0,
    titleWidth: '100px',
    rows: [
      { id: 1, titleWidth: '180px', avatarCount: 2, badgeCount: 2 },
      { id: 2, titleWidth: '140px', avatarCount: 1, badgeCount: 1 },
      { id: 3, titleWidth: '200px', avatarCount: 3, badgeCount: 2 },
    ],
  },
  {
    id: 1,
    titleWidth: '130px',
    rows: [
      { id: 1, titleWidth: '160px', avatarCount: 1, badgeCount: 1 },
      { id: 2, titleWidth: '190px', avatarCount: 2, badgeCount: 3 },
      { id: 3, titleWidth: '130px', avatarCount: 2, badgeCount: 1 },
      { id: 4, titleWidth: '170px', avatarCount: 1, badgeCount: 2 },
      { id: 5, titleWidth: '150px', avatarCount: 3, badgeCount: 1 },
    ],
  },
  {
    id: 2,
    titleWidth: '90px',
    rows: [
      { id: 1, titleWidth: '175px', avatarCount: 2, badgeCount: 2 },
      { id: 2, titleWidth: '120px', avatarCount: 1, badgeCount: 1 },
    ],
  },
];
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.wp-list-skeleton {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    gap: 16px;
    border-bottom: 1px solid $divider;
    flex-shrink: 0;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__sep {
    width: 6px;
    height: 10px;
    background: $divider;
    border-radius: 2px;

    body.dark-mode & { background: $dark-border; }
  }

  &__tabs {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 auto;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    height: 44px;
    padding: 0 16px;
    gap: 16px;
    border-bottom: 1px solid $divider;
    flex-shrink: 0;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__chips {
    display: flex;
    gap: 6px;
  }

  &__members {
    display: flex;
    margin-left: auto;

    > :deep(*) {
      margin-left: -6px;
      &:first-child { margin-left: 0; }
    }
  }

  &__table-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 16px;
    border-bottom: 1px solid $divider;
    flex-shrink: 0;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__table-spacer {
    flex: 1;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
  }

  &__group {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    body.dark-mode & { border-color: rgba(255, 255, 255, 0.06); }
  }

  &__group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.02);

    body.dark-mode & { background: rgba(255, 255, 255, 0.03); }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);

    body.dark-mode & { border-color: rgba(255, 255, 255, 0.04); }
  }

  &__status-bar {
    width: 4px;
    height: 32px;
    border-radius: 2px;
    background: #eee;
    flex-shrink: 0;

    body.dark-mode & { background: $dark-card; }
  }

  &__row-title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__row-badges {
    display: flex;
    gap: 4px;
  }

  &__row-avatars {
    display: flex;
    flex-shrink: 0;

    > :deep(*) {
      margin-left: -4px;
      &:first-child { margin-left: 0; }
    }
  }
}
</style>
