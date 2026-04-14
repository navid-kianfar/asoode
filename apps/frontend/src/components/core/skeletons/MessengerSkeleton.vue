<template>
  <div class="msg-skeleton">
    <!-- Sidebar -->
    <div class="msg-skeleton__sidebar">
      <!-- Search -->
      <div class="msg-skeleton__search">
        <SkeletonPulse width="100%" height="34px" radius="8px" />
      </div>
      <!-- Channel list -->
      <div class="msg-skeleton__channels">
        <div v-for="i in 8" :key="i" class="msg-skeleton__channel" :class="{ active: i === 1 }">
          <SkeletonPulse width="36px" height="36px" radius="50%" />
          <div class="msg-skeleton__channel-info">
            <SkeletonPulse :width="channelWidths[i % channelWidths.length]" height="12px" radius="3px" />
            <SkeletonPulse width="80%" height="10px" radius="2px" />
          </div>
          <SkeletonPulse width="32px" height="10px" radius="2px" />
        </div>
      </div>
    </div>

    <!-- Main conversation -->
    <div class="msg-skeleton__main">
      <!-- Header -->
      <div class="msg-skeleton__header">
        <SkeletonPulse width="32px" height="32px" radius="50%" />
        <div class="msg-skeleton__header-info">
          <SkeletonPulse width="140px" height="14px" radius="3px" />
          <SkeletonPulse width="80px" height="10px" radius="2px" />
        </div>
        <div class="msg-skeleton__header-actions">
          <SkeletonPulse width="28px" height="28px" radius="6px" />
          <SkeletonPulse width="28px" height="28px" radius="6px" />
        </div>
      </div>

      <!-- Messages -->
      <div class="msg-skeleton__messages">
        <div v-for="msg in messages" :key="msg.id" class="msg-skeleton__msg" :class="{ own: msg.own }">
          <SkeletonPulse v-if="!msg.own" width="28px" height="28px" radius="50%" />
          <div class="msg-skeleton__bubble">
            <SkeletonPulse :width="msg.width" height="12px" radius="3px" />
            <SkeletonPulse v-if="msg.lines > 1" :width="msg.width2" height="12px" radius="3px" />
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="msg-skeleton__input">
        <SkeletonPulse width="100%" height="42px" radius="10px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

const channelWidths = ['120px', '90px', '140px', '110px', '100px'];

const messages = [
  { id: 1, own: false, width: '180px', width2: '120px', lines: 2 },
  { id: 2, own: true, width: '150px', width2: '', lines: 1 },
  { id: 3, own: false, width: '200px', width2: '80px', lines: 2 },
  { id: 4, own: true, width: '170px', width2: '100px', lines: 2 },
  { id: 5, own: false, width: '130px', width2: '', lines: 1 },
  { id: 6, own: true, width: '190px', width2: '', lines: 1 },
];
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.msg-skeleton {
  display: flex;
  height: 100%;
  min-height: calc(100vh - 48px);

  &__sidebar {
    width: 300px;
    flex-shrink: 0;
    border-inline-end: 1px solid $divider;
    display: flex;
    flex-direction: column;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__search {
    padding: 12px;
    border-bottom: 1px solid $divider;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__channels {
    flex: 1;
    overflow: hidden;
  }

  &__channel {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);

    &.active {
      background: rgba($primary, 0.04);

      body.dark-mode & { background: rgba(255, 255, 255, 0.04); }
    }

    body.dark-mode & { border-color: rgba(255, 255, 255, 0.03); }
  }

  &__channel-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid $divider;
    flex-shrink: 0;

    body.dark-mode & { border-color: $dark-border; }
  }

  &__header-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__header-actions {
    display: flex;
    gap: 6px;
  }

  &__messages {
    flex: 1;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    justify-content: flex-end;
  }

  &__msg {
    display: flex;
    align-items: flex-end;
    gap: 8px;

    &.own {
      justify-content: flex-end;

      .msg-skeleton__bubble {
        background: rgba($primary, 0.06);

        body.dark-mode & { background: rgba($primary-light, 0.08); }
      }
    }
  }

  &__bubble {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.03);
    max-width: 60%;

    body.dark-mode & { background: rgba(255, 255, 255, 0.04); }
  }

  &__input {
    padding: 12px 16px;
    border-top: 1px solid $divider;
    flex-shrink: 0;

    body.dark-mode & { border-color: $dark-border; }
  }
}

@media (max-width: 768px) {
  .msg-skeleton__sidebar { display: none; }
}
</style>
