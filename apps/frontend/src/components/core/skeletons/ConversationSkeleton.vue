<template>
  <div class="conv-skeleton">
    <!-- Header -->
    <div class="conv-skeleton__header">
      <SkeletonPulse width="32px" height="32px" radius="50%" />
      <div class="conv-skeleton__header-info">
        <SkeletonPulse width="140px" height="14px" radius="3px" />
        <SkeletonPulse width="80px" height="10px" radius="2px" />
      </div>
      <div class="conv-skeleton__header-actions">
        <SkeletonPulse width="28px" height="28px" radius="6px" />
        <SkeletonPulse width="28px" height="28px" radius="6px" />
      </div>
    </div>

    <!-- Messages -->
    <div class="conv-skeleton__messages">
      <div v-for="msg in messages" :key="msg.id" class="conv-skeleton__msg" :class="{ own: msg.own }">
        <SkeletonPulse v-if="!msg.own" width="28px" height="28px" radius="50%" />
        <div class="conv-skeleton__bubble">
          <SkeletonPulse :width="msg.width" height="12px" radius="3px" />
          <SkeletonPulse v-if="msg.lines > 1" :width="msg.width2" height="12px" radius="3px" />
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="conv-skeleton__input">
      <SkeletonPulse width="100%" height="42px" radius="10px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

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

.conv-skeleton {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

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

      .conv-skeleton__bubble {
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
</style>
