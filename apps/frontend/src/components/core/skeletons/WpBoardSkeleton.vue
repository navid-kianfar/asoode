<template>
  <div class="wp-board-skeleton">
    <!-- Header skeleton (mimics WpHeader) -->
    <div class="wp-board-skeleton__header">
      <div class="wp-board-skeleton__breadcrumb">
        <SkeletonPulse width="90px" height="14px" radius="3px" />
        <span class="wp-board-skeleton__sep"></span>
        <SkeletonPulse width="130px" height="14px" radius="3px" />
      </div>
      <div class="wp-board-skeleton__tabs">
        <SkeletonPulse v-for="i in 4" :key="i" width="68px" height="26px" radius="4px" />
      </div>
      <div class="wp-board-skeleton__actions">
        <SkeletonPulse width="28px" height="28px" radius="6px" />
        <SkeletonPulse width="28px" height="28px" radius="6px" />
      </div>
    </div>

    <!-- Toolbar skeleton (mimics WpToolbar) -->
    <div class="wp-board-skeleton__toolbar">
      <div class="wp-board-skeleton__chips">
        <SkeletonPulse width="78px" height="26px" radius="13px" />
        <SkeletonPulse width="60px" height="26px" radius="13px" />
        <SkeletonPulse width="72px" height="26px" radius="13px" />
      </div>
      <div class="wp-board-skeleton__members">
        <SkeletonPulse v-for="i in 4" :key="i" width="28px" height="28px" radius="50%" />
      </div>
      <SkeletonPulse width="100px" height="6px" radius="3px" />
    </div>

    <!-- Board columns -->
    <div class="wp-board-skeleton__columns">
      <div
        v-for="col in columns"
        :key="col.id"
        class="wp-board-skeleton__column"
      >
        <!-- Column header -->
        <div class="wp-board-skeleton__col-header">
          <SkeletonPulse :width="col.headerWidth" height="16px" radius="3px" />
          <SkeletonPulse width="30px" height="14px" radius="8px" />
        </div>

        <!-- Cards -->
        <div
          v-for="card in col.cards"
          :key="card.id"
          class="wp-board-skeleton__card"
        >
          <SkeletonPulse :width="card.titleWidth" height="13px" radius="3px" />
          <SkeletonPulse :width="card.subtitleWidth" height="11px" radius="3px" />
          <div class="wp-board-skeleton__card-footer">
            <div class="wp-board-skeleton__card-badges">
              <SkeletonPulse v-for="b in card.badges" :key="b" width="24px" height="10px" radius="2px" />
            </div>
            <div class="wp-board-skeleton__card-avatars">
              <SkeletonPulse
                v-for="n in card.avatarCount"
                :key="n"
                width="22px"
                height="22px"
                radius="50%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

const columns = [
  {
    id: 1,
    headerWidth: '100px',
    cards: [
      { id: 1, titleWidth: '75%', subtitleWidth: '50%', avatarCount: 2, badges: [1, 2] },
      { id: 2, titleWidth: '60%', subtitleWidth: '40%', avatarCount: 1, badges: [1] },
      { id: 3, titleWidth: '85%', subtitleWidth: '55%', avatarCount: 3, badges: [1, 2] },
    ],
  },
  {
    id: 2,
    headerWidth: '120px',
    cards: [
      { id: 1, titleWidth: '65%', subtitleWidth: '45%', avatarCount: 1, badges: [1] },
      { id: 2, titleWidth: '80%', subtitleWidth: '35%', avatarCount: 2, badges: [1, 2, 3] },
      { id: 3, titleWidth: '70%', subtitleWidth: '50%', avatarCount: 2, badges: [1] },
      { id: 4, titleWidth: '55%', subtitleWidth: '40%', avatarCount: 1, badges: [1, 2] },
      { id: 5, titleWidth: '75%', subtitleWidth: '45%', avatarCount: 3, badges: [1] },
    ],
  },
  {
    id: 3,
    headerWidth: '80px',
    cards: [
      { id: 1, titleWidth: '70%', subtitleWidth: '50%', avatarCount: 2, badges: [1, 2] },
      { id: 2, titleWidth: '50%', subtitleWidth: '35%', avatarCount: 1, badges: [1] },
    ],
  },
  {
    id: 4,
    headerWidth: '110px',
    cards: [
      { id: 1, titleWidth: '65%', subtitleWidth: '45%', avatarCount: 1, badges: [1] },
      { id: 2, titleWidth: '80%', subtitleWidth: '55%', avatarCount: 2, badges: [1, 2] },
      { id: 3, titleWidth: '60%', subtitleWidth: '40%', avatarCount: 2, badges: [1] },
      { id: 4, titleWidth: '75%', subtitleWidth: '50%', avatarCount: 1, badges: [1, 2] },
    ],
  },
];
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.wp-board-skeleton {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f4f5f7;

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

  &__columns {
    flex: 1;
    display: flex;
    gap: 12px;
    padding: 16px;
    overflow-x: auto;
    align-items: flex-start;
  }

  &__column {
    width: 272px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__col-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 4px;
  }

  &__card {
    background: $surface;
    border-radius: $border-radius-md;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

    body.dark-mode & {
      background: $dark-card;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  &__card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
  }

  &__card-badges {
    display: flex;
    gap: 4px;
  }

  &__card-avatars {
    display: flex;

    > :deep(*) {
      margin-left: -4px;
      &:first-child { margin-left: 0; }
    }
  }
}
</style>
