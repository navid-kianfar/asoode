<template>
  <div class="tms-skeleton">
    <!-- Header -->
    <div class="tms-skeleton__header">
      <SkeletonPulse width="200px" height="16px" radius="3px" />
      <div class="tms-skeleton__header-actions">
        <SkeletonPulse width="28px" height="28px" radius="6px" />
        <SkeletonPulse width="28px" height="28px" radius="6px" />
        <SkeletonPulse width="28px" height="28px" radius="6px" />
      </div>
    </div>

    <div class="tms-skeleton__body">
      <!-- Main content -->
      <div class="tms-skeleton__main">
        <!-- Title -->
        <SkeletonPulse width="70%" height="22px" radius="4px" />

        <!-- Quick Properties Bar -->
        <div class="tms-skeleton__props">
          <SkeletonPulse width="90px" height="28px" radius="14px" />
          <SkeletonPulse width="80px" height="28px" radius="14px" />
          <SkeletonPulse width="70px" height="28px" radius="14px" />
          <SkeletonPulse width="100px" height="28px" radius="14px" />
        </div>

        <!-- Description lines -->
        <div class="tms-skeleton__desc">
          <SkeletonPulse width="100%" height="12px" radius="3px" />
          <SkeletonPulse width="90%" height="12px" radius="3px" />
          <SkeletonPulse width="60%" height="12px" radius="3px" />
        </div>

        <!-- Attachments -->
        <div class="tms-skeleton__attachments">
          <SkeletonPulse width="100%" height="48px" radius="6px" />
          <SkeletonPulse width="100%" height="48px" radius="6px" />
        </div>

        <!-- Tabs -->
        <div class="tms-skeleton__tabs">
          <SkeletonPulse width="80px" height="28px" radius="4px" />
          <SkeletonPulse width="70px" height="28px" radius="4px" />
        </div>

        <!-- Comment area -->
        <div class="tms-skeleton__comments">
          <div v-for="i in 3" :key="i" class="tms-skeleton__comment">
            <SkeletonPulse width="28px" height="28px" radius="50%" />
            <div class="tms-skeleton__comment-body">
              <SkeletonPulse width="120px" height="10px" radius="3px" />
              <SkeletonPulse width="80%" height="12px" radius="3px" />
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="tms-skeleton__sidebar">
        <!-- Members -->
        <div class="tms-skeleton__section">
          <SkeletonPulse width="80px" height="10px" radius="2px" />
          <div class="tms-skeleton__avatars">
            <SkeletonPulse v-for="i in 3" :key="i" width="28px" height="28px" radius="50%" />
          </div>
        </div>
        <!-- Labels -->
        <div class="tms-skeleton__section">
          <SkeletonPulse width="50px" height="10px" radius="2px" />
          <div class="tms-skeleton__labels">
            <SkeletonPulse width="60px" height="20px" radius="4px" />
            <SkeletonPulse width="48px" height="20px" radius="4px" />
          </div>
        </div>
        <!-- Dates -->
        <div class="tms-skeleton__section">
          <SkeletonPulse width="40px" height="10px" radius="2px" />
          <SkeletonPulse width="140px" height="14px" radius="3px" />
          <SkeletonPulse width="120px" height="14px" radius="3px" />
        </div>
        <!-- Timer -->
        <div class="tms-skeleton__section">
          <SkeletonPulse width="100px" height="10px" radius="2px" />
          <SkeletonPulse width="100%" height="40px" radius="6px" />
        </div>
        <!-- Map placeholder -->
        <div class="tms-skeleton__section">
          <SkeletonPulse width="60px" height="10px" radius="2px" />
          <SkeletonPulse width="100%" height="120px" radius="8px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.tms-skeleton {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid $divider;
    flex-shrink: 0;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__header-actions {
    display: flex;
    gap: 6px;
  }

  &__body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  &__main {
    flex: 1;
    padding: 24px 28px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__props {
    display: flex;
    gap: 8px;
    padding-bottom: 16px;
    border-bottom: 1px solid $divider;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__desc {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  &__attachments {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__tabs {
    display: flex;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid $divider;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__comments {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__comment {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  &__comment-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  &__sidebar {
    width: 280px;
    flex-shrink: 0;
    background: #f8f9fa;
    border-inline-start: 1px solid $divider;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    body.dark-mode & {
      background: #333;
      border-color: #444;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__avatars {
    display: flex;
    gap: 4px;
  }

  &__labels {
    display: flex;
    gap: 4px;
  }
}

@media (max-width: 960px) {
  .tms-skeleton__sidebar {
    display: none;
  }
}
</style>
